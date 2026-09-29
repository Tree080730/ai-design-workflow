---
name: design-system-builder
description: 用于从产品上下文、现有界面、截图、结构化设计数据或品牌信息中建立和维护可执行的设计系统。当项目缺少统一视觉约束、多页面表现不一致、需要沉淀 tokens/组件/页面规则，或需要为 AI 生成提供稳定约束时使用。
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
- 响应式断点与页面容器规则。

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

每个页面至少记录：结构层级、区块、组件映射、间距、状态、交互、跨页面契约和异常场景。

第三方组件必须记录复用范围、覆盖理由和 token 映射，避免不透明的局部改写。

## 5. 验证

- token 是否被真实代码引用，而非只存在于文档。
- 组件状态是否覆盖默认、加载、空、错误和禁用等关键场景。
- 页面是否只使用已定义 token 或有明确例外。
- 文档、源码和预览是否一致。
- 链接、索引和命名是否可检索。

## 6. 持续更新

设计系统不是一次性文档。token、共享组件或页面模式变化时，同步源码、规范、索引和预览；破坏性变更需记录迁移影响。项目事实变化后，同时触发 Project Adapter 的轻量核验。

## 输出节奏

1. 核心 tokens。
2. 布局与交互规则。
3. 高频组件。
4. 页面模式。
5. 索引、预览和一致性检查。

每阶段都应可独立使用；缺失内容标记为待确认，不为追求“完整”而虚构。
