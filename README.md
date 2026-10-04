# AI Design Workflow

[中文](README.zh-CN.md)

A Design Harness for consistent, specification-aware page development inside existing coding agents. Its Skills guide the host to establish or read design constraints, reuse components, implement pages and verify applicable visual and business states.

The host owns models, conversation, tools, permissions and sessions. This project provides the design-development foundation. It does not require a standalone agent runtime or GUI.

## Quick start

Have Codex or Claude Code, Node.js 18+ and a target project directory ready. Create an empty directory for a new project, or use the actual root of an existing project. Replace `/path/to/project` below; keep the quotes for paths containing spaces.

```bash
git clone https://github.com/Tree080730/ai-design-workflow.git
cd ai-design-workflow
node scripts/install-host.mjs "/path/to/project" --host codex
```

For Claude Code, replace `codex` with `claude`; use `both` for both hosts. Harness installation needs neither `npm install` nor the example application's dependencies.

Open the **target project** in the host, start a new session and ask:

> Locate the available designer-dev-workflow Skill and identify this project's design constraints for page development. Do not modify files yet.

Once the Skill is located, choose a request below. See [Quick Start](docs/quick-start.md) for details and [Host integration](docs/host-integration.md) for discovery and updates.

## Four ways to use it

Replace the example pages, business requirements and references with your own. The agent reads context and describes a proposal; confirm it in conversation before implementation.

### New project: build from zero

> Use the Design Harness to build a user-management page with a list, filters and editing. Confirm the platform and technology, then establish minimum design constraints from my references. Mark unsupported decisions for confirmation. After I confirm the proposal, implement the page, reusable components and a Gallery, and verify applicable states plus desktop and narrow layouts.

### Existing project: reuse and extend

> Use the Design Harness to add a settings page. Read the actual code, design specifications and components first. Reuse existing layout, form and feedback patterns, preserving the technology stack and token pipeline. Explain necessary extensions, implement after confirmation, check shared impact, and synchronize specifications and the existing Gallery.

### Reference website: extract design rules

> Use design-system-builder to derive colors, typography, spacing, radius, layout and observable component rules from [reference URL] and my screenshots for this project. Distinguish measured values from inferences and record sources. Mark unseen states and breakpoints for confirmation. Let me confirm the core constraints before integrating them into real project styles, components and the Gallery.

Website inspection depends on the host's browser tools and page accessibility. If access fails, use screenshots, structured design data or source code. A URL or screenshot alone does not reveal a website's complete internal design system.

### Design System Gallery: display and maintain

> Use design-system-builder to build a Design System Gallery for this project. Reuse an existing Storybook/docs site or create a project development entry. Import real tokens and components, show applicable variants, states and page patterns, register source/spec references, and provide startup commands, the URL and verification results.

For an existing Gallery, ask: “Add the new component and its states to the Gallery using the real implementation; update specifications and indexes.” See [Design System Gallery](#design-system-gallery) below for the runnable example and integration contract.

## Complete usage flow

Users describe requests, confirm proposals and inspect results in their coding agent. The agent reads constraints, implements changes, verifies them and maintains design assets. Per-request manual CLI setup is not required after installation.

```mermaid
flowchart LR
    A[Prepare host and project] --> B[Install Harness]
    B --> C[Confirm Skill discovery]
    C --> D[Describe a page request]
    D --> E[Read or establish constraints and confirm scope]
    E --> F[Reuse assets and implement]
    F --> G[Verify and correct]
    G --> H[Deliver and synchronize assets]
    H --> D
```

### 1. Prepare the host and project

Use an available Codex or Claude Code installation, with your model or account configured in that host. The Harness uses the host's model and tools.

For 0→1 work, prepare an empty target directory. For existing projects, use the actual project root. Repository and installation commands are in the quick start above.

### 2. Install into the target project

The installer requires Node.js 18+. Installing the example application's dependencies is not a prerequisite.

```bash
node scripts/install-host.mjs "/path/to/project" --host codex
# For Claude Code:
node scripts/install-host.mjs "/path/to/project" --host claude
```

Use `--host both` for both integrations or `--dry-run` to preview changes. The same Skills are copied, with a short project instruction entry:

| Host | Skills directory | Instruction entry |
|---|---|---|
| Codex | `.agents/skills/` | Existing `AGENTS.override.md`, otherwise `AGENTS.md` |
| Claude Code | `.claude/skills/` | Existing root `CLAUDE.md`, otherwise existing `.claude/CLAUDE.md`, otherwise a new root `CLAUDE.md` |

Existing instructions are preserved; conflicting or locally modified managed content stops installation. Installation does not initialize product tokens or migrate existing toolchains.

### 3. Confirm discovery in the host

Open the **target project** and start a new session. For first use, ask:

> Locate the available designer-dev-workflow Skill and identify the project constraints you would use for page development. Do not modify files yet.

Confirm that the agent actually located the Skill file. If discovery fails, explicitly invoke `$designer-dev-workflow` in Codex or `/designer-dev-workflow` in Claude Code, then check working directory, loading paths and host configuration. See [Host integration](docs/host-integration.md) for troubleshooting and updates.

### 4. Describe the request through conversation

Provide the page's purpose, content, business behavior and acceptance requirements, plus existing designs, screenshots or specifications when available. You do not need to select every supporting Skill manually.

Use the prompts in [Four ways to use it](#four-ways-to-use-it) above. Reference extraction and Gallery construction also run through the host conversation.

### 5. Establish context and confirm the proposal

The agent selects a path from actual project state:

| Scenario | Agent responsibility |
|---|---|
| 0→1 | Confirm platform and technology, establish the application skeleton, minimum tokens/layout/interaction rules, and component/page registration |
| Existing project | Read relevant code and specifications, verify project indexes, identify reuse and necessary extensions, and retain the existing token pipeline |

Use `design-system-builder` when constraints are missing. Use `proposal-with-preview` only when design input is unclear and multiple reasonable implementations exist: summarize directions, expand the selected one, then preview it. Clear references and small changes can skip proposal previews.

The main workflow creates a specification covering scope, reuse, risks and acceptance conditions. The user confirms it in conversation before implementation. Unresolved choices remain explicit; starter values are not confirmed product rules.

### 6. Implement, verify and correct

The agent uses host tools to develop the page, reuses tokens/components/page patterns, and covers applicable loading, empty, error, disabled and boundary states. High-impact changes beyond confirmed scope return to proposal confirmation.

Run existing project builds/checks and verify actual pages, interactions and shared impact. Inspect alignment, overflow, wrapping and responsive reordering at representative desktop and narrow widths. Routing, async, persistence and reversal changes also need applicable success, failure recovery, refresh, reversal and final-state verification. Correct failures and rerun relevant checks.

Static styling changes do not automatically require E2E. Record unavailable or unexecuted verification explicitly; successful builds or zero CLI issues do not replace page verification.

### 7. Deliver and continue iterating

Deliver changes, decisions, verification results and remaining risks. Synchronize affected design rules, component/page indexes and necessary project mappings. The user inspects the page and continues through conversation.

For example:

> Add a role-management page next. Reuse the user-management list, filter and feedback components, preserve the design constraints, and verify effects on the original page when shared components change.

This loop makes initial assets the foundation for later development. A fresh session rereads relevant project constraints and implementation. Task evidence resumption applies only when the project has deliberately adopted task tracking.

### What is optional?

Installation and host discovery establish the integration. CLI scan/init/check/doctor are helpers the agent can use when useful. Managed token export, explicit asset manifests and persisted task evidence are opt-in enhancements. Users do not need a new task plan, token conversion or manual tool invocation for every request. Commands are listed below.

## Core Skills

| Skill | Responsibility |
|---|---|
| `designer-dev-workflow` | Project understanding, change routing, specification, implementation, verification and delivery |
| `design-system-builder` | Executable design constraints, tokens, layouts, states and reusable assets |
| `proposal-with-preview` | Resolve ambiguous page/component implementation choices through progressive previews |
| `rules-governance` | Requested consistency audits and rule-drift review |

For 0→1 projects, establish minimum usable constraints and assets. For existing projects, adopt real code and established rules. Maintain those assets as pages and shared components evolve. Creative ideation is not the core product responsibility.

High-risk flows need relevant success, recovery, persistence, reversal and boundary verification. Reuse existing project tests and the host's browser capabilities. Static styling changes do not automatically require E2E.

## Design System Gallery

Design-system construction includes a persistent Gallery of real tokens, shared component variants/states and page patterns, with source/spec references. The host reuses an existing Storybook/docs site or creates a development entry using the project framework. Gallery imports real assets and remains after temporary proposal previews are removed.

Ask the host to build a Gallery using existing tokens/components, register relevant states and patterns, and verify desktop, narrow-screen and keyboard behavior. See the [implementation contract and React starter](skills/design-system-builder/references/gallery.md). Run the example:

```bash
cd examples/react-vite
npm ci
npm run dev
```

Open the URL printed by Vite. Example assets are candidate; a Gallery or successful build does not certify all business pages.

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
