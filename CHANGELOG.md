# Changelog

## Unreleased

- Added explicit grid, alignment-anchor, equal-height, baseline, and responsive-reordering requirements to Design System layout guidance and generated project templates.
- Added mandatory desktop and narrow-screen geometry checks before proposal previews can be presented for confirmation.
- Added layout geometry to the delivery quality checklist and regression coverage for generated layout contracts.

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
