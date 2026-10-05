import {websiteReferences} from './website-references.mjs';
import fs from 'node:fs';
import {usageGuides, usageReviewedAt} from './usage-guides.mjs';
const overviews = JSON.parse(fs.readFileSync(new URL('../public/overviews/sources.json', import.meta.url), 'utf8'));
const selectionGuides = JSON.parse(fs.readFileSync(new URL('./selection-guides.json', import.meta.url), 'utf8'));
// Editorial summaries, not redistributed third-party tokens or design assets.
// Package licenses apply to the linked code; brand assets can have separate terms.
export const catalogVersion = 1;
export const checkedAt = '2026-10-04';
export const catalog = [
  {
    id:'ant-design',name:'Ant Design',publisher:'Ant Group',mark:'A',color:'#1677ff',
    category:'open-source',license:'MIT',platforms:['React','Web'],tags:['企业应用','数据密集','表单与表格'],
    summary:'从复杂业务中建立秩序。Ant Design 为企业级 Web 产品提供设计规范、组件和主题体系，让信息密集的界面保持清晰、一致。',
    detail:'适合管理后台、工作台与业务系统。以成熟的表单、表格和反馈组件为基础，再用项目主题表达自己的品牌与视觉风格。',
    docs:'https://ant.design/',repository:'https://github.com/ant-design/ant-design',resources:'https://ant.design/docs/resources/',theme:'https://ant.design/docs/react/customize-theme/',
    packages:['antd'],principles:['清晰的信息层级','一致的操作与反馈','可复用的业务组件'],
    foundations:[['主题与语义','从全局与组件 Token 建立颜色、字体、间距和状态的对应关系。'],['布局与密度','结合页面内容确定容器、栅格和信息密度，保持跨页面一致。'],['行为与反馈','统一表单校验、加载、禁用和结果反馈，明确每一步操作。']],
    components:['Button','Form','Table','Modal','Select','DatePicker'],note:'依赖版本与主题映射在项目实施时确认；选择参考不会自动安装组件库。'
  },
  {
    id:'tdesign',logoExtension:'png',name:'TDesign',publisher:'Tencent',mark:'T',color:'#0052d9',
    category:'open-source',license:'MIT',platforms:['React','Vue','小程序'],tags:['企业应用','多框架','主题定制'],
    summary:'让设计与开发共享一套语言。TDesign 将腾讯的产品设计经验沉淀为设计指南、组件库和配套工具，覆盖多个开发平台。',
    detail:'适合需要统一体验的业务产品。根据项目技术栈选择对应组件实现，再维护项目自己的颜色、字体、布局与交互规则。',
    docs:'https://tdesign.tencent.com/',repository:'https://github.com/Tencent/tdesign',resources:'https://tdesign.tencent.com/',theme:'https://github.com/Tencent/tdesign-react',
    packages:['tdesign-react'],principles:['统一的设计语言','跨平台的组件一致性','可定制的主题'],
    foundations:[['基础语言','以颜色、字体、图标与动效建立统一的视觉基础。'],['主题与布局','让主题配置与项目布局规范共同服务真实业务页面。'],['跨框架实现','匹配已有项目技术栈，避免为了设计基础迁移整个工程。']],
    components:['Button','Form','Table','Dialog','Select','Tabs'],note:'此处列出 React 包作为候选；Vue 和小程序项目应选择各自的官方实现。'
  },
  {
    id:'material',name:'Material Design',publisher:'Google',mark:'G',color:'#6750a4',
    category:'open-source',license:'Apache-2.0',platforms:['Web Components','Android'],tags:['Material 3','表达性主题','跨平台'],
    summary:'以颜色、形状与动效构建有表达力的产品。Material Design 提供系统化设计指南，帮助不同平台上的体验建立清晰的结构与反馈。',
    detail:'将 Material 的设计语言作为项目依据，再选择符合平台的组件实现。官方 Material Web 使用 Web Components，不等同于 React 的 MUI。',
    docs:'https://m3.material.io/',repository:'https://github.com/material-components/material-web',resources:'https://m3.material.io/resources',theme:'https://material-web.dev/theming/',
    packages:['@material/web'],principles:['有意义的颜色角色','明确的层次与形状','连续的交互反馈'],
    foundations:[['颜色角色','用语义化颜色角色组织表面、内容和交互，而不是单纯替换主色。'],['形状与层次','协调容器形状、排版与层次，让重点自然显现。'],['平台匹配','按目标平台选择实现，并验证实际状态与可访问性。']],
    components:['Button','Dialog','Text field','Tabs','Menu','Checkbox'],note:'官方 Material Web 仓库标注维护模式；采用其组件前需评估维护状态与平台适配。'
  },
  {
    id:'apple-hig',hidden:true,name:'Human Interface Guidelines',publisher:'Apple',mark:'A',color:'#171717',
    category:'reference',license:'官方资源单独许可',platforms:['iOS','macOS','Apple 平台'],tags:['平台规范','交互指南','设计参考'],
    summary:'让产品自然地融入 Apple 平台。Human Interface Guidelines 提供布局、导航、交互与可访问性的设计指导，帮助用户用熟悉的方式完成任务。',
    detail:'可作为设计与交互参考，但不是可直接安装的开源 Web 组件库。应用这些原则时，应结合项目平台重新定义可执行样式和组件。',
    docs:'https://developer.apple.com/design/human-interface-guidelines/',repository:null,resources:'https://developer.apple.com/design/resources/',theme:'https://developer.apple.com/design/human-interface-guidelines/color',
    packages:[],principles:['清晰的内容与层级','熟悉的平台行为','尊重可访问性偏好'],
    foundations:[['平台与内容','从内容、任务和平台约定出发安排导航与操作。'],['交互与反馈','让操作、结果与状态清晰可感知，避免仅靠装饰表达。'],['资源边界','使用官方资源前阅读对应许可，不复制分发平台资产。']],
    components:['Navigation','Controls','Menus','Dialogs','Feedback','Accessibility'],note:'作为规范参考使用。Apple 设计资源有单独许可，不作为开源组件包或内置素材分发。'
  },
  {
    id:'cloudscape',name:'Cloudscape',publisher:'Amazon',mark:'a',color:'#ec7211',
    category:'open-source',license:'Apache-2.0',platforms:['React','Web'],tags:['复杂工作台','云控制台','数据管理'],
    summary:'为复杂任务提供清晰的路径。Cloudscape 源自 AWS 的 Web 产品实践，结合设计指南、交互模式和前端组件，服务于规模化的业务应用。',
    detail:'适合控制台、管理工具和数据密集的工作台。围绕任务组织页面布局、导航与操作，复用真实组件并保持一致反馈。',
    docs:'https://cloudscape.design/',repository:'https://github.com/cloudscape-design/components',resources:'https://cloudscape.design/get-started/for-designers/',theme:'https://cloudscape.design/foundation/visual-foundation/theming/',
    packages:['@cloudscape-design/components','@cloudscape-design/global-styles'],principles:['围绕任务组织界面','清晰的复杂信息','一致的操作模式'],
    foundations:[['应用结构','用统一导航、内容区域与操作区承载复杂工作流。'],['视觉基础','协调排版、颜色与间距，让页面层级易于识别。'],['任务模式','统一资源列表、筛选、创建与反馈等业务模式。']],
    components:['Button','Table','App layout','Form','Select','Modal'],note:'适合复杂业务应用；品牌主题与布局扩展应遵循官方支持方式。'
  },
  {
    id:'carbon',name:'Carbon',publisher:'IBM',mark:'C',color:'#0f62fe',
    category:'open-source',license:'Apache-2.0',platforms:['React','Web Components'],tags:['企业产品','网格与排版','设计 Token'],
    summary:'以结构、节奏与一致性承载复杂信息。Carbon 是 IBM 的开源设计系统，提供设计 Token、网格、排版与组件实现。',
    detail:'适合数据密集的企业产品与工具。让组件、页面布局与业务内容共享同一套基础规则，同时保留项目必要的主题扩展。',
    docs:'https://carbondesignsystem.com/',repository:'https://github.com/carbon-design-system/carbon',resources:'https://carbondesignsystem.com/resources/',theme:'https://carbondesignsystem.com/guidelines/themes/overview/',
    packages:['@carbon/react'],principles:['明确的结构与节奏','一致的视觉基础','可复用的产品体验'],
    foundations:[['网格与节奏','让页面和区块共享可解释的对齐与间距体系。'],['主题与排版','用主题 Token 与排版层级组织内容和状态。'],['组件组合','围绕业务需要选择组件，并保持跨页面复用。']],
    components:['Button','Data table','Modal','Text input','Dropdown','Tabs'],note:'React 和 Web Components 使用不同实现；应按实际工程选择。'
  },
  {
    id:'fluent',name:'Fluent 2',publisher:'Microsoft',mark:'M',color:'#0078d4',
    category:'open-source',license:'MIT',platforms:['React','Web Components'],tags:['生产力工具','可访问性','多平台'],
    summary:'让工作流更自然地连接。Fluent 2 提供 Microsoft 的设计语言与组件基础，服务于内容、协作和生产力体验。',
    detail:'适合协作工具与业务工作台。结合项目品牌定义主题，选择匹配平台的组件，同时关注操作可达性和信息层级。',
    docs:'https://fluent2.microsoft.design/',repository:'https://github.com/microsoft/fluentui',resources:'https://fluent2.microsoft.design/get-started/design',theme:'https://fluent2.microsoft.design/get-started/develop',
    packages:['@fluentui/react-components'],principles:['自然的工作流','一致的多平台体验','可访问的操作'],
    foundations:[['主题与语义','通过主题组织颜色、排版、形状和反馈。'],['内容与协作','保持工具、内容与操作之间清晰的关系。'],['可访问性','验证键盘、焦点与状态信息，覆盖真实使用方式。']],
    components:['Button','Input','Dialog','Menu','Combobox','Table'],note:'组件代码为 MIT；官方字体与图标可能适用单独资产许可。'
  },
  {
    id:'spectrum',name:'Spectrum',publisher:'Adobe',mark:'S',color:'#e34850',
    category:'open-source',license:'Apache-2.0',platforms:['React','Web'],tags:['创作工具','可访问性','自适应体验'],
    summary:'为丰富的创作与工作体验建立一致基础。Spectrum 提供 Adobe 的设计指南，React Spectrum 将其落为可复用的组件。',
    detail:'适合编辑器、创作工具和复杂业务产品。区分带视觉语言的 React Spectrum 与无默认样式的 React Aria，选择合适的实现。',
    docs:'https://spectrum.adobe.com/',repository:'https://github.com/adobe/react-spectrum',resources:'https://spectrum.adobe.com/',theme:'https://react-spectrum.adobe.com/react-spectrum/theming.html',
    packages:['@adobe/react-spectrum'],principles:['一致的创作体验','适应用户与设备','可访问的组件行为'],
    foundations:[['设计语言','统一颜色、排版和控件状态，支撑密集的工具界面。'],['自适应体验','考虑输入方式、设备与内容变化，验证实际布局。'],['实现选择','按需求采用 React Spectrum 或另建视觉层，不混淆两者。']],
    components:['Button','TextField','Dialog','Menu','Picker','TableView'],note:'当前项目应确认所选 Spectrum 实现与对应主题 API，不混用不同组件体系。'
  }
];
// Official examples are separate from the library selected for implementation.
const showcases = {
  "ant-design": {
    "image": "https://github.com/user-attachments/assets/74ad0b4a-e086-4955-8edd-9f2cff31aee8",
    "source": "https://github.com/ant-design/ant-design-pro",
    "preview": "https://preview.pro.ant.design/",
    "caption": "官方页面示例 · Ant Design Pro",
    "componentsUrl": "https://ant.design/components/overview/",
    "headline": "面向企业级 Web 产品，提供统一的界面规范与可复用的 React 组件。",
    "positioningSource": "https://ant.design/docs/spec/introduce/",
    "exampleNote": "页面示例来自 Ant Design Pro，是基于 Ant Design 的应用模板；选择此系统不会自动安装整套模板。",
    "imageWidth": 1718,
    "imageHeight": 1191
  },
  "tdesign": {
    "preview": "https://tdesign.tencent.com/starter/react/#/dashboard/base",
    "componentsUrl": "https://tdesign.tencent.com/react/overview",
    "headline": "面向企业应用，支持跨平台、多技术栈下的一致设计与组件实现。",
    "positioningSource": "https://github.com/Tencent/tdesign",
    "image": "https://raw.githubusercontent.com/Tencent/tdesign-react-starter/develop/docs/docs-starter.png",
    "source": "https://github.com/Tencent/tdesign-react-starter",
    "caption": "官方页面示例 · TDesign React Starter",
    "imageWidth": 1920,
    "imageHeight": 1688,
    "exampleNote": "页面来自官方 React Starter 应用模板，展示业务后台的实际布局；选择此系统不会自动安装整套模板。"
  },
  "material": {
    "preview": "https://material-web.dev/",
    "componentsUrl": "https://material-web.dev/components/",
    "headline": "Google 的 Material 3 设计体系；此处展示用于 Web 应用的官方 Material Web 组件。",
    "positioningSource": "https://github.com/material-components/material-web",
    "image": "https://raw.githubusercontent.com/material-components/material-web/main/docs/components/images/dialog/hero.webp",
    "source": "https://github.com/material-components/material-web/tree/main/docs/components/images/dialog",
    "caption": "官方组件示例 · Material Web Dialog",
    "imageWidth": 2400,
    "imageHeight": 1200,
    "exampleNote": "此图展示官方 Material Web 对话框组件，并非完整业务页面；具体实现应按目标平台选择。"
  },
  "apple-hig": {
    "preview": "https://developer.apple.com/design/human-interface-guidelines/",
    "componentsUrl": "https://developer.apple.com/design/human-interface-guidelines/components",
    "headline": "面向 Apple 各平台的应用体验，提供设计指导与最佳实践。",
    "positioningSource": "https://developer.apple.com/design/",
    "image": "https://developer.apple.com/design/resources/images/thumbnails/Thumbnail-UIKit-iOS27_2x.png?3",
    "source": "https://developer.apple.com/design/resources/",
    "caption": "官方平台界面示例 · iOS / iPadOS",
    "imageWidth": 2046,
    "imageHeight": 1248,
    "exampleNote": "此图来自 Apple 官方设计资源，展示平台界面；HIG 是平台规范参考，并非开源 Web 组件库。"
  },
  "cloudscape": {
    "preview": "https://cloudscape.design/examples/",
    "componentsUrl": "https://cloudscape.design/components/",
    "headline": "用于构建 Web 应用，源自 AWS 产品与服务，提供设计指南、组件和开发工具。",
    "positioningSource": "https://cloudscape.design/",
    "image": "https://cloudscape.design/__images/yvlrib0vb3vb/3RkANdWu0IRLpTcBJYSPg5/2397551327a83cfbddd1fe4db9f58188/homepage--meet-cloudscape--os-light.png",
    "source": "https://cloudscape.design/",
    "caption": "官方界面展示 · Cloudscape",
    "imageWidth": 876,
    "imageHeight": 528,
    "exampleNote": "此图为官方首页的界面组合展示；完整页面及其交互可在官方示例中查看。"
  },
  "carbon": {
    "preview": "https://carbondesignsystem.com/components/overview/",
    "componentsUrl": "https://carbondesignsystem.com/components/overview/",
    "headline": "IBM 面向企业产品的开源设计系统，以 IBM Design Language 为基础。",
    "positioningSource": "https://www.carbondesignsystem.com/",
    "image": "https://raw.githubusercontent.com/carbon-design-system/carbon-website/main/src/pages/components/data-table/images/datatable-batch-action.png",
    "source": "https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/components/data-table/images/datatable-batch-action.png",
    "caption": "官方组件示例 · Carbon 数据表格（文档快照）",
    "imageWidth": 1856,
    "imageHeight": 1044,
    "exampleNote": "此图来自已归档的官方文档仓库，展示数据表格批量操作；当前组件版本与样式应以现行官方文档为准。"
  },
  "fluent": {
    "preview": "https://react.fluentui.dev/",
    "componentsUrl": "https://react.fluentui.dev/",
    "headline": "支持 Web、iOS、Android 与 Windows 应用，提供对应平台的设计资源和组件。",
    "positioningSource": "https://fluent2.microsoft.design/",
    "image": "https://fluent2websitecdn.azureedge.net/cdn/web_react_asset-3.BMI8JK6s.webp",
    "source": "https://fluent2.microsoft.design/",
    "caption": "官方组件展示 · Fluent 2 React",
    "imageWidth": 1775,
    "imageHeight": 1325,
    "exampleNote": "此图来自官方首页的 React 组件展示，呈现卡片与操作按钮；不是完整业务页面。"
  },
  "spectrum": {
    "preview": "https://react-spectrum.adobe.com/react-spectrum/",
    "componentsUrl": "https://react-spectrum.adobe.com/react-spectrum/",
    "headline": "Adobe 产品体验的设计体系，提供基础规范、Token、组件与模式，支持一致的产品体验。",
    "positioningSource": "https://spectrum.adobe.com/",
    "image": "https://spectrum.adobe.com/foundations/media_1a93a0b0e1b7fb0945b404bf29ffcc9bd5cc43d71.png",
    "source": "https://spectrum.adobe.com/foundations/attention-hierarchy",
    "caption": "官方交互示例 · Spectrum 导航与层级",
    "imageWidth": 924,
    "imageHeight": 880,
    "exampleNote": "此图来自现行 Spectrum 设计指南，展示导航与注意力层级；接入 React Spectrum 时需核验所选版本与主题，不将规范示例视为组件实现。"
  }
};
for (const preset of catalog) {
  preset.showcase = showcases[preset.id];
  preset.overview = overviews[preset.id] ?? null;
  preset.usage = {reviewedAt:usageReviewedAt, sections:usageGuides[preset.id]};
  preset.selectionGuide = selectionGuides[preset.id];
}
catalog.push(...websiteReferences);
export function findPreset(id) { return catalog.find(item => item.id === id); }
