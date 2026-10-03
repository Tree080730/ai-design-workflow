# AI Design Workflow

[中文](README.zh-CN.md)

A Design Harness for consistent, specification-aware page development inside existing coding agents. Its Skills guide the host to establish or read design constraints, reuse components, implement pages and verify applicable visual and business states.

The host owns models, conversation, tools, permissions and sessions. This project provides the design-development foundation. It does not require a standalone agent runtime or GUI.

## Start with your coding agent

From this checkout, install into an existing project directory with Node.js 18+:

```bash
node scripts/install-host.mjs /path/to/project --host codex
# Or:
node scripts/install-host.mjs /path/to/project --host claude
```

`--host both` installs both integrations. `--dry-run` previews changes. The installer preserves existing project instructions and stops on conflicting or locally modified managed content.

Open the project in the host, start a new session, and ask it to locate the available `designer-dev-workflow` Skill. Then describe your page request normally. See [Host integration](docs/host-integration.md) for activation checks, update behavior and loading limitations.

Installation copies Skills and adds a short project instruction entry. It does not initialize product tokens or force an existing project to change its toolchain.

## Core Skills

| Skill | Responsibility |
|---|---|
| `designer-dev-workflow` | Project understanding, change routing, specification, implementation, verification and delivery |
| `design-system-builder` | Executable design constraints, tokens, layouts, states and reusable assets |
| `proposal-with-preview` | Resolve ambiguous page/component implementation choices through progressive previews |
| `rules-governance` | Requested consistency audits and rule-drift review |

For 0→1 projects, establish minimum usable constraints and assets. For existing projects, adopt real code and established rules. Maintain those assets as pages and shared components evolve. Creative ideation is not the core product responsibility.

High-risk flows need relevant success, recovery, persistence, reversal and boundary verification. Reuse existing project tests and the host's browser capabilities. Static styling changes do not automatically require E2E.

## Optional engineering helpers

The CLI reduces repeated deterministic work; it is not a prerequisite for the Skills.

| Command | Purpose |
|---|---|
| `scan` | Read-only project facts and discovered paths |
| `init` | Missing starter assets and refreshed Adapter |
| `check` | Static design consistency candidates and configured mappings |
| `doctor` | Structural diagnostics and known constraint-input gaps |
| `tokens` | Opt-in JSON-to-CSS export |
| `task` | Opt-in verification evidence and recovery |

Run from source, for example:

```bash
node packages/cli/bin/design-workflow.mjs scan /path/to/project --json
```

Initialization preserves existing managed starter files unless `--force` is explicit. The Project Adapter is a cache; source and executable configuration remain authoritative. Static-check success and structural health do not certify page quality.

- [Configuration](docs/configuration.md)
- [Token integration](docs/token-integration.md)
- [Optional task evidence](docs/task-evidence.md)

## Status and development

The released baseline is v0.1.2; unreleased host installation and optional tooling changes are listed in [CHANGELOG](CHANGELOG.md). Host integration tests validate files and portable resources, not real model-session behavior or universal compliance.

```bash
npm run validate
```

See [Quick Start](docs/quick-start.md), [Architecture](docs/architecture.md), and [Contributing](CONTRIBUTING.md).

## Repository

```text
skills/                Design-development core
scripts/install-host.mjs  Project-scoped host installer
packages/cli/          Optional deterministic tools and starter assets
examples/react-vite/   Token integration and verification fixture
test/                  Observable behavior tests
docs/                  Product boundaries and usage
```

## License

[MIT](LICENSE)
