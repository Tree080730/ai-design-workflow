import React,{useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import './shared.css';
import versions from '../public/preview/versions.json';
export function Sheet({actions,input,selection,feedback,controls,navigation,data,status,extras}) {
  useEffect(()=>{
    const main=document.querySelector('main');
    const report=()=>parent.postMessage({type:'design-preview-size',height:Math.ceil(main.getBoundingClientRect().height)+2},'*');
    const observer=new ResizeObserver(report);observer.observe(main);report();
    return ()=>observer.disconnect();
  },[]);
  const version=versions[location.pathname.split('/').pop().replace('.html','')];
  const overview=new URLSearchParams(location.search).has('overview');
  return <main className={overview?'overview-sheet':'interactive-sheet'}><header><h1>{overview?'组件总览':'组件样板'}</h1><p>官方组件 · 默认浅色主题{version&&` · ${version.version}`}</p></header><section><h2>操作与状态</h2><div className="samples">{actions}</div></section><section><h2>输入与选择</h2><div className="fields">{input}{selection}</div></section>{overview&&<><section><h2>选择与开关</h2><div className="fields">{controls}</div></section><section><h2>导航</h2>{navigation}</section><section><h2>数据展示</h2>{data}</section><section><h2>状态与进度</h2><div className="status-samples">{status}</div></section></>}<section><h2>反馈</h2>{feedback}</section></main>;
}
export function mount(Component){createRoot(document.getElementById('root')).render(<Component/>);}
