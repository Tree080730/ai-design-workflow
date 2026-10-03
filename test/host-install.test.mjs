import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import crypto from 'node:crypto';
import {installHost} from '../packages/cli/src/host-install.mjs';
function fixture(run) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'design-host-'));
  const write=(file,content)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),content);};
  try{run(root,write);}finally{fs.rmSync(root,{recursive:true,force:true});}
}

test('both hosts install portable skills and scoped entries while preserving project instructions',()=>fixture((root,write)=>{
  write('AGENTS.md','# Existing project rules\nUse existing components.\n');
  write('CLAUDE.md','# Existing Claude rules\n');
  const result=installHost(root,{host:'both'});
  assert.equal(result.hosts.length,2);
  for(const [host,directory,entry] of [['codex','.agents/skills','AGENTS.md'],['claude','.claude/skills','CLAUDE.md']]) {
    assert.ok(fs.readFileSync(path.join(root,entry),'utf8').startsWith('# Existing'));
    assert.equal(fs.readFileSync(path.join(root,entry),'utf8').split('<!-- design-harness:start -->').length,2);
    for(const skill of result.hosts.find(item=>item.host===host).skills) assert.ok(fs.existsSync(path.join(root,directory,skill,'SKILL.md')));
    const scan=spawnSync(process.execPath,[path.join(root,directory,'designer-dev-workflow/scripts/scan-project.mjs'),root],{encoding:'utf8'});
    assert.equal(scan.status,0,scan.stderr);
    assert.equal(JSON.parse(scan.stdout).mode,'zero-to-one');
  }
  assert.equal(fs.existsSync(path.join(root,'.design-workflow/config.json')),false);
  assert.equal(fs.existsSync(path.join(root,'design-system')),false);
  assert.equal(installHost(root,{host:'both'}).written.length,0);
}));

test('dry run leaves project untouched and override/nested instruction entries are respected',()=>fixture((root,write)=>{
  write('AGENTS.override.md','# Overrides');write('.claude/CLAUDE.md','# Nested');
  const result=installHost(root,{host:'both',dryRun:true});
  assert.deepEqual(result.hosts.map(item=>item.instructionFile),['AGENTS.override.md','.claude/CLAUDE.md']);
  assert.equal(fs.existsSync(path.join(root,'.agents')),false);
  assert.equal(fs.readFileSync(path.join(root,'AGENTS.override.md'),'utf8'),'# Overrides');
  installHost(root,{host:'both'});
  assert.equal(fs.existsSync(path.join(root,'AGENTS.md')),false);
  assert.equal(fs.existsSync(path.join(root,'CLAUDE.md')),false);
}));

test('conflicts are detected across hosts before installation writes any files',()=>fixture((root,write)=>{
  write('.claude/skills/designer-dev-workflow/SKILL.md','# Local workflow');
  assert.throws(()=>installHost(root,{host:'both'}),/Preserving existing/);
  assert.equal(fs.existsSync(path.join(root,'.agents')),false);
  assert.equal(fs.existsSync(path.join(root,'AGENTS.md')),false);
}));

test('local skill or managed-entry edits are preserved on reinstall',()=>fixture((root,write)=>{
  installHost(root,{host:'codex'});
  write('.agents/skills/designer-dev-workflow/SKILL.md','# Local edit');
  assert.throws(()=>installHost(root,{host:'codex'}),/locally modified skill/);
  assert.equal(fs.readFileSync(path.join(root,'.agents/skills/designer-dev-workflow/SKILL.md'),'utf8'),'# Local edit');
}));

test('edits outside managed blocks survive while block edits and malformed markers block updates',()=>fixture((root,write)=>{
  installHost(root,{host:'claude'});
  const file=path.join(root,'CLAUDE.md');
  fs.appendFileSync(file,'\n# Team-specific addition\n');
  assert.equal(installHost(root,{host:'claude'}).written.length,0);
  assert.match(fs.readFileSync(file,'utf8'),/Team-specific/);
  write('CLAUDE.md',fs.readFileSync(file,'utf8').replace('## Design Harness','## Edited Harness'));
  assert.throws(()=>installHost(root,{host:'claude'}),/modified Design Harness block/);
  write('CLAUDE.md','<!-- design-harness:start -->');
  assert.throws(()=>installHost(root,{host:'claude'}),/Malformed/);
}));

test('installer refuses symlinked destinations and changed active instruction locations',()=>fixture((root,write)=>{
  const other=fs.mkdtempSync(path.join(os.tmpdir(),'design-host-other-'));
  try {
    fs.symlinkSync(other,path.join(root,'.agents'),'dir');
    assert.throws(()=>installHost(root,{host:'codex'}),/symlinked/);
    assert.equal(fs.readdirSync(other).length,0);
    fs.unlinkSync(path.join(root,'.agents'));
    installHost(root,{host:'codex'});
    write('AGENTS.override.md','# New override');
    assert.throws(()=>installHost(root,{host:'codex'}),/instruction location changed/);
  }finally{fs.rmSync(other,{recursive:true,force:true});}
}));

test('source updates replace unchanged managed resources using previous hashes',()=>fixture((root,write)=>{
  installHost(root,{host:'codex'});
  const resource='.agents/skills/designer-dev-workflow/SKILL.md';
  write(resource,'# Previously installed version');
  const manifestFile=path.join(root,'.design-workflow/host-installation.json');
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  // Simulate the receipt from a previous release, without changing repository source.
  const previousHash=contentHash('# Previously installed version');
  manifest.hosts.codex.files[resource]=previousHash;
  fs.writeFileSync(manifestFile,JSON.stringify(manifest));
  assert.ok(installHost(root,{host:'codex'}).written.includes(resource));
  assert.match(fs.readFileSync(path.join(root,resource),'utf8'),/name: designer-dev-workflow/);
}));
function contentHash(value){return crypto.createHash('sha256').update(value).digest('hex');}

test('public installer command supports JSON dry-run without changing the target',()=>fixture(root=>{
  const script=path.resolve('scripts/install-host.mjs');
  const preview=spawnSync(process.execPath,[script,root,'--host','both','--dry-run','--json'],{encoding:'utf8'});
  assert.equal(preview.status,0,preview.stderr);
  const receipt=JSON.parse(preview.stdout);
  assert.equal(receipt.dryRun,true);
  assert.ok(receipt.written.includes('AGENTS.md'));
  assert.ok(receipt.written.includes('CLAUDE.md'));
  assert.equal(fs.existsSync(path.join(root,'.agents')),false);
  const installed=spawnSync(process.execPath,[script,root,'--host','both','--json'],{encoding:'utf8'});
  assert.equal(installed.status,0,installed.stderr);
  assert.equal(JSON.parse(installed.stdout).hosts.length,2);
}));


test('unsupported host names never create installation files',()=>fixture(root=>{
  for (const host of ['toString','constructor','unknown']) assert.throws(()=>installHost(root,{host}),/--host must/);
  assert.equal(fs.existsSync(path.join(root,'.design-workflow')),false);
}));
