# Executable token sources and asset mapping

Token integration is opt-in. `init` alone supplies starter assets; it does not select ownership of an existing project's token pipeline or edit application entry points.

## Managed JSON → CSS

After initialization, configure `.design-workflow/config.json`:

```json
{
  "schemaVersion": 1,
  "designSystemDirectory": "design-system",
  "tokens": {
    "mode": "managed",
    "sourceDirectory": "design-system/tokens",
    "outputFile": "src/styles/generated-tokens.css",
    "entryFiles": ["src/main.tsx"]
  }
}
```

Export, then import the CSS in the actual runtime entry:

```bash
node packages/cli/bin/design-workflow.mjs tokens /path/to/project
```

```tsx
import './styles/generated-tokens.css';
```

An existing stylesheet may instead use `@import './generated-tokens.css';` and be imported by the entry. The command reports the configured entry files and does not edit business code. Multiple entries must each be mapped and checked.

The JSON directory is authoritative. Regenerate after changing it; `check` compares expected output with the runtime file. Export refuses to replace an existing file without the generated header unless `--force` is explicitly provided. Invalid sources are rejected before changing output. Export is not proof that the CSS has been loaded in a browser.

### Supported format

The exporter supports the repository's scalar token JSON templates and scalar `$value` leaves. It does not claim full Design Tokens Community Group format support. Object-valued dimensions, gradients, typography composites and other complex leaves need the project's existing compiler or a future adapter.

- The filename becomes the alias namespace: `colors.json` defines `colors.*`.
- `primitive` leaves can be referenced but are not exported. Other scalar leaves are exported.
- Aliases accept local `{primitive.accent-600}` and qualified `{colors.primitive.accent-600}` paths, including across files. Cycles and unknown aliases are errors.
- `colors.semantic.action-primary` exports `--color-action-primary`.
- `typography.fontSize.body` exports `--font-size-body`; font families and line heights are also exported.
- `spacing.space-4` exports `--space-4`; `radius.radius-md` exports `--radius-md`.
- Other filename namespaces export their leaf path with kebab-case names. Duplicate CSS names are rejected; filenames should be unique across nested source directories.
- Strings and finite numbers are supported. Values containing CSS declaration delimiters, comments or newlines are rejected. This validation is not a complete CSS type validator.

Exported CSS is deterministic and contains resolved values under `:root`. Theme selectors and per-scope variants require external mode.

## Existing toolchains

Keep existing tools and use a CSS mapping:

```json
{
  "tokens": {
    "mode": "external",
    "definitionFiles": ["src/theme/variables.css"],
    "entryFiles": ["src/main.tsx"],
    "externalTokens": ["--third-party-runtime-variable"]
  }
}
```

The Harness reads CSS custom property declarations without rewriting them. `externalTokens` explicitly acknowledges names supplied elsewhere; it is an exemption mapping, not evidence they exist at runtime. Existing JS theme objects, utility class systems or non-CSS token consumers require their own checks; this iteration does not inspect them. `tokens` export is unavailable in external mode.

## What check proves

`check` can report:

- Missing or invalid JSON sources, missing output, and output drift.
- Missing external CSS definition files or configured entry files.
- A configured CSS file not reachable from an entry through relative static JS/CSS imports.
- Unresolved relative imports, which make integration coverage incomplete.
- `var(--name)` references absent from mapped token names and declarations in the same file. Fallback references are P2; other unmapped references are P1 review candidates, since legitimate local or external variables can exist elsewhere.

The result distinguishes `unconfigured`, `issues-found`, and `static-checks-passed`. No configuration means token integration was not checked, even if the overall issue count is zero.

This is lightweight static analysis, not a language parser, module bundler or browser. It ignores block and whole-line comments; inline JS comments and string literals can still produce candidates. Aliased imports, dynamic imports, unquoted CSS imports, framework-injected styles and CSS scope are not resolved. A static import path does not prove the stylesheet is applied, nor does it prove themes, inheritance or business behavior. Verify those in the browser.

## Component and page mapping

For custom source locations or same-name assets, add `assetManifest` to config:

```json
{"assetManifest": ".design-workflow/assets.json"}
```

Manifest:

```json
{
  "schemaVersion": 1,
  "assets": [
    {
      "type": "component",
      "name": "FormCard",
      "source": "src/components/forms/Card.tsx",
      "document": "design-system/components/form-card.md"
    },
    {
      "type": "page",
      "name": "Settings",
      "source": "src/screens/Settings.tsx",
      "document": "design-system/pages/settings.md"
    }
  ]
}
```

Paths are relative to the project. Mapped assets are checked for missing source and document files; discovered assets without mappings continue to use basename-based documentation checks. This records identity and location, not semantic reuse, document completeness or component behavior. No automatic component generation is performed.

The React + Vite example demonstrates JSON export, transitive entry imports and page mapping:

```bash
node packages/cli/bin/design-workflow.mjs tokens examples/react-vite
node packages/cli/bin/design-workflow.mjs check examples/react-vite --strict
```
