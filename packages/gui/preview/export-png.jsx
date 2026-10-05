import React,{useState} from 'react';
import {toSvg} from 'html-to-image';
// Development-only export view. Re-rasterize the DOM at 2×; never upscale an old image.
export default function ExportPNG({system}){
 const [state,setState]=useState(''),[url,setURL]=useState(''),[svg,setSVG]=useState('');
 if(new URLSearchParams(location.search).get('export')!=='png')return null;
 async function generate(){
  setState('正在生成');setURL('');
  try{
   await document.fonts.ready;
   const node=document.querySelector('.reference-sheet');
   const descendants=(root)=>Array.from(root.querySelectorAll('*')).flatMap(el=>[el,...(el.shadowRoot?descendants(el.shadowRoot):[])]);
   const elements=descendants(node);
   await Promise.all(elements.filter(el=>el.updateComplete).map(el=>el.updateComplete));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   // SVG paint properties are absent from HTML-only computed-style lists.
   const includeStyleProperties=[...new Set([...getComputedStyle(document.documentElement),...elements.filter(el=>el instanceof SVGElement).flatMap(el=>Array.from(getComputedStyle(el)))])];
   // Some nested SVG clones omit computed paint styles; bake them into attributes.
   const paints=elements.filter(el=>el instanceof SVGElement).flatMap(el=>['fill','stroke','stroke-width','stroke-dasharray','stroke-dashoffset','stroke-linecap','stroke-linejoin','opacity','fill-opacity','stroke-opacity','r','cx','cy','rx','ry','x','y'].map(name=>({el,name,previous:el.getAttribute(name),value:getComputedStyle(el).getPropertyValue(name)})));
   const svgStyles=elements.filter(el=>el instanceof SVGElement).map(el=>({el,previous:el.getAttribute('style'),values:['width','height','transform','transform-origin','clip-path'].map(name=>[name,getComputedStyle(el).getPropertyValue(name)])}));
   let svgURL;
   try{
    paints.forEach(({el,name,value})=>el.setAttribute(name,value));
    svgStyles.forEach(({el,values})=>values.forEach(([name,value])=>el.style.setProperty(name,value)));
    svgURL=await toSvg(node,{width:1920,height:946,backgroundColor:'#ffffff',includeStyleProperties});
   }finally{svgStyles.forEach(({el,previous})=>previous===null?el.removeAttribute('style'):el.setAttribute('style',previous));paints.forEach(({el,name,previous})=>previous===null?el.removeAttribute(name):el.setAttribute(name,previous));}
   const svgDocument=new DOMParser().parseFromString(decodeURIComponent(svgURL.split(',')[1]),'image/svg+xml');
   // Preserve SVG attribute transforms without duplicating them as CSS transforms.
   svgDocument.querySelectorAll('svg [transform]').forEach(el=>el.style.removeProperty('transform'));
   const rendered=new Image();
   const ready=new Promise((resolve,reject)=>{rendered.onload=resolve;rendered.onerror=()=>reject(new Error('SVG rasterization failed'));});
   rendered.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svgDocument));
   setSVG(rendered.src);
   await ready;
   const canvas=document.createElement('canvas');canvas.width=3840;canvas.height=1892;
   const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
   context.drawImage(rendered,0,0,canvas.width,canvas.height);
   const png=canvas.toDataURL('image/png');
   setURL(png);setState('导出完成 · 3840 × 1892 · 无损 PNG');
  }catch(error){setState(`导出失败：${error.message}`);}
 }
 return <div className="reference-export-toolbar"><button onClick={generate}>生成高清 PNG</button><span role="status">{state}</span>{url&&<a id="export-png" href={url} download={`${system}.png`}>下载 PNG</a>}{svg&&<a id="export-svg" href={svg} download={`${system}.svg`}>下载 SVG</a>}</div>;
}
