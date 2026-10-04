# 快速上手

[English](quick-start.md)

## 1. 安装到目标项目

准备可用的 Codex 或 Claude Code、Git、Node.js 18+ 和已存在的目标项目目录。0→1 项目先创建空目录；已有项目使用真实项目根目录。

将 `/你的项目路径` 替换为实际目录，保留引号：

```bash
git clone https://github.com/Tree080730/ai-design-workflow.git
cd ai-design-workflow
node scripts/install-host.mjs "/你的项目路径" --host codex
```

Claude Code 使用 `--host claude`，两者都使用则选 `--host both`。可加 `--dry-run` 预览安装变化。无需运行 `npm install`；`examples/react-vite` 的依赖仅用于运行该示例。

安装将 Skills 和简短指令入口写入目标项目，保留原有指令，不生成业务页面、设计 tokens 或完整 Gallery。详见[宿主接入说明](host-integration.md)。

## 2. 核验宿主加载

在宿主里打开**目标项目**，启动新会话，发送：

> 请定位当前可用的 designer-dev-workflow Skill，说明本项目开发页面会读取哪些设计约束。先不要修改文件。

确认 Agent 实际找到了 Skill 文件。需要时显式调用：Codex 使用 `$designer-dev-workflow`，Claude Code 使用 `/designer-dev-workflow`。仅文件安装成功不等于会话已经加载。

## 3. 选择需求并开始对话

README 提供四种可复制示例：[新项目](../README.zh-CN.md#新项目从-0-到-1)、[已有项目](../README.zh-CN.md#已有项目复用并扩展)、[参考网页提取](../README.zh-CN.md#参考网页提取设计系统)、[Gallery](../README.zh-CN.md#design-system-gallery展示与维护)。替换实际业务、参考 URL 和验收要求即可。

Agent 读取项目上下文、说明约束和复用判断并形成方案；你确认后进入实现。没有依据的产品规则标记待确认。已有项目保留现有技术栈、组件和 token 管线。

参考网页需要宿主浏览器能力与可访问页面；无法访问时使用截图、结构化设计数据或源码。单个页面不能证明未观察到的全部断点或组件状态。

Gallery 引用真实 tokens 和组件，复用已有 Storybook/文档站或创建开发入口。交付应包含启动命令和实际地址，详见 [Gallery 实施契约](../skills/design-system-builder/references/gallery.md)。

## 4. 查看结果并继续迭代

Agent 提供实现结果、启动/查看方式、实际验证结果和未验证项，并同步相关规范、Gallery 与索引。下一页沿用这些项目资产。新会话中先读取现有约束与实现。

用户无需每次手动初始化 CLI、转换 token 格式或创建 task 计划。CLI、[token 导出](token-integration.md)与[任务证据追踪](task-evidence.md)按项目需要采用。

## 5. 更新已有安装

在工作区干净的 Harness 仓库目录执行 `git pull --ff-only`，然后重新运行原来的安装命令：

```bash
node scripts/install-host.mjs "/你的项目路径" --host codex
```

在目标项目启动新会话并核验加载。更新针对复制的 Skills；产品 tokens、组件与已生成的 Gallery 不会自动被替换，需要通过宿主对话应用相关变化。

保留 `.design-workflow/host-installation.json`。本地修改过的受管理 Skill 文件会阻止更新，先比较并合并差异，避免直接覆盖；具体冲突处理见[宿主接入说明](host-integration.md)。

## 常见问题

| 情况 | 处理 |
|---|---|
| 目标目录不存在 | 创建空目录，或选择已有项目根目录 |
| 宿主找不到 Skill | 核验打开的是目标项目，启动新会话并显式调用主 Skill |
| 参考网页无法访问 | 提供截图、结构化数据或源码，保留未知项 |
| 安装后没有 Gallery | 在对话中请求建立；安装只复制能力，不自动生成展示站 |
| 更新遇到本地修改冲突 | 比较并合并相关内容，保留安装记录 |
