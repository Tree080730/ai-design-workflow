# GUI 启动入口验收记录

日期：2026-10-06。范围：首次/再次启动、目标项目和原会话绑定、实例恢复、Hook 安装合并与返回失败说明。不是参考分析或业务页面构建的验收。

## 程序验收

- `npm test`：101 项通过，0 失败。
- 增补真实 shell 调用和返回辅助模块路由后，`node --test test/gui-startup.test.mjs`：5 项通过，0 失败。
- `npm run smoke`：退出码 0；候选示例仍报告约束文档缺失与 starter tokens 需要复核，未被视为正式页面交付。
- `git diff --check` 和修改后 JavaScript 语法检查通过。

临时项目用真实本地 HTTP 服务验证并发启动复用、不同会话隔离、身份核验、保存选择、再次启动跳过、主动重选保留文件与服务退出后的重建。Hook 安装测试保留原配置，阻止覆盖修改过的托管定义，并在包含空格和单引号的路径中运行生成命令。系统浏览器打开测试使用替身，未实际调用系统浏览器。

## 宿主浏览器验证

启动独立临时项目，明确绑定当前 `CODEX_THREAD_ID`。Codex 内置浏览器成功打开新服务 URL，读取到目标项目名称、两类目录和不使用预设入口，并取得正常渲染截图。测试标签页关闭，核验身份后的测试服务已停止。

这次未保存新的用户选择、发送需求或启动设计构建；未点击会话深链。浏览器能展示本地 GUI，不证明 SessionStart Hook 自动触发或返回原会话成功。

## 当时待完成事项（后续结果见文末）

- 用户确定 Hook 的打开方式：系统浏览器请求打开，或 Agent 下一回合打开 Codex 内置浏览器。
- 在目标项目安装所选 Hook 后，由用户在 Codex 审阅、信任定义并触发真实会话事件。
- 真实保存选择并返回原会话的导航验收。

实现和启用条件见 [启动说明](gui-startup.md)。未更改全局 Codex 配置、未授予 Hook 信任、未更改旧工作流阶段门禁。

## 内置浏览器模式隔离项目准备

用户已选择 `host` 模式，先在隔离项目验收。项目位于 `../acceptance-runs/gui-startup-host-20261006`，建立独立 Git 边界并安装四个项目 Skill、项目 AGENTS 入口与 `.codex/hooks.json`。40 个安装资源摘要一致；生成命令通过忽略 `compact` 事件的 shell 调用检查。此检查没有启动服务，未产生选择或 GUI 实例记录。

尚未授予项目/Hook 信任，也未在新的 Codex 会话中观察 SessionStart 自动触发。验收项目 README 提供首回合与返回后的验收提示词，要求区分真实 Hook 输出和手动启动，避免误报。全局配置和正式项目入口未改变。

## 首次真实会话未触发的排查

用户截图显示会话未获得可见的 Hook 输出。目标项目与 Hook 均已有信任记录；该会话功能标记 hooks=true。使用本机 Codex 0.160.1 的只读 hooks/list 解析目标项目，得到 enabled=true、trustStatus=trusted、warnings=[]、errors=[]，定义摘要与当前信任记录一致。查询没有创建线程或执行启动 Hook，不能替代当前桌面进程的生命周期验收。

目标目录没有 GUI 实例记录；未找到直接执行错误，因此不能确定是桌面进程配置未刷新、生命周期未触发或其他原因。新增脚本调用诊断后，待用户完整重新打开 Codex 并创建新会话复验，不能将重复发送普通消息视为重新触发。

## 重启后真实入口验收

2026-10-06 21:30:43（Asia/Shanghai），隔离项目记录到真实 SessionStart（source=startup），started → invoked → completed 均成功。GUI 实例绑定项目 `gui-startup-host-20261006` 与会话 `01a11168-8ff9-7bc1-b0cf-8dab9114ec04`。用户确认 GUI 正常打开。

随后实际 design-basis.json 保存 Linear（linear-site）、mode=reference、官网 https://linear.app/，projectPath 与隔离项目一致，requirementSource=host，intent 为空。用户提供宿主读取回复截图，显示同一会话绑定，且未分析参考、未开始构建。

因此本次原生启动、GUI 展示、选择持久化及宿主读取已获验证；重启前未收到 Hook 的具体原因仍未被独立定位，不将恢复结果解释为已确定根因。用户随后明确确认点击继续后自动返回 Codex 原对话，导航结果以该人工确认记录为依据。来源分析、合并确认、设计系统/Gallery 与业务构建不在本次入口验收通过范围内。

## 当前结论

内置浏览器模式在本次隔离项目通过入口链路验收：受信任的新会话启动 → GUI 打开 → Linear 选择保存 → 自动返回原 Codex 对话 → 宿主读取实际选择。此结果限定本次环境与路径，不代表每次打开目录即自动运行，也不代表其他模式的真实构建验收。已有选择跳过、主动重选、实例恢复与多会话隔离的补充真实验收见下文。

## 第二步隔离项目收尾验收通过

2026-10-06 21:41（Asia/Shanghai），对同一隔离项目执行真实启动器和服务操作，绑定当前验收会话与此前用户验收会话两个实际 UUID。启动器检测已有选择并返回 openRequired=false；显式 --reselect 打开 GUI，保存的 Linear 选择内容摘要未变化。两个服务返回各自的原会话 ID，使用独立地址。仅终止本次验收拥有的服务后重新启动，新实例身份核验成功，另一个会话的服务仍可访问。恢复后的目录与 Linear 详情在 Codex 内置浏览器实际呈现。

这批检查没有模拟 SessionStart，也没有改变用户的选择。运行证据保存在隔离项目 `.design-workflow/tail-acceptance.json`，截图为 `reselect-recovery.png`。临时浏览器页和本次验收服务已关闭，用户原验收服务未终止。

2026-10-06 21:51:35（Asia/Shanghai），新会话 `01a1117b-a986-7163-ad1d-8b0263eb20f6` 的真实 SessionStart（source=startup）记录 started → invoked → completed。用户提供回复截图，确认收到 existing selection 输出，读取实际 Linear/reference 选择，状态 selected、实现 not-started；未打开 GUI、未开始构建、未修改文件。已有选择跳过的原生验收通过。

第二步的隔离项目验收现已通过。正式工作区 Hook 安装仅进行了 dry-run，无冲突；未写入或授予信任。正式启用与完整设计构建链路仍需分别验收，不能由本次结果推定通过。
