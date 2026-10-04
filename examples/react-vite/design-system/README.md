# Example Design System

This small fixture demonstrates how the scanner recognizes an existing React + Vite project. Run:

```bash
node ../../packages/cli/bin/design-workflow.mjs scan .
```


JSON under `tokens/` is the executable source. Export with `node ../../packages/cli/bin/design-workflow.mjs tokens .`, then check with `node ../../packages/cli/bin/design-workflow.mjs check . --strict`. `src/main.tsx` imports App, which imports the stylesheet, which imports generated CSS. The fixture tests this static integration, not browser or business quality. Colors and type are starter values, not confirmed product choices.

The page mapping is `.design-workflow/assets.json`; page scope is described in `pages/adapter-example.md`.

## Persistent Gallery (candidate)

From `examples/react-vite`, run `npm ci` then `npm run dev`; open the URL Vite prints, root `/`. Foundations, Components and Patterns have stable anchors. Source entry: `src/App.tsx`; the renderer is `src/gallery/DesignSystemGallery.tsx`. This dedicated example intentionally includes Gallery in `npm run build`; real products should explicitly choose development-only or separate build access.

Gallery token entries come from the JSON source, previews use runtime CSS variables, and specimens import shared components. [Component index](components/README.md) and [page index](pages/README.md) map documentation; `.design-workflow/assets.json` maps source assets. Startup/typecheck/build results and actual browser observations must be recorded separately. Starter assets remain candidate.

Actual executed checks and limits: [Gallery verification](gallery-verification.md).
