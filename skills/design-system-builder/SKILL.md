---
name: design-system-builder
description: 用于从产品上下文、现有界面、截图、结构化设计数据或品牌信息中建立和维护可执行的设计系统。当项目缺少统一视觉约束、多页面表现不一致、需要沉淀 tokens/组件/页面规则，需要搭建或维护 Design System Gallery，或需要为 AI 生成提供稳定约束时使用。
---

# Design System Builder

把视觉判断转化为人和 Agent 都能读取、实现和检查的约束。没有证据的值必须标记为待确认，不将推测写成既定事实。

## 1. 收集与排序证据

按可信度使用输入：

1. 已确认的设计稿或结构化设计数据。
2. 当前生产代码与可运行页面。
3. 已有 token、组件规范和品牌规则。
4. PRD、截图、参考页面和用户口述。

冲突时记录来源和取舍，不静默覆盖。

## 2. 提取基础约束

优先建立：

- 颜色：primitive 与 semantic 分层。
- 字体：字号、字重、行高和用途。
- 间距：基础步长与语义间距。
- 圆角、阴影、层级和动效。
- 响应式断点、页面容器与布局几何规则。

布局规则至少说明：顶层栅格、容器与边距、区块间距、跨列对齐锚点、需要等高的模块、文字或控件基线，以及各断点如何重排。若两个区域需要横向对齐，必须共享同一父级网格轨道或记录等价实现；相同间距不能替代共享对齐关系。无法从证据判断的关系标记为待确认。

先完成核心 tokens 并确认，再继续组件和页面，避免后续规则建立在不稳定基础上。

需要确定产品调性和取舍准则时读取 [设计原则模板](references/design-principles.md)；需要机器可读 token 时从 [Token 模板](references/design-tokens-template.json) 开始。

## 3. 建立结构

```text
design-system/
├── README.md
├── tokens/
│   ├── colors.json
│   ├── typography.json
│   ├── spacing.json
│   └── ...
├── layout.md
├── interaction.md
├── components/
│   ├── README.md
│   └── component-name.md
└── pages/
    ├── README.md
    └── page-name.md
```

`README.md` 只做入口和索引；细节按需分散到 tokens、组件和页面文件，支持渐进读取。完整文件职责见 [输出结构](references/output-structure.md)。

## 4. 组件与页面规范

每个组件至少记录：用途、结构、变体、状态、属性、交互、可访问性、token 引用和使用边界。创建具体文档时读取 [组件规范模板](references/component-template.md)。

每个页面至少记录：结构层级、区块、组件映射、栅格与对齐关系、间距、状态、交互、响应式重排、跨页面契约和异常场景。

第三方组件必须记录复用范围、覆盖理由和 token 映射，避免不透明的局部改写。

## 可执行来源与映射

新项目可以在 `.design-workflow/config.json` 配置 `tokens.mode=managed`、`sourceDirectory`、`outputFile` 和 `entryFiles`，使用 `design-workflow tokens` 从 JSON 导出 CSS。导出后将 CSS 接入真实入口；先确认输出文件的所有权，不用 `--force` 覆盖未知样式。已有工具链可用 `tokens.mode=external`、`definitionFiles` 和 `entryFiles` 映射 CSS 定义，无需迁移源格式。未配置或静态检查通过均不代表浏览器中的样式已经验证。

组件和页面可通过配置 `assetManifest` 指向项目相对路径的 JSON 清单，记录 `schemaVersion: 1` 与 `assets`；每项包含 `type`、`name`、`source`、`document`。显式映射用于同名资产、非标准目录和失效路径检查，不能替代语义复用判断。

## 5. 建立 Design System Gallery

Gallery 是设计系统的持续展示与验证入口，建立或系统化更新设计系统时应交付可运行的 Gallery，不只交付 Markdown。先检查已有 Storybook、组件文档站或展示路由，优先扩展现有入口；没有时沿用项目框架建立独立开发入口或路由，不新增独立 Agent GUI，不自动暴露到生产导航。

按 [Gallery 实施契约](references/gallery.md) 建立基础规则、组件变体/状态、页面模式与源码/规范映射。展示直接引用真实 token 来源和组件，禁止维护一套外观相似的副本；未知状态标记待补齐。React 项目可改造 [Gallery 模板](assets/DesignSystemGallery.tsx) 与 [样式模板](assets/gallery.css)，其他技术栈实现同等契约，不强制迁移或引入 Storybook。

先交付与当前资产匹配的最小 Gallery，再随资产扩展。实验或一次性项目保持 candidate 状态与最小入口，不为形式上的完整编造组件。Gallery 持续保留，不能随临时 proposal 预览一起清理。记录启动命令、入口、资产映射及生产构建策略；只有无法运行时才交付明确标注未验证的降级结果。

## 6. 验证

- token 是否被真实代码引用，而非只存在于文档。
- 组件状态是否覆盖默认、加载、空、错误和禁用等关键场景。
- 页面是否只使用已定义 token 或有明确例外。
- 在代表性桌面与窄屏宽度下，容器边缘、网格轨道、区块边缘、关键基线和等高关系是否符合 `layout.md`；独立内容高度是否造成意外错位或溢出。
- 文档、源码和预览是否一致。
- 链接、索引和命名是否可检索。
- Gallery 引用真实资产，代表性桌面/窄屏可用，状态与键盘交互可操作，无真实业务副作用；结果记录为通过、失败或未验证。

## 7. 持续更新

设计系统不是一次性文档。token、共享组件或页面模式变化时，同步源码、规范、索引和预览；破坏性变更需记录迁移影响。项目事实变化后，同时触发 Project Adapter 的轻量核验。

生命周期必须匹配项目用途：实验、基准测试和预计删除的一次性项目可以把 token、组件和页面保持为 `candidate`，只维护当前验证所需的可执行来源与最小索引。只有用户要求长期维护、规则已有稳定证据或准备跨项目复用时，才建议补齐稳定版文档并晋级状态。不得为了形式上的“完整”生成用户明确不会保留的稳定资产。

## 输出节奏

1. 核心 tokens。
2. 布局与交互规则。
3. 高频组件。
4. 页面模式。
5. 可运行 Gallery、索引和一致性检查。

每阶段都应可独立使用；缺失内容标记为待确认，不为追求“完整”而虚构。
