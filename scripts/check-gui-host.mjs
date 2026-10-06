import {spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

// Read-only: never start a daemon, resume a thread, send a turn or read auth files.
export function checkGuiHost({threadId,project,socket,timeoutMs=8000,spawnProcess=spawn}={}) {
  if (!threadId) return Promise.resolve({status:'unavailable',reason:'missing-thread-id',canDispatch:false});
  return new Promise(resolve=>{
    let child,buffer='',finished=false,stage='initialize',missingSocket=false;
    const finish=result=>{
      if(finished)return;finished=true;clearTimeout(timer);child?.kill();
      resolve({...result,canDispatch:false});
    };
    const timer=setTimeout(()=>finish({status:'unavailable',reason:'timeout',stage}),timeoutMs);
    try {child=spawnProcess('codex',['app-server','proxy',...(socket?['--sock',socket]:[])],{stdio:['pipe','pipe','pipe']});}
    catch {finish({status:'unavailable',reason:'cli-unavailable'});return;}
    const send=message=>child.stdin.write(JSON.stringify(message)+'\n');
    child.on('error',()=>finish({status:'unavailable',reason:'cli-unavailable'}));
    child.stdin.on('error',()=>finish({status:'unavailable',reason:'transport-closed',stage}));
    // Do not surface raw stderr or unrelated thread/event content.
    child.stderr.on('data',bytes=>{
      if(/No such file or directory|os error 2/.test(bytes.toString()))missingSocket=true;
    });
    child.stdout.on('data',chunk=>{
      buffer+=chunk;if(buffer.length>1024*1024){finish({status:'unavailable',reason:'response-too-large'});return;}
      let end;
      while((end=buffer.indexOf('\n'))>=0&&!finished){
        const line=buffer.slice(0,end);buffer=buffer.slice(end+1);
        if(!line.trim())continue;
        let message;try{message=JSON.parse(line);}catch{finish({status:'unavailable',reason:'invalid-protocol'});return;}
        if(message.id===1&&stage==='initialize'){
          if(message.error||!message.result){finish({status:'unavailable',reason:'initialize-rejected'});return;}
          stage='thread/read';send({method:'initialized'});
          send({id:2,method:'thread/read',params:{threadId,includeTurns:false}});
        }else if(message.id===2&&stage==='thread/read'){
          const thread=message.result?.thread;
          if(message.error||thread?.id!==threadId){finish({status:'unavailable',reason:'thread-not-readable'});return;}
          const canonical=value=>{try{return fs.realpathSync(value);}catch{return path.resolve(value);}};
          const projectMatches=Boolean(project&&thread.cwd&&canonical(project)===canonical(thread.cwd));
          finish({status:'readable',threadId:thread.id,cwd:thread.cwd??null,projectMatches,
            reason:projectMatches?'read-only-verified':'project-binding-not-verified',
            remaining:['turn submission','event subscription','approvals','desktop tool parity']});
        }
      }
    });
    child.on('exit',code=>finish({status:'unavailable',reason:missingSocket?'control-socket-missing':'proxy-exited',exitCode:code,stage}));
    send({id:1,method:'initialize',params:{clientInfo:{name:'design_builder_probe',title:'Design Builder connection check',version:'0.1.0'}}});
  });
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const options={threadId:process.env.CODEX_THREAD_ID,project:process.cwd()};
  for(let i=2;i<process.argv.length;i++){
    const key={'--thread':'threadId','--project':'project','--socket':'socket'}[process.argv[i]];
    if(!key||!process.argv[i+1])throw new Error('Usage: node scripts/check-gui-host.mjs [--thread ID] [--project PATH] [--socket PATH]');
    options[key]=process.argv[++i];
  }
  const result=await checkGuiHost(options);console.log(JSON.stringify(result,null,2));
  process.exitCode=result.status==='readable'&&result.projectMatches?0:1;
}
