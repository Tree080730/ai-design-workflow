export function returnNote(project,navigation='idle') {
  const handoff=project.handoff?.status;
  const saved=handoff==='read'?'宿主已记录读取当前选择与需求。':handoff==='stale'?'选择或需求已变化，等待宿主重新读取。':handoff==='blocked'?'交接记录无法核验，请在宿主中检查项目与需求。':'选择已保存，等待宿主读取；保存不代表已开始构建。';
  if(!project.host?.returnUrl)return saved+' 请手动返回打开此项目的 Codex 会话并输入需求。';
  const recovery=navigation==='pending'?'已尝试返回原会话；如果仍停留在这里，请点击返回按钮或手动切回 Codex。':navigation==='failed'?'自动返回未完成，请点击返回按钮或手动切回 Codex。':'点击返回原会话并输入需求。';
  return saved+' '+recovery+' 返回不会自动发送消息。';
}
