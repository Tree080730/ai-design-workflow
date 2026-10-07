import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hostReturn} from './host-return.mjs';

export function runtimeDirectory(project) {
  const root=fs.realpathSync(path.resolve(project));
  if(!fs.statSync(root).isDirectory())throw new Error('Project must be an existing directory.');
  let current=root;
  for(const part of ['.design-workflow','gui-sessions']) {
    current=path.join(current,part);
    try {if(fs.lstatSync(current).isSymbolicLink()||!fs.statSync(current).isDirectory())throw new Error('GUI runtime refuses symlinked or non-directory paths.');}
    catch(error){if(error.code!=='ENOENT')throw error;fs.mkdirSync(current,{mode:0o700,recursive:true});}
  }
  return {root,directory:current};
}
export function atomicRecord(file,value) {
  const temporary=`${file}.${crypto.randomUUID()}.tmp`;
  try{fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});fs.renameSync(temporary,file);}
  finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}
export async function verifySession(record,root,threadId) {
  if(record?.schemaVersion!==1||record.projectPath!==root||record.hostThread!==threadId||!/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(record.url??'')||!/^[a-f0-9]{64}$/.test(record.nonce??''))return false;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),700);
  try{
    const response=await fetch(record.url+'/api/session',{headers:{'x-design-session':record.nonce},signal:controller.signal,redirect:'error'});
    if(!response.ok)return false;
    const value=await response.json();
    return value.schemaVersion===1&&value.projectPath===root&&value.hostThread===threadId&&value.nonce===record.nonce;
  }catch{return false;}finally{clearTimeout(timer);}
}
function readRecord(file){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}}
export async function launchGui({project,hostThread=null,timeoutMs=10000}={}) {
  const threadId=hostReturn(hostThread).threadId;
  const {root,directory}=runtimeDirectory(project);
  const key=crypto.createHash('sha256').update(JSON.stringify([root,threadId])).digest('hex').slice(0,24);
  const recordFile=path.join(directory,key+'.json'),lock=path.join(directory,key+'.lock');
  const deadline=Date.now()+timeoutMs;
  for(const file of [recordFile,lock])try{if(fs.lstatSync(file).isSymbolicLink())throw new Error('GUI runtime refuses symlinked files.');}catch(error){if(error.code!=='ENOENT')throw error;}
  let locked=false;
  while(Date.now()<deadline) {
    const prior=readRecord(recordFile);
    if(await verifySession(prior,root,threadId))return {...prior,reused:true,recordFile};
    try{fs.writeFileSync(lock,String(Date.now()),{flag:'wx',mode:0o600});locked=true;break;}
    catch(error){if(error.code!=='EEXIST')throw error;
      try { if(Date.now()-fs.statSync(lock).mtimeMs>60000) {fs.unlinkSync(lock);continue;} } catch(race) {if(race.code==='ENOENT')continue;throw race;}
      await new Promise(resolve=>setTimeout(resolve,100));}
  }
  if(!locked)throw new Error('GUI startup is busy. Retry; no selection was changed.');
  try {
    const prior=readRecord(recordFile);
    if(await verifySession(prior,root,threadId))return {...prior,reused:true,recordFile};
    const nonce=crypto.randomBytes(32).toString('hex');
    const log=path.join(directory,key+'.log');
    try{if(fs.lstatSync(log).isSymbolicLink())throw new Error('GUI runtime refuses symlinked log files.');}catch(error){if(error.code!=='ENOENT')throw error;}
    const fd=fs.openSync(log,'a',0o600);
    let child;
    try{child=spawn(process.execPath,[fileURLToPath(new URL('./session.mjs',import.meta.url)),JSON.stringify({project:root,hostThread:threadId,nonce,recordFile})],{detached:true,stdio:['ignore',fd,fd]});}
    finally{fs.closeSync(fd);}
    let failure;child.on('error',error=>{failure=error;});child.unref();
    while(Date.now()<deadline) {
      if(failure)throw failure;
      const record=readRecord(recordFile);
      if(record?.nonce===nonce&&await verifySession(record,root,threadId))return {...record,reused:false,recordFile};
      if(child.exitCode!==null)throw new Error(`GUI failed to start. Inspect ${log}`);
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    throw new Error(`GUI readiness timed out. Inspect ${log}; retry to recover. No selection was changed.`);
  }finally{try{fs.unlinkSync(lock);}catch(error){if(error.code!=='ENOENT')throw error;}}
}
