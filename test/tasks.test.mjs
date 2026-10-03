import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {createTask,runTaskCheck,recordTaskEvidence,taskStatus,finishTask,recoverTask,listTasks} from '../packages/cli/src/tasks.mjs';

function fixture(run) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'design-task-'));
  const write=(file,content)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),typeof content==='string'?content:JSON.stringify(content));};
  try {write('src/app.js','export const value=1;');run(root,write);} finally {fs.rmSync(root,{recursive:true,force:true});}
}
const command=[process.execPath,'-e','process.exit(0)'];
function plan(extra={}) {
  return {schemaVersion:1,id:'sample',title:'Track example change',changeTypes:['page'],inputs:['src/app.js'],criteria:[
    {id:'static',kind:'static',title:'Static analysis',command},
    {id:'build',kind:'build',title:'Build',command},
    {id:'visual',kind:'visual',title:'Review layout',context:{pages:['/'],viewports:['desktop','narrow']}}
  ],...extra};
}
function manual(write) {
  write('proof/layout.md','# Observation\nDesktop and narrow layout reviewed.');
  return {criterionId:'visual',status:'passed',note:'Observed both viewports.',artifacts:['proof/layout.md'],context:{pages:['/'],viewports:['desktop','narrow']}};
}

test('task resumes from persisted evidence and cannot finish before mandatory checks',()=>fixture((root,write)=>{
  const created=createTask(root,plan());
  assert.equal(created.canFinish,false);
  assert.equal(created.criteria[0].status,'not-run');
  assert.equal(finishTask(root,'sample').finishBlocked,true);
  assert.throws(()=>createTask(root,plan()));
  assert.throws(()=>recordTaskEvidence(root,'sample',{criterionId:'static',status:'passed',note:'Trust me'}),/actual command/);
  runTaskCheck(root,'sample','static');
  runTaskCheck(root,'sample','build');
  recordTaskEvidence(root,'sample',manual(write));
  const completed=finishTask(root,'sample');
  assert.equal(completed.status,'completed');
  assert.equal(completed.criteria[0].latest.exitCode,0);
  assert.match(fs.readFileSync(path.join(root,completed.criteria[0].latest.artifacts[0].file),'utf8'),/stdout/);
  const cli=path.resolve('packages/cli/bin/design-workflow.mjs');
  const resumed=spawnSync(process.execPath,[cli,'task','status',root,'--task','sample','--json'],{encoding:'utf8'});
  assert.equal(resumed.status,0,resumed.stderr);
  assert.equal(JSON.parse(resumed.stdout).status,'completed');
}));

test('failed execution and interrupted states are retained with recovery actions',()=>fixture((root,write)=>{
  const input=plan();input.criteria[0].command=[process.execPath,'-e',"console.error('failure detail');process.exit(3)"];
  createTask(root,input);
  const result=runTaskCheck(root,'sample','static');
  assert.equal(result.criteria[0].status,'failed');
  assert.equal(result.criteria[0].latest.exitCode,3);
  assert.match(fs.readFileSync(path.join(root,result.criteria[0].latest.artifacts[0].file),'utf8'),/failure detail/);
  assert.equal(result.canFinish,false);
  const statePath=path.join(root,result.stateFile);
  const state=JSON.parse(fs.readFileSync(statePath,'utf8'));state.history[0].status='running';fs.writeFileSync(statePath,JSON.stringify(state));
  write('.design-workflow/tasks/sample/lock.json',{pid:2147483647});
  const recovered=recoverTask(root,'sample');
  assert.equal(recovered.criteria[0].status,'running');
  assert.ok(recovered.nextActions[0].includes('run the configured check'));
  assert.equal(fs.existsSync(path.join(root,'.design-workflow/tasks/sample/lock.json')),false);
  write('.design-workflow/tasks/sample/lock.json',{pid:process.pid});
  assert.throws(()=>recoverTask(root,'sample'),/still exists/);
}));

test('changed tracked inputs or evidence invalidate completion without deleting history',()=>fixture((root,write)=>{
  createTask(root,plan());runTaskCheck(root,'sample','static');runTaskCheck(root,'sample','build');recordTaskEvidence(root,'sample',manual(write));finishTask(root,'sample');
  write('proof/layout.md','# Changed observation');
  let result=taskStatus(root,'sample');
  assert.equal(result.status,'verification-stale');
  assert.deepEqual(result.criteria[2].staleArtifacts,['proof/layout.md']);
  write('src/app.js','export const value=2;');
  result=taskStatus(root,'sample');
  assert.ok(result.criteria.every(item=>item.status==='stale'));
  assert.equal(result.history.length,3);
  assert.equal(finishTask(root,'sample').finishBlocked,true);
  runTaskCheck(root,'sample','static');
  assert.equal(taskStatus(root,'sample').criteria[0].status,'passed');
  assert.equal(taskStatus(root,'sample').history.length,4);
}));

test('manual verification requires attachments and actual declared coverage; exemptions are explicit',()=>fixture((root,write)=>{
  createTask(root,plan());
  assert.throws(()=>recordTaskEvidence(root,'sample',{criterionId:'visual',status:'passed',note:'Looks fine'}),/attachments/);
  const evidence=manual(write);evidence.context.viewports=['desktop'];
  assert.throws(()=>recordTaskEvidence(root,'sample',evidence),/viewports coverage/);
  assert.throws(()=>recordTaskEvidence(root,'sample',{criterionId:'visual',status:'not-applicable',note:'Skip'}),/cannot be marked/);
  const input=plan({id:'docs',changeTypes:['docs'],criteria:[{id:'docs',kind:'documentation',title:'Reference check',allowNotApplicable:true}]});
  createTask(root,input);
  recordTaskEvidence(root,'docs',{criterionId:'docs',status:'not-applicable',note:'No reference links in this change.'});
  assert.equal(finishTask(root,'docs').status,'completed');
}));

test('risk rules require visual coverage and complete high-risk state loops',()=>fixture(root=>{
  for (const input of [plan({criteria:[]}),plan({inputs:['../outside']}),plan({id:'../bad'}),plan({changeTypes:['routing']}),plan({criteria:plan().criteria.filter(item=>item.kind!=='visual')})]) assert.throws(()=>createTask(root,input));
  const input=plan({changeTypes:['page','async','persistence','reversible','routing','cross-page']});
  input.criteria.push({id:'flow',kind:'interaction',title:'Verify state loop',context:{pages:['/','/detail'],states:['success','failure','recovery','refresh','reversal','final-state','not-found','cross-page']}});
  assert.equal(createTask(root,input).risk,'high');
}));

test('command timeouts, missing executables and mutations cannot be counted as pass',()=>fixture(root=>{
  const input=plan();input.criteria[0].command=[process.execPath,'-e','setTimeout(()=>{},10000)'];input.criteria[0].timeoutMs=50;
  input.criteria[1].command=['design-harness-nonexistent-executable'];
  createTask(root,input);
  assert.equal(runTaskCheck(root,'sample','static').criteria[0].status,'failed');
  assert.equal(runTaskCheck(root,'sample','build').criteria[1].status,'failed');
  const mutating=plan({id:'mutating'});mutating.criteria[0].command=[process.execPath,'-e',"require('fs').writeFileSync('src/app.js','changed')"];
  createTask(root,mutating);
  assert.equal(runTaskCheck(root,'mutating','static').criteria[0].status,'stale');
}));

test('optional gaps are retained as completion risks',()=>fixture((root,write)=>{
  const input=plan();input.criteria.push({id:'extra',kind:'documentation',title:'Optional docs check',required:false});
  createTask(root,input);runTaskCheck(root,'sample','static');runTaskCheck(root,'sample','build');recordTaskEvidence(root,'sample',manual(write));
  const result=finishTask(root,'sample');
  assert.equal(result.status,'completed-with-risks');
  assert.deepEqual(result.risks.map(item=>item.id),['extra']);
}));

test('CLI task option values do not become project paths and blocked completion exits nonzero',()=>fixture((root,write)=>{
  write('plan.json',plan());const cli=path.resolve('packages/cli/bin/design-workflow.mjs');
  const created=spawnSync(process.execPath,[cli,'task','create','--file',path.join(root,'plan.json'),root,'--json'],{encoding:'utf8'});
  assert.equal(created.status,0,created.stderr);
  const blocked=spawnSync(process.execPath,[cli,'task','finish',root,'--task','sample','--json'],{encoding:'utf8'});
  assert.equal(blocked.status,2);
  assert.equal(JSON.parse(blocked.stdout).finishBlocked,true);
}));


test('new sessions discover tasks and isolate unreadable task state',()=>fixture((root,write)=>{
  assert.deepEqual(listTasks(root),{tasks:[],errors:[]});
  createTask(root,plan());
  write('.design-workflow/tasks/broken/task.json','{ invalid');
  const result=listTasks(root);
  assert.deepEqual(result.tasks.map(item=>item.id),['sample']);
  assert.deepEqual(result.errors.map(item=>item.id),['broken']);
  assert.equal(result.tasks[0].blockers.length,3);
  const cli=path.resolve('packages/cli/bin/design-workflow.mjs');
  const listed=spawnSync(process.execPath,[cli,'task','list',root,'--json'],{encoding:'utf8'});
  assert.equal(listed.status,0,listed.stderr);
  assert.equal(JSON.parse(listed.stdout).tasks[0].id,'sample');
}));

test('separate required criteria can collectively cover viewports and risk states',()=>fixture(root=>{
  const input=plan({changeTypes:['layout','async']});
  input.criteria=input.criteria.filter(item=>item.kind!=='visual');
  for (const viewport of ['desktop','narrow']) input.criteria.push({id:viewport,kind:'visual',title:viewport,context:{pages:['/'],viewports:[viewport]}});
  for (const state of ['success','failure','recovery']) input.criteria.push({id:state,kind:'interaction',title:state,context:{pages:['/'],states:[state]}});
  assert.equal(createTask(root,input).risk,'high');
}));

test('deleted execution logs invalidate previously passed automatic evidence',()=>fixture(root=>{
  createTask(root,plan());
  const result=runTaskCheck(root,'sample','static');
  fs.rmSync(path.join(root,result.criteria[0].latest.artifacts[0].file));
  const resumed=taskStatus(root,'sample');
  assert.equal(resumed.criteria[0].status,'stale');
  assert.equal(resumed.criteria[0].staleArtifacts.length,1);
}));


test('local task state is ignored without replacing existing gitignore entries',()=>fixture((root,write)=>{
  write('.gitignore','node_modules/');
  createTask(root,plan());
  assert.equal(fs.readFileSync(path.join(root,'.gitignore'),'utf8'),'node_modules/\n/.design-workflow/tasks/\n');
  createTask(root,plan({id:'second'}));
  assert.equal(fs.readFileSync(path.join(root,'.gitignore'),'utf8'),'node_modules/\n/.design-workflow/tasks/\n');
}));
