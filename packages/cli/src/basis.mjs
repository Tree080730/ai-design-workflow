// Component foundations and visual references are independent inputs.
export function sourceUrl(value) {
  const parsed=new URL(value);
  if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error('Source URL must be HTTP(S), without credentials.');
  return parsed.href;
}
export function basisInputs(basis) {
  if(!basis)return {component:null,references:[],mode:'custom'};
  if(basis.schemaVersion===1) {
    if(!['components','reference','custom'].includes(basis.mode)||(basis.mode==='custom'?basis.preset!==null:!basis.preset?.id))throw new Error('Invalid design basis.');
    const component=basis.mode==='components'?basis.preset:null;
    const references=[];
    if(basis.mode==='reference')references.push({kind:'url',url:sourceUrl(basis.referenceUrl||basis.preset.reference?.url||basis.preset.docs),name:basis.preset.name});
    else if(basis.referenceUrl)references.push({kind:'url',url:sourceUrl(basis.referenceUrl),name:'用户参考'});
    // Legacy mode remains stable until the user explicitly saves the new flow.
    return {component,references,mode:basis.mode};
  }
  if(basis.schemaVersion!==2||!Array.isArray(basis.references)||basis.references.length>8||!(basis.component===null||typeof basis.component?.id==='string'&&Boolean(basis.component.id.trim())))throw new Error('Invalid design basis.');
  if(basis.component)sourceUrl(basis.component.docs);
  const references=basis.references.map(item=>{
    if(item.kind==='url')return {...item,url:sourceUrl(item.url)};
    if(item.kind!=='image'||!/^\.design-workflow\/references\/[a-f0-9]{64}\.(png|jpg|webp)$/.test(item.file??'')||! /^[a-f0-9]{64}$/.test(item.sha256??''))throw new Error('Invalid reference image.');
    return item;
  });
  const mode=basis.component?(references.length?'combined':'components'):(references.length?'reference':'custom');
  if(basis.mode!==mode)throw new Error('Design basis mode does not match its inputs.');
  return {component:basis.component,references,mode};
}
