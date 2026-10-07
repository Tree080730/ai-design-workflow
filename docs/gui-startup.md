# GUI 启动、绑定与恢复

本入口负责选择起点，不启动设计构建，不发送需求消息。宿主读取选择和用户需求后继续现有 Skill 阶段契约。这里没有另建 Agent 运行时。

## 手动启动与恢复

在 Harness 仓库运行（Node.js 18 或以上）：

```bash
npm run design:start -- --project "/目标项目" --host-thread SESSION_UUID --open host
```

启动器输出本地 URL；Agent 使用宿主浏览器工具打开它。`--host-thread` 可省略并继承 `CODEX_THREAD_ID`；没有有效绑定时只能手动切回宿主，不能猜测会话。UUID 格式不被支持时明确报错。

默认检查已有选择：如果目标项目已有有效 `.design-workflow/design-basis.json`，返回其路径并跳过 GUI。主动换方向时添加 `--reselect`。该参数只打开选择页面，不删除已有选择。

`--open system` 请求系统浏览器打开地址。成功发出请求不代表窗口已显示；失败时仍提供 URL。`--open host` 不调用系统浏览器，需要宿主 Agent 打开页面。

启动服务直接使用 Node 内置能力，不要求先构建组件预览。组件页面的可交互预览仍依赖原有 GUI 构建产物；缺失时不应将预览不可用误报为启动成功展示全部内容。

## 可选的 Codex SessionStart Hook

安装 Skills 和启动 Hook 是两个独立步骤。安装器只修改明确指定的目标项目，不更改全局 Codex 配置。

先查看将要写入的文件，再按所选打开方式安装：

```bash
npm run install:gui-hook -- "/目标项目" --open host --dry-run
npm run install:gui-hook -- "/目标项目" --open host
```

希望由 Hook 请求系统浏览器打开时，将 `host` 改为 `system`。安装器保留其他 Hook；此前安装的托管 Hook 被手工修改时，停止覆盖并要求显式合并。命令使用当前仓库和 Node 的绝对路径，移动仓库或更换 Node 安装后需要重新安装。

根据 [Codex 官方 Hooks 文档](https://learn.chatgpt.com/docs/hooks)，项目 Hook 需要受信任的项目，并由用户审阅、信任具体 Hook 定义。定义发生变化后可能需要再次审阅。安装器不授予信任，也不绕过宿主策略。

SessionStart Hook 处理 `startup`、`resume`、`clear`，忽略 `compact`。它从实际事件读取原会话 ID，并始终绑定安装时明确指定的目标项目；项目子目录可以启动，项目外的 cwd 被拒绝。

**这不是“选中项目目录就执行脚本”。** Hook 必须已启用、受信任，并且宿主触发受支持的本地会话事件。`host` 模式在 Hook 上下文中给出 URL 和打开要求，由 Agent 下一回合调用浏览器工具；Hook 自身没有直接打开 Codex 内置浏览器的接口。当前实现不承诺云端 Work 或其他宿主支持这套启动入口。

## 会话隔离与返回

同一目标项目与原会话共享一个经过身份验证的本地服务，不同会话分开启动。服务使用动态回环端口，避免固定端口占用或误连到其他项目。私有实例记录、日志和锁位于 `.design-workflow/gui-sessions/`；记录同时核验项目、会话与随机标识，不能仅凭 PID 判断服务归属。

服务无请求 45 分钟后退出。下次启动会检测失效记录并重新建立服务；超时提供日志路径和重试说明，保留已有选择。启动器不杀死记录中声称归属的进程。

保存成功后 GUI 尝试 `codex://threads/SESSION_UUID` 导航；页面若仍显示，则提供再次返回与手动切回路径。浏览器接受导航调用不代表已到达原会话。保存、返回、宿主实际读取、开始构建分别报告，返回不预填或提交消息。

## 启动诊断

原生 Hook 调用脚本后，会在目标项目 `.design-workflow/gui-hook-events.jsonl` 记录 started、invoked 及 completed/ignored/failed 状态。日志只用于定位脚本是否被调用及事件是否匹配，不是原生触发通过的独立证明；手动执行同样会留下记录，必须结合会话事件与时间核验。配置已加载、已信任也不代表生命周期事件已经执行。重复发送普通消息不会重放 SessionStart。

## 验证范围

`test/gui-startup.test.mjs` 使用真实临时项目与本地 HTTP 服务验证并发复用、不同会话隔离、失效恢复、选择保留、嵌套目录绑定、Hook 合并及浏览器打开失败说明。全部程序回归检查仍执行 `npm test`。

原生 Codex Hook 审阅/触发、浏览器展示和返回原会话需要真实宿主验收；隔离测试不替代这些步骤，也不证明来源分析与最终页面构建完成。
