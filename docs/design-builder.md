# Design Builder GUI

本地目录式 GUI 用于选择设计系统基础，记录使用方式与风格参考。首页以 Logo 与名称展示所有系统，悬停或键盘聚焦时浅辅色从右向左展开，保持 Logo 原色与清晰对比；点击进入详情，确认后保存选择并返回原宿主会话。采用白底、宽留白布局。用户继续使用宿主 Agent 的模型和工具，无需自己的模型 API。

## 启动与使用

1. 准备目标项目目录；新项目先创建空目录，并按 README 安装宿主 Skills。
2. 在本仓库运行 `npm run gui -- --project "/目标项目路径"`，在宿主浏览器打开 `http://127.0.0.1:4173/`；可用 `--port 4174` 修改端口。
3. 首页浏览全部 Logo 和名称，可搜索或筛选；点击条目先看组件总览图与选择入口；再深入官方组件和主题指南。
4. 在详情点击返回对话按钮，保存选择并尝试打开绑定的原宿主会话。未绑定或浏览器未打开深链时，保存完成页保留返回入口与交接说明。可在“我的项目”调整组件基础/仅参考模式和可选风格网址。
5. 在原宿主会话直接输入需求。Skill 读取目标项目最新选择文件，再分析来源、建立设计系统与页面。GUI 不再收集业务 prompt，也不会自动发送消息。

在 Codex 执行环境启动时继承 `CODEX_THREAD_ID`；也可显式指定 `--host-thread SESSION_UUID`。独立终端没有此环境时不会猜测最近会话。只绑定当前任务的明确会话，不开启新会话。启动示例：

```sh
npm run gui -- --project "/目标项目路径" --host-thread "原宿主会话UUID"
```

返回链接只打开原会话，不预填或自动提交消息；浏览器/系统可能要求确认。服务器不启动独立 Agent。已保存选择不包含宿主会话 ID，避免把他人的会话绑定带入其他机器。


每次启动绑定一个目标项目；切换项目需用另一目标路径启动。浏览不会写入项目，保存后刷新会恢复选择。并行窗口修改冲突时不会覆盖更新，请刷新再编辑。已有无效配置或符号链接会被拒绝，原文件保留。

## 选择的含义

- **仅参考规范**：参考信息层级、布局、交互与视觉原则，继续使用项目已有技术栈，不自动安装库。
- **规范 + 组件基础**：将官方组件库作为候选实现基础，Agent 检查技术兼容性、具体版本和主题接口后再接入。不是所有预设都适用于 React 或所有业务场景。
- **自己的风格**：可与基础规范组合；将品牌、网页或截图交给 Agent，区分来源与推断，不让参考取代已有确认约束。

详情页对八套系统统一使用“系统介绍与选择 → 组件展示 → 选择前了解 → 官方资料 → 接入说明”的结构，顶部居中展示企业 Logo 与设计系统名称，下方为简介和继续按钮；全宽高清组件图底部渐隐，点击放大可查看完整原图，去掉重复区域标题与图片外框。技术栈与许可信息移入接入说明。静态组件名称卡片、交互样板入口和「官方视觉示例」折叠区域已删除。官方组件目录及主题指南位于选择说明的对应条目，候选依赖位于接入说明。已删除编撰的设计基础概括、原则标签及分类说明，概括文案的位置与写法待用户确认。组件源码保留用于生成总览图片，独立构建产物不入 Git，不会将这些依赖安装到目标项目。Apple 展示平台参考，并标明没有可安装的 Web 组件包。

Ant Design 直接使用官方仓库 README 引用的 3840 × 1892 组件展示原图，并保留来源链接；其他六套由本项目使用真实官方组件生成 3840 × 1892 拼贴画布，取消分类标题和分组边框，保留各库默认浅色外观。涵盖操作、输入、选择开关、导航、数据、状态进度与反馈。生成图下标明实际库版本，区别于官方发布图片。Material Web 使用官方 List，未提供的展示类型采用明确标注的补充组合；Apple 保留官方平台参考，不用 Web 仿制控件冒充原生实现。

总览 PNG 和版本/源码摘要保存在 `packages/gui/public/overviews/`，源码位于 `packages/gui/preview/`。修改展示源码或更新依赖后，先运行 `npm run build:preview -w @ai-design-workflow/gui`，用宿主浏览器打开 `/preview/<id>.html?overview=1&export=png`，点击「生成高清 PNG」并下载。导出器从 1920 × 946 的真实 DOM 以 2× 像素密度重新渲染，输出 3840 × 1892 无损 PNG；不会放大旧图，也不经过 JPEG 压缩。替换对应 PNG 并同步 `sources.json` 的真实尺寸、实际版本、导出方式和源码摘要。普通启动重新构建交互样板，不会自动覆盖总览图片。

补充官方视觉示例已删除，详情仅保留组件总览（Apple 为平台参考）。目标项目自己的 Gallery 应使用实际安装的组件、主题与源码。

## 预设与官方来源

核对日期：2026-10-04。许可描述针对所链接代码仓库，品牌、字体、图标和设计文件须另查各自条款。实现时解析并锁定实际版本，目录不自动跟随最新版安装。

| 系统 | 来源与许可 | 适用说明 |
|---|---|---|
| Ant Design | [官方规范](https://ant.design/) · [源码 MIT](https://github.com/ant-design/ant-design) | React 企业 Web；使用官方主题接口 |
| TDesign | [官方规范](https://tdesign.tencent.com/) · [源码 MIT](https://github.com/Tencent/tdesign) | 多框架；本目录列出 React 候选，按实际平台选择 |
| Material | [Material 3](https://m3.material.io/) · [Material Web Apache-2.0](https://github.com/material-components/material-web) | 官方 Web Components；仓库声明处于维护模式，选型前评估；React 的 MUI 属于另一套实现 |
| Apple HIG | [指南](https://developer.apple.com/design/human-interface-guidelines/) · [设计资源](https://developer.apple.com/design/resources/) | 仅参考项，不标为开源 Web 组件库，不安装 Apple 资源 |
| Cloudscape | [官方规范](https://cloudscape.design/) · [源码 Apache-2.0](https://github.com/cloudscape-design/components) | React 管理控制台 |
| Carbon | [官方规范](https://carbondesignsystem.com/) · [源码 Apache-2.0](https://github.com/carbon-design-system/carbon) | 数据密集型企业产品，目录列出 React 候选 |
| Fluent 2 | [官方规范](https://fluent2.microsoft.design/) · [源码 MIT](https://github.com/microsoft/fluentui) | React v9 候选；其他平台按官方文档选择 |
| Spectrum | [官方规范](https://spectrum.adobe.com/) · [React Spectrum Apache-2.0](https://github.com/adobe/react-spectrum) | React Spectrum 提供视觉组件；不要与无样式的 React Aria 混为一谈 |

## Logo 来源

标识保存在 `packages/gui/public/logos/`，来源记录见同目录 `sources.json`：八项均使用企业标识：Ant Group、Tencent、Google、Apple、Amazon、IBM、Microsoft 和 Adobe，设计系统名称仍用于区分参考对象。横向字标保留原始比例，Amazon 的官方浅色字标改用深色文字以适配浅底，保留橙色微笑标识。标识仅用于识别参考对象，不表示官方合作。商标权归各发布方。页面运行时不向第三方请求 Logo。

## 与宿主衔接

配置写到 `.design-workflow/design-basis.json`，包含 schema/catalog 版本、来源快照、模式、业务意图、参考 URL 和未开始实现状态。Workflow 与 Builder Skills 已加入读取规则。更新 Skill 后新会话可使用；当前目录 GUI 不随独立 Skill 安装包分发，需要运行本仓库。

当前通过共享项目文件保存选择，并用绑定的会话深链返回宿主；用户随后在宿主输入需求。未绑定时提供手动返回与可复制交接说明。GUI 未接入直接向 Codex/Claude 会话发送任务的桥接能力；本地网页能打开不意味着自动拥有宿主模型调用权限。后续桥接应复用宿主支持的工具/插件接口，并保持同一项目配置协议。

服务器仅监听本机回环地址。写入接口限制同源请求与目标配置路径，不执行任意命令、不读取项目源码到目录界面，也不连接模型服务。交付契约应将该配置纳入输入追踪；选择变更后重新确认设计依据并验证受影响资产。

六套跨品牌图使用 `reference-layout.jsx` 的 27 个固定区域，沿用 Ant Design 原图的区域与内容顺序，不再展示自制项目表单。优先使用各自安装库中的真实组件；库没有的展示类型由 `reference-fallbacks.jsx` 补充，使用本品牌配色，属于本项目展示组合，不是官方原生组件。引导面板使用原生容器、按钮和列表组成。Fluent 日历使用微软 `@fluentui/react-calendar-compat`。图片说明明确区分官方原图与本项目生成图，补充展示不会安装到用户项目。Apple 继续使用平台参考。

来源清单记录依赖版本、原图链接、每份展示源码的 SHA-256、生成 PNG 的真实尺寸与摘要。生成图必须使用无损 PNG 导出器，并保留至少 3840 × 1892 的像素尺寸。导出会保留 SVG 绘制属性和 Shadow DOM 内部组件样式，须检查进度环、选中状态与图标等细节。浏览器截图若返回 JPEG，转码不能恢复已经丢失的清晰度，不能作为高清图源。启动 GUI 不会自动重新导出图片。

## 接入与使用说明的来源

八套系统的说明分别依据官方仓库 README、入门指南、主题文档和平台资源页整理，按接入、配置和实现边界分节，每节提供直接来源链接，标注核对日期与“非官方原文”。数据维护于 `packages/gui/src/usage-guides.mjs`；更新依赖或官方文档后，重新核对对应说明及日期。Apple 保持平台规范参考，Material Web 标明维护模式，Spectrum 当前展示的 v3 与 Spectrum 2 分开说明。本工具的选择行为单独标注，不表述为官方能力。选择说明的来源链接与资料卡片描述使用 muted 色、13px 字号。

详情标题下的一句定位说明依据各品牌官方介绍整理，并附直接来源链接。只描述官方明确的产品定位或平台范围，不增加推断性的行业/项目推荐，也不将定位作为使用限制。

## 非技术用户的选择信息

首页仅展示 Logo、名称与品牌；官方定位、限制和来源入口集中在详情页，不要求用户选择开发框架。详情以组件图展示视觉语言，在「选择前了解」中仅说明能力、外观调整范围，以及 Apple、Material Web、Spectrum 等存在的必要限制，每项提供官方依据。网页接入与维护记录移入折叠说明；首页不展示介绍和限制。技术命令、Provider 和 API 保留在「接入与使用说明」。兼容性目前由宿主 Agent 在实施前核对，GUI 并未自动检测所有技术栈。选择信息随新的设计基础记录保存，供 Agent 读取；旧选择记录保持兼容，不会因浏览页面自动重写。

说明数据位于 `packages/gui/src/selection-guides.json`。维护信息是核对日的快照，官方仓库发布记录不等同于所选组件包最新版本或未来维护承诺；Fluent 和 Spectrum 等多包仓库尤其需要在实施时核对具体包。展示图含补充组合的系统明确区分图片效果与原生组件能力，示例控件列表不作为完整功能清单。更新数据时同时核对官方入口、组件目录、主题边界和维护说明，不按品牌编造适用行业。

## 不采用预设的入口
首页“不使用预设，继续”保存 mode=custom、preset=null，进入同一个需求页。刷新可恢复，调整面板可补充风格参考；重新选择品牌保留已保存的需求与风格。与尚未选择区分，旧 schemaVersion=1 记录仍可读取。宿主按原工作流构建，不自动清理或迁移已有源码。GUI 仍通过共享文件与“复制到宿主”交接；自动派发未接入。

## 品牌官网参考

设计参考目录目前提供 Apple、Linear、Notion、多邻国、Adidas、LVMH、Nike、Airbnb 的官方网站。官网入口、核对日期和编辑观察方向一起保存到设计基础的 `preset.reference`；继续使用 `mode: reference`，不安装品牌 SDK。图片为官网实际页面截图，每个品牌三张，缩小后横向排列并自动向左循环；悬停、键盘焦点和暂停按钮可停止，减少动态偏好下可手动浏览。截图保存在 `packages/gui/public/references/`，截图来源、尺寸、日期及 SHA-256 记录于同目录 `page-captures.json`；图片不可用时保留官网入口。旧 Apple HIG 不再出现在发现列表，既有记录仍可读取并继续使用。

## 选择后的真实交接状态
GUI仅保存输入并尝试打开绑定会话；状态“等待宿主读取”直到宿主实际执行安装Skill的 `scripts/workflow.mjs read PROJECT --prompt-file .design-workflow/specs/request.md`。API的 handoff 区分 waiting/read/stale/blocked；读取回执不是自动激活、网页分析或任务执行成功。返回页重新打开/刷新获取最新状态，不以导航尝试显示构建成功。新任务遵循 [参考分析与阶段检查](../skills/designer-dev-workflow/references/reference-analysis.md)，证据不足暂停并向用户确认，分析与适配约束合并确认一次。
