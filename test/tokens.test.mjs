import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {buildTokens,compileTokens} from '../packages/cli/src/tokens.mjs';
import {checkProject} from '../packages/cli/src/check.mjs';
import {initProject} from '../packages/cli/src/init.mjs';

function fixture(run) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'design-tokens-'));
  const write=(file,content)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),typeof content==='string'?content:JSON.stringify(content));};
  try {run(root,write);} finally {fs.rmSync(root,{recursive:true,force:true});}
}
const managed={mode:'managed',sourceDirectory:'design-system/tokens',outputFile:'src/styles/generated.css',entryFiles:['src/main.tsx']};

test('JSON export resolves aliases and typography, detects drift, and verifies static entry integration',()=>fixture((root,write)=>{
  initProject(root);
  write('.design-workflow/config.json',{tokens:managed});
  write('src/main.tsx',"import './styles/app.css';\nconst x='var(--color-action-primary)';");
  write('src/styles/app.css',"@import './generated.css';\nbody {font-size:var(--font-size-body);}");
  const first=buildTokens(root);
  assert.ok(first.tokenCount>10);
  const output=fs.readFileSync(path.join(root,managed.outputFile),'utf8');
  assert.match(output,/--color-action-primary: #2563eb/);
  assert.match(output,/--font-family-sans: Inter/);
  assert.match(output,/--line-height-body: 1.5/);
  assert.equal(checkProject(root).tokenChecks.status,'static-checks-passed');
  write('design-system/tokens/colors.json',{primitive:{accent:'#445566'},semantic:{'action-primary':'{primitive.accent}'}});
  assert.ok(checkProject(root).issues.some(x=>x.type==='token-output-drift'));
  buildTokens(root);
  assert.match(fs.readFileSync(path.join(root,managed.outputFile),'utf8'),/--color-action-primary: #445566/);
  assert.equal(checkProject(root).tokenChecks.status,'static-checks-passed');
  write('src/main.tsx',"const x='var(--color-action-primary)';");
  assert.ok(checkProject(root).issues.some(x=>x.type==='token-integration-unverified'));
}));

test('export refuses unmanaged output and invalid aliases without changing runtime CSS',()=>fixture((root,write)=>{
  write('.design-workflow/config.json',{tokens:managed});
  write('design-system/tokens/colors.json',{semantic:{action:'#fff'}});
  write(managed.outputFile,'/* user CSS */');
  assert.throws(()=>buildTokens(root),/unmanaged file/);
  assert.equal(fs.readFileSync(path.join(root,managed.outputFile),'utf8'),'/* user CSS */');
  buildTokens(root,{force:true});
  const before=fs.readFileSync(path.join(root,managed.outputFile),'utf8');
  write('design-system/tokens/colors.json',{semantic:{action:'{missing}'}});
  assert.throws(()=>buildTokens(root),/Unknown token alias/);
  assert.equal(fs.readFileSync(path.join(root,managed.outputFile),'utf8'),before);
  assert.ok(checkProject(root).issues.some(x=>x.type==='invalid-token-source'));
  write('design-system/tokens/colors.json',{semantic:{a:'{semantic.b}',b:'{semantic.a}'}});
  assert.throws(()=>buildTokens(root),/Cyclic/);
}));

test('external mappings preserve toolchains and distinguish comments, local vars, fallbacks and unmapped references',()=>fixture((root,write)=>{
  const config={tokens:{mode:'external',definitionFiles:['src/brand.css'],entryFiles:['src/main.tsx'],externalTokens:['--injected']}};
  write('.design-workflow/config.json',config);
  write('src/brand.css',':root {--brand:#123456;}');
  write('src/main.tsx',"import './brand.css';\n// var(--comment) #ffffff\nconst color='var(--brand)';");
  write('src/style.css',`/* var(--ignored) */\n.card {--local:1rem;gap:var(--local);color:var(--missing);background:var(--fallback, white);border:var(--injected);}`);
  const issues=checkProject(root).issues;
  assert.deepEqual(issues.filter(x=>x.type==='unmapped-token-reference').map(x=>[x.value,x.severity]),[['--missing','P1'],['--fallback','P2']]);
  assert.equal(issues.filter(x=>x.type==='hardcoded-color').length,0);
  assert.throws(()=>buildTokens(root),/mode="managed"/);
  assert.equal(fs.readFileSync(path.join(root,'src/brand.css'),'utf8'),':root {--brand:#123456;}');
  fs.rmSync(path.join(root,'src/brand.css'));
  assert.ok(checkProject(root).issues.some(x=>x.type==='missing-token-definitions'));
}));

test('compiler rejects invalid names, values and CSS name collisions',()=>fixture((root,write)=>{
  for (const value of [{semantic:{'bad name':'#fff'}},{semantic:{a:'red; } body { color:red'}},{semantic:{a:{$value:{x:1}}}},{semantic:{'foo-bar':'1','foo_bar':'2'}}]) {
    write('design-system/tokens/colors.json',value);
    assert.throws(()=>compileTokens(root,managed));
  }
}));

test('token CLI exports JSON results and strict checks flag missing runtime entry',()=>fixture((root,write)=>{
  write('.design-workflow/config.json',{strictChecks:true,tokens:managed});
  write('design-system/tokens/spacing.json',{'space-1':'0.25rem'});
  const cli=path.resolve('packages/cli/bin/design-workflow.mjs');
  const result=spawnSync(process.execPath,[cli,'tokens',root,'--json'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(result.stdout).tokenCount,1);
  const checked=spawnSync(process.execPath,[cli,'check',root,'--json'],{encoding:'utf8'});
  assert.equal(checked.status,2);
  assert.ok(JSON.parse(checked.stdout).issues.some(x=>x.type==='missing-token-entry'));
}));

test('invalid token mapping config is rejected',()=>fixture((root,write)=>{
  for (const tokens of [{mode:'unknown'}, {...managed,entryFiles:[]},{...managed,outputFile:'../out.css'}, {...managed,outputFile:'out.json'},{mode:'external',entryFiles:['src/main.tsx'],definitionFiles:['theme.ts']},{...managed,externalTokens:['not-custom-property']}]) {
    write('.design-workflow/config.json',{tokens});
    assert.throws(()=>checkProject(root));
  }
}));

test('explicit asset mapping disambiguates same-name components and catches stale documents',()=>fixture((root,write)=>{
  write('.design-workflow/config.json',{assetManifest:'.design-workflow/assets.json'});
  write('src/components/forms/Card.tsx','export const Card = () => null;');
  write('src/components/feed/Card.tsx','export const Card = () => null;');
  write('design-system/components/form-card.md','# Form card');
  write('design-system/components/feed-card.md','# Feed card');
  write('.design-workflow/assets.json',{schemaVersion:1,assets:[{type:'component',name:'FormCard',source:'src/components/forms/Card.tsx',document:'design-system/components/form-card.md'},{type:'component',name:'FeedCard',source:'src/components/feed/Card.tsx',document:'design-system/components/feed-card.md'}]});
  assert.equal(checkProject(root).issues.length,0);
  fs.rmSync(path.join(root,'design-system/components/feed-card.md'));
  assert.deepEqual(checkProject(root).issues.map(x=>x.type),['missing-asset-document']);
  fs.rmSync(path.join(root,'src/components/forms/Card.tsx'));
  assert.ok(checkProject(root).issues.some(x=>x.type==='missing-asset-source'));
}));

test('qualified aliases work across files and unused primitive cycles are rejected',()=>fixture((root,write)=>{
  write('design-system/tokens/colors.json',{primitive:{ink:'#112233'}});
  write('design-system/tokens/theme.json',{semantic:{ink:{$value:'{colors.primitive.ink}',$type:'color'}}});
  assert.match(compileTokens(root,managed).css,/--ink: #112233/);
  write('design-system/tokens/colors.json',{primitive:{ink:'#112233',a:'{primitive.b}',b:'{primitive.a}'}});
  assert.throws(()=>compileTokens(root,managed),/Cyclic/);
}));

test('unresolved imports and references from nonstandard runtime entries remain visible',()=>fixture((root,write)=>{
  write('.design-workflow/config.json',{tokens:{mode:'external',definitionFiles:['ui/theme.css'],entryFiles:['ui/main.js']}});
  write('ui/theme.css',':root {--known: red;}');
  write('ui/main.js',"import './theme.css';\nimport './missing.js';\nconst x='var(--unknown)';");
  const types=checkProject(root).issues.map(x=>x.type);
  assert.ok(types.includes('token-import-unresolved'));
  assert.ok(types.includes('unmapped-token-reference'));
}));

test('the React Vite example has consistent executable token and page mappings',()=>{
  const result=checkProject(path.resolve('examples/react-vite'));
  assert.equal(result.tokenChecks.status,'static-checks-passed');
  assert.equal(result.assetChecks.status,'mapping-checked');
  assert.equal(result.summary.issues,0);
});
