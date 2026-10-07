import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {projectRelativePath} from './config.mjs';
import {basisInputs,sourceUrl} from './basis.mjs';
import {taskStatus} from './tasks.mjs';

export const workflowFiles = {
  basis: '.design-workflow/design-basis.json',
  receipt: '.design-workflow/host-read.json',
  analysis: '.design-workflow/reference-analysis.json',
  confirmation: '.design-workflow/analysis-confirmation.json',
  designSystem: '.design-workflow/design-system-review.json'
};
export const dimensions = {
  reference: ['hierarchy','color-typography','layout','components-states','interaction-motion','responsive','adaptation'],
  components: ['official-source','compatibility-version','required-capabilities','theme-extension','accessibility-states','maintenance-license','adaptation'],
  custom: ['user-goals','existing-assets','color-typography','layout','components-states','responsive','adaptation']
};
dimensions.combined=[...dimensions.components.map(name=>'components.'+name),...dimensions.reference.map(name=>'reference.'+name)];
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function file(root, relative) {
  projectRelativePath(relative,'workflow file');
  let current=root;
  for(const part of relative.split('/')) {
    current=path.join(current,part);
    let stat;
    try {stat=fs.lstatSync(current);} catch(error) {if(error.code!=='ENOENT')throw error;}
    if(stat?.isSymbolicLink()) throw new Error(`Symlinked workflow path: ${relative}`);
  }
  return current;
}
const read = (root,relative) => JSON.parse(fs.readFileSync(file(root,relative),'utf8'));
const sha = (root,relative) => digest(fs.readFileSync(file(root,relative)));
const nonempty = value => typeof value==='string' && Boolean(value.trim());
function url(value) {
  const parsed=new URL(value);
  if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password) throw new Error('Source URL must be HTTP(S), without credentials.');
  return parsed.href;
}
function input(root) {
  const exists=fs.existsSync(file(root,workflowFiles.basis));
  const basis=exists?read(root,workflowFiles.basis):null;
  if(basis) {
    basisInputs(basis);
    if(basis.projectPath && fs.realpathSync(basis.projectPath)!==root) throw new Error('Design basis belongs to a different project.');
  }
  const normalized=basisInputs(basis);
  const mode=normalized.mode;
  const referenceUrl=basis?.schemaVersion===2?(normalized.component?.docs||normalized.references.find(item=>item.kind==='url')?.url||null):(basis?.referenceUrl||basis?.preset?.reference?.url||basis?.preset?.docs||null);
  if(referenceUrl)url(referenceUrl);
  const attachments={};
  for(const reference of normalized.references.filter(item=>item.kind==='image')){
    if(sha(root,reference.file)!==reference.sha256)throw new Error('Reference image is missing or changed.');
    attachments[reference.file]=reference.sha256;
  }
  return {mode,referenceUrl,...(basis?.schemaVersion===2?{component:normalized.component,references:normalized.references,attachments}:{}),basisHash:exists?sha(root,workflowFiles.basis):null};
}
function atomic(root,relative,value) {
  const target=file(root,relative);fs.mkdirSync(path.dirname(target),{recursive:true});
  const temporary=`${target}.${crypto.randomUUID()}.tmp`;
  try {fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n',{flag:'wx'});fs.renameSync(temporary,target);}
  finally {if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}
// This records an actual file read; it does not claim the host automatically loaded
// a Skill, opened the desktop conversation or submitted a turn.
export function acknowledgeInput(target,promptFile) {
  const root=fs.realpathSync(path.resolve(target));
  const selected=input(root);
  if(!nonempty(fs.readFileSync(file(root,promptFile),'utf8'))) throw new Error('Current host requirement must not be empty.');
  if(hostReadStatus(root).status==='read') {
    const previous=read(root,workflowFiles.receipt);
    if(previous.promptFile===promptFile)return previous;
  }
  const value={schemaVersion:1,projectPath:root,...selected,promptFile,promptHash:sha(root,promptFile),readAt:new Date().toISOString(),method:'actual-file-read'};
  atomic(root,workflowFiles.receipt,value);return value;
}
export function hostReadStatus(target) {
  try {
    const root=fs.realpathSync(path.resolve(target)),selected=input(root);
    if(!fs.existsSync(file(root,workflowFiles.receipt))) return {status:'waiting',reason:'not-read'};
    const receipt=read(root,workflowFiles.receipt);
    if(receipt.schemaVersion!==1||receipt.method!=='actual-file-read'||!nonempty(receipt.readAt)||receipt.projectPath!==root||receipt.basisHash!==selected.basisHash||receipt.mode!==selected.mode||receipt.referenceUrl!==selected.referenceUrl||JSON.stringify(receipt.attachments??{})!==JSON.stringify(selected.attachments??{})||receipt.promptHash!==sha(root,receipt.promptFile)) return {status:'stale',reason:'input-changed'};
    return {status:'read',readAt:receipt.readAt};
  }catch(error){return {status:'blocked',reason:error.message};}
}
export function workflowStatus(target,{stage='implementation'}={}) {
  const blockers=[],trackedInputs=[];
  // Reuse one current task snapshot within this synchronous status call only.
  // The next invocation reads and hashes everything again, including attachments.
  const taskSnapshots=new Map();
  const add=(code,message)=>blockers.push({code,message});
  let root;
  try {
    if(!['analysis','implementation','page','delivery'].includes(stage)) throw new Error('Unknown workflow stage.');
    root=fs.realpathSync(path.resolve(target));
    const selected=input(root),state=hostReadStatus(root);
    if(fs.existsSync(file(root,workflowFiles.basis)))trackedInputs.push(workflowFiles.basis);
    trackedInputs.push(...Object.keys(selected.attachments??{}));
    if(state.status!=='read') throw new Error(`Host input ${state.status}: ${state.reason}`);
    const receipt=read(root,workflowFiles.receipt);trackedInputs.push(workflowFiles.receipt,receipt.promptFile);
    if(stage!=='analysis') {
      const analysis=read(root,workflowFiles.analysis);trackedInputs.push(workflowFiles.analysis);
      if(analysis.schemaVersion!==1||analysis.mode!==selected.mode||analysis.receiptHash!==sha(root,workflowFiles.receipt)) throw new Error('Analysis does not match current input receipt.');
      const evidence=new Map();
      for(const item of analysis.evidence??[]) {
        if(!nonempty(item.id)||evidence.has(item.id)) throw new Error('Evidence IDs must be unique.');
        if(item.sha256!==sha(root,item.file)||!fs.readFileSync(file(root,item.file)).length) throw new Error(`Missing or changed evidence: ${item.id}`);
        if(!nonempty(item.capturedAt))throw new Error(`Missing capture date: ${item.id}`);
        if(!['screenshot','dom','official-doc','user-input','existing-source','interaction-log'].includes(item.kind))throw new Error(`Unknown evidence kind: ${item.id}`);
        if(selected.mode!=='custom'&& !['user-input','existing-source'].includes(item.kind))url(item.url);
        else if(item.url!==undefined)url(item.url);
        if(item.kind==='screenshot') {
          const bytes=fs.readFileSync(file(root,item.file));
          if(bytes.length<24||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||!bytes.readUInt32BE(16)||!bytes.readUInt32BE(20))throw new Error('Screenshot evidence must be a real PNG.');
          if(!Number.isFinite(item.viewport?.width)||!Number.isFinite(item.viewport?.height)||item.viewport.width<=0||item.viewport.height<=0)throw new Error('Screenshot must record actual CSS viewport dimensions.');
        }
        trackedInputs.push(item.file);evidence.set(item.id,item);
      }
      if(selected.referenceUrl&&![...evidence.values()].some(item=>!['user-input','existing-source'].includes(item.kind)&&item.url!==undefined&&url(item.url)===url(selected.referenceUrl)))throw new Error('Selected source URL has no evidence.');
      if(selected.references){
        for(const reference of selected.references){
          const source=[...evidence.values()].filter(item=>reference.kind==='url'?item.url&&url(item.url)===url(reference.url)&&!['user-input','existing-source'].includes(item.kind):item.file===reference.file&&item.sha256===reference.sha256);
          if(!source.length)throw new Error('Each selected reference needs actual source evidence.');
          if(reference.kind==='url'&&(!source.some(item=>item.kind==='screenshot'&&item.viewport.width<768)||!source.some(item=>item.kind==='screenshot'&&item.viewport.width>=1024)))throw new Error('Every website reference needs actual desktop and narrow observations.');
        }
      }
      const hasWebReference=selected.references?selected.references.some(item=>item.kind==='url'):selected.mode==='reference';
      for(const dimension of dimensions[selected.mode]) {
        const name=dimension.replace(/^(components|reference)\./,'');
        const isVisual=selected.mode==='reference'||dimension.startsWith('reference.');
        const matches=(analysis.findings??[]).filter(item=>item.dimension===dimension);
        if(matches.length!==1)throw new Error(`Expected one finding for ${dimension}.`);
        const finding=matches[0];
        if(!['observed','adapted','not-applicable'].includes(finding.status)||!nonempty(finding.observation)||!nonempty(finding.decision))throw new Error(`Incomplete analysis: ${dimension}. Pause for user clarification.`);
        if(finding.status==='not-applicable'&&isVisual&&['hierarchy','color-typography','layout','responsive','adaptation'].includes(name))throw new Error(`Core website analysis cannot be omitted: ${dimension}`);
        if(!Array.isArray(finding.evidence)||!finding.evidence.length||finding.evidence.some(id=>!evidence.has(id)))throw new Error(`Missing evidence for ${dimension}.`);
        if(isVisual&&['hierarchy','color-typography','layout','components-states'].includes(name)&&finding.status!=='not-applicable'&&!finding.evidence.some(id=>evidence.get(id).kind==='screenshot'||selected.references?.some(ref=>ref.kind==='image'&&ref.file===evidence.get(id).file)))throw new Error(`Visual evidence required: ${dimension}.`);
        if(isVisual&&hasWebReference&&name==='responsive'&&finding.status!=='not-applicable') {
          const screenshots=finding.evidence.map(id=>evidence.get(id)).filter(item=>item.kind==='screenshot');
          if(!screenshots.some(item=>item.viewport.width<768)||!screenshots.some(item=>item.viewport.width>=1024))throw new Error('Actual desktop and narrow source observations required.');
        }
        if(isVisual&&!hasWebReference&&['responsive','interaction-motion'].includes(name)&&finding.status!=='adapted')throw new Error('Static images cannot prove responsive or interaction behavior; record project adaptation.');
        const rule=finding.rule;
        if(!rule||rule.sha256!==sha(root,rule.file)||!nonempty(rule.anchor)||!fs.readFileSync(file(root,rule.file),'utf8').includes(rule.anchor))throw new Error(`Missing or changed rule mapping: ${dimension}.`);
        trackedInputs.push(rule.file);
      }
      const confirmation=read(root,workflowFiles.confirmation);trackedInputs.push(workflowFiles.confirmation);
      if(confirmation.schemaVersion!==1||confirmation.status!=='confirmed'||confirmation.analysisHash!==sha(root,workflowFiles.analysis)||confirmation.receiptHash!==sha(root,workflowFiles.receipt)||!nonempty(confirmation.confirmedAt)||!nonempty(confirmation.userDecision)||confirmation.recordHash!==sha(root,confirmation.record))throw new Error('Analysis and adaptation require current user confirmation.');
      trackedInputs.push(confirmation.record);
      if(stage==='page'||stage==='delivery') {
        const review=read(root,workflowFiles.designSystem);trackedInputs.push(workflowFiles.designSystem);
        if(review.schemaVersion!==1||review.status!=='passed'||review.confirmationHash!==sha(root,workflowFiles.confirmation))throw new Error('Design system review must follow the confirmed analysis.');
        const contract=read(root,'.design-workflow/delivery.json');
        for(const artifact of contract.artifacts.filter(item=>['styles','component','gallery'].includes(item.kind))) {
          for(const relative of [artifact.source,artifact.entry]) {
            if(review.sources?.[relative]!==sha(root,relative))throw new Error(`Unreviewed design system source: ${relative}`);
            trackedInputs.push(relative);
          }
        }
        for(const check of ['static','build','gallery-desktop','gallery-narrow','gallery-interaction','rules']) {
          const record=review.checks?.[check];
          if(record?.status!=='passed'||!nonempty(record.note)||record.sha256!==sha(root,record.file))throw new Error(`Design system check missing or stale: ${check}`);
          if(!taskSnapshots.has(record.taskId))taskSnapshots.set(record.taskId,taskStatus(root,record.taskId));
          const task=taskSnapshots.get(record.taskId);
          const criterion=task.criteria.find(item=>item.id===record.criterionId);
          if(criterion?.status!=='passed'||!criterion.required||criterion.allowNotApplicable)throw new Error(`Design system task evidence not passed: ${check}`);
          if(criterion.latest?.inputs?.[workflowFiles.confirmation]!==sha(root,workflowFiles.confirmation)||Object.entries(review.sources??{}).some(([name,hash])=>criterion.latest?.inputs?.[name]!==hash))throw new Error(`Design system check is not bound to current sources and confirmation: ${check}`);
          if(['static','build'].includes(check)&&(criterion.kind!==check||criterion.latest?.method!=='command'))throw new Error(`Actual command evidence required: ${check}`);
          const gallery=contract.artifacts.find(item=>item.kind==='gallery');
          if(check.startsWith('gallery-')&&!criterion.context.pages?.includes(gallery?.url))throw new Error(`Gallery URL not verified: ${check}`);
          if(['gallery-desktop','gallery-narrow'].includes(check)&&(criterion.kind!=='visual'||!criterion.context.viewports?.includes(check.slice(8))))throw new Error(`Gallery viewport not verified: ${check}`);
          if(check==='gallery-interaction'&&(!['interaction','e2e'].includes(criterion.kind)||!criterion.context.states?.includes('success')))throw new Error('Gallery interaction not verified.');
          if(check==='rules'&&criterion.kind!=='documentation')throw new Error('Design system rules review not verified.');
          trackedInputs.push(record.file);
        }
      }
    }
  }catch(error){add('workflow-incomplete',error.message);}
  return {schemaVersion:1,stage,canProceed:blockers.length===0,status:blockers.length?'blocked':'verified',blockers,trackedInputs:[...new Set(trackedInputs)],scopeNote:'Validates declared evidence, input hashes and stage prerequisites. Human/agent observations and user-confirmation records are not independently authenticated. Does not constrain host file tools or auto-dispatch turns.'};
}
