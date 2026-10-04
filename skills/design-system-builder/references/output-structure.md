# Design System 输出结构

## 顶层

| 文件 | 职责 |
|---|---|
| `README.md` | 定位、版本、原则摘要和导航，不堆叠全部细节 |
| `layout.md` | 容器、栅格、断点、页面骨架、跨列对齐锚点、等高关系、关键基线和响应式重排规则 |
| `interaction.md` | 加载、反馈、错误、弹层、导航和动效等跨组件规则 |
| `third-party-mapping.md` | 第三方组件、token 覆盖和例外原因 |

## Tokens

每类 token 使用 JSON 作为机器源，Markdown 作为解释层。推荐 primitive 与 semantic 分层：

```json
{
  "primitive": { "blue-600": "#2563eb" },
  "semantic": { "color-action-primary": "{primitive.blue-600}" }
}
```

组件只引用 semantic token；primitive 用于定义和主题映射。

## 组件文件

每个组件一个文件，包含：用途、结构、变体、状态、属性、行为、可访问性、token 映射、使用边界、示例和源码位置。源码可以内嵌或链接，但同一项目必须统一策略。

## 页面文件

每个页面记录：用户目标、入口、结构层级、区块、组件映射、栅格与对齐关系、状态、异常场景、响应式行为、跨页面契约和验证方式。

## 索引规则

- `components/README.md` 和 `pages/README.md` 是可检索清单。
- 新增、重命名或删除资产时同步索引。
- 链接使用相对路径并由自动检查验证。
- 预览站点是验证入口，不是规范的唯一事实来源。

## Gallery

设计系统索引应登记持续 Gallery 的启动命令、实际 URL/路由、源码入口、展示清单、候选状态和生产构建策略。展示代码放在项目适合的目录，不要求位于 `design-system/`。使用现有 Storybook/docs 时登记现有入口。

- Foundations 从真实 token 源或现有工具链生成展示条目；样例使用实际运行样式。
- Components 挂载真实组件的变体与适用状态；不复制实现。
- Patterns 展示可复用页面组合，使用明确标注的模拟数据。
- 每项有稳定 id、源码与规范位置，可深链接；待补齐与未验证状态可见。
- Gallery 持续维护；proposal 临时预览仍按原流程清理。

实施与验收见 [Gallery 契约](gallery.md)。
