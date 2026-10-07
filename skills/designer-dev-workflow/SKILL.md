---
name: designer-dev-workflow
description: 优先用于从 0 到 1 构建可执行设计系统、Gallery 和业务页面，组织设计依据与约束确认、源码实现、验证及交付。也支持已有项目的局部页面/组件变更；设计系统建设调用 design-system-builder，视觉方向有分歧时按需调用 proposal-with-preview。
---

# Designer Dev Workflow

主线：**确认设计依据与约束 → 真实设计系统源码与 Gallery → 复用资产构建业务页面 → 全部验收与交付**。宿主负责模型、工具、权限和会话；CLI 与 token 导出可选。完整建设不能在 Gallery 完成后提前结束。

## 不可省略的要求

- 先读取目标项目真实规则、资产、源码、入口和运行命令，沿用已有工具链与组件。源码必须可编辑、接入实际入口；文档、截图、JSON、dist 或临时预览不能替代源码和 Gallery。
- 每次设计任务读取最新 GUI 选择（如有）与本次需求，保存需求记录，执行 `scripts/workflow.mjs read PROJECT --prompt-file RELATIVE_PATH`。没有构建需求时不自动构建；新版选择分别读取 `component` 与 `references`；两步都跳过才是 custom，不继承旧选择。组合选择同时执行组件与参考分析；图片只证明可见静态特征。
- 按模式完成七项分析，区分实际观察、推断与项目适配。参考网站必须真实读取并取得桌面/窄屏及适用交互证据。来源不可访问或核心证据不足时暂停依赖步骤，请用户确认调整，不能用猜测或旧截图补成通过。
- 分析、适配约束、实现范围合并确认一次，绑定当前输入和分析。沿用已有明确授权；高影响变化、输入变化或证据不足重新确认，不能替用户确认。
- 新建完整项目的 `.design-workflow/delivery.json` 必须 `workflow: true`。存在 GUI 或阶段记录时不能用旧契约绕开检查。
- 实施前运行 `workflow.mjs status PROJECT --stage implementation`；业务页面实施前运行 `--stage page`，确认 DS 源码、Gallery 与六项真实检查有效。失败先修复，不跳过阶段。
- 最终运行 `scripts/verify-project.mjs status PROJECT`，并把同一门禁接入 CI。只有 `canFinish: true` 才能宣称已登记验收通过。源码、规则、输入、附件变化使证据过期，必须重验；必需项不得改可选、豁免或伪造。
- 最终验收覆盖 static、build、规则与源码对照、所有 Gallery/业务入口的桌面与窄屏布局、真实交互和适用业务状态；无执行能力如实标记未验证。模拟数据明确标记。
- 布局验收必须检查自适应宽度与同类控件间距：应共用边缘的工具栏/内容区域实际对齐，控件按剩余空间伸缩；同类相邻操作使用同一间距 token。按[质量检查](references/quality-check-template.md)测量桌面、窄屏和附属按钮显示/隐藏的实际几何；将适用检查登记为交付契约必需项，失败不得交付。固定宽度或不同间距只有明确设计依据且已确认时保留。

## 按阶段读取，不一次加载全部材料

| 当前工作 | 必须读取 / 按需调用 |
|---|---|
| GUI 输入与参考分析 | [设计基础](references/design-basis.md)、[分析与阶段契约](references/reference-analysis.md)；宿主接入问题再读 [宿主说明](references/host-integration.md) |
| 范围与约束确认 | [执行阶段说明](references/execution-stages.md) 中阶段一、[Spec 模板](references/solution-spec-template.md)、[交付门禁](references/delivery-gate.md) |
| 设计系统与 Gallery | 执行阶段说明中阶段二、[源码交付契约](references/source-delivery.md)；调用 `design-system-builder`，不可用则读 [最小实现](references/minimal-design-system.md) |
| 业务页面与交付 | 执行阶段说明中阶段三、[质量检查](references/quality-check-template.md)、[交付模板](references/delivery-template.md)；需要 E2E 时读 [基准](references/e2e-baseline.md) |
| 已有项目局部修改 | [补充路径](references/existing-project.md)，不自动重建设计系统 |
| 效率与重复检查 | [高效执行规则](references/efficient-execution.md)，仅优化读取和输出，不能减少流程与验收 |

每个阶段首次进入时读取对应完整说明；已读且未变的内容无需每回合重复输出。`proposal-with-preview` 仅用于视觉方向不明且有合理分歧；`rules-governance` 用于请求的巡检或需要完整审查的高影响变化。其余模板和证据恢复说明按当前需求读取。

阶段门禁是确定性检查，不能限制宿主文件权限，也不能保证模型自动调用 Skill；GUI 保存不等于任务已启动。真实自动唤起与回宿主需单独验收。
