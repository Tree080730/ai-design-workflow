import React from 'react';
import ExportPNG from './export-png.jsx';
import './reference-layout.css';
import {fallbackSlots} from './reference-fallbacks.jsx';
export const referenceRegions={
 buttons:[32,24,465,42],select:[502,24,230,42],date:[777,24,220,42],
 radios:[32,94,570,32],checkboxes:[32,145,570,32],switches:[635,94,360,84],
 modal:[1028,24,480,174],popover:[1536,24,170,120],popconfirm:[1732,24,155,100],tooltip:[1536,154,110,35],message:[1660,150,228,48],
 steps:[32,223,665,42],rating:[734,223,160,42],tags:[896,224,355,42],alert:[1300,222,588,44],
 list:[32,296,720,264],progress:[796,296,365,254],tour:[1220,298,328,363],tourAccent:[1584,298,328,363],
 calendar:[32,600,422,314],tabs:[502,600,610,60],pagination:[502,681,610,55],timeline:[502,760,290,153],avatars:[823,760,285,44],sliders:[823,850,380,63],badges:[1300,760,288,48],floating:[1674,738,212,180]
};
export const listItems=[1,2,3,4].map(i=>({id:String(i),title:`Design System Title ${i}`,description:'A design language for enterprise applications'}));
export function Missing({name}){return <span className="reference-missing">No native {name}</span>}
export function ReferenceCanvas({slots,system}){return <><main data-system={system} className="reference-sheet" aria-label="Design system component reference"><div className="reference-stage">{Object.entries(referenceRegions).map(([id,[x,y,w,h]])=><div id={`reference-${id}`} key={id} className={`reference-region ref-${id}`} style={{left:x,top:y,width:w,height:h}}>{slots[id]??fallbackSlots[id]??<Missing name={id}/>}</div>)}</div></main><ExportPNG system={system}/></>}
