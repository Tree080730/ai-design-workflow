---
name: designer-dev-workflow
description: 面向设计与前端交付的通用协同流程。用于启动新项目、接手已有项目，或完成页面、组件、样式、交互和业务能力变更；负责项目识别、需求澄清、路径分诊、方案确认、实现、检查与交付沉淀。设计约束缺失时调用 design-system-builder；新增页面或组件且没有明确设计稿时调用 proposal-with-preview。
---

# Designer Dev Workflow

把每次代码交付组织成可检查的阶段。项目事实以源码和配置为准，Project Adapter 只做索引和缓存。

## Phase 0：识别项目

首次进入项目时必须检查：

- 是否存在真实业务代码，而非只看规则文档是否齐全。
- 技术栈、包管理器、运行/构建/检查命令。
- 页面、组件、样式、token、测试和文档目录。
- 是否已有设计系统、项目规则和 Project Adapter。

判定：

- 没有真实业务骨架：0-1 模式。
- 已有真实业务代码：已有项目模式，即使规则或设计系统缺失。

优先运行 `design-workflow scan <项目目录> --json` 获取客观扫描结果；CLI 不可用时运行 `node scripts/scan-project.mjs <项目目录>`。无 Adapter 时由 `design-workflow init` 生成 `.design-workflow/project-adapter.json`，或按 [Project Adapter 模板](references/project-adapter-template.md) 手工生成。已有 Adapter 时核验关键命令和目录。发现差异先展示变化，再更新索引。

0-1 模式先确认目标平台和技术方案，再建立：项目骨架、最小设计系统、项目规则、开发流程和 Adapter。优先通过 `design-workflow init` 创建缺失资产；CLI 不可用时读取 [最小设计系统](references/minimal-design-system.md)、[RULES 模板](references/rules-template.md) 与 [DEV-WORKFLOW 模板](references/dev-workflow-template.md)。设计系统需要完整定义时调用 `design-system-builder`。

React + Vite 项目可读取 [Adapter 示例](references/react-vite-adapter-example.md)，但必须用真实扫描结果替换示例值。

## Phase 1：理解需求

确认用户链路、页面结构、内容模块、输入输出、状态、候选组件、影响范围和验收标准。关键信息缺失时追问，不用臆测填补产品决策。

## Phase 2：路径分诊并写 Spec

选择一条主路径：

| 路径 | 类型 | 原则 |
|---|---|---|
| A | token / 设计变量 | 修改源 token，避免业务代码硬编码 |
| B | 已有组件变更 | 先读规范与实现，评估共享影响 |
| C | 新增通用组件 | 先证明无法复用，再新增并登记 |
| D | 新增页面 / 路由 | 建页面、接路由、补页面规范 |
| E | 新增业务流程 | 复用组件，补齐数据与状态链路 |
| F | 组合需求 | 拆成组件、页面、业务分步执行 |

可追加组件库、动效、工程、文档等专项标签。

任何会修改代码、样式、配置或文档的任务，先在 `.design-workflow/specs/` 中按 [技术方案模板](references/solution-spec-template.md) 生成 spec，至少说明：路径、复用判断、改动范围、风险和验收标准。得到用户明确确认后再实现。

## Phase 3：没有明确设计稿时选方案

当新增或重做页面/组件、视觉方向不明确且存在多种合理解法时，调用 `proposal-with-preview`。已有明确设计稿、参考页面，或只是小范围 token 修改时跳过。

## Phase 4：小步实现

- 改前读取相关实现、规则和上下游。
- 优先复用 token、组件和页面模式。
- 组件层保持通用，业务层承载场景逻辑。
- 每个小步完成后运行对应检查。
- 发现 spec 未覆盖的高影响变化时，追加到 spec 并暂停确认。
- 更新设计系统资产后，同步其预览与索引。

## Phase 5：质量检查

先运行 `design-workflow check`，再检查运行/构建、核心交互、设计系统复用、视觉预览、代码规范、共享影响、文档完整性和未验证风险。使用 [质量检查模板](references/quality-check-template.md) 输出结果。

## Phase 6：交付沉淀

按 [交付文档模板](references/delivery-template.md) 输出变更摘要、文件清单、关键决策、交互链路、验证结果、设计系统同步情况、已知问题和后续建议。

## 子 Skill 编排

| Skill | 调用条件 | 不可用时 |
|---|---|---|
| `design-system-builder` | 设计约束缺失、混乱或需要系统化更新 | 使用最小 token 与组件规则 |
| `proposal-with-preview` | 无明确设计稿且存在多种合理方案 | 输出精简文本方案并等待选择 |
| `rules-governance` | 用户要求规则巡检，或高影响变更后的完整检查 | 按质量检查模板人工核对 |

子 Skill 是按需增强，不应成为主流程能否运行的硬依赖。
