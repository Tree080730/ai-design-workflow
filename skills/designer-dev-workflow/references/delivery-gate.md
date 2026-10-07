# 默认交付契约与检查

用于 0→1 设计系统与业务页面建设。Agent 从已确认 Spec 生成契约、执行检查并修正失败项，用户无需手工编写 JSON。已有项目的局部改动可继续使用原有验收机制，不自动重建项目。检查器需要 Node.js 18+，随本 Skill 安装，无 npm 依赖。

## 契约

在目标项目创建 `.design-workflow/delivery.json`，参照 [JSON 起点](delivery-contract-template.json)，替换实际路径、入口、地址、验收命令及风险类型。不得原样套用示例业务与命令。

- `schemaVersion: 1`，`scope: full` 表示设计系统、Gallery 和业务页面；`design-system` 表示仅前两阶段，仍需 Gallery。
- `confirmation.status` 初始 `pending`。用户已在对话中确认当前范围后，关联实际 Spec/确认记录文件，再设为 `confirmed`。程序检查记录存在且非空，不能认证是谁批准；不要替用户确认。
- `rules` 指向确认的规则文件；`inputs` 列出 Spec、测试定义、项目配置及源目录外的相关资产。`sourceRoots` 列出源码、token 源与相关规范目录。检查器自动追踪这些目录的文件清单、内容、静态可达文件及顶层依赖/构建配置；变更后需重验。遗漏的外部文件、环境变量与远程数据仍不在追踪范围内。
- `artifacts` 登记真实 `styles`、必要 `component`、`gallery`、`page` 的 `source` 与运行 `entry`；Gallery/page 必须有真实 `url`。样式/token JSON 必须配套实际运行样式，不能作为唯一运行产物。入口可为 HTML 或 JS/TS/Vue/Svelte 文件，不接受 dist、文档、截图和符号链接。
- `integration` 默认 `static`：检查相对静态引用、字面量动态 import/require 和 HTML script/link；无法解析或不连通就阻塞。别名、框架约定入口或隐式样式注入需明确用 `runtime`，保留静态未证明警告，提供真实浏览器接入证据。不要仅为消除错误切换模式。
- `changeTypes` 使用实际变化类型，特别登记 routing、async、cross-page、persistence、reversible；沿用风险验证最小要求。`criteria` 必需包含 static、build、documentation（规则与源码对照）、全部 Gallery/page 在 desktop/narrow 的 visual，以及真实入口与 success 状态的 interaction/e2e。必需项不能豁免；业务的其他状态按 Spec 追加。

目录中的依赖、构建输出、Git/宿主文件和 task 状态被排除。手工证据放在源码输入目录之外，如 `deliverables/evidence/`，避免把验证记录当作源码修改使证据立即失效。新源码、范围或验收改变会开启新的验证轮次；已有文件内容变化会使当前轮次证据过期，旧日志保留。

## 执行与修正

下面命令从本 Skill 目录运行；参数是目标项目绝对路径。若在目标项目根目录运行，使用已安装的 `.agents/skills/designer-dev-workflow/scripts/verify-project.mjs`（Claude 换 `.claude`）。

```bash
node scripts/verify-project.mjs prepare "/目标项目"
node scripts/verify-project.mjs run "/目标项目" --check static
node scripts/verify-project.mjs run "/目标项目" --check build
node scripts/verify-project.mjs record "/目标项目" --file "/目标项目/deliverables/evidence/visual.json"
node scripts/verify-project.mjs status "/目标项目"
```

`prepare` 只创建当前验收轮次，不表示完成；`run` 实际执行契约中的 argv 命令并保存日志与退出状态。单项 run/record 成功退出 0，但剩余必需项仍可阻塞整体交付。`status` 只读，未通过退出 2，全部通过退出 0。命令证据不能用手工 record 冒充。

visual/interaction/documentation 手工记录例子：

```json
{
  "criterionId": "visual",
  "status": "passed",
  "note": "实际打开两个入口，检查桌面和窄屏的栅格、溢出与组件状态；观察详情见附件。",
  "artifacts": ["deliverables/evidence/layout-review.md"],
  "context": {"pages": ["/gallery", "/"], "viewports": ["desktop", "narrow"]}
}
```

必须先真实检查，再填写对应记录；可以附截图、观察笔记或测试结果。引擎核验附件哈希与声明覆盖，不能判断文字是否诚实或截图是否代表全部页面。环境无法执行时 record `unverified` 并说明，必需项继续阻塞，不宣称完成。

读取 JSON 的 `stages`、`blockers`、`warnings` 和 `canFinish`。缺源码/空实现/入口不通时修正代码；not-run 补检查；failed 修复后重跑；stale 以最终源码重新验证。不要把失败项变成 optional、删除范围或虚构证据。只有 `canFinish: true` 表示**当前已登记验收通过**，交付仍需说明范围与运行时警告。

CLI 可用时等价使用 `design-workflow delivery prepare|run|record|status <项目>`，`status --json` 输出同一判定。底层复用 task 引擎；中断后先核验原进程已退出，再运行 `node scripts/verify-project.mjs recover <项目>` 清理当前轮次锁，随后重新执行中断检查。恢复不会把未完成检查标为通过；CLI 的 task recover 也可处理返回 `taskId`，见 [证据说明](task-evidence.md)。

## 精简工具输出

上述命令可加 `--summary`，CLI 等价使用 `delivery ... --summary`。所有检查与退出状态不变，保留阻塞、警告、每项覆盖和附件路径；完整历史与哈希留在 task 状态文件。排查时去掉该参数读取全文。按阶段读取和浏览器批量验收见 [高效执行规则](efficient-execution.md)。不跨调用缓存通过结果。

## 程序约束落点

在目标项目的 CI 验收步骤运行：

```bash
node .agents/skills/designer-dev-workflow/scripts/verify-project.mjs status .
```

把命令加到 CI/构建验收才会使失败阻止流水线通过；Skill 和项目指令仅负责默认引导，不能强制任意宿主调用程序。不要将 gate 挂到契约本身的 build/static 命令中，避免验收递归。task 日志默认在 Git 忽略目录，CI 需要在当前工作区重新执行自动检查，并取得来自同一源码版本的浏览器/设计证据（例如受管理 CI artifact）；没有证据时正确地失败，不通过提交可伪造的“成功标记”绕过。

本版本不是安全沙箱：拥有项目写权限的人或 Agent 仍可修改契约、程序与证据。团队可用 CI、分支保护和人工审查约束这些修改。静态引用扫描与明显空/占位实现检查不能证明全部源码完成或全部设计规则合规；语义设计判断通过确认规则、实际预览及规则对照验收完成。不要把 `verified` 扩张为任何模型、环境和规模都不会出错。

## 上游阶段检查
新项目契约必须启用 `workflow: true`。存在GUI选择文件时，即使旧契约没有该字段，也自动检查输入回执、逐项分析、合并确认、DS实际检查。详细结构见 [参考分析与阶段契约](reference-analysis.md)。执行构建/检查命令前核对实施阶段，最终status再次核对全部阶段；缺失或过期记录阻塞。阶段检查器不拦截宿主直接文件写入，必须由Skill调用，并在CI通过最终status阻止不完整交付。没有证据就停在阻塞状态，不补虚构成功标记。
