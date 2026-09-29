# AI Design Workflow

[中文](README.zh-CN.md)

An open-source, agent-agnostic harness for design-system-aware AI development. It combines deterministic project tooling with installable Skills for judgment-heavy design and delivery decisions.

## Why

AI agents can understand a repository, but repeated delivery becomes unreliable when project discovery, design rules, previews, checks, and handoff depend on memory alone.

AI Design Workflow separates two responsibilities:

- **Harness:** deterministic scanning, initialization, checks, diagnostics, state, and templates.
- **Skills:** requirement interpretation, route selection, design-system reasoning, proposals, and rule governance.

## Status

`v0.1.1` is an early working release. The CLI has automated tests and a React + Vite adapter. The Skills are valid and usable, but full agent-specific installation and real-project evaluations are still expanding.

## Quick start

Requirements: Node.js 18 or newer.

From a clone:

```bash
npm install
node packages/cli/bin/design-workflow.mjs scan /path/to/project
node packages/cli/bin/design-workflow.mjs init /path/to/project
node packages/cli/bin/design-workflow.mjs check /path/to/project
node packages/cli/bin/design-workflow.mjs doctor /path/to/project
```

After an npm release, the intended interface is:

```bash
npx ai-design-workflow scan
npx ai-design-workflow init
npx ai-design-workflow check
npx ai-design-workflow doctor
```

`init` creates only missing project files by default and safely refreshes the generated Project Adapter. `init --force` explicitly allows managed starter files to be replaced. `check --strict` exits non-zero when issues are found.

## Commands

| Command | Purpose | Writes files |
|---|---|---|
| `scan` | Detect stack, project mode, commands, paths, and adapter | No |
| `init` | Create workflow assets and refresh the generated Adapter | Yes; existing project files are preserved unless `--force` is used |
| `check` | Report hardcoded colors and missing design documentation | No |
| `doctor` | Diagnose runtime and project workflow setup | No |

All commands support `--json` for machine-readable output.

## Skills

Three core Skills form the decision layer:

1. `designer-dev-workflow` — orchestrates project discovery, specification, implementation, verification, and delivery.
2. `design-system-builder` — extracts and maintains executable design constraints.
3. `proposal-with-preview` — supports progressive multi-direction decisions when no clear design input exists.

`rules-governance` is an optional review Skill for rule drift, token compliance, and design-documentation coverage.

Install the needed directories under `skills/` using the Skill mechanism supported by your agent. Cloning this repository alone does not automatically register them.

## Generated project structure

```text
.design-workflow/
├── config.json
├── project-adapter.json
└── specs/
design-system/
├── README.md
├── tokens/
├── components/
├── pages/
├── layout.md
└── interaction.md
RULES.md
DEV-WORKFLOW.md
```

The Project Adapter is a cache and index. Source code and executable configuration remain authoritative.

## Repository structure

```text
packages/cli/          Deterministic CLI harness
skills/                Agent decision Skills
examples/react-vite/   First supported adapter example
test/                  Observable CLI behavior tests
docs/                  Architecture and concepts
```

## Safety and scope

- The CLI does not upload project content.
- It does not generate production business code.
- It does not silently convert one-off preferences into long-term rules.
- It does not overwrite existing managed files unless `--force` is supplied.
- Proposal assets are static scaffolds and must not contain production APIs or side effects.

## Development

```bash
npm install
npm run validate
```

See [Quick Start](docs/quick-start.md), [Architecture](docs/architecture.md), and [Contributing](CONTRIBUTING.md).

## License

[MIT](LICENSE)
