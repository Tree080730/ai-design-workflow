# 最小设计系统

仅用于 0-1 项目在完整设计系统尚未建立时启动。若已有品牌、设计稿或生产页面，应从真实输入提取约束，不长期使用示例值。

最小启动也必须包含可运行的 Design System Gallery；“最小”限制展示规模，不取消这个交付项。

## 最小目录

```text
design-system/
├── README.md
├── tokens/
│   ├── colors.json
│   ├── typography.json
│   ├── spacing.json
│   └── radius.json
├── components/README.md
├── pages/README.md
├── layout.md
└── interaction.md
```

## 最小源码交付

下面的设计系统目录是规范与索引结构，不是完整代码产物。最小启动同样必须在目标项目中落地：工程入口与必要配置、真实 token/样式来源和接入、当前需求的页面与组件实现，以及 Gallery 源码。实际目录沿用已确认技术栈，不固定要求 React 或 JSON→CSS。

正式实现文件不能是空文件或仅有 TODO 的骨架；源码必须由运行入口、路由或消费组件引用。文档、截图、token JSON、索引和临时预览不能替代实现。候选状态不免除源码；缺少必需代码或入口未接通属于未完成，环境无法执行则明确运行未验证。

## 最小运行要求

- 至少定义背景、文字、边框、主色和状态色等语义颜色。
- 至少定义正文/标题字号、基础间距和圆角。
- 源码侧有唯一 token 入口，例如 `src/styles/tokens.css`。
- `components/README.md` 和 `pages/README.md` 可以为空清单，但必须说明登记方式。
- `layout.md` 记录容器、栅格、跨列对齐锚点、需要等高的模块、关键基线与移动端重排规则；未知关系明确标记为待确认。
- `interaction.md` 记录加载、空、错误、禁用和反馈模式。
- Gallery 使用项目实际运行样式展示已接入的 tokens，并在设计系统 README 中登记启动命令、访问地址、源码入口与生产构建策略。

## 最小 Gallery

确认平台、技术方案和核心约束后，随项目骨架与 token 接入建立持续展示入口。已有 Storybook/文档站时复用，否则按项目技术栈建立开发页面或独立入口；不要求额外 Agent GUI 或固定框架。展示代码放在项目合适的源码目录，`design-system/README.md` 记录实际位置。

最少覆盖：

- **Foundations**：当前实际定义的颜色、字体、间距和圆角，显示名称与来源，样例使用真实运行样式；不另存一套手写 token 值。
- **Components**：当前已经实现的可复用组件及适用的变体/状态，直接挂载真实实现；尚无组件时明确显示“尚未登记”，首个页面完成后补上其共享资产。
- **Patterns**：已有页面或布局组合及源码/规范位置；尚无模式时明确显示“尚未登记”，不虚构页面来填满展示。
- **入口与导航**：可运行、可定位的基础/组件/模式分区，提供实际启动命令与地址，并说明开发专用或独立构建策略。

初始 Gallery 可以很小、保持 candidate 状态，但必须有真实 token 展示与可运行入口。首轮交付应同步已实现的组件和页面模式；后续新增/修改资产时同步展示与索引。Gallery 持续保留，不随临时 proposal 预览清理。

由宿主实施 Gallery；`design-workflow init` 只创建设计资产模板和索引，不自动创建展示代码。`design-system-builder` 可用时复用其 Gallery 契约和模板；不可用时本节仍是独立可执行的最小要求。

交付前核验真实资产引用、入口可运行以及适用的桌面/窄屏布局与交互。无法运行或入口缺失属于未完成；缺少浏览器验证能力时明确记录未验证，不宣称视觉检查通过。

## CSS 示例

```css
:root {
  --color-accent: #2563eb;
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-border: #e5e7eb;
  --color-surface: #ffffff;
  --color-background: #f9fafb;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

这些值是占位基线，不是品牌规范。确认真实视觉方向后必须替换并记录来源。
