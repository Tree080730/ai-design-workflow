import {createGuiServer} from './server.mjs';
import {atomicRecord,runtimeDirectory} from './launch.mjs';
import path from 'node:path';

try {
  const config=JSON.parse(process.argv[2]);
  const {root,directory}=runtimeDirectory(config.project);
  if(path.dirname(config.recordFile)!==directory||!/^[a-f0-9]{64}$/.test(config.nonce))throw new Error('Invalid GUI session configuration.');
  const server=createGuiServer({project:root,hostThread:config.hostThread,session:{nonce:config.nonce}});
  let lastRequest=Date.now();
  server.on('request',()=>{lastRequest=Date.now();});
  const idle=setInterval(()=>{if(Date.now()-lastRequest>45*60*1000)stop();},60000);idle.unref();
  const stop=()=>{clearInterval(idle);server.closeAllConnections();server.close(()=>process.exit(0));};
  process.on('SIGTERM',stop);process.on('SIGINT',stop);
  server.on('error',error=>{console.error(error.message);process.exit(1);});
  server.listen(0,'127.0.0.1',()=>atomicRecord(config.recordFile,{schemaVersion:1,projectPath:root,hostThread:config.hostThread,nonce:config.nonce,pid:process.pid,url:`http://127.0.0.1:${server.address().port}`,startedAt:new Date().toISOString()}));
}catch(error){console.error(error.message);process.exitCode=1;}
