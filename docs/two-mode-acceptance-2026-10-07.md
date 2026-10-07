# 开源组件 / 不使用预设验收进度

两独立干净项目：../acceptance-runs/components-20261007 与 ../acceptance-runs/custom-20261007。
真实 GUI 已分别保存 Ant Design/components 和 custom/preset:null。两者项目路径与当前实际宿主会话绑定，host-read 回执已生成，七维分析、候选规则与来源/项目扫描证据已保存；原生 SessionStart 未重新验证，不把本次手动启动记作 Hook 自动触发。GUI 调用返回导航已观察到尝试提示，当前会话的实际回跳没有用户确认，不新声称导航通过。

Ant Design 官方网站由web工具读取；直接HTTP抓取403后使用同版本官方GitHub源文档及npm元数据保存本次证据。6.6.5 React peer>=18、MIT；主题ConfigProvider token，原组件Button/Input/Segmented/Empty真实文档核验。未来维护不承诺，候选组件可访问性需实现后实测。

发现并修复：非custom模式此前强制本地user-input/existing-source填HTTP URL，导致合法本地扫描被拒。现在这两类允许无URL，有URL仍校验；外部证据继续强制HTTP URL，选定来源匹配只能由外部证据提供。本次新增两模式测试覆盖合法本地证据、缺失官方URL、当地证据不能冒充官方来源。

实际用户于 2026-10-07 回复「确认，开始执行」。两项目均保存当前分析/读取回执哈希绑定的真实确认；implementation门禁通过。随后实际构建共享token/组件/Gallery，六项检查通过，page门禁通过后才实施业务页。最终各11项必需检查全部通过，bundled verify-project status 返回 canFinish:true，无阻塞。

| 项目 | 业务入口 | Gallery | 最终证据 |
|---|---|---|---|
| Ant Design/components | http://127.0.0.1:4182/ | http://127.0.0.1:4182/gallery.html | ../acceptance-runs/components-20261007/deliverables/final-status.json |
| custom/preset:null | http://127.0.0.1:4183/ | http://127.0.0.1:4183/gallery.html | ../acceptance-runs/custom-20261007/deliverables/final-status.json |

两者从空源码和新依赖锁文件构建；custom未安装antd或沿用Linear源码/规则。相同业务验收范围允许复用本次新编写的中性业务逻辑和检查模式，视觉底座各自独立。

实际 CUA 内置浏览器：桌面1280×800、窄屏480×800；Gallery与业务入口分别检查按钮显示/隐藏，无横向溢出，共用边缘误差0px、搜索剩余宽度自适应、同类gap16px。实际操作搜索标题/摘要、分类联合筛选、六项中文拼音排序、详情/按钮返回/Escape返回保留状态和原行焦点、空结果恢复、重置焦点返回搜索框、Tab/Enter/Space及可见焦点。Gallery禁用/加载示例、空状态恢复和排序/输入动作均实测；控制台没有error/warn。

修复了组件包装与antd ButtonProps类型冲突、primary样式覆盖和loading禁用一致性；业务重置后恢复搜索焦点。生产构建及类型检查在最终源码上真实执行并留存日志。业务使用六篇本地示例，未声称后端、刷新持久化或独立详情深链接。

两项目已加入同一门禁的CI配置；未运行远程CI。task日志默认忽略，干净CI若没有同源码版本的浏览器/设计证据必须阻塞，不能把本地通过当远程CI通过。测试证据按项目保存，未修改既有Linear业务页。此前仓库108项协议测试通过，本次真实界面验收另行记录，二者不互相替代。
