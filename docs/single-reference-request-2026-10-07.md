# 单一参考选择局部变更

用户确认范围：自定义参考区位于全部品牌之后，无围框、与品牌同层级；只允许一个参考；该区只有参考网页 URL 输入、“使用此 URL”和“不使用设计参考”两个操作。品牌确认和 URL 确认均直接保存并返回宿主。移除图片上传与累加参考界面，保留旧记录读取兼容。

本轮修改的是 Harness 的 GUI 工具，不是根据已保存 Apple / Ant Design 选择构建业务页面。不重新进行来源分析、DS/Gallery 建设或 combined 业务页面端到端验收。仅验证相关保存 API、桌面/窄屏、单一选择替换、非法 URL、跳过与刷新恢复；不推送 GitHub。

## 本轮验证

- 4 项针对性 API 测试通过：首次 URL 保存与替换、顺序保存与多份拒绝、过期写入/非法输入、符号链接保护。`node --check packages/gui/public/app.js` 与 `git diff --check` 通过。无需重新构建未改动的组件预览。
- 真实 GUI 隔离项目验证：URL 错误提示、URL 保存、刷新恢复、品牌替换、无参考跳过（忽略未提交的非法 URL）通过。底部顺序、无顶/左右边框、仅两个按钮、共享 16px 操作间距已测量。桌面宽度 1048px 和实际窄屏宽度 480px，无横向溢出；浏览器最小视口使 390px 未验证。
- 修复了首次无图片保存时未创建 `.design-workflow` 目录的问题。
- 截图保存在工作区 `acceptance-runs/single-reference-20261007/{desktop,narrow,preview}.jpg`；测试服务已停止。正式预览已刷新，当前地址 `http://127.0.0.1:51900/`，已有选择文件未被测试覆盖。
- 通用业务构建 implementation 门禁因缺少 reference-analysis.json 阻塞，最终 status 因无 delivery.json 为 canFinish:false。它们关联仓库中旧 Apple 业务选择；本轮仅 GUI 工具维护，不声称完成 DS/Gallery、登记完整交付或业务端到端验收，也未新增/伪造这些记录。
- 没有运行全量测试，没有推送 GitHub。

## 页面说明精简

删除组件/参考步骤切换栏及底部流程说明；保留标题上方“第 1/2 步，共 2 步”和原标题。第一步说明查看详情、选择组件或跳过、进入参考步骤；第二步说明品牌单选、自定义 URL 或跳过，以及保存后返回宿主输入需求。沿用顺序推进、详情返回与重新选择入口。仅进行语法、diff 及受影响页面验证，不重复全量测试。

本次真实浏览器验证：两处移除后 DOM 不再存在，第一步跳过组件仍可正常进入第二步，步骤数字和两步说明正确；400px 窄屏无横向溢出。语法与 diff 检查通过，截图为 `acceptance-runs/single-reference-20261007/step-intro.jpg`。正式预览 `http://127.0.0.1:59690/` 已刷新；无保存操作，未改变正式选择。

## 自定义参考折叠入口

用户确认：自定义参考默认与品牌保持相同列表行状态；点击后展开现有 URL 表单与两个操作。复用 system-card 样式、Logo 占位、名称列和行分隔线；展开内容无围框。支持再次点击收起及 aria-expanded/aria-controls，切换步骤恢复折叠，输入内容不清空。

折叠交互验证通过：桌面默认隐藏表单，自定义行与品牌行同高约 96px、左边缘相同；鼠标点击、Enter 展开和 Space 收起均正常，收起再展开保留保时捷 URL 输入（没有提交保存）；400px 窄屏无横向溢出，展开仅两个操作按钮。语法与 diff 检查通过。截图：`acceptance-runs/single-reference-20261007/custom-collapsed.jpg` 和 `custom-expanded-narrow.jpg`。预览已更新并保留折叠状态。

## 自定义参考间距与动画修正

移除品牌列表残留 20px 底部 padding；展开固定标题行浅灰背景和标题左移状态（表单沿用白底，与用户图二一致），取消标题/表单分隔线。采用 CSS grid 0fr/1fr 高度与透明度过渡，支持连续反向切换；收起使用 inert 和 aria-hidden 排除隐藏表单焦点，保留输入。系统减少动态效果偏好沿用现有规则。

本轮真实 GUI 验证：品牌列表与自定义行间隙测量为 0；默认内容高度 0，展开状态鼠标移开后仍保持 -110px 标题位移；标题行 border-bottom 为 0；快速连续反向切换后收起最终高度为 0、标题恢复，aria-hidden=true 且 inert 存在；400px 窄屏无横向溢出，URL 保留，未提交保存。截图为 `acceptance-runs/single-reference-20261007/custom-smooth-expanded.jpg`。仅针对受影响布局与交互验证，未重复全量测试或推送。

## 项目 Logo 与缺失入口图标

Header 左侧使用用户提供的 Frame 172.png，原样复制为 logos/design-builder.png，32px（窄屏 28px），保持比例。自定义参考使用单色链接 SVG，不使用预设组件/设计参考使用同一圆圈斜线 SVG。列表沿用品牌图标 36/30px 及共享列宽；表单操作使用 18px。图标装饰性 alt 为空，操作名称由原文字提供；不改变参考选择流程。

本轮验证：新增明确静态路由测试 1 项通过（PNG/SVG MIME、内容可读、未知资源 404）；真实浏览器确认三个图标均加载成功。桌面 Header 为 32px，400px 窄屏为 28px；展开中的“不使用参考”图标为 18px，按钮数量仍为 2，无横向溢出。源 PNG 与用户文件哈希相同。预览已重启到 `http://127.0.0.1:61508/`；语法与 diff 检查通过，未重复全量测试或推送。当前截图 `acceptance-runs/single-reference-20261007/logo-preview.jpg`。

## 自定义参考 Hover 与选中图标

用户要求自定义参考复用品牌行 Hover 效果，Hover/点击状态右侧保留对应 Logo。添加同一链接 SVG 的 card-watermark，直接复用品牌行裁切、渐隐、放大与动画；移除此前压制 Hover 的局部覆盖，展开状态固定右侧水印，鼠标移开仍保留；收起且移出悬停/键盘焦点后恢复默认行。

真实原生指针验证：aria-expanded=false 且 :hover=true 时水印 opacity=1、标题位移 -110px；展开后鼠标移入表单，:hover=false 时水印仍为 1；收起并移出后恢复默认。400px 窄屏无横向溢出且水印保持可见。截图：`acceptance-runs/single-reference-20261007/custom-watermark.jpg`；diff 检查通过，未重复全量测试、未推送。

## 移除表单跳过操作图标

按用户最新截图要求，仅移除“不使用设计参考”文字按钮前的圆圈斜线图标；第一步跳过组件的列表图标、Header Logo 和自定义参考行水印保持现有实现。

## 跳过组件的 Hover 水印

按最新截图为“不使用预设组件”列表行添加右侧圆圈斜线 card-watermark，复用品牌行 Hover/键盘 focus-visible 的放大、裁切、渐隐动画。表单“不使用设计参考”继续保持纯文字。

## 第二步返回组件选择

在设计参考页标题上方添加“返回上一步：选择组件底座”，仅在第二步显示，复用 back-button。返回调用既有 setStep(open-source)，不清空 componentId/references 或 URL 输入、不写入已保存选择；再次选择或跳过组件继续第二步。

真实浏览器验证第二步→第一步→选择 Ant Design→第二步成功，组件摘要更新，已输入保时捷 URL 保留；再次返回并跳过组件也正常。400px 窄屏无横向溢出。验证未提交保存，正式文件仍为无预设组件+Duolingo。截图 `acceptance-runs/single-reference-20261007/step-back.jpg`；语法与 diff 通过。

## 返回操作统一到步骤行

用户要求返回在步骤小标题位置，所有页面返回的位置、字号、颜色和字重一致。Gallery 返回与步骤合并为一个 page-kicker 行；组件/品牌详情页返回和保存结果页重新选择均使用 page-kicker + step-label。继承原步骤文字 14px/500/#666（窄屏 13px），保留步骤信息，并统一距内容顶部的 16/12px 起始偏移。返回行为不变。

验证：实测第二步、品牌详情、保存结果页返回入口均位于同一标题上方行，桌面 y=137.98，字号 14px、字重 500、颜色 #666；400px 窄屏返回与步骤同排，均为 13px，无横向溢出。详情返回及结果页重新选择均可用。证据：`acceptance-runs/single-reference-20261007/back-kicker.png`（宿主项目目录）。只进行浏览器定向核对、JS 语法检查和 diff 检查，未推送 GitHub、未重复全量测试。

## 回退按钮只显示箭头
按用户要求，步骤回退、两类详情页返回和保存结果页重新选择均只显示原左箭头，位置及步骤行字体保持一致。原返回目标保留在 aria-label/title 中。

## 提交发布准备
2026-10-07 用户已授权推送。同步 README/中文 README、Design Builder 说明、产品链路、Logo 来源及安装版 Skill 的单参考契约，并记录 CHANGELOG。发布前定向测试 5 项通过（Logo 路由、目录服务、首次 URL 保存/替换、组合保存/跳过/兼容图片、宿主读回），GUI build:preview 通过；在全新临时目录安装 Codex Skills 成功，安装内容包含最新单参考契约。JS 语法与 git diff --check 通过。本轮没有重复全量测试。公开分发仍采用 GitHub 克隆及本机运行，不是在线托管 GUI。
