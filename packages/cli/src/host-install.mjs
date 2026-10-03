import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {listFiles, pathExists, readJson, toPosix} from './fs-utils.mjs';

const skillRoot=fileURLToPath(new URL('../../../skills/',import.meta.url));
const names=['designer-dev-workflow','design-system-builder','proposal-with-preview','rules-governance'];
const START='<!-- design-harness:start -->';
const END='<!-- design-harness:end -->';
const hash=content=>crypto.createHash('sha256').update(content).digest('hex');
const manifestName='.design-workflow/host-installation.json';
const hostRoots={codex:'.agents/skills',claude:'.claude/skills'};
function relativeFile(root,file) {return toPosix(path.relative(root,file));}
function block(host) {
  return [START,'## Design Harness','',
    'For page, component, styling and interaction work, use the `designer-dev-workflow` skill at `'+hostRoots[host]+'/designer-dev-workflow/SKILL.md`. It coordinates the design-system and proposal skills when needed; use rules-governance for requested audits.',
    'Read relevant project rules, existing design assets and implementation before changes. Preserve the existing token toolchain and reusable components.',
    'Use the host for file edits, shell commands, browser verification and session management. Harness CLI, token export and task tracking are optional helpers, not prerequisites.',
    'For unrelated tasks, follow normal project instructions. This entry does not change host permissions or require a new agent runtime.',END].join('\n');
}
function instructionFile(root,host) {
  if(host==='codex') return pathExists(path.join(root,'AGENTS.override.md'))?'AGENTS.override.md':'AGENTS.md';
  return !pathExists(path.join(root,'CLAUDE.md')) && pathExists(path.join(root,'.claude/CLAUDE.md'))?'.claude/CLAUDE.md':'CLAUDE.md';
}
function findBlock(content) {
  const starts=content.split(START).length-1;
  const ends=content.split(END).length-1;
  if (!starts && !ends) return null;
  if (starts!==1 || ends!==1 || content.indexOf(END)<content.indexOf(START)) throw new Error('Malformed or duplicate Design Harness instruction markers.');
  const start=content.indexOf(START);
  const end=content.indexOf(END)+END.length;
  return {start,end,content:content.slice(start,end)};
}
function currentHash(root,file) {
  const absolute=path.join(root,file);
  if (!pathExists(absolute)) return null;
  if (!fs.statSync(absolute).isFile()) throw new Error(`Expected a file: ${file}`);
  return hash(fs.readFileSync(absolute));
}
function readManifest(root) {
  const file=path.join(root,manifestName);
  if (!pathExists(file)) return {schemaVersion:1,hosts:{}};
  const value=readJson(file);
  if (!value || value.schemaVersion!==1 || !value.hosts || typeof value.hosts!=='object' || Array.isArray(value.hosts)) throw new Error('Invalid host installation manifest.');
  return value;
}
function checkParents(root,relative) {
  let current=root;
  for (const part of relative.split('/')) {
    current=path.join(current,part);
    if (fs.existsSync(current) || (()=>{try{fs.lstatSync(current);return true;}catch{return false;}})()) {
      if(fs.lstatSync(current).isSymbolicLink()) throw new Error(`Installation refuses symlinked paths: ${relative}`);
    }
  }
}
export function installHost(target,{host,dryRun=false}={}) {
  const root=path.resolve(target);
  const hosts=host==='both'?['codex','claude']:[host];
  if (hosts.some(value=>!Object.hasOwn(hostRoots,value))) throw new Error('--host must be codex, claude or both.');
  if (!pathExists(root) || !fs.statSync(root).isDirectory()) throw new Error('Target project must already exist.');
  checkParents(root,manifestName);
  const manifest=readManifest(root);
  const writes=[];
  const nextHosts={...manifest.hosts};
  const outcomes=[];
  for (const selected of hosts) {
    const previous=manifest.hosts[selected];
    const files={};
    for (const name of names) {
      const source=path.join(skillRoot,name);
      if (!pathExists(path.join(source,'SKILL.md'))) throw new Error(`Skill source is missing: ${name}. Run the installer from a complete repository checkout.`);
      for(const file of listFiles(source,{excluded:['node_modules','.git']})) {
        const destination=`${hostRoots[selected]}/${name}/${relativeFile(source,file)}`;
        checkParents(root,destination);
        const content=fs.readFileSync(file);
        const actual=currentHash(root,destination);
        const expected=hash(content);
        if(actual!==null && actual!==expected && actual!==previous?.files?.[destination]) throw new Error(`Preserving existing or locally modified skill: ${destination}. Resolve the conflict before installing.`);
        files[destination]=expected;
        if(actual!==expected) writes.push({file:destination,content});
      }
    }
    // Refuse source removals rather than silently leaving obsolete executable resources.
    for(const file of Object.keys(previous?.files || {})) if(!(file in files)) throw new Error(`Obsolete installed resource needs review: ${file}. This installer does not delete project files.`);
    const entry=instructionFile(root,selected);
    checkParents(root,entry);
    if(previous?.instructionFile && previous.instructionFile!==entry) throw new Error(`Host instruction location changed from ${previous.instructionFile} to ${entry}; relocate the managed block deliberately before reinstalling.`);
    const content=pathExists(path.join(root,entry))?fs.readFileSync(path.join(root,entry),'utf8'):'';
    const existing=findBlock(content);
    const replacement=block(selected);
    if(existing && existing.content!==replacement && hash(existing.content)!==previous?.blockHash) throw new Error(`Preserving locally modified Design Harness block: ${entry}`);
    const nextContent=existing?content.slice(0,existing.start)+replacement+content.slice(existing.end):content+(content && !content.endsWith('\n')?'\n':'')+(content?'\n':'')+replacement+'\n';
    if(nextContent!==content) writes.push({file:entry,content:nextContent});
    nextHosts[selected]={skillRoot:hostRoots[selected],files,instructionFile:entry,blockHash:hash(replacement)};
    outcomes.push({host:selected,skillRoot:hostRoots[selected],instructionFile:entry,skills:names});
  }
  const nextManifest=JSON.stringify({schemaVersion:1,hosts:nextHosts},null,2)+'\n';
  if(!pathExists(path.join(root,manifestName)) || fs.readFileSync(path.join(root,manifestName),'utf8')!==nextManifest) writes.push({file:manifestName,content:nextManifest});
  if(!dryRun) for(const write of writes) {
    const absolute=path.join(root,write.file);
    fs.mkdirSync(path.dirname(absolute),{recursive:true});
    const temporary=`${absolute}.${crypto.randomUUID()}.tmp`;
    try {fs.writeFileSync(temporary,write.content);fs.renameSync(temporary,absolute);} finally {if(pathExists(temporary)) fs.unlinkSync(temporary);}
  }
  return {root,dryRun,written:writes.map(write=>write.file),hosts:outcomes,verification:'Files and instruction entries installed only. Start a new host session, confirm the skills are visible, and ask the host to identify the loaded workflow before using it. Host policy and nested instructions may affect loading.'};
}
