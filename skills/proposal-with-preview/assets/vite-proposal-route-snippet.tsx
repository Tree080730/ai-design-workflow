/**
 * Temporary visual proposal component.
 * Replace placeholders with the selected proposal only.
 * Do not add API calls, production state, analytics, or side effects.
 * Remove the component and temporary route after the decision.
 */
export function ProposalPreview() {
  const sampleItems = [
    { title: '示例内容', description: '使用静态数据验证信息层级与布局。' },
  ];

  return (
    <main className="proposal-preview" aria-label="方案预览">
      <header>
        <p>Proposal</p>
        <h1>替换为方案名称</h1>
      </header>

      <section aria-label="主要内容">
        {sampleItems.map((item) => (
          <article key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

// Example temporary registration; adapt it to the project's router:
// <Route path="/proposal/selected" element={<ProposalPreview />} />