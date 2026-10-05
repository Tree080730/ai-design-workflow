import {handoff} from './handoff.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const officialLink=(url,label)=>`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
const mark = preset => `<span class="system-logo" data-brand="${escape(preset.id)}"><img src="/logos/${escape(preset.id)}.${escape(preset.logoExtension??'svg')}" alt="" width="64" height="64"></span>`;
let presets=[],activeId,project,filter='open-source',toastTimer,view='gallery';
function toast(message) {$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
async function api(url,options) {
  const response=await fetch(url,options);const result=await response.json();
  if (!response.ok) throw new Error(result.error ?? '请求失败，请重试。');
  return result;
}
function renderList() {
  const query=$('#search').value.trim().toLocaleLowerCase();
  const visible=presets.filter(p=>!p.hidden&&p.category===filter&&[p.name,p.publisher,...p.platforms,...p.tags].join(' ').toLocaleLowerCase().includes(query));
  $('#gallery-lead').textContent=filter==='reference'?'从品牌官网寻找视觉参考，再形成你自己的设计。':'从一套成熟的设计系统开始，再让它成为你的设计。';
  $('#preset-list').innerHTML=visible.map(p=>`<button class="system-card" data-brand="${escape(p.id)}" data-preset="${escape(p.id)}" aria-label="查看 ${escape(p.name)} 详情">${mark(p)}${mark(p).replace('class="system-logo"','class="card-watermark" aria-hidden="true"')}<span class="system-card-name">${escape(p.name)}</span><span class="system-card-publisher">${escape(p.publisher)}</span><span class="card-arrow" aria-hidden="true">↗</span></button>`).join('')+'<button id="skip-preset" class="system-card" data-brand="custom"><span class="system-logo" aria-hidden="true"></span><span class="system-card-name">不使用预设</span><span class="card-arrow" aria-hidden="true">↗</span></button>';
  $('#skip-preset').addEventListener('click',skipPreset);
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
async function persist(p,values={}) {
  const current=project.selection;
  const sameBasis=p?current?.preset?.id===p.id:current?.mode==='custom';
  project=await api('/api/basis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({presetId:p?.id??null,mode:p?(sameBasis?current.mode:(p.category==='reference'?'reference':'components')):'custom',intent:current?.intent??'',referenceUrl:current?.referenceUrl??'',...values,revision:project.revision})});
}
async function choose(p,button) {
  button.disabled=true;$('#detail-error').hidden=true;
  try {await persist(p);showConversation();}catch(error){$('#detail-error').textContent=error.message;$('#detail-error').hidden=false;}finally{button.disabled=false;}
}
function showConversation(push=true) {
  if(!project.selection)return showGallery(push);
  activeId=project.selection.preset?.id??'custom';const p=presets.find(item=>item.id===activeId);document.documentElement.style.setProperty('--accent',p?.color??'#171717');
  setView('conversation');$('#conversation-basis').innerHTML=p?mark(p)+`<span>${escape(p.name)}<small>${project.selection.mode==='components'?'组件与规范基础':'仅作为设计参考'}</small></span><span>调整 ↗</span>`:'<span>不使用预设<small>根据你的需求构建设计系统</small></span><span>调整 ↗</span>';
  $('#request-input').value=project.selection.intent;$('#request-message').textContent=project.selection.intent;$('#request-message').hidden=!project.selection.intent;
  $('#copy-request').disabled=!project.selection.intent;$('#request-error').hidden=true;
  if(push)history.pushState(null,'',`/#conversation/${encodeURIComponent(activeId)}`);window.scrollTo(0,0);
}
function route() {
  const hash=location.hash.slice(1);if(hash==='main')return;if(hash.startsWith('conversation/'))return showConversation(false);
  const p=presets.find(p=>p.id===hash);if(p)select(p.id,false);else showGallery(false);
}
function renderDetail(p) {
  if(p.referenceKind==='website')return renderWebsiteReference(p);
  const selected=project.selection?.preset?.id===p.id;
  const sample=p.showcase;
  const guide=p.selectionGuide;
  const overviewImage=p.overview?`${p.overview.image}?v=${p.overview.imageSha256??'official'}`:'';

  $('#detail').hidden=false;$('#loading').hidden=true;
  $('#detail').innerHTML=`<button id="detail-back" class="back-button">← 所有设计系统</button>
    <div class="detail-hero">
    <section class="detail-hero-info" aria-labelledby="detail-title"><div class="detail-title-row">${mark(p)}<h1 id="detail-title">${escape(p.name)}</h1></div><p class="detail-summary">${escape(guide.introduction)}</p><p class="detail-positioning-source">${officialLink(sample.positioningSource,'官方介绍')}</p></section><section class="detail-decision" aria-label="选择设计系统"><button class="primary-button" id="use-preset">${selected?'沿用':'选择'} ${escape(p.name)} 并继续</button><p id="detail-error" class="form-error" role="alert" hidden></p></section></div>

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
  const selected=project.selection?.preset?.id===p.id;
  const url=escape(p.reference.url);
  $('#detail').innerHTML=`<button id="detail-back" class="back-button">← 所有设计系统</button>
    <div class="detail-hero">
      <section class="detail-hero-info" aria-labelledby="detail-title"><div class="detail-title-row">${mark(p)}<h1 id="detail-title">${escape(p.name)}</h1></div><p class="detail-summary">品牌官网 · 视觉与页面表达参考</p><p class="detail-positioning-source"><a href="${url}" target="_blank" rel="noopener noreferrer">查看品牌官网 ↗</a></p></section>
      <section class="detail-decision" aria-label="选择设计参考"><button class="primary-button" id="use-preset">${selected?'沿用':'参考'} ${escape(p.name)} 并继续</button><p id="detail-error" class="form-error" role="alert" hidden></p></section>
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

function showSaved(selection) {
  $('#basis-form').hidden=true;$('#saved-project').hidden=false;$('#handoff').value=handoff(selection);
}
function openProject(p=presets.find(item=>item.id===(project.selection?.preset?.id??activeId)),saved=true) {
  document.body.dataset.guide='false';$('#dialog-title').textContent='项目的设计起点';
  $('#dialog-selection').innerHTML=p?`<div class="chosen-system">${mark(p)}<div><strong>${escape(p.name)}</strong><small>${escape(p.publisher)} · ${p.category==='reference'?'规范参考':escape(p.license)}</small></div></div>`:'<div class="chosen-system"><strong>不使用预设设计系统</strong></div>';
  $('#mode-fieldset').hidden=!p;
  const current=(p?project.selection?.preset?.id===p.id:project.selection?.mode==='custom')?project.selection:null;
  const componentRadio=$('input[name="mode"][value="components"]');componentRadio.disabled=!p||p.category==='reference';componentRadio.closest('label').classList.toggle('disabled',componentRadio.disabled);
  if(p)$(`input[name="mode"][value="${current?.mode??(p.category==='reference'?'reference':'components')}"]`).checked=true;
  $('#reference-url').value=current?.referenceUrl??'';$('#intent').value=current?.intent??'';
  $('#basis-form').dataset.preset=p?.id??'';$('#basis-form').hidden=false;$('#saved-project').hidden=true;$('#form-error').hidden=true;
  if(saved&&current)showSaved(current);
  $('#project-dialog').showModal();
}
$('#close-dialog').addEventListener('click',()=>$('#project-dialog').close());
$('#project-dialog').addEventListener('click',event=>{if(event.target===$('#project-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();}});
$('#edit-basis').addEventListener('click',()=>{$('#basis-form').hidden=false;$('#saved-project').hidden=true;});
$('#basis-form').addEventListener('submit',async event=>{
  event.preventDefault();$('#save-basis').disabled=true;$('#form-error').hidden=true;
  try {
    project=await api('/api/basis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({presetId:event.target.dataset.preset||null,mode:event.target.dataset.preset?$('input[name="mode"]:checked').value:'custom',intent:$('#intent').value,referenceUrl:$('#reference-url').value,revision:project.revision})});
    $('#project-dialog').close();showConversation();toast('设计基础已保存到项目');
  } catch(error){$('#form-error').textContent=error.message;$('#form-error').hidden=false;}
  finally{$('#save-basis').disabled=false;}
});
$('#copy-handoff').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#handoff').value);toast('已复制，交给宿主 Agent 继续构建');}catch{$('#handoff').focus();$('#handoff').select();toast('请复制已选中的构建需求');}});
async function skipPreset(event){const button=event.currentTarget;button.disabled=true;$('#gallery-error').hidden=true;try{await persist(null);showConversation();}catch(error){$('#gallery-error').textContent=error.message;$('#gallery-error').hidden=false;}finally{button.disabled=false;}}
$('#search').addEventListener('input',renderList);
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{filter=button.dataset.filter;for(const item of document.querySelectorAll('[data-filter]')){item.classList.toggle('selected',item===button);item.setAttribute('aria-pressed',String(item===button));}renderList();});
$('#project-nav').addEventListener('click',()=>project.selection?showConversation():showGallery());$('#project-pill').addEventListener('click',()=>project.selection?showConversation():showGallery());
$('#library-nav').addEventListener('click',()=>{$('#project-dialog').close();showGallery();});
$('#guide-nav').addEventListener('click',()=>{document.body.dataset.guide='true';$('#dialog-title').textContent='从参考到真实页面';$('#dialog-selection').innerHTML='<div class="guide-body"><ol><li><strong>选择设计基础。</strong> 浏览官方规范与组件实现，找到适合业务和技术栈的起点。</li><li><strong>加入你的方向。</strong> 提供风格参考与业务需求，保存到当前项目。</li><li><strong>交给宿主构建。</strong> 复制构建需求，在宿主对话中继续；无需额外配置模型 API。</li><li><strong>查看并迭代。</strong> 宿主建立项目自己的源码与 Gallery，并验证页面和交互。</li></ol><p class="guide-hint">当前 GUI 完成参考选择与项目保存。自动向当前宿主会话派发任务的连接尚未接入。</p></div>';$('#project-dialog').showModal();});
document.addEventListener('keydown',event=>{if(view==='gallery'&&event.key==='/'&&!['INPUT','TEXTAREA'].includes(event.target.tagName)&&!$('#project-dialog').open){event.preventDefault();$('#search').focus();}});
try {
  const [catalog,state]=await Promise.all([api('/api/catalog'),api('/api/project')]);presets=catalog.presets;project=state;
  $('#project-name').textContent=project.projectName;$('#project-pill').title=project.projectPath;
  $('#loading').hidden=true;route();
} catch(error){$('#loading').textContent='无法读取项目：'+error.message;$('#search').disabled=true;for(const id of ['project-nav','project-pill','guide-nav'])$('#'+id).disabled=true;}

$('#conversation-back').addEventListener('click',()=>showGallery());
$('#conversation-basis').addEventListener('click',()=>openProject(undefined,false));
$('#request-form').addEventListener('submit',async event=>{
  event.preventDefault();const intent=$('#request-input').value.trim();if(!intent){$('#request-error').textContent='先描述你想构建的项目。';$('#request-error').hidden=false;return;}
  $('#save-request').disabled=true;try {await persist(presets.find(p=>p.id===activeId),{intent});showConversation(false);toast('需求已保存，可以复制到宿主继续');}catch(error){$('#request-error').textContent=error.message;$('#request-error').hidden=false;}finally{$('#save-request').disabled=false;}
});
$('#request-input').addEventListener('input',()=>{$('#copy-request').disabled=$('#request-input').value.trim()!==project.selection?.intent||!project.selection?.intent;});
$('#copy-request').addEventListener('click',async()=>{if(!project.selection)return;try{await navigator.clipboard.writeText(handoff(project.selection));toast('已复制，请在宿主会话中继续');}catch{openProject();toast('请手动复制构建需求');}});
window.addEventListener('popstate',route);
window.addEventListener('hashchange',route);
