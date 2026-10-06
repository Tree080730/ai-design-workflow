# GUI → 当前桌面宿主连接验证

验证日期：2026-10-06。结论：**当前机器未能通过公开 app-server 代理连接当前桌面宿主。自动发送与状态回传尚未实现。**

## 真实验证

- 本机 `codex-cli 0.159.0-alpha.12.1` 支持 `app-server proxy`、Unix socket 和 JSON-RPC。
- 当前执行环境提供 `CODEX_THREAD_ID`；该值只作目标标识，不代表连接已经成立。
- `codex app-server proxy` 实际退出 1：缺少 `/Users/hezheshu/.codex/app-server-control/app-server-control.sock`。
- `codex app-server daemon version` 返回相同的缺少 socket 错误。
- 本机可见 `.codex/ipc/ipc.sock`，但未找到已核实的公开协议允许通过它提交用户消息；没有向该端点发送猜测协议。
- 诊断脚本重试结果：`status: unavailable`，`canDispatch: false`。未进入 initialize / thread/read 成功阶段。

没有启动另一台 app-server、创建新任务、恢复当前活动会话、发送模型请求、读取认证文件或改宿主配置。没有把另一个执行引擎当成桌面当前会话。GUI selection 与保存/复制功能保持原样。

## 可重复诊断

从仓库执行（需本机 Codex CLI）：

```sh
node scripts/check-gui-host.mjs --project /path/to/host/project
```

默认读取当前执行环境的 `CODEX_THREAD_ID`。在独立终端可显式传入 `--thread ID`，仅在宿主正式提供控制端点时使用 `--socket PATH`。脚本只 initialize 和 thread/read，不触发执行；不会输出会话正文、认证数据或原始 stderr。连接和项目绑定成功时退出 0，其他情况退出 1。

即使返回 readable，也只证明读取能力，不证明自动发送、事件订阅、审批或桌面工具兼容性。GUI 必须保留不可发送状态，直到这些能力分别验收通过。

## 测试

`node --test test/gui-host.test.mjs test/gui.test.mjs`：15 项通过。诊断使用模拟传输验证只读请求范围、错误会话、缺少 ID、断开、超时与项目绑定差异；GUI 回归使用临时目录验证持久化与输入边界。模拟通过不算真实宿主端到端通过。

## 后续边界

首先确认桌面宿主支持的同会话连接接口；不能靠启动独立 daemon 解决当前桌面会话不暴露端点的问题。获取受支持端点后，先完成同会话读取和项目绑定，再验证单次消息投递、重复提交防护、忙碌/取消/失败恢复、执行事件回传、权限审批和所需工具一致性。验证前不改主按钮为“开始构建”。

如果当前桌面版本无法提供该接口，独立 app-server 是另一种产品路线，需要单独确认会话、认证、工具与运行环境，不能宣称无缝接续桌面宿主。

官方协议来源：[Codex App Server](https://learn.chatgpt.com/docs/app-server)。官方存在协议不等于本机桌面已启用其控制端点。

## 正式入口补充确认（2026-10-06）

查阅并打开官方 [Commands / Deep links](https://learn.chatgpt.com/docs/reference/commands)，确认：

| 入口 | 已确认的行为 | 不能据此宣称 |
| --- | --- | --- |
| `codex://threads/<thread-id>` | 打开已有本地会话 | 预填、自动发送、订阅回复 |
| `codex://new?prompt=…&path=…` | 在指定绝对工作目录打开新会话并预填输入框 | 自动发送或保留原会话历史 |
| app-server | 提供消息与事件协议 | 本机桌面当前已开放控制 socket |

本机 ChatGPT.app 的 Info.plist 实际注册 `codex` URL scheme。宿主专用导航工具对当前 thread ID 返回 `{navigated:true}`；这是宿主侧导航成功证据，不是从 GUI 浏览器点击深链后的完整验收。电脑使用工具不能查看该桌面 App，故未验证桌面截图与输入框状态；未用其他方式绕过限制。

CLI `codex queue --help` 显示支持既有会话消息排队，但尚未验证其对当前桌面会话的适用性。没有用真实消息试投递，也没有因检查而启动 daemon；不能将命令存在视为同会话发送成功。

官方 [MCP UI 文档](https://developers.openai.com/plugins/build/chatgpt-ui) 描述的是在兼容宿主内渲染的 iframe 和 MCP Apps bridge（含 ui/message）。现有 localhost GUI 是普通浏览器页面；没有证据表明它拥有这座 bridge，不能直接加 window.openai 调用就宣称已接入桌面宿主。

**推荐当前可实施的过渡链路**：保存输入 → 复制完整需求 → 打开明确绑定的已有会话 → 用户粘贴发送。GUI 需明确提示最后的人工发送步骤，按钮命名用“在宿主中继续”，不用“已开始构建”。复制失败时应保留手动复制入口，打开链接失败时保留会话链接；不能以导航尝试作为交付成功。

绑定必须使用明确的目标会话 ID，不能以最近会话代替，也不能让独立 GUI 服务器猜测当前激活会话。还需在交接需求中提供项目绝对路径：当前宿主工作目录为仓库父目录，而 GUI 目标为 ai-design-workflow 仓库，项目绑定尚未由 app-server 核实。既有 workflow 不因入口切换改变。

本轮只确认能力与更新证据，尚未改 GUI 主按钮、启用消息发送或创建新会话。
