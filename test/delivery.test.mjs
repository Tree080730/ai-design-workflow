import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {deliveryStatus, executeDelivery, validateDeliveryContract} from '../packages/cli/src/delivery.mjs';
import {installHost} from '../packages/cli/src/host-install.mjs';

const command = [process.execPath,'-e','process.exit(0)'];
function contract(scope = 'full') {
  const urls = scope === 'full'?['/gallery','/']:['/gallery'];
  return {schemaVersion:1,title:'Build the confirmed design system and page',scope,
    confirmation:{status:'confirmed',record:'spec/confirmation.md'},rules:['spec/rules.md'],sourceRoots:['src'],inputs:['spec/spec.md'],changeTypes:['page'],
    artifacts:[{id:'styles',kind:'styles',source:'src/style.css',entry:'src/main.js'},
      {id:'gallery',kind:'gallery',source:'src/gallery.js',entry:'src/main.js',url:'/gallery'},
      ...(scope === 'full'?[{id:'page',kind:'page',source:'src/page.js',entry:'src/main.js',url:'/'}]:[])],
    criteria:[{id:'static',kind:'static',title:'Static project checks',command},
      {id:'build',kind:'build',title:'Production build',command},
      {id:'visual',kind:'visual',title:'Desktop and narrow design review',context:{pages:urls,viewports:['desktop','narrow']}},
      {id:'integration',kind:'interaction',title:'Real entries and core behavior',context:{pages:urls,states:['success']}},
      {id:'rules',kind:'documentation',title:'Compare confirmed rules and implementation'}]};
}
function fixture(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'design-delivery-'));
  const write = (file,content) => {fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),typeof content === 'string'?content:JSON.stringify(content));};
  try {
    write('.design-workflow/delivery.json',contract());
    for (const file of ['spec/confirmation.md','spec/rules.md','spec/spec.md']) write(file,'# Confirmed project scope and rules');
    write('src/main.js',"import './style.css'; import './gallery.js'; import './page.js';");
    write('src/style.css',':root { --color-text: #222; }');
    write('src/gallery.js','export const gallery = () => document.createElement("section");');
    write('src/page.js','export const page = () => document.createElement("main");');
    run(root,write);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
}
function verify(root,write) {
  executeDelivery(root,'run',{check:'static'});
  executeDelivery(root,'run',{check:'build'});
  for (const item of contract().criteria.filter(item => !item.command)) {
    write(`proof/${item.id}.md`,'# Actual observation for fixture');
    write('record.json',{criterionId:item.id,status:'passed',note:'Observed declared coverage',artifacts:[`proof/${item.id}.md`],context:item.context ?? {}});
    executeDelivery(root,'record',{file:path.join(root,'record.json')});
  }
  return deliveryStatus(root);
}

test('missing or invalid contract cannot silently pass an empty project',()=>fixture(root=>{
  fs.rmSync(path.join(root,'.design-workflow/delivery.json'));
  assert.equal(deliveryStatus(root).canFinish,false);
  const cli = spawnSync(process.execPath,['packages/cli/bin/design-workflow.mjs','delivery','status',root,'--json'],{encoding:'utf8'});
  assert.equal(cli.status,2,cli.stderr);
  assert.equal(JSON.parse(cli.stdout).blockers[0].code,'invalid-contract');
}));
test('confirmed source does not count as delivered until required evidence passes',()=>fixture((root,write)=>{
  const pending = executeDelivery(root,'prepare');
  assert.equal(pending.canFinish,false);
  assert.equal(pending.stages[1].status,'implemented-unverified');
  assert.equal(pending.blockers.length,5);
  const result = verify(root,write);
  assert.equal(result.canFinish,true,JSON.stringify(result.blockers));
  assert.equal(result.stages[2].status,'verified');
}));
test('source, rule and attachment changes invalidate the current delivery',()=>fixture((root,write)=>{
  verify(root,write);
  write('src/page.js','export const page = () => document.createElement("article");');
  assert.equal(deliveryStatus(root).canFinish,false);
  assert.ok(deliveryStatus(root).evidence.criteria.every(item => item.status === 'stale'));
  verify(root,write);
  write('spec/rules.md','# Changed design rule');
  assert.equal(deliveryStatus(root).canFinish,false);
  verify(root,write);
  write('proof/visual.md','# Changed attachment');
  assert.equal(deliveryStatus(root).evidence.criteria.find(item => item.id === 'visual').status,'stale');
}));
test('new source files and contract changes require fresh verification',()=>fixture((root,write)=>{
  const first = verify(root,write);
  write('src/new.js','export const newComponent = 1;');
  const added = deliveryStatus(root);
  assert.notEqual(first.taskId,added.taskId);
  assert.equal(added.canFinish,false);
  verify(root,write);
  const changed = contract(); changed.title='Updated confirmed scope';write('.design-workflow/delivery.json',changed);
  assert.equal(deliveryStatus(root).canFinish,false);
}));
test('missing Gallery and disconnected styles are structural blockers',()=>fixture((root,write)=>{
  fs.rmSync(path.join(root,'src/gallery.js'));
  write('src/main.js',"import './page.js';");
  const result = deliveryStatus(root);
  assert.ok(result.blockers.some(item => item.code === 'missing-input' && item.file === 'src/gallery.js'));
  assert.ok(result.blockers.some(item => item.code === 'integration-unverified' && item.file === 'src/style.css'));
}));
test('unconfirmed scopes, JSON artifacts and empty source cannot pass',()=>fixture((root,write)=>{
  const input = contract();input.confirmation.status='pending';write('.design-workflow/delivery.json',input);
  assert.throws(()=>executeDelivery(root,'prepare'),/not confirmed/);
  assert.ok(deliveryStatus(root).blockers.some(item => item.code === 'scope-unconfirmed'));
  input.confirmation.status='confirmed';input.artifacts[0].source='src/tokens.json';
  assert.throws(()=>validateDeliveryContract(input),/editable runtime source/);
  write('.design-workflow/delivery.json',contract());write('src/gallery.js','/* Gallery not implemented */');
  assert.ok(deliveryStatus(root).blockers.some(item => item.code === 'placeholder-source'));
}));
test('mandatory checks and page coverage cannot be removed or exempted',()=>{
  for (const kind of ['build','static','documentation','visual','interaction']) {
    const input = contract();input.criteria=input.criteria.filter(item => item.kind !== kind);
    assert.throws(()=>validateDeliveryContract(input));
  }
  const input = contract();input.criteria.find(item => item.kind === 'visual').context.pages=['/gallery'];
  assert.throws(()=>validateDeliveryContract(input),/Visual coverage missing/);
  const high = contract();high.changeTypes.push('async');
  assert.throws(()=>validateDeliveryContract(high),/High-risk/);
});
test('design system only scope stops before business pages but still requires Gallery',()=>fixture((root,write)=>{
  write('.design-workflow/delivery.json',contract('design-system'));
  assert.equal(deliveryStatus(root).stages[2].status,'out-of-scope');
  const input=contract('design-system');input.artifacts=input.artifacts.filter(item => item.kind !== 'gallery');
  assert.throws(()=>validateDeliveryContract(input),/gallery/);
}));
test('failed commands and manual command claims cannot produce a pass',()=>fixture((root,write)=>{
  const input = contract();input.criteria[1].command=[process.execPath,'-e','process.exit(7)'];write('.design-workflow/delivery.json',input);
  const result = executeDelivery(root,'run',{check:'build'});
  assert.equal(result.evidence.criteria.find(item => item.id === 'build').latest.exitCode,7);
  assert.equal(result.canFinish,false);
  write('record.json',{criterionId:'build',status:'passed',note:'Claim success',artifacts:['spec/spec.md']});
  assert.throws(()=>executeDelivery(root,'record',{file:path.join(root,'record.json')}),/actual command/);
}));
test('aliases and framework wiring require explicit runtime mode and recorded evidence',()=>fixture((root,write)=>{
  write('src/main.js',"import '@/style.css'; import '@/gallery.js'; import '@/page.js';");
  assert.ok(deliveryStatus(root).blockers.some(item => item.code === 'integration-unverified'));
  const input = contract();input.artifacts.forEach(item => item.integration='runtime');write('.design-workflow/delivery.json',input);
  assert.equal(deliveryStatus(root).warnings.filter(item=>item.code==='integration-unverified').length,3);
  assert.ok(deliveryStatus(root).warnings.some(item=>item.code==='legacy-workflow'));
  assert.equal(deliveryStatus(root).canFinish,false);
  assert.equal(verify(root,write).canFinish,true);
}));
test('project escape and symlinked source fail closed',()=>fixture((root,write)=>{
  write('src/main.js',"import '../../outside.js';");
  assert.equal(deliveryStatus(root).blockers[0].code,'invalid-contract');
  write('src/main.js',"import './gallery.js';");
  fs.rmSync(path.join(root,'src/gallery.js'));fs.symlinkSync(path.join(root,'spec/spec.md'),path.join(root,'src/gallery.js'));
  assert.equal(deliveryStatus(root).blockers[0].code,'invalid-contract');
}));
test('installed standalone verifier works without CLI checkout and rejects missing evidence',()=>fixture((root,write)=>{
  installHost(root,{host:'both'});
  for (const directory of ['.agents/skills','.claude/skills']) {
    const script = path.join(root,directory,'designer-dev-workflow/scripts/verify-project.mjs');
    const blocked = spawnSync(process.execPath,[script,'status',root],{cwd:root,encoding:'utf8'});
    assert.equal(blocked.status,2,blocked.stderr);
  }
  verify(root,write);
  for (const directory of ['.agents/skills','.claude/skills']) {
    const script = path.join(root,directory,'designer-dev-workflow/scripts/verify-project.mjs');
    const passed = spawnSync(process.execPath,[script,'status',root],{cwd:root,encoding:'utf8'});
    assert.equal(passed.status,0,passed.stderr);
    assert.equal(JSON.parse(passed.stdout).canFinish,true);
  }
}));

test('single-check CLI success stays distinct from blocked overall delivery',()=>fixture(root=>{
  const run = spawnSync(process.execPath,['packages/cli/bin/design-workflow.mjs','delivery','run',root,'--check','build','--json'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.operation.status,'passed');
  assert.equal(result.canFinish,false);
  const status = spawnSync(process.execPath,['packages/cli/bin/design-workflow.mjs','delivery','status',root,'--json'],{encoding:'utf8'});
  assert.equal(status.status,2);
}));
test('portable recovery preserves interrupted checks and refuses live owner locks',()=>fixture((root,write)=>{
  const status = executeDelivery(root,'prepare');
  const lock = `.design-workflow/tasks/${status.taskId}/lock.json`;
  write(lock,{pid:process.pid});
  assert.throws(()=>executeDelivery(root,'recover'),/still exists/);
  write(lock,{pid:2147483647});
  assert.equal(executeDelivery(root,'recover').canFinish,false);
  assert.equal(fs.existsSync(path.join(root,lock)),false);
}));
test('HTML entries, imported files outside source roots and build configuration are tracked',()=>fixture((root,write)=>{
  write('index.html','<script type="module" src="src/main.js"></script>');
  write('shared/helper.js','export const helper = true;');
  write('src/main.js',"import '../shared/helper.js'; import './style.css'; import './gallery.js'; import './page.js';");
  write('pnpm-lock.yaml','lockfileVersion: 9');
  const input = contract();input.artifacts.forEach(item => item.entry='index.html');write('.design-workflow/delivery.json',input);
  assert.equal(verify(root,write).canFinish,true);
  write('shared/helper.js','export const helper = false;');
  assert.ok(deliveryStatus(root).evidence.criteria.every(item => item.status === 'stale'));
  verify(root,write);
  write('pnpm-lock.yaml','lockfileVersion: 10');
  assert.equal(deliveryStatus(root).canFinish,false);
}));
test('null Gallery stubs and changed stored plans cannot satisfy the gate',()=>fixture((root,write)=>{
  write('src/gallery.js','export const Gallery = () => null;');
  assert.ok(deliveryStatus(root).blockers.some(item => item.code === 'placeholder-source'));
  write('src/gallery.js','export const gallery = () => document.createElement("section");');
  const status = executeDelivery(root,'prepare');
  const file = `.design-workflow/tasks/${status.taskId}/task.json`;
  const state = JSON.parse(fs.readFileSync(path.join(root,file)));state.plan.criteria[0].command=command.slice(0,1);write(file,state);
  assert.ok(deliveryStatus(root).blockers.some(item => item.code === 'invalid-evidence'));
}));
test('shipped template and candidate example are valid pending contracts',()=>{
  for (const file of ['skills/designer-dev-workflow/references/delivery-contract-template.json','examples/react-vite/.design-workflow/delivery.json']) {
    assert.equal(validateDeliveryContract(JSON.parse(fs.readFileSync(file))).confirmation.status,'pending');
  }
  const result = deliveryStatus('examples/react-vite');
  assert.equal(result.canFinish,false);
  assert.ok(result.blockers.some(item => item.code === 'scope-unconfirmed'));
  assert.equal(result.blockers.some(item => item.code === 'integration-unverified'),false);
});
