# AI Design Workflow

[English](README.md)

一套运行在成熟 coding Agent 中的 **Design Harness**。通过 Skills 帮助 Agent 建立或读取设计约束、复用组件、实现规范页面，并验证适用的视觉和业务状态。

宿主负责模型、对话、工具、权限和会话，本项目负责设计开发底座。当前不建设独立 Agent 框架或 GUI。

## 安装后直接对话开发

从本仓库安装到已有项目目录，需要 Node.js 18+：

```bash
node scripts/install-host.mjs /你的项目路径 --host codex
# 或：
node scripts/install-host.mjs /你的项目路径 --host claude
```

两种宿主都使用时可选 `--host both`；`--dry-run` 预览变化。安装会保留现有项目指令，遇到冲突或本地修改的受管理内容时停止。

在宿主中打开项目，启动新会话，先让它定位可用的 `designer-dev-workflow` Skill，然后正常描述页面需求。加载自检、升级行为与适用边界见 [宿主接入说明](docs/host-integration.md)。

安装只复制 Skills 并增加简短入口，不初始化产品 tokens，也不要求已有项目迁移工具链。

## 核心能力

| Skill | 职责 |
|---|---|
| `designer-dev-workflow` | 项目理解、需求分诊、方案、实现、验证与交付 |
| `design-system-builder` | 设计约束、tokens、布局、状态和可复用资产 |
| `proposal-with-preview` | 通过渐进预览确认有分歧的页面或组件实现方案 |
| `rules-governance` | 按需巡检一致性与规则漂移 |

0→1 建立必要的最小约束与资产；已有项目沿用真实源码和现有规范。随着页面、共享组件与业务流程迭代持续维护这些资产。创意生成不属于核心职责。

高风险流程验证适用的成功、恢复、刷新、撤销和边界状态，优先使用项目已有测试和宿主浏览器能力。普通静态样式修改不默认要求 E2E。

## 可选工程工具

CLI 用于减少重复的确定性操作，不是使用 Skills 的前置条件。

| 命令 | 用途 |
|---|---|
| `scan` | 只读扫描项目事实与目录 |
| `init` | 创建缺失模板并刷新 Adapter |
| `check` | 静态一致性候选问题与已配置映射检查 |
| `doctor` | 结构诊断与已知约束缺口 |
| `tokens` | 按需从 JSON 导出 CSS |
| `task` | 按需记录验证证据和恢复任务 |

源码运行示例：

```bash
node packages/cli/bin/design-workflow.mjs scan /你的项目路径 --json
```

初始化默认保留已有受管理模板，只有显式 `--force` 才允许替换。Adapter 是索引和缓存，源码与可执行配置是事实来源。静态检查或结构健康不代表页面质量已经通过验证。

- [配置与诊断](docs/configuration.md)
- [Token 接入与资产映射](docs/token-integration.md)
- [可选任务证据追踪](docs/task-evidence.md)

## 当前状态与开发

已发布基线为 v0.1.2，当前未发布的宿主接入和工具增强见 [CHANGELOG](CHANGELOG.md)。安装测试验证文件与独立资源可用性，尚未验证真实宿主模型会话或所有环境下的遵循效果。

```bash
npm run validate
```

进一步阅读：[快速上手](docs/quick-start.md)、[架构](docs/architecture.md)、[贡献指南](CONTRIBUTING.md)。

## License

[MIT](LICENSE)
