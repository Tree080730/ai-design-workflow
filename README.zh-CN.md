# AI Design Workflow

[English](README.md)

一套面向 AI 协同设计开发的开源 Harness。它把确定性的工程操作交给 CLI，把需求理解、设计判断与方案取舍交给可安装的 Skills。

## 为什么需要它

Agent 可以临时理解一个仓库，但如果项目扫描、设计规则、方案预览、质量检查和交付完全依赖上下文记忆，多次交付后容易发生漂移。

本项目分为两层：

- **Harness**：项目扫描、初始化、检查、诊断、状态和模板。
- **Skills**：需求理解、路径分诊、设计系统、多方案决策和规则治理。

## 当前状态

`v0.1.0` 是可以运行的早期版本。CLI 已有自动测试并正式支持 React + Vite 识别；Skills 已通过结构校验，但不同 Agent 的安装体验和真实项目评测仍会继续完善。

## 快速开始

需要 Node.js 18 或更高版本。

```bash
npm install
node packages/cli/bin/design-workflow.mjs scan /你的项目路径
node packages/cli/bin/design-workflow.mjs init /你的项目路径
node packages/cli/bin/design-workflow.mjs check /你的项目路径
node packages/cli/bin/design-workflow.mjs doctor /你的项目路径
```

正式发布 npm 后，目标用法为：

```bash
npx ai-design-workflow scan
npx ai-design-workflow init
npx ai-design-workflow check
npx ai-design-workflow doctor
```

`init` 默认只创建缺失文件；只有显式使用 `--force` 才允许替换受管理的初始文件。`check --strict` 在发现问题时返回非零状态。

## 命令

| 命令 | 作用 | 是否写文件 |
|---|---|---|
| `scan` | 识别技术栈、项目模式、命令、目录和 Adapter | 否 |
| `init` | 创建工作流状态、规则和最小设计系统 | 是，只创建缺失文件 |
| `check` | 检查硬编码颜色和设计文档覆盖 | 否 |
| `doctor` | 检查运行环境和工作流完整性 | 否 |

所有命令都支持 `--json`。

## Skills

三个核心 Skill：

1. `designer-dev-workflow`：项目识别、方案 spec、实现、验证与交付编排。
2. `design-system-builder`：提取并维护可执行的设计约束。
3. `proposal-with-preview`：没有明确设计稿时进行渐进式多方案决策。

`rules-governance` 是可选检查 Skill，用于规则漂移、token 合规和设计文档覆盖检查。

请使用对应 Agent 支持的 Skill 安装方式安装 `skills/` 下需要的目录。仅克隆仓库不会自动注册 Skill。

## 初始化产物

```text
.design-workflow/
├── config.json
├── project-adapter.json
└── specs/
design-system/
├── README.md
├── tokens/
├── components/
├── pages/
├── layout.md
└── interaction.md
RULES.md
DEV-WORKFLOW.md
```

Project Adapter 只是索引和缓存，源码与可执行配置始终是事实来源。

## 安全边界

- CLI 不会上传项目内容。
- 不自动生成生产业务代码。
- 不把一次性偏好自动升级为长期规则。
- 没有 `--force` 时不覆盖已有受管理文件。
- 提案预览是静态脚手架，不得包含生产 API 或业务副作用。

## 开发验证

```bash
npm install
npm run validate
```

进一步阅读：[快速上手](docs/quick-start.md)、[架构说明](docs/architecture.md)、[贡献指南](CONTRIBUTING.md)。

## License

[MIT](LICENSE)