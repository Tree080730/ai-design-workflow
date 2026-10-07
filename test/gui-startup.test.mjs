import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {spawnSync} from 'node:child_process';
import {launchGui,verifySession} from '../packages/gui/src/launch.mjs';
import {installGuiHook} from '../packages/gui/src/hooks.mjs';
import {startDesign,runHook,openSystemBrowser,recordHookDiagnostic} from '../scripts/design-start.mjs';
import {returnNote} from '../packages/gui/public/return-state.js';
const thread='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
function project(t){const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),"design-start ' ")));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
function stop(record){try{process.kill(record.pid,'SIGTERM');}catch(error){if(error.code!=='ESRCH')throw error;}}
test('live startup isolates sessions, reuses concurrent launches and recovers stale instance',async t=>{
 const root=project(t);const pids=new Set();t.after(()=>{for(const pid of pids)stop({pid});});
 const pair=await Promise.all([launchGui({project:root,hostThread:thread}),launchGui({project:root,hostThread:thread})]);
 pair.forEach(r=>pids.add(r.pid));assert.equal(pair[0].url,pair[1].url);assert.equal(pair[0].pid,pair[1].pid);
 assert.equal(await verifySession(pair[0],root,thread),true);
 assert.equal((await fetch(pair[0].url+'/api/session')).status,403);
 const second=await launchGui({project:root,hostThread:other});pids.add(second.pid);assert.notEqual(second.url,pair[0].url);
 assert.equal((await fetch(pair[0].url+'/return-state.js')).status,200);
 const state=await (await fetch(pair[0].url+'/api/project')).json();assert.equal(state.host.threadId,thread);
 const saved=await fetch(pair[0].url+'/api/basis',{method:'POST',headers:{Origin:pair[0].url,'Content-Type':'application/json'},body:JSON.stringify({presetId:'linear-site',mode:'reference',intent:'',referenceUrl:'',selectionOnly:true,revision:state.revision})});assert.equal(saved.status,200);
 const content=fs.readFileSync(path.join(root,'.design-workflow/design-basis.json'),'utf8');
 assert.equal((await startDesign({project:root,hostThread:thread})).openRequired,false);
 assert.equal((await startDesign({project:root,hostThread:thread,reselect:true})).url,pair[0].url);
 assert.equal(fs.readFileSync(path.join(root,'.design-workflow/design-basis.json'),'utf8'),content);
 stop(pair[0]);await new Promise(resolve=>setTimeout(resolve,150));
 const recovered=await launchGui({project:root,hostThread:thread});pids.add(recovered.pid);assert.notEqual(recovered.pid,pair[0].pid);
 assert.equal(await verifySession(recovered,root,thread),true);
});
test('hook installer preserves unrelated hooks, is idempotent and refuses edited managed hook',t=>{
 const root=project(t);const file=path.join(root,'.codex/hooks.json');fs.mkdirSync(path.dirname(file));
 const existing={hooks:{UserPromptSubmit:[{hooks:[{type:'command',command:'echo user'}]}],SessionStart:[{matcher:'startup',hooks:[{type:'command',command:'echo existing'}]}]}};fs.writeFileSync(file,JSON.stringify(existing));
 assert.equal(installGuiHook(root,{openMode:'host',dryRun:true}).written.length,2);assert.deepEqual(JSON.parse(fs.readFileSync(file)),existing);
 installGuiHook(root,{openMode:'host'});const installed=JSON.parse(fs.readFileSync(file));assert.deepEqual(installed.hooks.UserPromptSubmit,existing.hooks.UserPromptSubmit);assert.deepEqual(installed.hooks.SessionStart[0],existing.hooks.SessionStart[0]);
 assert.equal(installGuiHook(root,{openMode:'host'}).written.length,0);
 assert.match(installed.hooks.SessionStart[1].hooks[0].command,/--project/);
 const invoked=spawnSync(installed.hooks.SessionStart[1].hooks[0].command,{shell:true,encoding:'utf8',input:JSON.stringify({hook_event_name:'SessionStart',source:'compact',cwd:root,session_id:thread})});assert.equal(invoked.status,0,invoked.stderr);assert.deepEqual(JSON.parse(invoked.stdout),{});
 const diagnostics=fs.readFileSync(path.join(root,'.design-workflow/gui-hook-events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.deepEqual(diagnostics.map(item=>item.status),['started','invoked','ignored']);assert.equal(fs.existsSync(path.join(root,'.design-workflow/gui-sessions')),false);
 installed.hooks.SessionStart[1].hooks[0].command+=' changed';fs.writeFileSync(file,JSON.stringify(installed));assert.throws(()=>installGuiHook(root,{openMode:'system'}),/preserved/);
 assert.deepEqual(JSON.parse(fs.readFileSync(file)),installed);
});
test('hook binds explicit project for nested cwd, skips compact, and reports browser failure honestly',async t=>{
 const root=project(t);const nested=path.join(root,'nested');fs.mkdirSync(nested);let received;
 const input={hook_event_name:'SessionStart',source:'startup',cwd:nested,session_id:thread};
 const result=await runHook(input,{project:root,openMode:'system',start:async args=>{received=args;return {openRequired:true,url:'http://127.0.0.1:1234',projectPath:root};},open:async()=>'failed'});
 assert.equal(received.project,root);assert.match(result.hookSpecificOutput.additionalContext,/failed/);
 assert.deepEqual(await runHook({...input,source:'compact'}),{});
 await assert.rejects(runHook({...input,session_id:'thr_guess'}),/UUID/);
 await assert.rejects(runHook({...input,cwd:os.tmpdir()},{project:root}),/outside/);
 const selected=await runHook(input,{start:async()=>({openRequired:false,selectionFile:'basis.json'}),open:()=>{throw new Error('must not open');}});assert.match(selected.hookSpecificOutput.additionalContext,/do not reopen/);
});
test('startup preserves invalid or symlinked selections',async t=>{
 const root=project(t);const folder=path.join(root,'.design-workflow');fs.mkdirSync(folder);const file=path.join(folder,'design-basis.json');fs.writeFileSync(file,'{"schemaVersion":99}');await assert.rejects(startDesign({project:root,hostThread:thread}),/Unsupported/);assert.equal(fs.readFileSync(file,'utf8'),'{"schemaVersion":99}');fs.unlinkSync(file);fs.symlinkSync('/tmp',file);await assert.rejects(startDesign({project:root}),/symlink/);
});
test('browser opening uses argument arrays, bounded waiting and no navigation success claim',async()=>{
 let invocation;const spawnCommand=(...args)=>{invocation=args;const child=new EventEmitter();queueMicrotask(()=>child.emit('exit',0));return child;};
 assert.equal(await openSystemBrowser('http://127.0.0.1:1234',{platform:'darwin',spawnCommand}),'requested');assert.deepEqual(invocation[1],['http://127.0.0.1:1234']);
 assert.equal(await openSystemBrowser('http://127.0.0.1:1234',{timeoutMs:10,spawnCommand:()=>new EventEmitter()}),'failed');
 await assert.rejects(openSystemBrowser('https://example.com'),/local GUI/);
 assert.match(returnNote({host:{returnUrl:'codex://threads/x'}},'pending'),/如果仍停留/);assert.match(returnNote({}),/手动返回/);
});

test('diagnostic logging preserves symlink targets',t=>{
 const root=project(t);fs.mkdirSync(path.join(root,'.design-workflow'));const target=path.join(root,'untouched');fs.writeFileSync(target,'unchanged');fs.symlinkSync(target,path.join(root,'.design-workflow/gui-hook-events.jsonl'));assert.throws(()=>recordHookDiagnostic(root,{status:'invoked'}),/symlink/);assert.equal(fs.readFileSync(target,'utf8'),'unchanged');
});
