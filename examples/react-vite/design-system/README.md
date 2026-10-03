# Example Design System

This small fixture demonstrates how the scanner recognizes an existing React + Vite project. Run:

```bash
node ../../packages/cli/bin/design-workflow.mjs scan .
```


JSON under `tokens/` is the executable source. Export with `node ../../packages/cli/bin/design-workflow.mjs tokens .`, then check with `node ../../packages/cli/bin/design-workflow.mjs check . --strict`. `src/main.tsx` imports App, which imports the stylesheet, which imports generated CSS. The fixture tests this static integration, not browser or business quality. Colors and type are starter values, not confirmed product choices.

The page mapping is `.design-workflow/assets.json`; page scope is described in `pages/adapter-example.md`.
