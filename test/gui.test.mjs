import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import http from 'node:http';
import {createGuiServer} from '../packages/gui/src/server.mjs';

async function fixture(run) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'design-gui-'));
  const server=createGuiServer({project:root});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const api=async(route,options)=>{const response=await fetch(url+route,options);return {status:response.status,value:await response.json()};};
  const post=body=>api('/api/basis',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify(body)});
  try {await run({root,url,api,post});} finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
}
test('project and utility logos use explicit static routes',()=>fixture(async({url})=>{
  for(const [asset,type] of [['design-builder.png','image/png'],['custom-reference.svg','image/svg+xml'],['no-reference.svg','image/svg+xml']]){
    const response=await fetch(`${url}/logos/${asset}`);
    assert.equal(response.status,200);assert.ok(response.headers.get('content-type').startsWith(type));
    assert.ok((await response.arrayBuffer()).byteLength>0);
  }
  assert.equal((await fetch(`${url}/logos/unknown.svg`)).status,404);
}));
test('GUI serves the catalog and project without modifying project files',()=>fixture(async({root,url,api})=>{
  const page=await fetch(url+'/');assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/default-src 'self'/);
  assert.match(await page.text(),/Design Builder/);
  const items=(await api('/api/catalog')).value.presets;
  assert.equal(items.length,16);
  assert.equal(items.find(item=>item.id==='apple-hig').category,'reference');
  assert.deepEqual(items.find(item=>item.id==='apple-hig').packages,[]);
  assert.ok(items.filter(item=>item.category==='open-source').every(item=>item.repository.startsWith('https://github.com/')));
  for (const item of items) {
    assert.ok(item.selectionGuide.introduction);
    assert.equal(item.selectionGuide.checkedAt,'2026-10-05');
    for(const key of ['components','customization','web','maintenance']) {
      assert.ok(item.selectionGuide[key].text);
      assert.equal(new URL(item.selectionGuide[key].source.url).protocol,'https:');
    }
    if (item.referenceKind==='website') {
      assert.equal(item.showcase.gallery.length,3);
      for (const capture of item.showcase.gallery) {
        const visual=await fetch(url+capture.image);
        assert.equal(visual.status,200);assert.match(visual.headers.get('content-type'),/image\//);
        const bytes=Buffer.from(await visual.arrayBuffer());
        assert.equal(bytes.readUInt32BE(16),capture.width);
        assert.equal(bytes.readUInt32BE(20),capture.height);
        assert.ok(capture.width>=3000);assert.equal(new URL(capture.source).protocol,'https:');
      }
    } else assert.equal(new URL(item.showcase.image).protocol,'https:');
    assert.equal(new URL(item.showcase.source).protocol,'https:');
    assert.ok(item.showcase.caption && item.showcase.imageWidth > 0 && item.showcase.imageHeight > 0);
    if(item.referenceKind!=='website')assert.ok(page.headers.get('content-security-policy').includes(item.showcase.image));
    if (item.category==='open-source') {
      assert.ok(['generated-from-official-components','user-provided-reference','official-reference-image'].includes(item.overview.kind));
      const overview=await fetch(url+item.overview.image);
      assert.equal(overview.status,200);assert.match(overview.headers.get('content-type'),/image\/png/);
      const bytes=Buffer.from(await overview.arrayBuffer());
      assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
      assert.equal(bytes.readUInt32BE(16),item.overview.width);assert.equal(bytes.readUInt32BE(20),item.overview.height);
      assert.ok(item.overview.caption);
      if(item.overview.kind==='generated-from-official-components') {
        assert.ok(item.overview.version && item.overview.package);
        assert.ok(item.overview.width>=3840 && item.overview.height>=1892,'Generated overviews must retain 2× pixel density');
        assert.equal(item.overview.encoding,'png');
      }
    } else assert.equal(item.overview,null);
    const asset=await fetch(url+`/logos/${item.id}.${item.logoExtension??'svg'}`);
    assert.equal(asset.status,200);assert.match(asset.headers.get('content-type'),/image\//);
    assert.ok((await asset.arrayBuffer()).byteLength>100);
  }
  assert.equal((await api('/logos/sources.json')).status,404);
  assert.equal((await api('/references/sources.json')).status,404);
  assert.equal((await api('/references/unknown.png')).status,404);
  assert.equal((await api('/overviews/sources.json')).status,404);
  assert.equal((await api('/overviews/unknown.png')).status,404);
  assert.equal((await api('/overviews/apple-hig.png')).status,404);
  assert.equal((await api('/logos/unknown.svg')).status,404);
  assert.equal((await api('/preview/unknown.html')).status,404);
  assert.equal((await api('/preview/versions.json')).status,404);
  const sample=await fetch(url+'/preview/ant-design.html');
  assert.ok([200,503].includes(sample.status));
  if(sample.status===200){assert.match(sample.headers.get('content-security-policy'),/default-src 'none'/);assert.match(await sample.text(),/ant-design.js/);}
  assert.equal((await api('/preview/assets/private.txt')).status,404);
  assert.equal((await api('/api/project')).value.selection,null);
  assert.deepEqual(fs.readdirSync(root),[]);
}));
test('selection is persisted for host consumption and survives a fresh server',()=>fixture(async({root,api,post})=>{
  const initial=(await api('/api/project')).value;
  const response=await post({presetId:'ant-design',mode:'components',intent:'User administration',referenceUrl:'https://example.com/style',revision:initial.revision});
  assert.equal(response.status,200);
  const saved=JSON.parse(fs.readFileSync(path.join(root,'.design-workflow/design-basis.json')));
  assert.equal(saved.preset.id,'ant-design');assert.deepEqual(saved.preset.packages,['antd']);
  assert.equal(saved.implementationStatus,'not-started');assert.equal(saved.intent,'User administration');
  assert.ok(saved.selectionGuide.web.text.includes('Agent'));
  assert.ok(saved.selectionGuide.customization.source.url);
  assert.equal((await api('/api/project')).value.selection.preset.id,'ant-design');
  const second=createGuiServer({project:root});await new Promise(resolve=>second.listen(0,'127.0.0.1',resolve));
  try {const state=await fetch(`http://127.0.0.1:${second.address().port}/api/project`);assert.equal((await state.json()).selection.preset.id,'ant-design');}
  finally {second.closeAllConnections();await new Promise(resolve=>second.close(resolve));}
}));
test('reference mode omits packages, Apple cannot be selected as a component implementation',()=>fixture(async({api,post})=>{
  const revision=(await api('/api/project')).value.revision;
  assert.equal((await post({presetId:'apple-hig',mode:'components',intent:'',referenceUrl:'',revision})).status,400);
  const result=await post({presetId:'apple-hig',mode:'reference',intent:'',referenceUrl:'',revision});
  assert.equal(result.status,200);assert.deepEqual(result.value.selection.preset.packages,[]);
}));
test('stale writes and invalid references preserve the current selection',()=>fixture(async({root,api,post})=>{
  const revision=(await api('/api/project')).value.revision;
  const input={presetId:'tdesign',mode:'components',intent:'',referenceUrl:'',revision};
  assert.equal((await post(input)).status,200);
  const before=fs.readFileSync(path.join(root,'.design-workflow/design-basis.json'),'utf8');
  assert.equal((await post({...input,presetId:'carbon'})).status,409);
  assert.equal((await post({...input,referenceUrl:'javascript:alert(1)'})).status,400);
  assert.equal((await post({...input,presetId:'unknown'})).status,400);
  assert.equal(fs.readFileSync(path.join(root,'.design-workflow/design-basis.json'),'utf8'),before);
}));
test('writes reject cross-origin requests and static serving cannot expose project files',()=>fixture(async({root,url,api})=>{
  fs.writeFileSync(path.join(root,'private.txt'),'private data');
  assert.equal((await api('/private.txt')).status,404);
  assert.equal((await api('/api/basis',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:'{}'})).status,403);
  const poisoned=await new Promise((resolve,reject)=>{const request=http.get(url+'/api/project',{headers:{Host:'example.com'}},response=>{response.resume();resolve(response.statusCode);});request.on('error',reject);});assert.equal(poisoned,403);
  assert.equal(fs.existsSync(path.join(root,'.design-workflow')),false);
}));
test('existing unsupported data and symlinked destinations are not overwritten',()=>fixture(async({root,api,post})=>{
  fs.mkdirSync(path.join(root,'.design-workflow'));fs.writeFileSync(path.join(root,'.design-workflow/design-basis.json'),'{}');
  assert.equal((await api('/api/project')).status,400);
  assert.equal((await post({presetId:'ant-design',mode:'components',intent:'',referenceUrl:'',revision:''})).status,400);
  assert.equal(fs.readFileSync(path.join(root,'.design-workflow/design-basis.json'),'utf8'),'{}');
  fs.rmSync(path.join(root,'.design-workflow/design-basis.json'));fs.writeFileSync(path.join(root,'outside.json'),'{}');
  fs.symlinkSync(path.join(root,'outside.json'),path.join(root,'.design-workflow/design-basis.json'));
  assert.equal((await api('/api/project')).status,400);
  assert.equal(fs.readFileSync(path.join(root,'outside.json'),'utf8'),'{}');
}));

test('custom basis replaces a preset explicitly and survives refresh without changing source files',()=>fixture(async({root,api,post})=>{
  fs.writeFileSync(path.join(root,'app.js'),'existing application');
  const initial=(await api('/api/project')).value;
  const input={presetId:'ant-design',mode:'components',intent:'管理工作台',referenceUrl:'https://example.com/style',revision:initial.revision};
  const selected=await post(input);
  const custom={...input,presetId:null,mode:'custom',revision:selected.value.revision};
  const result=await post(custom);assert.equal(result.status,200);
  assert.equal(result.value.selection.preset,null);assert.equal(result.value.selection.mode,'custom');
  assert.equal(result.value.selection.intent,input.intent);assert.equal(result.value.selection.referenceUrl,input.referenceUrl);
  assert.equal((await post(custom)).status,409);
  assert.equal((await post({...custom,presetId:'ant-design',revision:result.value.revision})).status,400);
  assert.equal((await post({...custom,mode:'components',revision:result.value.revision})).status,400);
  assert.equal((await api('/api/project')).value.selection.mode,'custom');
  const second=createGuiServer({project:root});await new Promise(resolve=>second.listen(0,'127.0.0.1',resolve));
  try {const state=await fetch(`http://127.0.0.1:${second.address().port}/api/project`);assert.equal((await state.json()).selection.mode,'custom');}
  finally {second.closeAllConnections();await new Promise(resolve=>second.close(resolve));}
  const restored=await post({...input,revision:result.value.revision});assert.equal(restored.status,200);
  assert.equal(restored.value.selection.preset.id,'ant-design');
  assert.equal(fs.readFileSync(path.join(root,'app.js'),'utf8'),'existing application');
}));

test('host handoff covers custom and component inputs without inventing a preset',async()=>{
  const {handoff}=await import('../packages/gui/public/handoff.js');
  const custom=handoff({mode:'custom',preset:null,intent:'订单管理',referenceUrl:'https://example.com/style'});
  assert.match(custom,/明确不采用预设/);assert.match(custom,/订单管理/);assert.match(custom,/example.com/);assert.doesNotMatch(custom,/undefined|null|Ant Design/);
  const components=handoff({mode:'components',preset:{name:'Ant Design',publisher:'Ant Group'},intent:'订单管理',referenceUrl:''});
  assert.match(components,/Ant Design/);assert.match(components,/主题映射/);
});

test('website references preserve official sources and never become component dependencies',()=>fixture(async({api,post})=>{
  const catalog=(await api('/api/catalog')).value.presets;
  assert.equal(catalog.filter(p=>!p.hidden&&p.category==='reference').length,8);
  assert.equal(catalog.find(p=>p.id==='apple-hig').hidden,true);
  assert.equal(catalog.some(p=>p.id==='stripe-site'),false);
  for(const id of ['duolingo-site','adidas-site','lvmh-site','nike-site','airbnb-site'])assert.ok(catalog.find(p=>p.id===id));
  let current=(await api('/api/project')).value;
  for(const preset of catalog.filter(p=>p.referenceKind==='website')) {
    const input={presetId:preset.id,mode:'reference',intent:'构建自己的产品',referenceUrl:'',revision:current.revision};
    assert.equal((await post({...input,mode:'components'})).status,400);
    const saved=await post(input);assert.equal(saved.status,200);current=saved.value;
    assert.deepEqual(current.selection.preset.packages,[]);
    assert.equal(current.selection.preset.reference.url,preset.docs);
    assert.equal(current.selection.preset.reference.kind,'website');
    assert.equal((await api('/api/project')).value.selection.preset.id,preset.id);
    const {handoff}=await import('../packages/gui/public/handoff.js');
    const prompt=handoff(current.selection);
    assert.ok(prompt.includes(preset.docs));assert.match(prompt,/视觉参考/);assert.match(prompt,/不安装该品牌产品 SDK/);
  }
  const legacy=await post({presetId:'apple-hig',mode:'reference',intent:'之前的项目',referenceUrl:'',revision:current.revision});
  assert.equal(legacy.status,200);assert.equal(legacy.value.selection.preset.id,'apple-hig');
}));

test('selection-only save clears stale requirements and records the target project',()=>fixture(async({root,api,post})=>{
  let current=(await api('/api/project')).value;
  current=(await post({presetId:'ant-design',mode:'components',intent:'old task',referenceUrl:'',revision:current.revision})).value;
  const result=await post({presetId:'apple-site',mode:'reference',intent:'old task',selectionOnly:true,referenceUrl:'',revision:current.revision});
  assert.equal(result.status,200);assert.equal(result.value.selection.intent,'');
  assert.equal(result.value.selection.requirementSource,'host');assert.equal(result.value.selection.projectPath,fs.realpathSync(root));
  assert.equal(result.value.host.returnUrl,null);assert.equal(result.value.host.canDispatch,false);
  assert.deepEqual((await api('/api/project')).value.selection,result.value.selection);
  const conflict=await post({presetId:null,mode:'custom',intent:'',selectionOnly:true,referenceUrl:'',revision:current.revision});
  assert.equal(conflict.status,409);assert.equal((await api('/api/project')).value.selection.preset.id,'apple-site');
}));
test('host return binds only an explicit UUID, never a new chat or auto-send',async()=>{
  const {hostReturn}=await import('../packages/gui/src/host-return.mjs');
  const id='01a10053-af1d-7b23-8e58-6aab9a9170be';
  assert.equal(hostReturn(id).returnUrl,`codex://threads/${id}`);assert.equal(hostReturn(id).canDispatch,false);
  assert.throws(()=>hostReturn('new?prompt=execute'));assert.equal(hostReturn(null).returnUrl,null);
  const {handoff}=await import('../packages/gui/public/handoff.js');
  const value=handoff({mode:'custom',preset:null,requirementSource:'host',intent:'STALE',referenceUrl:''},'/target/project');
  assert.ok(value.includes('/target/project'));assert.ok(!value.includes('STALE'));
});

test('GUI distinguishes saved selection, actual host acknowledgement and stale input',()=>fixture(async({root,api,post})=>{
 const {acknowledgeInput}=await import('../packages/cli/src/workflow.mjs');
 const initial=(await api('/api/project')).value;
 const saved=await post({presetId:'apple-site',mode:'reference',intent:'',referenceUrl:'',selectionOnly:true,revision:initial.revision});
 assert.equal(saved.value.handoff.status,'waiting');
 fs.mkdirSync(path.join(root,'spec'),{recursive:true});fs.writeFileSync(path.join(root,'spec/request.md'),'Current user document-page requirement.');
 acknowledgeInput(root,'spec/request.md');assert.equal((await api('/api/project')).value.handoff.status,'read');
 fs.writeFileSync(path.join(root,'spec/request.md'),'Changed user requirement.');assert.equal((await api('/api/project')).value.handoff.status,'stale');
}));

test('single reference saves to a fresh project and replacements never accumulate',()=>fixture(async({api,post})=>{
  let current=(await api('/api/project')).value;
  for(const references of [[{kind:'url',url:'https://example.com/inspiration'}],[{kind:'preset',presetId:'linear-site'}],[]]){
    const saved=await post({schemaVersion:2,componentId:null,references,revision:current.revision});
    assert.equal(saved.status,200);current=saved.value;
    assert.equal(current.selection.references.length,references.length);
    if(references[0]?.kind==='url')assert.equal(current.selection.references[0].url,references[0].url);
    if(references[0]?.kind==='preset')assert.equal(current.selection.references[0].presetId,references[0].presetId);
  }
}));
test('sequential flow saves independent component and reference inputs, skips, and original images',()=>fixture(async({root,url,api,post})=>{
  const {acknowledgeInput,hostReadStatus}=await import('../packages/cli/src/workflow.mjs');
  const {startDesign}=await import('../scripts/design-start.mjs');
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
  let current=(await api('/api/project')).value;
  const input={schemaVersion:2,componentId:'ant-design',references:[{kind:'image',name:'原始参考.png',data:png}],revision:current.revision};
  const result=await post(input);assert.equal(result.status,200);current=result.value;
  assert.equal(current.selection.mode,'combined');assert.equal(current.selection.component.id,'ant-design');
  assert.deepEqual(current.selection.component.packages,['antd']);assert.equal(current.selection.references.length,1);
  const image=current.selection.references[0];assert.deepEqual(fs.readFileSync(path.join(root,image.file)),Buffer.from(png,'base64'));
  assert.equal((await fetch(url+'/api/reference-image?sha='+image.sha256)).status,200);
  assert.equal((await fetch(url+'/api/reference-image?sha=unknown')).status,404);
  assert.equal((await startDesign({project:root})).openRequired,false);
  fs.mkdirSync(path.join(root,'spec'));fs.writeFileSync(path.join(root,'spec/request.md'),'Current combined requirement');
  const receipt=acknowledgeInput(root,'spec/request.md');assert.equal(receipt.mode,'combined');assert.equal(receipt.references.length,1);assert.equal(hostReadStatus(root).status,'read');
  fs.appendFileSync(path.join(root,image.file),'changed');assert.equal(hostReadStatus(root).status,'blocked');
  assert.equal((await fetch(url+'/api/reference-image?sha='+image.sha256)).status,400);
  fs.writeFileSync(path.join(root,image.file),Buffer.from(png,'base64'));
  const before=fs.readFileSync(path.join(root,'.design-workflow/design-basis.json'),'utf8');
  for(const bad of [{...input,references:[{kind:'preset',presetId:'linear-site'},{kind:'url',url:'https://example.com/'}]}, {...input,componentId:'apple-site'}, {...input,references:[{kind:'url',url:'javascript:alert(1)'}]}, {...input,references:[{kind:'image',data:Buffer.from('not an image').toString('base64')}]}, {...input,references:[{kind:'image',file: '../secret',sha256:image.sha256}]}])assert.equal((await post({...bad,revision:current.revision})).status,400);
  assert.equal(fs.readFileSync(path.join(root,'.design-workflow/design-basis.json'),'utf8'),before);
  assert.equal((await post(input)).status,409);
  for(const [componentId,references,mode] of [['ant-design',[{kind:'preset',presetId:'linear-site'}],'combined'],['ant-design',[{kind:'url',url:'https://example.com/inspiration'}],'combined'],['carbon',[],'components'],[null,[{kind:'image',name:'图片',data:png}],'reference'],[null,[],'custom']]){
    const saved=await post({schemaVersion:2,componentId,references,revision:current.revision});assert.equal(saved.status,200);current=saved.value;assert.equal(current.selection.mode,mode);assert.equal(current.selection.references.length,references.length);if(references[0]?.kind==='url')assert.equal(current.selection.references[0].url,references[0].url);if(references[0]?.kind==='preset')assert.equal(current.selection.references[0].presetId,references[0].presetId);assert.equal(current.selection.requirementSource,'host');assert.equal(current.selection.intent,'');assert.equal(current.selection.implementationStatus,'not-started');
  }
}));
test('combined handoff retains both inputs and limits image-only inference',async()=>{
 const {handoff}=await import('../packages/gui/public/handoff.js');
 const value=handoff({schemaVersion:2,component:{name:'Ant Design'},references:[{kind:'url',name:'Linear',url:'https://linear.app/'},{kind:'image',name:'布局.png',file:'.design-workflow/references/example.png',sha256:'hash'}]},'/project');
 assert.match(value,/Ant Design/);assert.match(value,/linear.app/);assert.match(value,/读取原图/);assert.match(value,/合并确认一次/);
});
