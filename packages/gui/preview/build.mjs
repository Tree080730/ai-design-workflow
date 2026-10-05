import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const ids=['ant-design','tdesign','material','carbon','fluent','spectrum','cloudscape'];
const require=createRequire(import.meta.url);
const names=['antd','tdesign-react','@material/web','@carbon/react','@fluentui/react-components','@adobe/react-spectrum','@cloudscape-design/components'];
const versions={};
for (let i=0;i<ids.length;i++){
  let directory=path.dirname(require.resolve(names[i]==='@material/web'?'@material/web/button/filled-button.js':names[i]));
  while(directory!==path.dirname(directory)){
    const file=path.join(directory,'package.json');
    if(fs.existsSync(file)){const pkg=JSON.parse(fs.readFileSync(file));if(pkg.name===names[i]){versions[ids[i]]={name:pkg.name,version:pkg.version};break;}}
    directory=path.dirname(directory);
  }
}
fs.mkdirSync(`${root}../public/preview`,{recursive:true});
fs.writeFileSync(`${root}../public/preview/versions.json`,JSON.stringify(versions));
await build({absWorkingDir:root,entryPoints:ids.map(id=>`${id}.jsx`),outdir:'../public/preview',bundle:true,minify:true,format:'iife',define:{'process.env.NODE_ENV':'"production"'},loader:{'.woff':'file','.woff2':'file','.svg':'file','.ttf':'file'},assetNames:'assets/[name]-[hash]'});
for(const id of ids)fs.writeFileSync(`${root}../public/preview/${id}.html`,`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>真实组件样板</title><link rel="stylesheet" href="/preview/${id}.css"><div id="root"><p class="preview-loading">正在加载官方组件…</p></div><script src="/preview/${id}.js"></script></html>`);
