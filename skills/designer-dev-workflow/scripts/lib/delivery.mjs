import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {readJson, toPosix} from './fs-utils.mjs';
import {projectRelativePath} from './config.mjs';
import {validateTaskPlan, createTask, taskStatus, runTaskCheck, recordTaskEvidence, recoverTask} from './tasks.mjs';
import {workflowStatus,workflowFiles} from './workflow.mjs';

export const CONTRACT_FILE = '.design-workflow/delivery.json';
const excluded = new Set(['node_modules','.git','dist','build','.next','coverage','.agents','.claude','tasks']);
const sourceExtensions = ['.js','.jsx','.ts','.tsx','.mjs','.cjs','.css','.scss','.less','.vue','.svelte','.html'];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const text = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
  return value;
};
const files = (value, label) => {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label} must be a nonempty array.`);
  return [...new Set(value.map(file => projectRelativePath(file,label)))].sort();
};
function safePath(root, file) {
  projectRelativePath(file,'project path');
  let current = root;
  for (const part of file.split('/')) {
    current = path.join(current,part);
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlinked delivery paths are unsupported: ${file}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return current;
}
function inventory(root, directory) {
  const result = [];
  const visit = file => {
    const absolute = safePath(root,file);
    if (!fs.existsSync(absolute)) { result.push(file); return; }
    if (fs.statSync(absolute).isFile()) { result.push(file); return; }
    for (const child of fs.readdirSync(absolute).sort()) if (!excluded.has(child)) visit(`${file}/${child}`);
  };
  visit(directory);
  return result;
}
export function validateDeliveryContract(value) {
  if (!value || value.schemaVersion !== 1) throw new Error('Delivery contract requires schemaVersion=1.');
  if (!['design-system','full'].includes(value.scope)) throw new Error('scope must be design-system or full.');
  if (!['pending','confirmed'].includes(value.confirmation?.status)) throw new Error('confirmation.status must be pending or confirmed.');
  const confirmation = {status:value.confirmation.status,record:projectRelativePath(value.confirmation.record,'confirmation.record')};
  const rules = files(value.rules,'rules');
  const sourceRoots = files(value.sourceRoots,'sourceRoots');
  const inputs = files(value.inputs,'inputs');
  const seen = new Set();
  if (!Array.isArray(value.artifacts) || !value.artifacts.length) throw new Error('artifacts must be nonempty.');
  const artifacts = value.artifacts.map(item => {
    const id = text(item.id,'artifact.id');
    if (seen.has(id)) throw new Error(`Duplicate artifact: ${id}`);
    seen.add(id);
    if (!['styles','component','gallery','page'].includes(item.kind)) throw new Error('Unsupported artifact.kind.');
    const source = projectRelativePath(item.source,'artifact.source');
    const entry = projectRelativePath(item.entry,'artifact.entry');
    if (![source,entry].every(file => sourceExtensions.includes(path.extname(file)))) throw new Error('Artifacts and entries must be editable runtime source, not JSON, docs or build output.');
    for (const file of [source,entry]) if (file.split('/').some(part => excluded.has(part)) || file.startsWith('.design-workflow/')) throw new Error(`Artifact is not project runtime source: ${file}`);
    const integration = item.integration ?? 'static';
    if (!['static','runtime'].includes(integration)) throw new Error('artifact.integration must be static or runtime.');
    const result = {id,kind:item.kind,source,entry,integration};
    if (['page','gallery'].includes(item.kind)) result.url = text(item.url,'artifact.url');
    return result;
  });
  for (const kind of ['styles','gallery',...(value.scope === 'full' ? ['page'] : [])]) if (!artifacts.some(item => item.kind === kind)) throw new Error(`Missing required artifact kind: ${kind}`);
  if (value.scope === 'design-system' && artifacts.some(item => item.kind === 'page')) throw new Error('Business pages require scope=full.');
  const plan = validateTaskPlan({schemaVersion:1,id:'delivery',title:text(value.title,'title'),changeTypes:value.changeTypes,inputs:[CONTRACT_FILE],criteria:value.criteria});
  // The delivery gate cannot be weakened into an optional or exempt review.
  const required = kind => plan.criteria.filter(item => item.kind === kind && item.required && !item.allowNotApplicable);
  for (const kind of ['static','build','documentation']) if (!required(kind).length) throw new Error(`Delivery requires a mandatory ${kind} check.`);
  const urls = [...new Set(artifacts.filter(item => item.url).map(item => item.url))];
  for (const url of urls) {
    for (const viewport of ['desktop','narrow']) if (!required('visual').some(item => item.context.pages?.includes(url) && item.context.viewports?.includes(viewport))) throw new Error(`Visual coverage missing: ${url} ${viewport}`);
    if (!plan.criteria.some(item => ['interaction','e2e'].includes(item.kind) && item.required && !item.allowNotApplicable && item.context.pages?.includes(url) && item.context.states?.includes('success'))) throw new Error(`Runtime integration verification missing: ${url}`);
  }
  if(value.workflow !== undefined && value.workflow !== true) throw new Error('workflow may only enable stage checks, not disable them.');
  return {schemaVersion:1,title:plan.title,scope:value.scope,confirmation,rules,sourceRoots,inputs,artifacts,changeTypes:plan.changeTypes,criteria:plan.criteria,...(value.workflow?{workflow:true}:{})};
}
// Conservative reachability, not a language parser. Non-relative/implicit framework
// wiring must use explicit runtime mode and the required browser evidence.
function graph(root, entry) {
  const visited = new Set();
  const unresolved = [];
  const pending = [entry];
  while (pending.length) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    const absolute = safePath(root,file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) { unresolved.push(file); continue; }
    visited.add(file);
    if (!sourceExtensions.includes(path.extname(file))) continue;
    const content = fs.readFileSync(absolute,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
    const patterns = [ /\b(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?['"]([^'"]+)['"]/g, /\b(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)/g, /@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g ];
    if (file.endsWith('.html')) patterns.push(/<(?:script|link)\b[^>]*\b(?:src|href)=['"]([^'"]+)['"]/g);
    for (const pattern of patterns) for (const match of content.matchAll(pattern)) {
      let reference = match[1].split(/[?#]/)[0];
      if (file.endsWith('.html') && reference.startsWith('/')) reference = toPosix(path.relative(path.dirname(absolute),path.join(root,reference.slice(1))));
      else if (!reference.startsWith('.') && !(file.endsWith('.html') && !/^(?:[a-z]+:|\/\/|#)/i.test(reference))) continue;
      const base = path.resolve(path.dirname(absolute),reference);
      const candidates = [base,...sourceExtensions.map(ext => base+ext),...sourceExtensions.map(ext => path.join(base,`index${ext}`))];
      let found = false;
      for (const candidate of candidates) {
        const relative = projectRelativePath(toPosix(path.relative(root,candidate)),'import');
        const checked = safePath(root,relative);
        if (fs.existsSync(checked) && fs.statSync(checked).isFile()) { pending.push(relative); found = true; break; }
      }
      if (!found) unresolved.push(`${file}: ${reference}`);
    }
  }
  return {visited,unresolved};
}
function prepare(root) {
  root = fs.realpathSync(path.resolve(root));
  const contract = validateDeliveryContract(readJson(safePath(root,CONTRACT_FILE)));
  const inputs = new Set([CONTRACT_FILE,contract.confirmation.record,...contract.rules,...contract.inputs,...contract.artifacts.flatMap(item => [item.source,item.entry])]);
  for (const directory of contract.sourceRoots) for (const file of inventory(root,directory)) inputs.add(file);
  // Include project-level dependency and build definitions automatically.
  for (const file of fs.readdirSync(root)) if (/^(package(?:-lock)?\.json|(?:pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)|(?:tsconfig|vite\.config|next\.config|webpack\.config).*)$/.test(file) && fs.statSync(safePath(root,file)).isFile()) inputs.add(file);
  const blockers = [];
  const warnings = [];
  const add = (code,file,message) => blockers.push({code,file,message});
  const guarded=contract.workflow===true||Object.values(workflowFiles).some(file=>fs.existsSync(safePath(root,file)));
  if(guarded) {
    const upstream=workflowStatus(root,{stage:'delivery'});
    for(const item of upstream.blockers)add(item.code,workflowFiles.analysis,item.message);
    for(const file of upstream.trackedInputs)inputs.add(file);
  }else warnings.push({code:'legacy-workflow',message:'Legacy contract without GUI input; stage checks are not enabled. New projects must set workflow: true.'});
  if (contract.confirmation.status !== 'confirmed') add('scope-unconfirmed',CONTRACT_FILE,'Record the user-confirmed scope before implementation verification.');
  for (const file of [...inputs]) {
    if (file.startsWith('.design-workflow/tasks/')) throw new Error('Delivery inputs must stay outside evidence state.');
    const absolute = safePath(root,file);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) { add('missing-input',file,'Required project input is missing or is not a file.'); continue; }
    if (!fs.readFileSync(absolute,'utf8').trim()) add('empty-input',file,'Required project input is empty.');
  }
  for (const artifact of contract.artifacts) {
    const absolute = safePath(root,artifact.source);
    if (!fs.existsSync(absolute)) continue;
    const content = fs.readFileSync(absolute,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'').trim();
    if (!content || /^export\s+default\s+null;?$/.test(content) || /^export\s+(?:const|let)\s+\w+\s*=\s*\([^)]*\)\s*=>\s*(?:null|\{\s*return\s+null;?\s*\});?$/.test(content) || /^(?:export\s+default\s+)?(?:function\s*\w*\([^)]*\)\s*\{\s*return\s+null;?\s*\}|\(?\)?\s*=>\s*null);?$/.test(content)) add('placeholder-source',artifact.source,'Source is empty or an obvious null placeholder; implement the declared artifact.');
    const reachable = graph(root,artifact.entry);
    for (const file of reachable.visited) inputs.add(file);
    if (!reachable.visited.has(artifact.source) || reachable.unresolved.length) {
      const finding = {code:'integration-unverified',file:artifact.source,message:`No complete static path from ${artifact.entry}; inspect imports and actual runtime integration.`,unresolved:reachable.unresolved};
      if (artifact.integration === 'static') blockers.push(finding);
      else warnings.push({...finding,message:finding.message+' Runtime mode requires recorded browser evidence; static reachability is not proven.'});
    }
  }
  const plan = validateTaskPlan({schemaVersion:1,id:'delivery',title:contract.title,changeTypes:contract.changeTypes,inputs:[...inputs].sort(),criteria:contract.criteria});
  plan.id = `delivery-${hash(JSON.stringify({contract,plan})).slice(0,20)}`;
  return {root,contract,plan,blockers,warnings};
}
export function deliveryStatus(target) {
  let current;
  try { current = prepare(target); }
  catch (error) { return {schemaVersion:1,canFinish:false,status:'blocked',stages:[],blockers:[{code:'invalid-contract',file:CONTRACT_FILE,message:error.message}],warnings:[],nextActions:['Create or repair the project delivery contract.']}; }
  const {root,contract,plan,blockers,warnings} = current;
  let evidence;
  const state = path.join(root,'.design-workflow/tasks',plan.id,'task.json');
  if (fs.existsSync(state)) {
    try {
      const stored = readJson(state);
      if (JSON.stringify(stored.plan) !== JSON.stringify(plan)) throw new Error('Stored evidence plan differs from the current contract.');
      evidence = taskStatus(root,plan.id);
    } catch (error) { blockers.push({code:'invalid-evidence',file:toPosix(path.relative(root,state)),message:error.message}); }
  }
  for (const criterion of plan.criteria.filter(item => item.required)) {
    const result = evidence?.criteria.find(item => item.id === criterion.id);
    if (result?.status !== 'passed') blockers.push({code:'verification-required',file:criterion.id,message:`${criterion.title}: ${result?.status ?? 'not-run'}`});
  }
  const implementationReady = !blockers.some(item => item.code !== 'verification-required');
  const canFinish = blockers.length === 0;
  return {schemaVersion:1,scope:contract.scope,taskId:plan.id,canFinish,status:canFinish?'verified':'blocked',stages:[
    {id:'constraints',status:contract.confirmation.status === 'confirmed' && !blockers.some(item => [contract.confirmation.record,...contract.rules].includes(item.file))?'confirmed':'blocked'},
    {id:'design-system',status:implementationReady?(canFinish?'verified':'implemented-unverified'):'blocked'},
    {id:'business-pages',status:contract.scope === 'design-system'?'out-of-scope':implementationReady?(canFinish?'verified':'implemented-unverified'):'blocked'}
  ],blockers,warnings,evidence,nextActions:blockers.map(item => item.message),scopeNote:'Verifies declared source, relative import paths and recorded checks. Browser/design records are human or agent observations, not proof of universal design quality. CI must invoke this gate to enforce completion; the host can otherwise skip it.'};
}
export function executeDelivery(target, action, options = {}) {
  if (!['status','prepare','run','record','recover'].includes(action)) throw new Error(`Unknown delivery action: ${action}`);
  if (action === 'run' && !options.check) throw new Error('--check is required.');
  if (action === 'record' && !options.file) throw new Error('--file is required.');
  if (action === 'status') return deliveryStatus(target);
  const current = prepare(target);
  if(action==='run'&&(current.contract.workflow===true||Object.values(workflowFiles).some(file=>fs.existsSync(safePath(current.root,file))))) {
    const upstream=workflowStatus(current.root,{stage:'implementation'});
    if(!upstream.canProceed)throw new Error(upstream.blockers.map(item=>item.message).join('; '));
  }
  if (current.contract.confirmation.status !== 'confirmed') throw new Error('Delivery scope is not confirmed.');
  const state = path.join(current.root,'.design-workflow/tasks',current.plan.id,'task.json');
  if (!fs.existsSync(state)) {
    if (action === 'recover') throw new Error('No delivery round to recover.');
    createTask(current.root,current.plan);
  }
  else if (JSON.stringify(readJson(state).plan) !== JSON.stringify(current.plan)) throw new Error('Stored evidence plan differs from contract.');
  let operation;
  if (action === 'run') {
    const result = runTaskCheck(current.root,current.plan.id,options.check);
    operation = result.criteria.find(item => item.id === options.check);
  } else if (action === 'record') {
    const record = readJson(path.resolve(options.file));
    for (const file of record.artifacts ?? []) safePath(current.root,file);
    const result = recordTaskEvidence(current.root,current.plan.id,record);
    operation = result.criteria.find(item => item.id === record.criterionId);
  }
  else if (action === 'recover') recoverTask(current.root,current.plan.id);
  else if (action !== 'prepare') throw new Error(`Unknown delivery action: ${action}`);
  const result = deliveryStatus(target);
  if (operation) result.operation = {id:operation.id,status:operation.status};
  return result;
}
export function deliveryExitCode(action, result) {
  if (['prepare','recover'].includes(action)) return 0;
  if (result.operation) return result.operation.status === 'passed' ? 0 : 2;
  return result.canFinish ? 0 : 2;
}
