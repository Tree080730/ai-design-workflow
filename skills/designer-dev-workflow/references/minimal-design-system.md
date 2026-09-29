# 最小设计系统

仅用于 0-1 项目在完整设计系统尚未建立时启动。若已有品牌、设计稿或生产页面，应从真实输入提取约束，不长期使用示例值。

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

## 最小运行要求

- 至少定义背景、文字、边框、主色和状态色等语义颜色。
- 至少定义正文/标题字号、基础间距和圆角。
- 源码侧有唯一 token 入口，例如 `src/styles/tokens.css`。
- `components/README.md` 和 `pages/README.md` 可以为空清单，但必须说明登记方式。
- `layout.md` 记录容器、栅格、跨列对齐锚点、需要等高的模块、关键基线与移动端重排规则；未知关系明确标记为待确认。
- `interaction.md` 记录加载、空、错误、禁用和反馈模式。

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
