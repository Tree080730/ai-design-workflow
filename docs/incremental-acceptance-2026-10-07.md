# 增量迭代验收（2026-10-07）

本轮已在隔离项目 `../acceptance-runs/gui-startup-host-20261006` 完成。用户实际确认“确认，开始执行”，范围为最近更新 / 标题排序，与既有搜索分类联合生效、详情返回保留、重置恢复默认。数量功能原已存在，不计为新增。

## 实现与真实验收

- 业务页复用原 Button、tokens、inline/page-heading 布局；未改动共享 DS/Gallery 源码。示例数据新增明确 ISO updatedAt；filter 后排序，标题使用中文拼音/数字 Collator，同序 id。
- 内置浏览器实际桌面 CSS 1037×1287、窄屏 CSS 480×800 无横向溢出。分类＋搜索＋排序、Enter/Space、详情返回状态和焦点、空结果恢复、清空搜索保留排序、Escape 分类收起、Tab 与刷新默认均已验证。
- 新需求回执真实使旧分析失效；重新确认后旧 DS review 仍正确阻塞。完成当前六项 DS 检查并通过 page 阶段后才修改业务页。旧证据与本轮证据分别保留，备份在隔离项目 `.design-workflow/backups/iteration-20261007`。
- 最终任务 `delivery-21dad9552ca96ea587d0`：九项 passed，canFinish true，无 blocker。规范 pending 状态矛盾已修正；历史官网观察保持 2026-10-06 日期，未伪称本次重新分析官网。

## 效率与限度

本轮实际耗时约 710 秒，包含需求绑定、DS 检查与真实浏览器验收；四次命令检查分别为 DS 阶段 typecheck/build、最终阶段 typecheck/build，没有减免阶段或视觉检查。完整状态 108544 bytes，摘要 6801 bytes，输出缩减约 93.7%，二者检查结果相同。这是输出量统计，不是总模型 token 或端到端加速的对照实验。

当前完整功能与证据位于隔离项目。CI 已声明同一 gate，本轮未推送或声称远程 CI 执行。开源组件/不使用预设的完整实机验收、正式安装入口启用等后续任务仍需按各自确认范围推进；本轮完成不代表所有模式均已完成验收。

## 证据

隔离项目 `deliverables/final-status.json` 与 `deliverables/evidence/iteration-20261007/`：包含输入失效、DS 失效、源码变化失效、命令日志、Gallery/业务页截图、真实 DOM 状态及复核记录。
