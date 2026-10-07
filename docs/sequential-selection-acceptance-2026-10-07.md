# 连续选择与组合输入验收

范围：GUI 从二选一改为「组件底座 → 视觉参考」，两步可跳过。参考支持品牌官网、自定义 HTTP(S) URL、原始 PNG/JPEG/WebP 图片，可组合（最多 8 份、每张 5 MB）。业务需求仍在宿主输入，本次没有重建业务页或重复原三模式构建。

程序回归：`npm test` 共 112 项通过，无失败；Skill 验证脚本通过。

## 实现与检查

- schemaVersion 2 保存 component 与 references；combined 同时覆盖组件七项与参考七项分析。旧 schemaVersion 1 不静默修改，继续读取和启动。
- 输入回执记录组件、全部参考和原图摘要；附件/选择/需求变化使后续失效。图片不会伪造交互或响应式观察；仅图片输入对应项须 adapted 并合并确认。
- 程序测试覆盖独立组合、三种跳过结果、非法输入/冲突保护、原图字节保存、原图改动失效、启动器已有选择不重开、缺失另一侧分析及每个来源证据阻塞。
- 隔离 GUI 真实操作：Ant Design → 自定义 URL → 上传本地 PNG → 加入 Linear → 保存。刷新恢复，调整组件不清除参考；无效协议明确阻止保存，未按“加入”的有效 URL 最终保存时自动纳入；全部跳过结果为 custom、component=null、references=[]。
- 真实宿主脚本 read 收到 combined、Ant Design、全部三个参考及附件摘要；analysis gate 通过。implementation gate 因没有来源分析正确阻止，不把输入验收声称完整构建。
- 实际 CSS 视口 1280×900 与 480×900，均无横向溢出；桌面内容边距 120px。输入按剩余空间伸缩，操作间距统一 16px；窄屏按钮与表单可用。

本地证据：父工作区 `acceptance-runs/sequential-input-20261007/evidence/` 中 desktop.png、narrow.png、combined-basis.json、combined-receipt.json；保存的图片仍在该项目 `.design-workflow/references/`。PNG 仅为 GUI 验收输入，没有把本地 Logo 当成真实来源分析。

## 边界

本次验证 GUI 保存→宿主读取以及新版门禁的程序行为；没有进行组合模式整套来源分析、确认、DS/Gallery/业务页的新一轮生成。原有三模式真实验收记录仍分别有效，不能直接称为组合模式完整 E2E。没有推送或执行远程 CI。当前正式项目旧选择保留，预览中浏览和进入第二步不会保存。
