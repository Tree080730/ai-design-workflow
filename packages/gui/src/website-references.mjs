import {readFileSync} from 'node:fs';
const captures=JSON.parse(readFileSync(new URL('../public/references/page-captures.json',import.meta.url),'utf8'));
// Website references are editorial observations of public pages, not vendor design systems.
const reviewedAt='2026-10-05';
const entries=[
  {id:'apple-site',name:'Apple',publisher:'Apple',color:'#171717',url:'https://www.apple.com/',
    focus:'产品主视觉、标题与行动按钮的层级，以及各内容区块之间的节奏。',
    tags:['产品展示','大幅主视觉','内容层级']},
  {id:'linear-site',name:'Linear',publisher:'Linear',color:'#5e6ad2',url:'https://linear.app/',
    focus:'产品界面的展示方式、紧凑的信息组织、排版与界面层次。',
    tags:['产品界面','信息密度','排版']},
  {id:'notion-site',name:'Notion',publisher:'Notion',logoExtension:'ico',color:'#171717',url:'https://www.notion.com/',
    focus:'文档与工作区的视觉组织、产品示例和说明内容之间的关系。',
    tags:['文档工作区','产品示例','内容组织']},
  {id:'duolingo-site',name:'Duolingo',publisher:'多邻国',logoExtension:'ico',color:'#58cc02',url:'https://www.duolingo.com/',
    focus:'角色插画与内容的配合、鲜明的颜色、按钮层次和学习体验的分步介绍。',tags:['角色插画','学习体验','按钮层次']},
  {id:'adidas-site',name:'Adidas',publisher:'Adidas',color:'#171717',url:'https://www.adidas.com/',
    focus:'品牌活动主视觉、商品卡片、系列分组与购物入口之间的关系。',tags:['商品展示','系列分组','活动主视觉']},
  {id:'lvmh-site',name:'LVMH',publisher:'LVMH',logoExtension:'png',color:'#0a142e',url:'https://www.lvmh.com/en',
    focus:'大幅品牌影像、衬线排版、留白，以及品牌故事与新闻内容的组织方式。',tags:['品牌影像','品牌叙事','衬线排版']},
  {id:'nike-site',name:'Nike',publisher:'Nike',color:'#171717',url:'https://www.nike.com/',
    focus:'运动产品主视觉、系列内容的连续展示、商品展示与行动入口的层级。',tags:['运动视觉','系列展示','行动入口']},
  {id:'airbnb-site',name:'Airbnb',publisher:'Airbnb',color:'#ff385c',url:'https://www.airbnb.com/',
    focus:'搜索入口、分类导航、图片卡片与价格和评分等信息的排列方式。',tags:['搜索入口','分类导航','图片卡片']}
];
export const websiteReferences=entries.map(entry=>{
  const source={label:'品牌官网',url:entry.url};
  const gallery=captures.filter(item=>item.id===entry.id).map(item=>({...item,image:`/references/${item.file}`}));
  return {...entry,category:'reference',referenceKind:'website',license:'品牌网站与素材保留各自权利',platforms:['Web'],packages:[],repository:null,
    docs:entry.url,resources:entry.url,theme:entry.url,
    reference:{kind:'website',url:entry.url,reviewedAt,focus:entry.focus},
    showcase:{image:gallery[0].image,imageWidth:gallery[0].width,imageHeight:gallery[0].height,source:entry.url,preview:entry.url,positioningSource:entry.url,caption:'官网实际页面截图',gallery},overview:null,
    selectionGuide:{checkedAt:reviewedAt,introduction:'以品牌官网的视觉与页面表达作为项目设计参考。',
      components:{text:entry.focus,source},customization:{text:'提炼参考页面的视觉关系，再结合你的品牌、内容与业务建立项目规则。',source},
      web:{text:'仅作为网页设计参考，由宿主实现项目自己的设计系统和页面；不安装该品牌产品的 SDK。',source},
      maintenance:{text:'官网会持续变化；保存的是参考入口与核对日期，不是冻结的官方规范。',source}},
    usage:{reviewedAt,sections:[]}};
});
