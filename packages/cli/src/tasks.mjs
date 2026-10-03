import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathExists, readJson, toPosix} from './fs-utils.mjs';
import {projectRelativePath} from './config.mjs';

const KINDS = ['static','build','visual','interaction','e2e','documentation'];
const CHANGES = ['token','component','page','layout','routing','async','cross-page','persistence','reversible','docs'];
const HIGH_RISK = ['routing','async','cross-page','persistence','reversible'];
const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const hash = content => crypto.createHash('sha256').update(content).digest('hex');
const now = () => new Date().toISOString();
function id(value,label) {
  if (typeof value !== 'string' || !idPattern.test(value)) throw new Error(`${label} must use lowercase letters, digits and hyphens, starting with a letter (max 64 characters).`);
  return value;
}
function text(value,label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
  return value;
}
function stringList(value,label) {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label} must be a nonempty array.`);
  return [...new Set(value.map(item=>text(item,label)))];
}
function evidencePath(value) {
  const file=projectRelativePath(value,'evidence path');
  if (file.startsWith('.design-workflow/tasks/')) throw new Error('Tracked inputs and manual attachments must stay outside task state.');
  return file;
}
export function validateTaskPlan(input) {
  if (!input || input.schemaVersion !== 1) throw new Error('Task plan requires schemaVersion=1.');
  const changeTypes=stringList(input.changeTypes,'changeTypes');
  if (changeTypes.some(type=>!CHANGES.includes(type))) throw new Error('Unsupported changeTypes.');
  const inputs=stringList(input.inputs,'inputs').map(evidencePath);
  if (!Array.isArray(input.criteria) || !input.criteria.length) throw new Error('criteria must be a nonempty array.');
  const seen=new Set();
  const criteria=input.criteria.map(value=>{
    const key=id(value.id,'criterion.id');
    if (seen.has(key)) throw new Error(`Duplicate criterion: ${key}`);
    seen.add(key);
    if (!KINDS.includes(value.kind)) throw new Error(`Unsupported criterion kind: ${value.kind}`);
    if (value.required !== undefined && typeof value.required !== 'boolean') throw new Error('criterion.required must be boolean.');
    const criterion={id:key,title:text(value.title,'criterion.title'),kind:value.kind,required:value.required ?? true};
    if (value.command !== undefined) {
      criterion.command=stringList(value.command,'criterion.command');
      // Arguments may legitimately repeat (for example multiple --project options).
      criterion.command=value.command.map(argument=>text(argument,'command argument'));
      if (['visual','interaction','documentation'].includes(value.kind)) throw new Error('Visual, interaction and documentation criteria use manual records; use e2e for automated browser commands.');
      criterion.timeoutMs=value.timeoutMs ?? 60000;
      if (!Number.isInteger(criterion.timeoutMs) || criterion.timeoutMs < 1 || criterion.timeoutMs > 60000) throw new Error('timeoutMs must be between 1 and 60000.');
    }
    if (['static','build','e2e'].includes(value.kind) && !criterion.command) throw new Error('Static, build and E2E criteria require an executable command. Use interaction for manual browser verification.');
    if (value.allowNotApplicable !== undefined && typeof value.allowNotApplicable !== 'boolean') throw new Error('allowNotApplicable must be boolean.');
    criterion.allowNotApplicable=value.allowNotApplicable ?? false;
    criterion.context={};
    if (value.context !== undefined && (!value.context || typeof value.context !== 'object' || Array.isArray(value.context))) throw new Error('criterion.context must be an object.');
    for (const field of ['pages','states','viewports']) if (value.context?.[field] !== undefined) criterion.context[field]=stringList(value.context[field],`context.${field}`);
    return criterion;
  });
  if (!criteria.some(item=>item.required)) throw new Error('A task needs at least one required acceptance criterion.');
  const has=kind=>criteria.some(item=>item.kind===kind && item.required && !item.allowNotApplicable);
  if (changeTypes.some(type=>type!=='docs') && (!has('static') || !has('build'))) throw new Error('Code changes require static and build criteria that cannot be marked not applicable.');
  if (changeTypes.some(type=>['page','layout','component','token'].includes(type))) {
    const visualCriteria=criteria.filter(item=>item.kind==='visual' && item.context.pages?.length && item.required && !item.allowNotApplicable);
    if (!['desktop','narrow'].every(viewport=>visualCriteria.some(item=>item.context.viewports?.includes(viewport)))) throw new Error('Visual changes require visual criteria covering desktop and narrow viewports.');
  }
  const highRisk=changeTypes.some(type=>HIGH_RISK.includes(type));
  if (highRisk) {
    const requiredStates=['success'];
    if (changeTypes.includes('async')) requiredStates.push('failure','recovery');
    if (changeTypes.includes('persistence')) requiredStates.push('refresh');
    if (changeTypes.includes('reversible')) requiredStates.push('reversal','final-state');
    if (changeTypes.includes('routing')) requiredStates.push('not-found');
    if (changeTypes.includes('cross-page')) requiredStates.push('cross-page');
    const flowCriteria=criteria.filter(item=>['interaction','e2e'].includes(item.kind) && item.required && !item.allowNotApplicable && item.context.pages?.length);
    if (!requiredStates.every(state=>flowCriteria.some(item=>item.context.states?.includes(state)))) throw new Error(`High-risk changes require interaction or E2E criteria with pages and states: ${requiredStates.join(', ')}.`);
  }
  return {schemaVersion:1,id:id(input.id,'task.id'),title:text(input.title,'task.title'),changeTypes,risk:highRisk?'high':'normal',inputs,criteria};
}
function taskDirectory(root,taskId) {return path.join(root,'.design-workflow/tasks',id(taskId,'task.id'));}
function atomicJson(file,value) {
  const temporary=`${file}.${crypto.randomUUID()}.tmp`;
  try {fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n');fs.renameSync(temporary,file);} finally {if(pathExists(temporary)) fs.unlinkSync(temporary);}
}
function locked(root,taskId,operation) {
  const directory=taskDirectory(root,taskId);
  if (!pathExists(directory)) throw new Error(`Task not found: ${taskId}`);
  const lock=path.join(directory,'lock.json');
  let descriptor;
  try {descriptor=fs.openSync(lock,'wx');} catch(error) {
    if (error.code==='EEXIST') throw new Error('Task is locked by an active or interrupted operation. Inspect lock.json and use task recover after the owning process has exited.');
    throw error;
  }
  fs.writeFileSync(descriptor,JSON.stringify({pid:process.pid,createdAt:now()}));
  try {return operation(directory);} finally {fs.closeSync(descriptor);fs.unlinkSync(lock);}
}
function readTask(root,taskId) {
  const task=readJson(path.join(taskDirectory(root,taskId),'task.json'));
  validateTaskPlan(task.plan);
  if (task.schemaVersion !== 1 || !['active','completed','completed-with-risks'].includes(task.status) || task.plan.id !== taskId || !Array.isArray(task.history)) throw new Error('Invalid task state.');
  for (const record of task.history) {
    if (!task.plan.criteria.some(item=>item.id===record.criterionId) || !['running','passed','failed','not-applicable','unverified','stale'].includes(record.status) || !['command','manual'].includes(record.method) || !record.inputs || !Array.isArray(record.artifacts)) throw new Error('Invalid task evidence record.');
    for (const attachment of record.artifacts) projectRelativePath(attachment.file,'record.artifact');
  }
  return task;
}
function snapshots(root,inputs) {
  const result={};
  for (const file of inputs) {
    const absolute=path.join(root,file);
    if (!pathExists(absolute)) {result[file]=null;continue;}
    if (!fs.statSync(absolute).isFile()) throw new Error(`Tracked input must be a file: ${file}`);
    result[file]=hash(fs.readFileSync(absolute));
  }
  return result;
}
function append(task,record) {
  task.history.push(record);
  task.updatedAt=now();
  task.status='active';
  delete task.finishedAt;
}
export function createTask(root,input) {
  root=path.resolve(root);
  if (!pathExists(root) || !fs.statSync(root).isDirectory()) throw new Error('Project directory does not exist.');
  const plan=validateTaskPlan(input);
  snapshots(root,plan.inputs);
  const directory=taskDirectory(root,plan.id);
  fs.mkdirSync(path.dirname(directory),{recursive:true});
  fs.mkdirSync(directory); // Never replace a task with the same id.
  const ignoreFile=path.join(root,'.gitignore');
  const existingIgnore=pathExists(ignoreFile)?fs.readFileSync(ignoreFile,'utf8'):'';
  if (!existingIgnore.split(/\r?\n/).some(line=>['.design-workflow/tasks/','/.design-workflow/tasks/'].includes(line.trim()))) {
    fs.writeFileSync(ignoreFile,existingIgnore+(existingIgnore && !existingIgnore.endsWith('\n')?'\n':'')+'/.design-workflow/tasks/\n');
  }
  const task={schemaVersion:1,plan,status:'active',createdAt:now(),updatedAt:now(),history:[]};
  atomicJson(path.join(directory,'task.json'),task);
  return taskStatus(root,plan.id);
}
function criterionFor(task,checkId) {
  const criterion=task.plan.criteria.find(item=>item.id===checkId);
  if (!criterion) throw new Error(`Unknown criterion: ${checkId}`);
  return criterion;
}
function artifact(root,file) {
  const absolute=path.join(root,file);
  if (!pathExists(absolute) || !fs.statSync(absolute).isFile()) throw new Error(`Evidence file is missing: ${file}`);
  return {file,sha256:hash(fs.readFileSync(absolute))};
}
export function runTaskCheck(root,taskId,checkId) {
  root=path.resolve(root);
  return locked(root,taskId,directory=>{
    const task=readTask(root,taskId);
    const criterion=criterionFor(task,checkId);
    if (!criterion.command) throw new Error('This criterion has no automated command; record manual evidence instead.');
    const attempt=crypto.randomUUID();
    const startedAt=now();
    const before=snapshots(root,task.plan.inputs);
    const record={attempt,criterionId:checkId,method:'command',status:'running',startedAt,command:criterion.command,declaredContext:criterion.context,inputs:before,artifacts:[]};
    append(task,record);
    atomicJson(path.join(directory,'task.json'),task);
    const execution=spawnSync(criterion.command[0],criterion.command.slice(1),{cwd:root,encoding:'utf8',timeout:criterion.timeoutMs,maxBuffer:8*1024*1024,shell:false});
    const log=path.join(directory,`${attempt}.log`);
    fs.writeFileSync(log,`${JSON.stringify({command:criterion.command,cwd:root,exitCode:execution.status,signal:execution.signal,error:execution.error?.message},null,2)}\n--- stdout ---\n${execution.stdout || ''}\n--- stderr ---\n${execution.stderr || ''}`);
    record.artifacts=[artifact(root,toPosix(path.relative(root,log)))];
    record.exitCode=execution.status;
    record.signal=execution.signal;
    record.error=execution.error?.message;
    record.finishedAt=now();
    record.status=!execution.error && execution.status===0 ? 'passed':'failed';
    if (JSON.stringify(before)!==JSON.stringify(snapshots(root,task.plan.inputs))) {record.status='stale';record.note='Tracked inputs changed while the check was running; run again against the final inputs.';}
    task.updatedAt=now();
    atomicJson(path.join(directory,'task.json'),task);
    return taskStatus(root,taskId);
  });
}
export function recordTaskEvidence(root,taskId,input) {
  root=path.resolve(root);
  return locked(root,taskId,directory=>{
    const task=readTask(root,taskId);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Manual evidence must be an object.');
    if (input.context !== undefined && (!input.context || typeof input.context !== 'object' || Array.isArray(input.context))) throw new Error('evidence.context must be an object.');
    const criterion=criterionFor(task,input.criterionId);
    if (!['passed','failed','not-applicable','unverified'].includes(input.status)) throw new Error('Unsupported manual evidence status.');
    if (criterion.command && input.status==='passed') throw new Error('Automated criteria can only pass through task run. Manual claims cannot replace actual command results.');
    if (input.status==='not-applicable' && !criterion.allowNotApplicable) throw new Error('This criterion cannot be marked not applicable.');
    const note=text(input.note,'evidence.note');
    if (input.artifacts !== undefined && !Array.isArray(input.artifacts)) throw new Error('evidence.artifacts must be an array of file paths.');
    const attachments=(input.artifacts || []).map(file=>artifact(root,evidencePath(file)));
    if (input.status==='passed' && !attachments.length) throw new Error('Manual pass requires evidence attachments.');
    const context={};
    for (const field of ['pages','states','viewports']) {
      if (input.context?.[field] !== undefined) context[field]=stringList(input.context[field],`evidence.context.${field}`);
      if (input.status==='passed' && (criterion.context[field] || []).some(value=>!context[field]?.includes(value))) throw new Error(`Manual evidence is missing required ${field} coverage.`);
    }
    append(task,{attempt:crypto.randomUUID(),criterionId:criterion.id,method:'manual',status:input.status,note,context,recordedAt:now(),inputs:snapshots(root,task.plan.inputs),artifacts:attachments});
    atomicJson(path.join(directory,'task.json'),task);
    return taskStatus(root,taskId);
  });
}
export function taskStatus(root,taskId) {
  root=path.resolve(root);
  const task=readTask(root,taskId);
  const current=snapshots(root,task.plan.inputs);
  const criteria=task.plan.criteria.map(criterion=>{
    const record=task.history.filter(item=>item.criterionId===criterion.id).at(-1);
    let status=record?.status || 'not-run';
    const staleArtifacts=(record?.artifacts || []).filter(item=>{
      try {return artifact(root,item.file).sha256 !== item.sha256;} catch {return true;}
    }).map(item=>item.file);
    if (record && (JSON.stringify(current)!==JSON.stringify(record.inputs) || staleArtifacts.length)) status='stale';
    return {...criterion,status,latest:record || null,staleArtifacts};
  });
  const blockers=criteria.filter(item=>item.required && !['passed','not-applicable'].includes(item.status)).map(item=>({id:item.id,status:item.status,title:item.title}));
  const risks=criteria.filter(item=>!item.required && !['passed','not-applicable'].includes(item.status)).map(item=>({id:item.id,status:item.status,title:item.title}));
  const state=task.status.startsWith('completed') ? (blockers.length ? 'verification-stale' : (risks.length ? 'completed-with-risks' : 'completed')) : 'active';
  return {id:taskId,title:task.plan.title,risk:task.plan.risk,status:state,canFinish:blockers.length===0,criteria,blockers,risks,trackedInputs:task.plan.inputs,history:task.history,stateFile:toPosix(path.relative(root,path.join(taskDirectory(root,taskId),'task.json'))),nextActions:blockers.map(item=>`${item.id}: ${item.status}; ${criteria.find(check=>check.id===item.id).command ? 'run the configured check':'record manual verification with attachments and context'}`),scope:'Evidence tracks declared criteria and tracked inputs only. Command success is not independent proof of test coverage; manual records remain human/agent observations, and changed untracked files are not detected.'};
}
export function finishTask(root,taskId) {
  root=path.resolve(root);
  return locked(root,taskId,directory=>{
    const result=taskStatus(root,taskId);
    if (!result.canFinish) return {...result,finishBlocked:true};
    const task=readTask(root,taskId);
    task.status=result.risks.length?'completed-with-risks':'completed';
    task.finishedAt=now();task.updatedAt=now();
    atomicJson(path.join(directory,'task.json'),task);
    return taskStatus(root,taskId);
  });
}
export function recoverTask(root,taskId) {
  root=path.resolve(root);
  const directory=taskDirectory(root,taskId);
  const lock=path.join(directory,'lock.json');
  if (pathExists(lock)) {
    const owner=readJson(lock);
    if (!Number.isInteger(owner.pid) || owner.pid<1) throw new Error('Invalid lock owner; inspect lock.json manually.');
    try {process.kill(owner.pid,0);throw new Error('The owning process still exists; recovery is blocked.');}
    catch(error) {if(error.code!=='ESRCH') throw error;}
    fs.unlinkSync(lock);
  }
  return locked(root,taskId,()=>taskStatus(root,taskId));
}

export function listTasks(root) {
  root=path.resolve(root);
  const directory=path.join(root,'.design-workflow/tasks');
  const tasks=[];
  const errors=[];
  if (pathExists(directory)) for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
    if (!entry.isDirectory() || !idPattern.test(entry.name)) continue;
    try {
      const result=taskStatus(root,entry.name);
      tasks.push({id:result.id,title:result.title,status:result.status,risk:result.risk,blockers:result.blockers,risks:result.risks,stateFile:result.stateFile,nextActions:result.nextActions});
    } catch(error) {errors.push({id:entry.name,message:error.message});}
  }
  return {tasks,errors};
}
