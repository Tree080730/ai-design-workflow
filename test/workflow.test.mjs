import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {acknowledgeInput,hostReadStatus,workflowStatus,dimensions} from '../packages/cli/src/workflow.mjs';
import {createTask,runTaskCheck,recordTaskEvidence} from '../packages/cli/src/tasks.mjs';
import {deliveryStatus,executeDelivery} from '../packages/cli/src/delivery.mjs';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function fixture(mode,run){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'workflow-'));
 const write=(name,data)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));};
 const sha=name=>hash(fs.readFileSync(path.join(root,name)));
 const basis={schemaVersion:1,projectPath:root,mode,preset:mode==='custom'?null:{id:'example',docs:'https://example.com/'},referenceUrl:''};
 write('.design-workflow/design-basis.json',basis);write('spec/request.md','User: build a document page.');write('rules.md','# Layout\nCandidate rules with evidence.');
 const receipt=()=>acknowledgeInput(root,'spec/request.md');
 // Protocol fixtures are explicitly synthetic; these tests are not visual E2E.
 function analysis(){
  const png=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(png);png.writeUInt32BE(1280,16);png.writeUInt32BE(900,20);write('proof/desktop.png',png);write('proof/narrow.png',png);write('proof/source.md','Synthetic fixture source content.');
  const evidence=[['desktop','screenshot','proof/desktop.png',1280],['narrow','screenshot','proof/narrow.png',480],['source',mode==='custom'?'user-input':'official-doc','proof/source.md',null]].map(([id,kind,file,width])=>({id,kind,file,sha256:sha(file),url:'https://example.com/',capturedAt:'2026-10-06T00:00:00Z',...(width?{viewport:{width,height:900}}:{})}));
  return {schemaVersion:1,mode,receiptHash:sha('.design-workflow/host-read.json'),evidence,findings:dimensions[mode].map(dimension=>({dimension,status:mode==='custom'?'adapted':'observed',observation:'Fixture observation',decision:'Fixture adaptation',evidence:['desktop','narrow','source'],rule:{file:'rules.md',sha256:sha('rules.md'),anchor:'# Layout'}}))};
 }
 function confirm(a){write('.design-workflow/reference-analysis.json',a);write('spec/confirmed.md','User explicitly confirms fixture analysis and adaptation.');write('.design-workflow/analysis-confirmation.json',{schemaVersion:1,status:'confirmed',receiptHash:sha('.design-workflow/host-read.json'),analysisHash:sha('.design-workflow/reference-analysis.json'),confirmedAt:'2026-10-06T00:00:00Z',userDecision:'Confirm',record:'spec/confirmed.md',recordHash:sha('spec/confirmed.md')});}
 try{run({root,write,sha,basis,receipt,analysis,confirm});}finally{fs.rmSync(root,{recursive:true,force:true});}
}
for(const mode of ['reference','components','custom'])test(`${mode}: actual read, analysis, confirmation and ordered phase`,()=>fixture(mode,({root,receipt,analysis,confirm})=>{
 assert.equal(hostReadStatus(root).status,'waiting');assert.equal(workflowStatus(root).canProceed,false);receipt();assert.equal(workflowStatus(root,{stage:'analysis'}).canProceed,true);assert.equal(workflowStatus(root).canProceed,false);confirm(analysis());assert.equal(workflowStatus(root).canProceed,true);assert.equal(workflowStatus(root,{stage:'page'}).canProceed,false);
}));
test('unchanged reads are idempotent; selection and requirement changes invalidate downstream',()=>fixture('reference',({root,receipt,write,basis,analysis,confirm})=>{
 const first=receipt();assert.deepEqual(receipt(),first);confirm(analysis());write('spec/request.md','New user requirement');assert.equal(hostReadStatus(root).status,'stale');assert.equal(workflowStatus(root).canProceed,false);receipt();assert.equal(workflowStatus(root).canProceed,false);confirm(analysis());write('.design-workflow/design-basis.json',{...basis,selectedAt:'new choice'});assert.equal(hostReadStatus(root).status,'stale');
}));
test('source failure and missing visual/narrow coverage block; replacing source needs reanalysis',()=>fixture('reference',({root,receipt,analysis,confirm})=>{
 receipt();let a=analysis();a.findings[0].status='unobserved';confirm(a);assert.match(workflowStatus(root).blockers[0].message,/Incomplete/);a=analysis();a.findings[0].evidence=['source'];confirm(a);assert.match(workflowStatus(root).blockers[0].message,/Visual evidence/);a=analysis();a.findings.find(x=>x.dimension==='responsive').evidence=['desktop'];confirm(a);assert.match(workflowStatus(root).blockers[0].message,/narrow/);a=analysis();a.findings[0].status='not-applicable';confirm(a);assert.match(workflowStatus(root).blockers[0].message,/cannot be omitted/);confirm(analysis());assert.equal(workflowStatus(root).canProceed,true);
}));
test('tampering with evidence, rule, or analysis invalidates confirmation',()=>fixture('reference',({root,receipt,analysis,confirm,write})=>{
 receipt();confirm(analysis());write('proof/source.md','Changed');assert.equal(workflowStatus(root).canProceed,false);confirm(analysis());write('rules.md','# Layout changed');assert.equal(workflowStatus(root).canProceed,false);confirm(analysis());write('spec/confirmed.md','Changed answer');assert.equal(workflowStatus(root).canProceed,false);
}));
test('wrong project, unsafe paths and invalid source do not create receipts',()=>fixture('reference',({root,write,basis,receipt})=>{
 write('.design-workflow/design-basis.json',{...basis,projectPath:os.tmpdir()});assert.throws(receipt,/different project/);write('.design-workflow/design-basis.json',basis);assert.throws(()=>acknowledgeInput(root,'../outside.md'));write('.design-workflow/design-basis.json',{...basis,referenceUrl:'javascript:alert(1)'});assert.throws(receipt,/HTTP/);
}));
test('delivery fails closed when GUI upstream missing; legacy cannot disable enabled workflow',()=>fixture('reference',({root,write})=>{
 const c=JSON.parse(fs.readFileSync('skills/designer-dev-workflow/references/delivery-contract-template.json'));
 c.confirmation.status='confirmed';write('.design-workflow/delivery.json',c);assert.equal(deliveryStatus(root).canFinish,false);assert.ok(deliveryStatus(root).blockers.some(x=>x.code==='workflow-incomplete'));c.workflow=false;write('.design-workflow/delivery.json',c);assert.equal(deliveryStatus(root).blockers[0].code,'invalid-contract');
}));
test('workflow library is byte-identical in portable installation source',()=>{
 assert.deepEqual(fs.readFileSync('packages/cli/src/workflow.mjs'),fs.readFileSync('skills/designer-dev-workflow/scripts/lib/workflow.mjs'));
});
test('design-system stage requires actual command and Gallery task records bound to current sources',t=>fixture('custom',({root,receipt,analysis,confirm,write,sha})=>{
 receipt();confirm(analysis());
 const contract=JSON.parse(fs.readFileSync('skills/designer-dev-workflow/references/delivery-contract-template.json'));
 contract.artifacts=[{id:'styles',kind:'styles',source:'src/style.css',entry:'src/main.js'},{id:'gallery',kind:'gallery',source:'src/gallery.js',entry:'src/main.js',url:'/gallery'}];
 write('.design-workflow/delivery.json',contract);write('src/main.js',"import './style.css'; import './gallery.js';");write('src/style.css',':root{--text:#222}');write('src/gallery.js','export const gallery = true;');
 const sources=Object.fromEntries(['src/main.js','src/style.css','src/gallery.js'].map(file=>[file,sha(file)]));
 const criteria=[{id:'static',kind:'static',title:'Fixture static',command:[process.execPath,'-e','process.exit(0)']},{id:'build',kind:'build',title:'Fixture build',command:[process.execPath,'-e','process.exit(0)']},{id:'visual',kind:'visual',title:'Synthetic visual record',context:{pages:['/gallery'],viewports:['desktop','narrow']}},{id:'interaction',kind:'interaction',title:'Synthetic interaction',context:{pages:['/gallery'],states:['success']}},{id:'rules',kind:'documentation',title:'Synthetic review'}];
 createTask(root,{schemaVersion:1,id:'ds-review',title:'Stage protocol fixture',changeTypes:['component'],inputs:[...Object.keys(sources),'.design-workflow/analysis-confirmation.json'],criteria});
 const checks={};
 for(const criterion of criteria){
  const file=`proof/${criterion.id}.md`;write(file,'Synthetic test evidence, not real browser QA.');
  if(criterion.command)runTaskCheck(root,'ds-review',criterion.id);else recordTaskEvidence(root,'ds-review',{criterionId:criterion.id,status:'passed',note:'Synthetic fixture observation',artifacts:[file],context:criterion.context??{}});
  for(const key of criterion.id==='visual'?['gallery-desktop','gallery-narrow']:criterion.id==='interaction'?['gallery-interaction']:[criterion.id])checks[key]={status:'passed',note:'Synthetic fixture',file,sha256:sha(file),taskId:'ds-review',criterionId:criterion.id};
 }
 const review={schemaVersion:1,status:'passed',confirmationHash:sha('.design-workflow/analysis-confirmation.json'),sources,checks};
 write('.design-workflow/design-system-review.json',review);assert.equal(workflowStatus(root,{stage:'page'}).canProceed,true,JSON.stringify(workflowStatus(root,{stage:'page'}).blockers));
 const originalRead=fs.readFileSync;let taskReads=0;
 const mock=t.mock.method(fs,'readFileSync',function(name,...args){
  if(typeof name==='string'&&name.endsWith('/tasks/ds-review/task.json'))taskReads++;
  return originalRead.call(this,name,...args);
 });
 assert.equal(workflowStatus(root,{stage:'page'}).canProceed,true);
 assert.equal(taskReads,1);mock.mock.restore(); // all six checks use one current snapshot
 write('proof/rules.md','Changed attachment');assert.equal(workflowStatus(root,{stage:'page'}).canProceed,false);
 write('proof/rules.md','Synthetic test evidence, not real browser QA.');
 write('src/style.css',':root{--text:#333}');assert.equal(workflowStatus(root,{stage:'page'}).canProceed,false);
}));
test('guarded full delivery passes only after upstream, DS checks and final verification; changed basis invalidates all',()=>fixture('custom',({root,receipt,analysis,confirm,write,sha,basis})=>{
 receipt();confirm(analysis());
 const c=JSON.parse(fs.readFileSync('skills/designer-dev-workflow/references/delivery-contract-template.json'));
 c.confirmation={status:'confirmed',record:'spec/confirmed.md'};c.rules=['rules.md'];c.sourceRoots=['src'];c.inputs=['spec/request.md'];
 c.artifacts=[{id:'styles',kind:'styles',source:'src/style.css',entry:'src/main.js'},{id:'gallery',kind:'gallery',source:'src/gallery.js',entry:'src/main.js',url:'/gallery'},{id:'page',kind:'page',source:'src/page.js',entry:'src/main.js',url:'/'}];
 c.criteria=[{id:'static',kind:'static',title:'Fixture static',command:[process.execPath,'-e','process.exit(0)']},{id:'build',kind:'build',title:'Fixture build',command:[process.execPath,'-e','process.exit(0)']},{id:'visual',kind:'visual',title:'Synthetic visual',context:{pages:['/gallery','/'],viewports:['desktop','narrow']}},{id:'interaction',kind:'interaction',title:'Synthetic interaction',context:{pages:['/gallery','/'],states:['success']}},{id:'rules',kind:'documentation',title:'Synthetic rule review'}];
 write('.design-workflow/delivery.json',c);write('src/main.js',"import './style.css'; import './gallery.js'; import './page.js';");write('src/style.css',':root{--text:#222}');write('src/gallery.js','export const gallery = true;');write('src/page.js','export const page = true;');
 function verify(){
  executeDelivery(root,'run',{check:'static'});executeDelivery(root,'run',{check:'build'});
  for(const item of c.criteria.filter(x=>!x.command)){write(`proof/${item.id}.md`,'Protocol fixture only, not real visual QA.');write('record.json',{criterionId:item.id,status:'passed',note:'Synthetic fixture observation',artifacts:[`proof/${item.id}.md`],context:item.context??{}});executeDelivery(root,'record',{file:path.join(root,'record.json')});}
  return deliveryStatus(root);
 }
 const before=verify();assert.equal(before.canFinish,false);assert.ok(before.blockers.some(x=>x.code==='workflow-incomplete'));
 const sources=Object.fromEntries(['src/main.js','src/style.css','src/gallery.js'].map(file=>[file,sha(file)]));const checks={};
 for(const key of ['static','build','gallery-desktop','gallery-narrow','gallery-interaction','rules']){const criterionId=key.startsWith('gallery-')?(key==='gallery-interaction'?'interaction':'visual'):key;const file=`proof/summary-${key}.md`;write(file,'Fixture summary.');checks[key]={status:'passed',note:'Synthetic fixture',file,sha256:sha(file),taskId:before.taskId,criterionId};}
 write('.design-workflow/design-system-review.json',{schemaVersion:1,status:'passed',confirmationHash:sha('.design-workflow/analysis-confirmation.json'),sources,checks});assert.equal(workflowStatus(root,{stage:'page'}).canProceed,true);
 assert.equal(verify().canFinish,true,JSON.stringify(deliveryStatus(root).blockers));write('.design-workflow/design-basis.json',{...basis,selectedAt:'new selection'});assert.equal(deliveryStatus(root).canFinish,false);
}));

test('broken symbolic links cannot become workflow output paths',()=>fixture('custom',({root})=>{
 fs.symlinkSync(path.join(root,'missing-target'),path.join(root,'.design-workflow/host-read.json'));
 assert.throws(()=>acknowledgeInput(root,'spec/request.md'),/Symlinked/);
}));

test('removing GUI selection does not disable checks when a read receipt remains',()=>fixture('reference',({root,receipt,write})=>{
 receipt();fs.unlinkSync(path.join(root,'.design-workflow/design-basis.json'));
 const c=JSON.parse(fs.readFileSync(new URL('../skills/designer-dev-workflow/references/delivery-contract-template.json',import.meta.url)));
 delete c.workflow;write('.design-workflow/delivery.json',c);
 assert.ok(deliveryStatus(root).blockers.some(item=>item.code==='workflow-incomplete'));
}));

test('workflow summary preserves input receipt and all stage blockers without changing files',()=>fixture('reference',({root,receipt,analysis,confirm})=>{
 const script=path.resolve('skills/designer-dev-workflow/scripts/workflow.mjs');
 const invoke=(action,args=[])=>spawnSync(process.execPath,[script,action,root,...args],{encoding:'utf8'});
 receipt();confirm(analysis());
 for(const stage of ['analysis','implementation','page','delivery']){
  const full=invoke('status',['--stage',stage]);const compact=invoke('status',['--summary','--stage',stage]);
  assert.equal(compact.status,full.status);const a=JSON.parse(full.stdout),b=JSON.parse(compact.stdout);
  for(const key of ['canProceed','status','stage','blockers','scopeNote'])assert.deepEqual(b[key],a[key]);
  assert.equal(b.trackedInputCount,a.trackedInputs.length);
 }
 const before=fs.readFileSync(path.join(root,'.design-workflow/host-read.json'),'utf8');
 const read=invoke('read',['--prompt-file','spec/request.md','--summary']);
 assert.equal(read.status,0);assert.deepEqual(JSON.parse(read.stdout),JSON.parse(before));
 assert.equal(fs.readFileSync(path.join(root,'.design-workflow/host-read.json'),'utf8'),before);
 assert.equal(invoke('status',['--summary','--stage']).status,2);
}));

for(const mode of ['components','reference'])test(`${mode}: local evidence needs no URL while selected official source remains required`,()=>fixture(mode,({root,receipt,analysis,confirm,write,sha})=>{
 receipt();const a=analysis();write('proof/local.md','Actual local input in protocol fixture.');a.evidence.push({id:'local',kind:'existing-source',file:'proof/local.md',sha256:sha('proof/local.md'),capturedAt:'2026-10-07T00:00:00Z'});a.findings.at(-1).evidence.push('local');confirm(a);assert.equal(workflowStatus(root,{stage:'implementation'}).canProceed,true);
 a.evidence.find(x=>x.id==='source').url=undefined;confirm(a);assert.equal(workflowStatus(root,{stage:'implementation'}).canProceed,false);
 a.evidence.filter(x=>x.id!=='local').forEach(x=>x.url='https://different.example/');a.evidence.find(x=>x.id==='local').url='https://example.com/';confirm(a);assert.equal(workflowStatus(root,{stage:'implementation'}).canProceed,false);
}));

test('combined foundations require both seven-dimension analyses and every chosen source',()=>fixture('components',({root,write,receipt,analysis,confirm,sha})=>{
 write('.design-workflow/design-basis.json',{schemaVersion:2,projectPath:root,mode:'combined',component:{id:'example',docs:'https://example.com/'},references:[{kind:'url',url:'https://example.com/'}]});
 receipt();let a=analysis();a.mode='combined';a.findings=dimensions.combined.map(dimension=>({...a.findings[0],dimension}));confirm(a);assert.equal(workflowStatus(root).canProceed,true);
 a.findings=a.findings.filter(item=>!item.dimension.startsWith('components.'));confirm(a);assert.match(workflowStatus(root).blockers[0].message,/components.official-source/);
 a=analysis();a.mode='combined';a.findings=dimensions.combined.map(dimension=>({...a.findings[0],dimension}));a.evidence=a.evidence.filter(item=>item.id!=='narrow');confirm(a);assert.match(workflowStatus(root).blockers[0].message,/desktop and narrow/);
 write('.design-workflow/design-basis.json',{schemaVersion:2,projectPath:root,mode:'combined',component:{id:'example',docs:'https://example.com/'},references:[{kind:'url',url:'https://unobserved.example/'}]});receipt();a=analysis();a.mode='combined';a.findings=dimensions.combined.map(dimension=>({...a.findings[0],dimension}));confirm(a);assert.match(workflowStatus(root).blockers[0].message,/Each selected reference/);
}));
test('image-only references use the actual attachment and cannot invent responsive observations',()=>fixture('reference',({root,write,receipt,analysis,confirm,sha})=>{
 write('proof/input.png',Buffer.from('89504e470d0a1a0a00000000000000000000000100000001','hex'));
 const digest=sha('proof/input.png'),file='.design-workflow/references/'+digest+'.png';write(file,fs.readFileSync(path.join(root,'proof/input.png')));
 write('.design-workflow/design-basis.json',{schemaVersion:2,projectPath:root,mode:'reference',component:null,references:[{kind:'image',name:'User reference',file,sha256:digest}]});
 receipt();let a=analysis();a.evidence=[{id:'input',kind:'user-input',file,sha256:digest,capturedAt:'2026-10-07T00:00:00Z'}];a.findings=a.findings.map(item=>({...item,status:['responsive','interaction-motion'].includes(item.dimension)?'adapted':'observed',evidence:['input']}));confirm(a);assert.equal(workflowStatus(root).canProceed,true);
 a.findings.find(item=>item.dimension==='responsive').status='observed';confirm(a);assert.match(workflowStatus(root).blockers[0].message,/Static images/);
 write(file,'changed input');assert.equal(hostReadStatus(root).status,'blocked');assert.equal(workflowStatus(root).canProceed,false);
}));
