# 可选任务证据与恢复


只有用户要求可追踪的命令证据，或项目已明确采用 task 记录时，才使用下面的机制。普通工作使用宿主计划、会话和现有检查/交付记录即可；不要求另建任务系统。

需要此增强且 CLI 可用时，使用 `design-workflow task create <项目> --file <计划 JSON>` 将已接受的范围与验收项落盘。计划包含 `schemaVersion: 1`、`id`、`title`、`changeTypes`、`inputs` 与 `criteria`。`inputs` 应覆盖相关源码、tokens、共享消费页面、配置、测试定义和 spec；未登记的文件变化不会自动使证据过期。

用 `task run <项目> --task <id> --check <验收项 id>` 执行已声明的静态、构建或 E2E 命令，保存实际日志与退出状态。浏览器观察用 `task record ... --file <记录 JSON>`，包含 `criterionId`、`status`、`note`、附件路径和页面/状态/视口 context。人工记录不得冒充自动化通过。

采用 task 记录的项目恢复会话时先 `task list`，再 `task status` 读取阻塞项、历史和下一步。失败、未执行、缺失附件或过期证据不能算作必需项通过。采用 task 记录时，交付前运行 `task finish`；被阻止时继续处理或明确记录未完成，不伪造证据。中断锁只在原进程退出后通过 `task recover` 清理，随后重新执行中断检查。

这些命令负责执行记录，不替代规范内容、用户授权或验收判断。CLI 不可用时保留同等结构的检查与交付文档，明确未自动追踪的风险。
