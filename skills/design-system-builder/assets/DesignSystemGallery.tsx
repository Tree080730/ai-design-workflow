import type { CSSProperties, ReactNode } from 'react';

export type GalleryToken = {
  id: string;
  name: string;
  cssVariable: `--${string}`;
  kind: 'color' | 'spacing' | 'radius' | 'typography';
  sourceValue: string;
  source: string;
};
export type GallerySpecimen = {
  id: string;
  title: string;
  description: string;
  source: string;
  document: string;
  status: 'candidate' | 'stable' | 'incomplete';
  preview: ReactNode;
};

// Import real token definitions and components in the caller. Adapt CSS variable
// mappings and routing to the project. Keep Gallery separate from business APIs.
export function DesignSystemGallery({ tokens, components, patterns }: {
  tokens: GalleryToken[];
  components: GallerySpecimen[];
  patterns: GallerySpecimen[];
}) {
  function specimens(items: GallerySpecimen[]) {
    return items.map(item => (
      <article className="gallery-card" id={item.id} key={item.id}>
        <h3><a href={`#${item.id}`}>{item.title}</a></h3>
        <p>{item.description}</p>
        <p className="gallery-meta">Status: {item.status}</p>
        <div className="gallery-preview">{item.preview}</div>
        <dl className="gallery-references">
          <dt>Source</dt><dd><code>{item.source}</code></dd>
          <dt>Specification</dt><dd><code>{item.document}</code></dd>
        </dl>
      </article>
    ));
  }
  return (
    <main className="gallery-shell">
      <header>
        <p className="gallery-meta">Design Harness · Living reference</p>
        <h1>Design System Gallery</h1>
        <p>Real tokens and shared components. Preview interactions use local mock data.</p>
        <nav aria-label="Gallery sections" className="gallery-navigation">
          <a href="#foundations">Foundations</a>
          <a href="#components">Components</a>
          <a href="#patterns">Patterns</a>
        </nav>
      </header>
      <section aria-labelledby="foundations">
        <h2 id="foundations">Foundations</h2>
        <div className="gallery-grid">
          {tokens.map(token => {
            const value = `var(${token.cssVariable})`;
            const style: CSSProperties = token.kind === 'color' ? { backgroundColor: value }
              : token.kind === 'spacing' ? { width: value }
              : token.kind === 'radius' ? { borderRadius: value }
              : token.cssVariable.startsWith('--font-family-') ? { fontFamily: value }
              : token.cssVariable.startsWith('--line-height-') ? { lineHeight: value }
              : { fontSize: value };
            return (
              <article className="gallery-card" id={token.id} key={token.id}>
                <h3><a href={`#${token.id}`}>{token.name}</a></h3>
                <div className={`gallery-token-preview gallery-token-${token.kind}`} style={style} aria-hidden="true">
                  {token.kind === 'typography' ? 'Aa · Design system' : ''}
                </div>
                <code>{token.cssVariable}</code>
                <p className="gallery-meta">Source value: {token.sourceValue}</p>
                <p className="gallery-meta"><code>{token.source}</code></p>
              </article>
            );
          })}
        </div>
        {tokens.length === 0 && <p>Token sources not yet registered.</p>}
      </section>
      <section aria-labelledby="components">
        <h2 id="components">Components</h2>
        <div className="gallery-grid">{specimens(components)}</div>
        {components.length === 0 && <p>Component specimens not yet registered.</p>}
      </section>
      <section aria-labelledby="patterns">
        <h2 id="patterns">Patterns</h2>
        <div className="gallery-patterns">{specimens(patterns)}</div>
        {patterns.length === 0 && <p>Page patterns not yet registered.</p>}
      </section>
    </main>
  );
}
