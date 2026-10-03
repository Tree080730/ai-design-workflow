# Contributing

## Development

Requirements: Node.js 18 or newer.

```bash
npm install
npm test
npm run smoke
```

## Pull requests

- Keep the harness agent-agnostic and framework-neutral unless code belongs to an adapter.
- Add observable tests for CLI behavior.
- Do not add company-specific names, internal URLs, credentials, local absolute paths, or proprietary business examples.
- Keep deterministic operations in the CLI and judgment-heavy guidance in Skills.
- Update documentation when a command, state schema, or generated artifact changes.

Changes to CLI scanner, configuration, or filesystem helpers must run `npm run sync:skill-scanner`. Generated standalone Skill copies are verified by tests.
