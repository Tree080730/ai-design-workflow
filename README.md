# AI Design Workflow Skills

一套与公司、业务和具体工具无关的 AI 协同设计开发方法。它把稳定交付拆成三个职责明确、按需协作的 Skill：

1. `designer-dev-workflow`：控制从项目识别到交付沉淀的主流程。
2. `design-system-builder`：把视觉决策沉淀为可复用、可检查的设计约束。
3. `proposal-with-preview`：在没有明确设计稿时，以渐进方式生成、预览并选择方案。

## 核心链路

```text
用户需求
  ↓
Designer Dev Workflow
  ├─ 项目识别：0-1 / 已有项目
  ├─ Project Adapter：把项目差异翻译为统一上下文
  ├─ Design System Builder：缺少或需要更新设计约束时调用
  ├─ Proposal With Preview：无明确设计稿且存在多种方案时调用
  ├─ 小步实现与验证
  └─ 质量检查与交付沉淀
```

三个 Skill 不应合并：主流程负责“何时做什么”，设计系统负责“依据什么设计”，多方案预览负责“信息不足时如何决策”。它们可以独立演进，也可以由主流程按条件调用。

## 目录

```text
skills/
├── designer-dev-workflow/
│   ├── SKILL.md
│   └── references/
├── design-system-builder/
│   └── SKILL.md
└── proposal-with-preview/
    └── SKILL.md
docs/
├── architecture.md
└── sanitization-report.md
```

## 使用方式

- 新项目：先由主流程识别项目状态，再建立最小设计系统和项目规则。
- 已有项目：先生成或校验 Project Adapter，再按实际需求进入修改链路。
- 新页面且没有设计稿：主流程调用多方案预览 Skill。
- 已有明确设计稿：跳过多方案探索，直接按设计系统和项目规则实现。
- 仅修改既有样式或 token：直接进入对应路径，不必调用多方案预览。

具体阶段、触发条件和产物见 [架构说明](docs/architecture.md)。

## 公开版边界

本仓库只保留通用方法、模板和决策逻辑，不包含任何原项目业务代码、公司名称、内部域名、人员信息、专有组件库、内部工具或真实业务案例。
