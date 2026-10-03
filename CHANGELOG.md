# Changelog

## Unreleased

- Established host-first product boundaries and a project-scoped installer for Codex and Claude Code Skills with preserved instruction entries, conflict checks and update receipts.
- Made token export and task evidence optional enhancements in Workflow guidance and moved installation/conversation ahead of CLI setup in the quick start.

- Added opt-in task plans, persisted command/manual verification evidence, risk-based minimum acceptance coverage, blocked completion and optional risk reporting.
- Added task discovery, stale input/artifact detection, retained attempt history and safe interrupted-lock recovery.

- Added opt-in managed JSON token export, including typography and alias validation, with safe output ownership checks.
- Added external CSS token mapping, generated-output drift checks, unmapped variable candidates, and conservative runtime entry import diagnostics.
- Added explicit component/page asset mappings with missing-source/document checks and migrated the React + Vite example to an executable JSON-to-CSS source.

- Made design-system directory configuration effective across scanning, initialization, checks, and generated rules; existing single design systems are adopted instead of creating a competing default.
- Enabled configured strict check exit behavior and rejected invalid configuration before managed file writes.
- Used discovered component/page directories for documentation checks and avoided classifying nested components as pages.
- Added separate structural completeness and conservative constraint-input diagnostics to doctor while preserving existing healthy/exit semantics.
- Unified standalone Skill scanner behavior with generated, regression-checked CLI scanner distribution copies.

## 0.1.2

- Added explicit grid, alignment-anchor, equal-height, baseline, and responsive-reordering requirements to Design System layout guidance and generated project templates.
- Added mandatory desktop and narrow-screen geometry checks before proposal previews can be presented for confirmation.
- Added layout geometry to the delivery quality checklist and regression coverage for generated layout contracts.
- Added structural discovery for common E2E directories, including `e2e`, `playwright`, and `cypress/e2e`, with Adapter regression coverage.
- Added risk-triggered E2E guidance for recovery, persistence, reversal, boundary states, browser runtime preparation, and accessible selectors.
- Clarified that experimental and disposable benchmark projects may keep Design System assets in `candidate` status instead of producing premature stable documentation.

## 0.1.1

- Fixed first-run Adapter generation to use a post-initialization project scan.
- Added the canonical Adapter path to generated Adapter metadata.
- Expanded `doctor` to detect drift in project mode, adapter, package manager, technologies, scripts, and indexed paths.
- Made repeated `init` runs safely refresh the generated Adapter without replacing existing project files.
- Added regression coverage for first-run consistency and later project drift.

## 0.1.0

- Added the agent-agnostic `design-workflow` CLI.
- Added `init`, `scan`, `check`, and `doctor` commands.
- Added non-destructive initialization and JSON output.
- Added the React + Vite adapter and example project.
- Added automated tests and GitHub Actions.
- Added three core Skills and the optional Rules Governance Skill.
- Added MIT license, bilingual entry documentation, security policy, and contribution guide.
