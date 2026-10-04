---
name: designer-dev-workflow
description: 面向设计与前端交付的通用协同流程。用于启动新项目、接手已有项目，或完成页面、组件、样式、交互和业务能力变更；负责项目识别、需求澄清、路径分诊、方案确认、实现、检查与交付沉淀。设计约束缺失时调用 design-system-builder；新增页面或组件且没有明确设计稿时调用 proposal-with-preview。
---

# Designer Dev Workflow

把每次代码交付组织成可检查的阶段。项目事实以源码和配置为准，Project Adapter 只做索引和缓存。

本 Skill 由宿主 Agent 执行，复用其模型、文件、命令、浏览器和会话能力。CLI 是可选辅助；token 导出与 task 记录是可选增强，不是使用本流程的前置条件。接入和工具边界见 [宿主接入说明](references/host-integration.md)。

## Phase 0：识别项目

首次进入项目时必须检查：

- 是否存在真实业务代码，而非只看规则文档是否齐全。
- 技术栈、包管理器、运行/构建/检查命令。
- 页面、组件、样式、token、测试和文档目录。
- 是否已有设计系统、项目规则和 Project Adapter。

判定：

- 没有真实业务骨架：0-1 模式。
- 已有真实业务代码：已有项目模式，即使规则或设计系统缺失。

使用宿主文件与搜索能力核验项目；CLI 已可用时可运行 `design-workflow scan <项目目录> --json` 获取结构化结果。也可从本 Skill 目录运行 `node scripts/scan-project.mjs <项目目录>`；没有 Node.js 时直接扫描源码和配置，不为扫描而要求安装运行环境。无 Adapter 时由 `design-workflow init` 生成 `.design-workflow/project-adapter.json`，或按 [Project Adapter 模板](references/project-adapter-template.md) 手工生成。已有 Adapter 时核验关键命令和目录。扫描读取 `.design-workflow/config.json` 中的设计系统目录配置；独立脚本与 CLI 使用相同扫描口径。`doctor` 的 `healthy` 仅表示没有诊断错误，`structureReady` 表示结构完整；`readiness` 提示已知约束缺口，不能替代源码接入、浏览器渲染或业务验证。发现差异先展示变化，再更新索引。

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
- 更新设计系统资产后，同步其 Gallery 展示条目、状态、源码/规范映射与索引；沿用已有 Storybook 或文档站。Gallery 持续保留，临时 proposal 预览按原流程清理。

## Phase 5：质量检查

检查运行/构建、核心交互、设计系统复用、视觉预览、代码规范、共享影响、文档完整性和未验证风险。CLI 已可用时可追加 `design-workflow check`；token 导出和显式资产清单只检查项目已采用的配置，不替换已有工具链。静态检查通过不能替代实际页面验证。使用 [质量检查模板](references/quality-check-template.md) 输出结果。

路由、异步恢复、跨页面状态、持久化或可逆操作发生变化时，属于高风险业务流程：必须验证完整闭环，而不是只检查成功首屏。至少覆盖成功、失败后的恢复结果、持久化后的刷新结果、撤销后的最终状态和适用的空/未找到边界。优先复用项目已有自动化测试；需要建立或扩展 E2E 时读取 [E2E 基准](references/e2e-baseline.md)。普通文案、静态样式或无状态局部调整不强制 E2E。没有可运行的 E2E 基础设施时明确记录未验证风险，不得把人工打开页面表述为端到端通过。

## 可选：任务状态与验证证据

只有用户要求可追踪的命令证据，或项目已明确采用 task 记录时，才使用下面的机制。普通工作使用宿主计划、会话和现有检查/交付记录即可；不要求另建任务系统。

需要此增强且 CLI 可用时，使用 `design-workflow task create <项目> --file <计划 JSON>` 将已接受的范围与验收项落盘。计划包含 `schemaVersion: 1`、`id`、`title`、`changeTypes`、`inputs` 与 `criteria`。`inputs` 应覆盖相关源码、tokens、共享消费页面、配置、测试定义和 spec；未登记的文件变化不会自动使证据过期。

用 `task run <项目> --task <id> --check <验收项 id>` 执行已声明的静态、构建或 E2E 命令，保存实际日志与退出状态。浏览器观察用 `task record ... --file <记录 JSON>`，包含 `criterionId`、`status`、`note`、附件路径和页面/状态/视口 context。人工记录不得冒充自动化通过。

采用 task 记录的项目恢复会话时先 `task list`，再 `task status` 读取阻塞项、历史和下一步。失败、未执行、缺失附件或过期证据不能算作必需项通过。采用 task 记录时，交付前运行 `task finish`；被阻止时继续处理或明确记录未完成，不伪造证据。中断锁只在原进程退出后通过 `task recover` 清理，随后重新执行中断检查。

这些命令负责执行记录，不替代规范内容、用户授权或验收判断。CLI 不可用时保留同等结构的检查与交付文档，明确未自动追踪的风险。

## Phase 6：交付沉淀

按 [交付文档模板](references/delivery-template.md) 输出变更摘要、文件清单、关键决策、交互链路、验证结果、设计系统同步情况、已知问题和后续建议。

## 子 Skill 编排

| Skill | 调用条件 | 不可用时 |
|---|---|---|
| `design-system-builder` | 设计约束缺失、混乱或需要系统化更新 | 使用最小 token 与组件规则 |
| `proposal-with-preview` | 无明确设计稿且存在多种合理方案 | 输出精简文本方案并等待选择 |
| `rules-governance` | 用户要求规则巡检，或高影响变更后的完整检查 | 按质量检查模板人工核对 |

子 Skill 是按需增强，不应成为主流程能否运行的硬依赖。
