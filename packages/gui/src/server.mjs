import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {catalog, catalogVersion, checkedAt, findPreset} from './catalog.mjs';
import {hostReturn} from './host-return.mjs';
import {hostReadStatus} from '../../cli/src/workflow.mjs';

const publicRoot = fileURLToPath(new URL('../public/',import.meta.url));
const selectionFile = '.design-workflow/design-basis.json';
function fileInProject(root) {
  const directory = path.join(root,'.design-workflow');
  for (const file of [directory,path.join(root,selectionFile)]) {
    try { if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Design basis refuses symlinked destinations.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return path.join(root,selectionFile);
}
function state(root) {
  const file = fileInProject(root);
  const content = fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
  const selection = content?JSON.parse(content):null;
  if (selection && (selection.schemaVersion !== 1 || (selection.mode === 'custom' ? selection.preset !== null : !findPreset(selection.preset?.id)))) throw new Error('Existing design basis is not a supported selection. Preserve it and resolve it before saving.');
  return {projectName:path.basename(root),projectPath:root,selection,handoff:hostReadStatus(root),revision:crypto.createHash('sha256').update(content ?? '').digest('hex')};
}
function save(root, input) {
  const preset = findPreset(input?.presetId);
  const custom = input?.mode === 'custom';
  if (custom ? input.presetId !== null : !preset) throw new Error('Unknown design system.');
  if (!['reference','components','custom'].includes(input.mode)) throw new Error('Choose a supported reference mode.');
  if (input.mode === 'components' && preset.category === 'reference') throw new Error('This system is a design reference, not an open-source component library.');
  for (const key of ['intent','referenceUrl']) if (typeof input[key] !== 'string' || input[key].length > (key === 'intent'?6000:2000)) throw new Error(`Invalid ${key}.`);
  if (input.referenceUrl.trim()) {
    const url = new URL(input.referenceUrl.trim());
    if (!['https:','http:'].includes(url.protocol) || url.username || url.password) throw new Error('Reference must be an HTTP(S) URL without credentials.');
  }
  const current = state(root);
  if (input.revision !== current.revision) return null;
  const value = {schemaVersion:1,catalogVersion,status:'selected',selectedAt:new Date().toISOString(),
    preset:custom?null:{id:preset.id,name:preset.name,publisher:preset.publisher,category:preset.category,license:preset.license,docs:preset.docs,repository:preset.repository,theme:preset.theme,resources:preset.resources,packages:input.mode === 'components'?preset.packages:[],sourceCheckedAt:preset.reference?.reviewedAt??checkedAt,...(preset.reference?{reference:preset.reference}:{} )},
    mode:input.mode,intent:input.selectionOnly===true?'':input.intent.trim(),referenceUrl:input.referenceUrl.trim(),
    ...(input.selectionOnly===true?{requirementSource:'host',projectPath:root}:{}),
    selectionGuide:custom?null:preset.selectionGuide,
    implementationStatus:'not-started',versionPolicy:'Resolve and pin compatible versions during project implementation.'};
  const file = fileInProject(root);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try { fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n',{flag:'wx'});fs.renameSync(temporary,file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  return state(root);
}
export function createGuiServer({project,hostThread=null}) {
  const root = fs.realpathSync(path.resolve(project));
  const host = hostReturn(hostThread);
  const projectState=()=>({...state(root),host});
  if (!fs.statSync(root).isDirectory()) throw new Error('Project must be an existing directory.');
  return http.createServer(async (request,response) => {
    const send = (status,value) => {response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(JSON.stringify(value));};
    try {
      const host = request.headers.host;
      const validHosts = [`127.0.0.1:${response.socket.localPort}`,`localhost:${response.socket.localPort}`];
      if (!validHosts.includes(host)) return send(403,{error:'Localhost access only.'});
      const url = new URL(request.url,`http://${host}`);
      if (url.pathname === '/api/catalog' && request.method === 'GET') return send(200,{schemaVersion:1,catalogVersion,checkedAt,presets:catalog});
      if (url.pathname === '/api/project' && request.method === 'GET') return send(200,projectState());
      if (url.pathname === '/api/basis' && request.method === 'POST') {
        if (request.headers.origin !== `http://${host}` || !request.headers['content-type']?.startsWith('application/json')) return send(403,{error:'Same-origin JSON requests only.'});
        let body = '';
        for await (const chunk of request) {body += chunk;if (Buffer.byteLength(body)>32*1024) return send(413,{error:'Request is too large.'});}
        const result = save(root,JSON.parse(body));
        return result?send(200,{...result,host:hostReturn(hostThread)}):send(409,{error:'Project selection changed. Reload before saving.'});
      }
      if (url.pathname.startsWith('/api/')) return send(404,{error:'Unknown operation.'});
      if (!['GET','HEAD'].includes(request.method)) return send(405,{error:'Method not allowed.'});
      const routes = {'/':'index.html','/app.js':'app.js','/handoff.js':'handoff.js','/styles.css':'styles.css'};
      const logo = /^\/logos\/([a-z-]+)\.(svg|ico|png)$/.exec(url.pathname);
      const preset = logo && findPreset(logo[1]);
      const previewEntry = /^\/preview\/([a-z-]+)\.(html|js|css)$/.exec(url.pathname);
      const previewAsset = /^\/preview\/assets\/[a-zA-Z0-9_.-]+\.(woff2?|ttf|svg)$/.test(url.pathname);
      const preview = (previewAsset || (previewEntry && findPreset(previewEntry[1])?.category === 'open-source')) ? url.pathname.slice(1) : null;
      const overviewEntry = /^\/overviews\/([a-z-]+)\.png$/.exec(url.pathname);
      const overview = overviewEntry && findPreset(overviewEntry[1])?.overview ? url.pathname.slice(1) : null;
      const reference = catalog.some(item => item.referenceKind === 'website' && (item.showcase.image === url.pathname || item.showcase.gallery?.some(visual => visual.image === url.pathname))) ? url.pathname.slice(1) : null;
      const file = reference ?? overview ?? preview ?? routes[url.pathname] ?? (preset && logo[2] === (preset.logoExtension ?? 'svg') ? `logos/${preset.id}.${logo[2]}` : null);
      if (!file) return send(404,{error:'Not found.'});
      if (preview && !fs.existsSync(path.join(publicRoot,file))) return send(503,{error:'组件样板尚未构建，请运行 npm run build:preview -w @ai-design-workflow/gui。'});
      const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf'};
      response.writeHead(200,{'Content-Type':`${types[path.extname(file)]}; charset=utf-8`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
        ...(preview?{'Access-Control-Allow-Origin':'*'}:{}),
        'Content-Security-Policy':preview?"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'":`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: ${catalog.map(item => item.showcase.image).filter(image => image.startsWith('https://')).join(' ')} https://github-production-user-asset-6210df.s3.amazonaws.com/507615/465824706-74ad0b4a-e086-4955-8edd-9f2cff31aee8.png; frame-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`});
      response.end(request.method === 'HEAD'?undefined:fs.readFileSync(path.join(publicRoot,file)));
    } catch (error) {send(400,{error:error.message});}
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);let project=process.cwd(),port=4173,hostThread=process.env.CODEX_THREAD_ID??null;
    for (let index=0;index<args.length;index++) {
      if (args[index] === '--project' && args[index+1]) project=args[++index];
      else if (args[index] === '--port' && args[index+1]) port=Number(args[++index]);
      else if (args[index] === '--host-thread' && args[index+1]) hostThread=args[++index];
      else throw new Error('Usage: npm run gui -- --project /project/path [--port 4173] [--host-thread SESSION_UUID]');
    }
    if (!Number.isInteger(port) || port<1 || port>65535) throw new Error('Invalid port.');
    const server = createGuiServer({project,hostThread});
    server.on('error',error => {console.error(error.message);process.exitCode=1;});
    server.listen(port,'127.0.0.1',() => console.log(`Design Builder: http://127.0.0.1:${port}\nProject: ${path.resolve(project)}`));
  } catch (error) {console.error(error.message);process.exitCode=1;}
}
