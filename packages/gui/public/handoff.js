export function handoff(selection) {
  const p=selection.preset;
  const basis=p?.reference?.kind==='website'
    ? `以 ${p.name} 品牌官网（${p.reference.url}）作为视觉参考。读取实际页面，区分官网观察与官方设计规范；参考重点：${p.reference.focus}。结合业务与品牌沉淀项目自己的规则和组件，不把官网当成可安装的设计系统，不安装该品牌产品 SDK。`
    : selection.mode==='custom'
    ? '用户明确不采用预设设计系统。根据业务需求、品牌和风格输入构建项目设计系统；已有项目优先沿用真实资产，不沿用历史预设，也不因此删除或替换现有源码。'
    : `以 ${p.name}（${p.publisher}）作为${selection.mode==='components'?'组件与规范基础':'设计参考'}，读取官方来源，核验技术栈${selection.mode==='components'?'、依赖兼容性、版本及主题映射':''}。`;
  return `使用 designer-dev-workflow，先读取当前项目的 .design-workflow/design-basis.json。${basis}${selection.referenceUrl?'风格参考：'+selection.referenceUrl+'。':''}${selection.intent?'项目需求：'+selection.intent+'。':''}结合现有资产确认项目约束与实现范围，沿用已有授权；按原工作流交付真实设计系统、Gallery 和确认范围内的业务页面。保留源码、实际验证与未完成项，不把输入选择视为实现已完成。`;
}
