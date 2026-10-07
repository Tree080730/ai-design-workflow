import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {atomicRecord} from './launch.mjs';
const statusMessage='Design Harness: preparing design starting point';
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";
const winQuote=value=>"'"+value.replaceAll("'","''")+"'";
function safe(root,relative) {
  let current=root;
  for(const part of relative.split('/')) {
    current=path.join(current,part);
    try{if(fs.lstatSync(current).isSymbolicLink())throw new Error(`Hook installation refuses symlinks: ${relative}`);}catch(error){if(error.code!=='ENOENT')throw error;}
  }
  return current;
}
export function installGuiHook(project,{openMode,dryRun=false}={}) {
  if(!['host','system'].includes(openMode))throw new Error('Choose --open host or system explicitly.');
  const root=fs.realpathSync(path.resolve(project));
  if(!fs.statSync(root).isDirectory())throw new Error('Project must already exist.');
  const file=safe(root,'.codex/hooks.json'),receipt=safe(root,'.design-workflow/gui-hook-installation.json');
  const content=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{hooks:{}};
  if(!content||typeof content!=='object'||Array.isArray(content)||content.hooks&&typeof content.hooks!=='object'||Array.isArray(content.hooks))throw new Error('Invalid existing hooks.json; preserved.');
  const previous=fs.existsSync(receipt)?JSON.parse(fs.readFileSync(receipt,'utf8')):null;
  const groups=content.hooks?.SessionStart??[];
  if(!Array.isArray(groups))throw new Error('Existing SessionStart hooks must be an array; preserved.');
  const owned=groups.filter(group=>Array.isArray(group?.hooks)&&group.hooks.some(item=>item.statusMessage===statusMessage));
  if(owned.length>1||owned.length===1&&(!previous||digest(owned[0])!==previous.groupHash))throw new Error('Locally changed or unowned Design Harness hook; preserved. Review and merge it explicitly.');
  const launcher=fileURLToPath(new URL('../../../scripts/design-start.mjs',import.meta.url));
  const command=[process.execPath,launcher,'--hook','--project',root,'--open',openMode].map(quote).join(' ');
  const commandWindows='powershell -NoProfile -Command "& '+[process.execPath,launcher,'--hook','--project',root,'--open',openMode].map(winQuote).join(' ')+'"';
  const group={matcher:'^(startup|resume|clear)$',hooks:[{type:'command',command,commandWindows,timeout:20,statusMessage,additionalContextLimit:1500}]};
  const next={...content,hooks:{...content.hooks,SessionStart:groups.map(item=>item===owned[0]?group:item)}};
  if(!owned.length)next.hooks.SessionStart.push(group);
  const planned=[];
  if(JSON.stringify(next)!==JSON.stringify(content))planned.push('.codex/hooks.json');
  const record={schemaVersion:1,projectPath:root,openMode,groupHash:digest(group),launcher};
  if(JSON.stringify(record)!==JSON.stringify(previous))planned.push('.design-workflow/gui-hook-installation.json');
  if(!dryRun)for(const relative of planned){const target=relative==='.codex/hooks.json'?file:receipt;fs.mkdirSync(path.dirname(target),{recursive:true});atomicRecord(target,relative==='.codex/hooks.json'?next:record);}
  return {projectPath:root,dryRun,written:planned,openMode,trust:'requires-user-review',note:'Review and trust the exact hook in Codex before it can run. This command does not grant trust or change global configuration.'};
}
