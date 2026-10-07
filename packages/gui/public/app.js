import {handoff} from './handoff.js';
import {returnNote} from './return-state.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const officialLink=(url,label)=>`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
const mark = preset => `<span class="system-logo" data-brand="${escape(preset.id)}"><img src="/logos/${escape(preset.id)}.${escape(preset.logoExtension??'svg')}" alt="" width="64" height="64"></span>`;
let presets=[],activeId,project,filter='open-source',toastTimer,view='gallery',returnNavigation='idle',componentId=null,references=[],stepOneDone=false;
function toast(message) {$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
async function api(url,options) {
  const response=await fetch(url,options);const result=await response.json();
  if (!response.ok) throw new Error(result.error ?? '请求失败，请重试。');
  return result;
}
function renderList() {
  const query=$('#search').value.trim().toLocaleLowerCase();
  const visible=presets.filter(p=>!p.hidden&&p.category===filter&&[p.name,p.publisher,...p.platforms,...p.tags].join(' ').toLocaleLowerCase().includes(query));
  $('#selection-step').textContent=filter==='reference'?'第 2 步，共 2 步':'第 1 步，共 2 步';
  $('#gallery-title').textContent=filter==='reference'?'选择你的设计参考':'选择你的组件底座';
  $('#gallery-step-back').hidden=filter!=='reference';
  $('#custom-references').hidden=filter!=='reference';
  $('#flow-summary').hidden=filter!=='reference';
  $('#flow-summary').textContent='组件底座：'+(presets.find(p=>p.id===componentId)?.name??'不使用预设组件');
  $('#search').placeholder=filter==='reference'?'搜索品牌官网':'搜索开源组件';
  $('#search').setAttribute('aria-label',$('#search').placeholder);
  $('#gallery-lead').textContent=filter==='reference'?'浏览品牌官网并查看详情，选择一个作为视觉参考；也可以点击列表底部“使用你自己的参考”，展开后输入网页 URL，或选择“不使用设计参考”。确认后保存选择，返回对话描述项目需求。':'浏览下方开源组件，查看详情后选择一套作为项目的组件底座。也可以选择“不使用预设组件”，继续下一步选择设计参考。';
  $('#preset-list').innerHTML=visible.map(p=>`<button class="system-card" data-brand="${escape(p.id)}" data-preset="${escape(p.id)}" aria-label="查看 ${escape(p.name)} 详情">${mark(p)}${mark(p).replace('class="system-logo"','class="card-watermark" aria-hidden="true"')}<span class="system-card-name">${escape(p.name)}</span><span class="system-card-publisher">${escape(p.publisher)}</span><span class="card-arrow" aria-hidden="true">↗</span></button>`).join('')+(filter==='reference'?'':`<button id="skip-preset" class="system-card" data-brand="custom"><span class="system-logo" aria-hidden="true"><img src="/logos/no-reference.svg" width="36" height="36" alt=""></span><span class="card-watermark" aria-hidden="true"><img src="/logos/no-reference.svg" width="64" height="64" alt=""></span><span class="system-card-name">${filter==='reference'?'不使用设计参考':'不使用预设组件'}</span><span class="card-arrow" aria-hidden="true">↗</span></button>`);
  $('#skip-preset')?.addEventListener('click',skipPreset);
  $('#empty-search').hidden=visible.length>0;
  for (const button of $('#preset-list').querySelectorAll('[data-preset]')) button.addEventListener('click',()=>select(button.dataset.preset));
}
function setView(next) {
  view=next;for(const id of ['gallery','detail','conversation'])$('#'+id).hidden=id!==next;
  $('#search').closest('label').hidden=next!=='gallery';
  $('#library-nav').classList.toggle('active',next!=='conversation');$('#project-nav').classList.toggle('active',next==='conversation');
  document.body.dataset.view=next;
}
function showGallery(push=true) {setView('gallery');renderList();if(push)history.pushState(null,'','/');window.scrollTo(0,0);}
function select(id,push=true) {
  const p=presets.find(item=>item.id===id);if(!p)return showGallery(false);
  activeId=id;document.documentElement.style.setProperty('--accent',p.color);document.documentElement.dataset.preset=id;
  renderDetail(p);setView('detail');if(push)history.pushState(null,'',`/#${encodeURIComponent(id)}`);window.scrollTo(0,0);
}
function setStep(next) {
  filter=next;
  setCustomReferenceExpanded(false);
  $('#search').value='';showGallery();$('#gallery-title').setAttribute('tabindex','-1');$('#gallery-title').focus({preventScroll:true});
}
function selectedLabel(selection) {
  if(selection.schemaVersion!==2)return selection.preset?.name??'不使用预设';
  return (selection.component?.name??'不使用预设组件')+' · '+(selection.references.length?selection.references.map(ref=>ref.name).join('、'):'不使用设计参考');
}
async function persistFlow() {
  project=await api('/api/basis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schemaVersion:2,componentId,references,revision:project.revision})});
}
async function choose(p,button) {
  $('#detail-error').hidden=true;
  if(p.category==='open-source'){componentId=p.id;stepOneDone=true;setStep('reference');return;}
  references=[{kind:'preset',presetId:p.id,name:p.name}];
  await completeFlow(button);
}
async function completeFlow(button){
  const errorElement=$(view==='detail'?'#detail-error':'#reference-error');
  button.disabled=true;errorElement.hidden=true;
  try{await persistFlow();finishSelection();}
  catch(error){errorElement.textContent=error.message;errorElement.hidden=false;}
  finally{button.disabled=false;}
}
function showReturn(push=true) {
  if(!project.selection)return showGallery(push);
  activeId=project.selection.component?.id??project.selection.preset?.id??project.selection.references?.find(ref=>ref.presetId)?.presetId??(project.selection.references?.length?'reference':'custom');
  setView('conversation');$('#conversation-basis').innerHTML=`<span>${escape(selectedLabel(project.selection))}<small>组件底座与视觉参考</small></span><span>调整 ↗</span>`;
  $('#return-project-path').textContent=project.projectPath;
  $('#return-host').hidden=!project.host?.returnUrl;
  $('#return-host').href=project.host?.returnUrl??'#';
  $('#return-note').textContent=returnNote(project,returnNavigation);
  $('#return-instructions').value=handoff(project.selection,project.projectPath);
  if(push)history.pushState(null,'',`/#selected/${encodeURIComponent(activeId)}`);window.scrollTo(0,0);
}
function finishSelection(){
  showReturn();
  if(project.host?.returnUrl){returnNavigation='pending';showReturn(false);try{location.assign(project.host.returnUrl);}catch{returnNavigation='failed';showReturn(false);}}
}

function route() {
  const hash=location.hash.slice(1);if(hash==='main')return;if(hash.startsWith('conversation/')||hash.startsWith('selected/'))return showReturn(false);
  const p=presets.find(p=>p.id===hash);if(p&&p.category==='reference'&&!stepOneDone)return showGallery(false);if(p)select(p.id,false);else showGallery(false);
}
function renderDetail(p) {
  if(p.referenceKind==='website')return renderWebsiteReference(p);
  const selected=componentId===p.id||references.some(ref=>ref.presetId===p.id);
  const sample=p.showcase;
  const guide=p.selectionGuide;
  const overviewImage=p.overview?`${p.overview.image}?v=${p.overview.imageSha256??'official'}`:'';

  $('#detail').hidden=false;$('#loading').hidden=true;
  $('#detail').innerHTML=`<div class="page-kicker step-label"><button id="detail-back" class="back-button" type="button" aria-label="所有设计系统" title="所有设计系统"><span aria-hidden="true">←</span></button></div>
    <div class="detail-hero">
    <section class="detail-hero-info" aria-labelledby="detail-title"><div class="detail-title-row">${mark(p)}<h1 id="detail-title">${escape(p.name)}</h1></div><p class="detail-summary">${escape(guide.introduction)}</p><p class="detail-positioning-source">${officialLink(sample.positioningSource,'官方介绍')}</p></section><section class="detail-decision" aria-label="选择设计系统"><button class="primary-button" id="use-preset">以 ${escape(p.name)} 为组件底座，继续选择参考</button><p id="detail-error" class="form-error" role="alert" hidden></p></section></div>

    <section class="system-components" aria-label="设计系统展示"><div class="system-live-preview">${p.category==='reference'?`<div class="platform-reference"><h2>平台设计规范</h2><img src="${escape(sample.image)}" alt="${escape(sample.caption)}" referrerpolicy="no-referrer"><span>${escape(sample.caption)}</span></div>`:`<figure class="component-overview"><button id="open-overview" aria-label="放大 ${escape(p.name)} 组件总览"><img src="${escape(overviewImage)}" alt="${escape(p.name)} 组件总览：操作、输入、选择、导航、数据、状态与反馈" width="${p.overview.width}" height="${p.overview.height}"><span>放大查看 ↗</span></button><figcaption>${escape(p.overview.caption)}${p.overview.kind==='generated-from-official-components'?'<span class="overview-composition-note">部分展示为本项目补充组合，不代表官方原生组件。</span>':''}${p.overview.imageSource?officialLink(p.overview.source,'查看图片来源'):''}</figcaption></figure>`}</div></section>
    <section class="system-selection-guide" aria-labelledby="selection-guide-title"><div class="system-section-heading"><h2 id="selection-guide-title">选择前了解</h2></div><dl>${[['components','提供哪些能力'],['customization','外观可以怎么调整']].map(([key,label])=>`<div class="selection-guide-row"><dt>${label}</dt><dd><p>${escape(key==='components'&&p.id==='material'?guide[key].text.split('。')[0]+'。':guide[key].text)}</p>${officialLink(guide[key].source.url,guide[key].source.label)}</dd></div>`).join('')}${guide.notice?`<div class="selection-guide-row"><dt>需要注意</dt><dd><p>${escape(guide.notice)}</p>${officialLink(guide[p.category==='reference'?'web':'maintenance'].source.url,guide[p.category==='reference'?'web':'maintenance'].source.label)}</dd></div>`:''}</dl><p class="selection-guide-footnote">控件列举为示例；完整能力见官方目录。核对日期：${escape(guide.checkedAt)}。</p></section>
    <section class="system-resources" aria-labelledby="resources-title"><div class="system-section-heading"><h2 id="resources-title">官方资料</h2><span>Resources</span></div><div class="detail-resource-grid"><a class="detail-resource-card" href="${escape(p.docs)}" target="_blank" rel="noopener noreferrer"><strong>设计规范</strong><p>了解设计原则、视觉基础与交互约定。</p><span>阅读官方规范 ↗</span></a><a class="detail-resource-card" href="${escape(p.resources)}" target="_blank" rel="noopener noreferrer"><strong>设计资源</strong><p>查看官方提供的设计与开发资源。</p><span>浏览官方资源 ↗</span></a><a class="detail-resource-card" href="${escape(sample.preview)}" target="_blank" rel="noopener noreferrer"><strong>官方示例</strong><p>进一步查看组件或平台的实际表现。</p><span>打开官方示例 ↗</span></a></div></section>

    <details class="detail-rules"><summary>接入与使用说明</summary><div class="detail-rules-content"><p class="usage-provenance">依据官方文档整理 · 核对日期：${escape(p.usage.reviewedAt)}</p><section class="usage-section"><h3>网页接入</h3><p>${escape(guide.web.text)}</p><div class="usage-source">来源：${officialLink(guide.web.source.url,guide.web.source.label)}</div></section>${!guide.notice?`<section class="usage-section"><h3>版本与维护记录</h3><p>${escape(guide.maintenance.text)}</p><div class="usage-source">来源：${officialLink(guide.maintenance.source.url,guide.maintenance.source.label)}</div></section>`:''}${p.usage.sections.map((section,index)=>`<section class="usage-section"><h3>${index+1}. ${escape(section.title)}</h3><p>${escape(section.text)}</p>${section.code?`<pre><code>${escape(section.code)}</code></pre>`:''}<div class="usage-source">来源：${officialLink(section.source.url,section.source.label)}</div></section>`).join('')}<p class="usage-project-note">本工具说明：选择设计系统会记录项目基础，不会自动安装依赖。后续由宿主 Agent 根据项目技术栈、所选实现及对应版本完成接入。</p></div></details>`;
  if (p.overview) {
    const dialog=document.createElement('dialog');
    dialog.className='overview-dialog';
    dialog.setAttribute('aria-label',`${p.name} 组件总览`);
    dialog.innerHTML=`<div class="overview-dialog-toolbar"><strong>${escape(p.name)} · 组件总览</strong><button type="button">关闭 ×</button></div><div class="overview-image-scroll"><img src="${escape(overviewImage)}" alt="${escape(p.name)} 组件总览" width="${p.overview.width}" height="${p.overview.height}"></div>`;
    $('#detail').append(dialog);
    $('#open-overview').addEventListener('click',()=>dialog.showModal());
    dialog.querySelector('button').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  }
  $('#use-preset').addEventListener('click',event=>choose(p,event.currentTarget));
  $('#detail-back').addEventListener('click',()=>showGallery());
}

// Automatic and manual movement share the same scroll position. Three copies
// keep a full viewport available on either side of the active cycle.
function setupReferenceCarousel(gallery,motion) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let period=0,paused=false,drag=null,dragged=false,lastTime=0,manualUntil=0;
  const measure=()=>{
    const next=gallery.querySelector('.reference-group').getBoundingClientRect().width;
    const phase=period?((gallery.scrollLeft%period)+period)%period:0;
    period=next;
    gallery.scrollLeft=reduced.matches?0:period+phase;
  };
  const normalize=()=>{
    if(reduced.matches||!period)return;
    if(gallery.scrollLeft<period||gallery.scrollLeft>=2*period)
      gallery.scrollLeft=period+((gallery.scrollLeft%period)+period)%period;
  };
  const syncMotion=()=>{
    motion.disabled=reduced.matches;
    motion.setAttribute('aria-pressed',String(paused||reduced.matches));
    motion.textContent=reduced.matches?'动态效果已关闭':paused?'继续滚动':'暂停滚动';
  };
  const onPreference=()=>{measure();syncMotion();};
  const manual=()=>{manualUntil=performance.now()+1200;};
  motion.addEventListener('click',()=>{paused=!paused;syncMotion();});
  gallery.addEventListener('scroll',normalize,{passive:true});
  gallery.addEventListener('wheel',event=>{
    if(event.deltaX||event.shiftKey){manual();if(event.shiftKey&&!event.deltaX){event.preventDefault();gallery.scrollLeft+=event.deltaY;}}
  },{passive:false});
  gallery.addEventListener('touchstart',manual,{passive:true});
  gallery.addEventListener('touchmove',manual,{passive:true});
  gallery.addEventListener('touchend',manual,{passive:true});
  gallery.addEventListener('dragstart',event=>event.preventDefault());
  gallery.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse'||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX};dragged=false;manual();
  });
  gallery.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.x;
    if(!dragged&&Math.abs(dx)<5)return;
    if(!dragged){dragged=true;gallery.setPointerCapture(event.pointerId);gallery.classList.add('dragging');}
    gallery.scrollLeft-=dx;normalize();drag.x=event.clientX;manual();
  });
  const endDrag=()=>{
    drag=null;gallery.classList.remove('dragging');manual();
    if(dragged&&gallery.contains(document.activeElement))document.activeElement.blur();
  };
  gallery.addEventListener('pointerup',endDrag);
  gallery.addEventListener('pointercancel',endDrag);
  gallery.addEventListener('lostpointercapture',endDrag);
  gallery.addEventListener('pointerleave',()=>{if(drag&&!dragged)endDrag();});
  gallery.addEventListener('click',event=>{if(dragged){event.preventDefault();dragged=false;}},true);
  const resize=new ResizeObserver(measure);
  resize.observe(gallery);reduced.addEventListener('change',onPreference);
  measure();syncMotion();
  const tick=time=>{
    if(!gallery.isConnected){resize.disconnect();reduced.removeEventListener('change',onPreference);return;}
    const elapsed=lastTime?Math.min(time-lastTime,50):0;lastTime=time;
    if(!paused&&!reduced.matches&&!drag&&time>manualUntil&&!gallery.matches(':focus-within')){
      gallery.scrollLeft+=70*elapsed/1000;normalize();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function renderWebsiteReference(p) {
  const selected=componentId===p.id||references.some(ref=>ref.presetId===p.id);
  const url=escape(p.reference.url);
  $('#detail').innerHTML=`<div class="page-kicker step-label"><button id="detail-back" class="back-button" type="button" aria-label="所有设计系统" title="所有设计系统"><span aria-hidden="true">←</span></button></div>
    <div class="detail-hero">
      <section class="detail-hero-info" aria-labelledby="detail-title"><div class="detail-title-row">${mark(p)}<h1 id="detail-title">${escape(p.name)}</h1></div><p class="detail-summary">品牌官网 · 视觉与页面表达参考</p><p class="detail-positioning-source"><a href="${url}" target="_blank" rel="noopener noreferrer">查看品牌官网 ↗</a></p></section>
      <section class="detail-decision" aria-label="选择设计参考"><button class="primary-button" id="use-preset">使用 ${escape(p.name)} 参考</button><p id="detail-error" class="form-error" role="alert" hidden></p></section>
    </div>
    <section class="website-reference-visual" aria-label="官网页面画廊"><div class="reference-gallery-toolbar"><span>官网页面视觉</span><button id="reference-motion" class="text-button" aria-pressed="false">暂停滚动</button></div><div class="reference-gallery"><div class="reference-track">${[false,true,true].map(copy=>`<div class="reference-group" ${copy?'aria-hidden="true"':''}>${p.showcase.gallery.map(item=>`<figure class="reference-slide"><a href="${escape(item.source)}" target="_blank" rel="noopener noreferrer" ${copy?'tabindex="-1"':''}><img src="${escape(item.image)}" alt="${escape(item.caption)}" width="${item.width}" height="${item.height}"><span class="reference-slide-error" hidden>图片暂时无法加载 · 查看官网 ↗</span></a><figcaption>${escape(item.caption)} ↗</figcaption></figure>`).join('')}</div>`).join('')}</div></div><p class="reference-capture-note">官网实际页面截图 · ${escape(p.reference.reviewedAt)} · 页面可能随地区和时间变化</p></section>
    <section class="system-selection-guide" aria-labelledby="reference-focus-title"><div class="system-section-heading"><h2 id="reference-focus-title">参考哪些部分</h2></div><p class="website-reference-focus">${escape(p.reference.focus)}</p><p class="selection-guide-footnote">以上为本项目整理的观察方向，不是品牌官方设计规范或适用场景推荐。完整视觉与交互请查看官网。</p></section>
    <details class="detail-rules"><summary>如何使用这份参考</summary><div class="detail-rules-content"><section class="usage-section"><h3>加入你的业务与风格</h3><p>选择后，继续描述你的项目需求。宿主会读取官网，提炼排版、颜色、布局与交互关系，构建项目自己的设计系统和业务页面。</p></section><section class="usage-section"><h3>保留项目自己的设计</h3><p>参考入口不提供该品牌的组件源码，也不会安装该品牌产品的 SDK。已有项目优先保留真实资产和确认规则；Logo、图片与文案用于识别参考来源，不作为你项目的品牌素材。</p></section><p class="usage-project-note">官网内容会更新，参考的范围由你的需求决定。</p></div></details>`;
  const gallery=$('.reference-gallery');
  const motion=$('#reference-motion');
  setupReferenceCarousel(gallery,motion);
  for(const image of gallery.querySelectorAll('img')){const failed=()=>{image.hidden=true;image.nextElementSibling.hidden=false;};image.addEventListener('error',failed);if(image.complete&&!image.naturalWidth)failed();}
  $('#use-preset').addEventListener('click',event=>choose(p,event.currentTarget));
  $('#detail-back').addEventListener('click',()=>showGallery());
}

$('#close-dialog').addEventListener('click',()=>$('#project-dialog').close());
async function skipPreset(event){
  if(filter==='open-source'){componentId=null;stepOneDone=true;setStep('reference');}
  else{references=[];$('#custom-reference-url').value='';await completeFlow(event.currentTarget);}
}
function setCustomReferenceExpanded(expanded){
  const content=$('#custom-reference-content');
  if(!expanded&&content.contains(document.activeElement))$('#toggle-custom-reference').focus({preventScroll:true});
  $('#custom-references').classList.toggle('is-expanded',expanded);
  content.inert=!expanded;
  content.setAttribute('aria-hidden',String(!expanded));
  $('#toggle-custom-reference').setAttribute('aria-expanded',String(expanded));
  $('#toggle-custom-reference .card-arrow').textContent=expanded?'−':'＋';
}
$('#toggle-custom-reference').addEventListener('click',()=>{
  setCustomReferenceExpanded($('#toggle-custom-reference').getAttribute('aria-expanded')!=='true');
});
$('#skip-reference').addEventListener('click',skipPreset);
$('#reference-form').addEventListener('submit',async event=>{
  event.preventDefault();$('#reference-error').hidden=true;
  try{
    const parsed=new URL($('#custom-reference-url').value.trim());
    if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error('请输入不含账号密码的 HTTP(S) 网页地址。');
    references=[{kind:'url',url:parsed.href,name:parsed.hostname}];
    await completeFlow($('#finish-reference'));
  }catch(error){$('#reference-error').textContent=error.message;$('#reference-error').hidden=false;}
});
$('#gallery-step-back').addEventListener('click',()=>setStep('open-source'));
$('#search').addEventListener('input',renderList);
$('#project-nav').addEventListener('click',()=>project.selection?showReturn():showGallery());$('#project-pill').addEventListener('click',()=>project.selection?showReturn():showGallery());
$('#library-nav').addEventListener('click',()=>{$('#project-dialog').close();setStep('open-source');});
$('#guide-nav').addEventListener('click',()=>{document.body.dataset.guide='true';$('#dialog-title').textContent='从参考到真实页面';$('#dialog-selection').innerHTML='<div class="guide-body"><ol><li><strong>选择组件底座。</strong> 选择开源组件，也可以跳过。</li><li><strong>选择设计参考。</strong> 选择一个品牌官网或输入自己的网页地址，也可以不使用设计参考；之后在宿主中描述需求。</li><li><strong>交给宿主构建。</strong> 保存选择后返回原宿主会话，在对话中继续；无需额外配置模型 API。</li><li><strong>查看并迭代。</strong> 宿主建立项目自己的源码与 Gallery，并验证页面和交互。</li></ol><p class="guide-hint">当前 GUI 完成参考选择与项目保存。自动向当前宿主会话派发任务的连接尚未接入。</p></div>';$('#project-dialog').showModal();});
document.addEventListener('keydown',event=>{if(view==='gallery'&&event.key==='/'&&!['INPUT','TEXTAREA'].includes(event.target.tagName)&&!$('#project-dialog').open){event.preventDefault();$('#search').focus();}});
try {
  const [catalog,state]=await Promise.all([api('/api/catalog'),api('/api/project')]);presets=catalog.presets;project=state;
  if(project.selection?.schemaVersion===2){componentId=project.selection.component?.id??null;references=project.selection.references.map(ref=>ref.presetId?{kind:'preset',presetId:ref.presetId,name:ref.name}:ref);}
  else if(project.selection){componentId=project.selection.mode==='components'?project.selection.preset.id:null;if(project.selection.mode==='reference')references.push({kind:project.selection.preset.reference?.kind==='website'?'preset':'url',presetId:project.selection.preset.id,url:project.selection.referenceUrl||project.selection.preset.reference?.url||project.selection.preset.docs,name:project.selection.preset.name});else if(project.selection.referenceUrl)references.push({kind:'url',url:project.selection.referenceUrl,name:'用户参考'});}
  $('#project-name').textContent=project.projectName;$('#project-pill').title=project.projectPath;
  $('#custom-reference-url').value=references.find(ref=>ref.kind==='url')?.url??'';
  $('#loading').hidden=true;route();
} catch(error){$('#loading').textContent='无法读取项目：'+error.message;$('#search').disabled=true;for(const id of ['project-nav','project-pill','guide-nav'])$('#'+id).disabled=true;}

$('#conversation-back').addEventListener('click',()=>setStep('open-source'));
$('#conversation-basis').addEventListener('click',()=>setStep('open-source'));
$('#copy-return').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText($('#return-instructions').value);toast('已复制交接说明，可在原宿主会话粘贴');}
  catch{$('#return-instructions').focus();$('#return-instructions').select();toast('请手动复制已选中的说明');}
});
window.addEventListener('popstate',route);
window.addEventListener('hashchange',route);
window.addEventListener('focus',async()=>{
  if(view!=='conversation')return;
  try{project=await api('/api/project');showReturn(false);}
  catch{toast('无法更新宿主读取状态，请刷新重试');}
});
