export function hostReturn(threadId) {
  if (threadId == null || threadId === '') return {threadId:null,returnUrl:null,canDispatch:false};
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId)) throw new Error('Host thread must be an explicit session UUID.');
  return {threadId,returnUrl:`codex://threads/${threadId}`,canDispatch:false};
}
