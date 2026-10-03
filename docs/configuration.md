# Configuration and structural readiness

The CLI and standalone Workflow Skill scanner read `.design-workflow/config.json`.

```json
{
  "schemaVersion": 1,
  "strictChecks": true,
  "designSystemDirectory": "docs/design-system"
}
```

- `schemaVersion` supports version 1; it may be omitted in a minimal config.
- `strictChecks` defaults to false. When true, `check` exits with code 2 on reported issues, including when using `--json`. `--strict` enables the same behavior for a single invocation.
- `designSystemDirectory` selects a directory relative to the project. Absolute paths, the project root, and parent traversal are rejected. A configured missing directory is reported as missing rather than falling back to another design system.
- Without an explicit directory, scanning discovers `design-system`, `docs/design-system`, and `style-guide`. Initialization adopts the single existing directory, or creates `design-system` when none exists. Multiple discovered systems require an explicit selection before initialization.
- Invalid configuration stops the command before managed starter files are written. Unknown fields are preserved; they do not imply supported behavior. The generated `adapter` field is informational; stack detection remains based on package dependencies.

Initialization and checks use the selected directory. Initialization preserves existing project files unless `--force` is supplied, preserves configuration fields on a forced refresh, and updates the generated Adapter. Component and page coverage uses the directories found by scanning; components nested under a page root are not also treated as pages. Documentation still follows the existing basename-to-kebab-case convention; same-name assets and custom source directories need further mapping work.

## Doctor output

The existing `healthy` field and exit behavior remain compatible: warnings do not cause failure. It describes the absence of diagnostic errors, not delivery readiness.

Additional JSON fields:

- `structureReady`: all existing structural checks pass, including Adapter consistency. This does not certify document content.
- `readiness.status`: `needs-review` when known missing documents, unresolved markers, untouched starter token files, or ambiguous design systems are found; otherwise `unverified`.
- `readiness.findings`: actionable input diagnostics with file paths.
- `readiness.scope`: explicitly states that runtime integration, rendered pages and business behavior remain unverified.

Removing markers or editing starter tokens does not certify readiness. Existing token formats and toolchains are not required to migrate to the generated template format. This round diagnoses known incomplete inputs; it does not verify token compilation, component contracts, accessibility or browser rendering.

## Standalone scanner maintenance

The Skill must work when installed without the repository. Its `scripts/lib/` directory therefore contains generated distribution copies of `scan.mjs`, `config.mjs`, and `fs-utils.mjs`. CLI source is authoritative. After editing those source modules, run:

```bash
npm run sync:skill-scanner
npm run validate
```

Tests check byte-for-byte synchronization and observable result parity. Do not edit the distribution copies independently.
