#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {launchGui} from '../packages/gui/src/launch.mjs';
import {hostReturn} from '../packages/gui/src/host-return.mjs';

export async function startDesign({project,hostThread=null,reselect=false}={}) {
  const root=fs.realpathSync(path.resolve(project));
  const file=path.join(root,'.design-workflow/design-basis.json');
  const directory=path.dirname(file);
  for(const name of [directory,file])try{if(fs.lstatSync(name).isSymbolicLink())throw new Error('Selection path is symlinked; resolve it before startup.');}catch(error){if(error.code!=='ENOENT')throw error;}
  const selection=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
  // Validate the persisted basis before deciding whether to skip selection.
  if(selection) {
    const {catalog}=await import('../packages/gui/src/catalog.mjs');
    if(selection.schemaVersion!==1||!['custom','components','reference'].includes(selection.mode)||
      (selection.mode==='custom'?selection.preset!==null:!catalog.some(item=>item.id===selection.preset?.id)))throw new Error('Unsupported saved selection; preserve and resolve it before startup.');
    if(selection.projectPath&&fs.realpathSync(selection.projectPath)!==root)throw new Error('Saved selection belongs to a different project.');
  }
  const host=hostReturn(hostThread);
  if(selection&&!reselect)return {status:'selected',projectPath:root,selectionFile:file,host,openRequired:false};
  const session=await launchGui({project:root,hostThread});
  return {status:'ready',projectPath:root,url:session.url,host,reused:session.reused,openRequired:true,recordFile:session.recordFile};
}
export async function openSystemBrowser(url,{platform=process.platform,spawnCommand=spawn,timeoutMs=3000}={}) {
  if(!/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(url))throw new Error('Only the local GUI URL may be opened.');
  const command=platform==='darwin'?['open',[url]]:platform==='win32'?['rundll32',['url.dll,FileProtocolHandler',url]]:['xdg-open',[url]];
  return new Promise(resolve=>{
    const child=spawnCommand(command[0],command[1],{stdio:'ignore'});
    const timer=setTimeout(()=>{child.unref?.();resolve('failed');},timeoutMs);
    const done=value=>{clearTimeout(timer);resolve(value);};
    child.once('error',()=>done('failed'));
    child.once('exit',code=>done(code===0?'requested':'failed'));
  });
}
export function recordHookDiagnostic(project,event) {
  const root=fs.realpathSync(path.resolve(project));
  const directory=path.join(root,'.design-workflow');
  const file=path.join(directory,'gui-hook-events.jsonl');
  for(const name of [directory,file])try{if(fs.lstatSync(name).isSymbolicLink())throw new Error('Hook diagnostics refuse symlinked destinations.');}catch(error){if(error.code!=='ENOENT')throw error;}
  fs.mkdirSync(directory,{recursive:true});
  if(fs.existsSync(file)&&fs.statSync(file).size>1024*1024)throw new Error('Hook diagnostics reached 1 MiB; archive the log before retrying.');
  fs.appendFileSync(file,JSON.stringify({at:new Date().toISOString(),...event})+'\n',{mode:0o600});
}
export async function runHook(input,{openMode='host',project=null,start=startDesign,open=openSystemBrowser}={}) {
  if(input.hook_event_name!=='SessionStart'||!['startup','resume','clear'].includes(input.source))return {};
  if(!input.cwd||!hostReturn(input.session_id).threadId)throw new Error('Hook needs an explicit project cwd and supported session UUID.');
  const root=project?fs.realpathSync(path.resolve(project)):fs.realpathSync(input.cwd);
  const cwd=fs.realpathSync(input.cwd);
  const relative=path.relative(root,cwd);
  if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw new Error('Hook cwd is outside its explicitly bound project.');
  const result=await start({project:root,hostThread:input.session_id});
  let context;
  if(!result.openRequired)context=`Design Harness: existing selection at ${result.selectionFile}. Read it and the installed designer-dev-workflow Skill when the user supplies a design requirement; do not reopen GUI or start a build merely because the session started.`;
  else {
    const opened=openMode==='system'?await open(result.url):'host-required';
    context=`Design Harness selection GUI ready: ${result.url}. Target project: ${result.projectPath}. Bound original session: ${input.session_id}. Browser open status: ${opened}. ${openMode==='host'?'Use the supported host browser tool to display this URL before design implementation.':'If the window did not open, display the URL for manual opening.'} Wait for selection and read the actual saved design-basis.json; then use the user requirement in this host conversation and follow the installed Skill. Do not treat this startup as a build request or source analysis.`;
  }
  return {hookSpecificOutput:{hookEventName:'SessionStart',additionalContext:context}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);
  try {
    let project=process.cwd(),hostThread=process.env.CODEX_THREAD_ID??null,reselect=false,hook=false,openMode='host';
    for(let i=0;i<args.length;i++) {
      if(args[i]==='--project'&&args[i+1])project=args[++i];
      else if(args[i]==='--host-thread'&&args[i+1])hostThread=args[++i];
      else if(args[i]==='--reselect')reselect=true;
      else if(args[i]==='--hook')hook=true;
      else if(args[i]==='--open'&&args[i+1])openMode=args[++i];
      else throw new Error('Usage: node scripts/design-start.mjs [--project PATH] [--host-thread UUID] [--reselect] [--open host|system] [--hook]');
    }
    if(!['host','system'].includes(openMode))throw new Error('Open mode must be host or system.');
    if(hook) {
      recordHookDiagnostic(project,{status:'started',pid:process.pid});
      let body='';for await(const chunk of process.stdin){body+=chunk;if(body.length>65536)throw new Error('Hook input is too large.');}
      const input=JSON.parse(body);
      const diagnostic={event:input.hook_event_name??null,source:input.source??null,sessionId:input.session_id??null,cwd:input.cwd??null};
      recordHookDiagnostic(project,{status:'invoked',...diagnostic});
      try {
        const output=await runHook(input,{openMode,project});
        recordHookDiagnostic(project,{status:output.hookSpecificOutput?'completed':'ignored',...diagnostic});
        console.log(JSON.stringify(output));
      } catch(error) {
        recordHookDiagnostic(project,{status:'failed',...diagnostic,error:error.message});
        throw error;
      }
    }else {
      const result=await startDesign({project,hostThread,reselect});
      if(result.openRequired)result.browserOpen=openMode==='system'?await openSystemBrowser(result.url):'host-required';
      console.log(JSON.stringify(result,null,2));
    }
  }catch(error){
    if(args.includes('--hook'))console.log(JSON.stringify({systemMessage:`Design Harness startup unavailable: ${error.message}. Use the manual startup command after resolving it; no build was started.`}));
    else{console.error(error.message);process.exitCode=1;}
  }
}
