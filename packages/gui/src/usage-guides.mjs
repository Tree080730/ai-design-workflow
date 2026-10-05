// Chinese paraphrases of the linked official documentation, reviewed on this date.
// Installation examples describe the selected implementation, not an automatic GUI action.
const section = (title, text, label, url, code) => ({title, text, source:{label,url}, ...(code ? {code} : {})});
export const usageReviewedAt = '2026-10-05';
export const usageGuides = {
  'ant-design': [
    section('接入 React 项目', '安装 antd 后，从包中按需导入 Button、Form 等组件。官方入门提供 React 示例；组件 API 与依赖兼容要求应对照项目实际安装版本。', '官方入门', 'https://ant.design/docs/react/getting-started/', "npm install antd\nimport { Button } from 'antd';"),
    section('配置项目主题', '通过 ConfigProvider 的 theme.token 配置全局设计 Token，通过 theme.components 定制单个组件。默认、深色与紧凑算法由 theme.algorithm 指定；颜色与组件状态沿用同一套主题配置。', '官方主题文档', 'https://ant.design/docs/react/customize-theme/'),
    section('处理弹层与消息', 'message、notification 和 Modal 的静态方法无法直接读取当前 ConfigProvider 上下文。需要主题、语言等上下文时，使用对应 Hook 并放置 contextHolder，或通过 App 组件提供的实例调用。', '官方主题文档：上下文限制', 'https://ant.design/docs/react/customize-theme/'),
  ],
  tdesign: [
    section('接入 React 项目', 'React 实现使用 tdesign-react，并在应用入口引入组件样式。从包中导入组件后，按照对应组件文档配置属性、事件与受控状态。', '官方 React 仓库 README', 'https://github.com/Tencent/tdesign-react', "npm install tdesign-react\nimport { Button } from 'tdesign-react';\nimport 'tdesign-react/es/style/index.css';"),
    section('使用主题能力', '官方 React 实现支持深色模式和主题定制。主题配置应采用该实现的官方方式；具体变量与组件接口可从仓库文档入口查阅，不直接套用其他组件库的 Token API。', '官方 README：特性与文档入口', 'https://github.com/Tencent/tdesign-react'),
    section('选择对应框架实现', 'TDesign 为 React、Vue 和小程序提供独立实现。Vue 3 对应 tdesign-vue-next，Vue 2 对应 tdesign-vue，小程序对应 tdesign-miniprogram；这些是不同的软件包，应查阅各自的接入说明。', '官方 README：相关项目', 'https://github.com/Tencent/tdesign-react'),
  ],
  material: [
    section('接入 Material Web', '此处展示的是 Google 的 Material Web（Material 3）实现。安装 @material/web，导入需要的元素定义后，在页面中使用 md-filled-button 等自定义元素；生产构建需要解析 npm 模块导入。', '官方 Quick start', 'https://github.com/material-components/material-web/blob/main/docs/quick-start.md', "npm install @material/web\nimport '@material/web/button/filled-button.js';"),
    section('配置颜色角色', '通过 --md-sys-color-* CSS 自定义属性设置配色。主色、表面色等角色需要配套的 on-* 内容颜色；官方文档提供 Material Theme Builder 和 material-color-utilities 两种配色生成入口。', '官方颜色主题文档', 'https://github.com/material-components/material-web/blob/main/docs/theming/color.md'),
    section('确认实现与维护状态', 'Material Web 使用 Web Components。官方仓库目前标注为维护模式，等待新的维护者；采用这一实现前应查看当前仓库状态，并根据目标平台选择相应的 Material 实现。', '官方 README：实现与维护说明', 'https://github.com/material-components/material-web'),
  ],
  'apple-hig': [
    section('从目标平台规范开始', 'Human Interface Guidelines 是 Apple 的设计指导入口。先选择目标平台，再查阅对应组件、布局与交互规范；这里沿用的是规范参考，不存在可从本目录安装的 Apple Web 组件包。', '官方 Human Interface Guidelines', 'https://developer.apple.com/design/human-interface-guidelines/'),
    section('使用官方设计资源', 'Apple Design Resources 提供按平台划分的设计模板与 UI 资源，并列出字体、SF Symbols 等资源入口。选择与目标平台和设计工具对应的版本，再阅读该资源的下载及使用条款。', '官方 Apple Design Resources', 'https://developer.apple.com/design/resources/'),
    section('确认资源的使用范围', '设计文件、字体与符号各有相应许可，不能把资源页面等同于开源 Web 组件库。官方页面中的 License Agreements 和各下载项目说明是具体使用范围的依据。', '官方资源与许可入口', 'https://developer.apple.com/design/resources/'),
  ],
  cloudscape: [
    section('接入 React 项目', '安装组件与全局样式包，在应用入口引入全局样式；组件可从各自路径导入。官方还提供 design-tokens 和 collection-hooks，后者用于列表、筛选、排序及分页状态。', '官方组件接入指南', 'https://cloudscape.design/get-started/for-developers/using-cloudscape-components/', "npm install @cloudscape-design/components @cloudscape-design/global-styles\nimport '@cloudscape-design/global-styles/index.css';\nimport Button from '@cloudscape-design/components/button';"),
    section('配置主题', '按照官方主题接口生成覆盖样式，并让主题样式在默认样式之后加载。官方推荐构建时生成主题；需要在前端动态定义主题时，可使用运行时主题接口。', '官方 Theming 文档', 'https://cloudscape.design/foundation/visual-foundation/theming/'),
    section('连接组件事件', 'Cloudscape 的事件参数通过 detail 提供数据，例如输入变化从 event.detail.value 读取。状态由应用管理，接入时应逐个核对组件事件和属性；官方 React 组件不直接替代其他框架实现。', '官方组件接入指南：事件与框架', 'https://cloudscape.design/get-started/for-developers/using-cloudscape-components/'),
  ],
  carbon: [
    section('接入 React 项目', '安装 @carbon/react，按照官方 React 接入页引入组件样式，再导入所需组件。该包提供组件、样式和图标；构建工具需要处理样式，依赖版本须满足包的 peerDependencies。', '官方 Carbon React 接入指南', 'https://www.carbondesignsystem.com/getting-started/developing/carbon-core/react', "npm install @carbon/react\nimport { Button } from '@carbon/react';"),
    section('加载样式与图标', '官方指南提供整体加载或按组件加载样式两种方式。图标可从 @carbon/react/icons 导入；组件样式的具体引入方式应使用该指南中的构建配置，避免只导入 JavaScript 而遗漏样式。', '官方 React 指南：Styles 与 Icons', 'https://www.carbondesignsystem.com/getting-started/developing/carbon-core/react'),
    section('选择实现与配套文档', '这里的接入命令对应 Carbon React。组件属性、样式与框架集成应以 React 指南和其链接的 Storybook 为准；如果使用其他实现，应切换到对应实现的文档。', '官方 React 指南与 Storybook 入口', 'https://www.carbondesignsystem.com/getting-started/developing/carbon-core/react'),
  ],
  fluent: [
    section('接入 Fluent UI React', '安装 @fluentui/react-components，将 FluentProvider 放在接近应用根节点的位置，然后在其子树中使用组件。这份说明对应当前展示使用的 React components 实现。', '官方 React components README', 'https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-components/README.md', "npm install @fluentui/react-components\nimport { FluentProvider, teamsLightTheme, Button } from '@fluentui/react-components';"),
    section('提供统一主题', '向 FluentProvider 的 theme 传入主题对象。官方入门示例采用 teamsLightTheme，并在 Provider 内使用 appearance="primary" 的 Button；主题作用于 Provider 的组件子树。', '官方 README：Provider 示例', 'https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-components/README.md'),
    section('查阅对应组件 API', '官方仓库将该包称为 converged components，并链接到 react.fluentui.dev 文档。组件属性与主题接口应查阅这套实现的文档，不混用旧包示例中的导入路径。', '官方 README：包说明与文档', 'https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-components/README.md'),
  ],
  spectrum: [
    section('接入 React Spectrum v3', '当前展示使用 @adobe/react-spectrum（v3）。安装后，在应用根部用 Provider 包裹组件，并传入 defaultTheme。构建工具需支持组件包的 CSS 导入，语言环境可通过 Provider 配置。', '官方 v3 Getting started', 'https://react-spectrum.adobe.com/v3/getting-started.html', "npm install @adobe/react-spectrum\nimport { Provider, defaultTheme, Button } from '@adobe/react-spectrum';"),
    section('配置颜色模式与尺寸', 'Provider 默认按系统设置切换颜色模式，并按输入设备调整组件尺寸。需要显式配置时，colorScheme 支持 light / dark，scale 支持 medium / large；自定义内容应使用 Spectrum 的颜色变量保持一致。', '官方 v3 Theming 文档', 'https://react-spectrum.adobe.com/v3/theming.html'),
    section('区分版本入口', '官方 v3 入门页提示 Spectrum 2 已推出。当前这套展示和接入说明仍对应 v3；若采用 Spectrum 2，应进入其独立文档确认安装包与 API，不直接混用 v3 示例。', '官方 v3 入门：Spectrum 2 入口', 'https://react-spectrum.adobe.com/v3/getting-started.html'),
  ],
};
