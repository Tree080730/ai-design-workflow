# Quick Start

[中文](quick-start.zh-CN.md)

The primary path builds design-system source and a Gallery from zero, then reuses them for business pages.

## 1. Install into a project

Requires an available Codex or Claude Code installation, Node.js 18+, Git and an existing target directory. New projects can start with an empty directory. Replace `/path/to/project` with its actual path; quote paths containing spaces. From a terminal:

```bash
git clone https://github.com/Tree080730/ai-design-workflow.git
cd ai-design-workflow
node scripts/install-host.mjs "/path/to/project" --host codex
# Or use --host claude; --host both supports both.
```

Harness installation requires no `npm install`; dependencies under `examples/react-vite` are only needed to run that demonstration.

For 0→1, create an empty target directory first. For existing projects, use the actual project root. Preview with `--dry-run`; existing project instructions are preserved. See [Host integration](host-integration.md).

## 2. Confirm discovery in the host

Open the project and start a new host session. Ask the host to locate `designer-dev-workflow/SKILL.md` and identify the project constraints relevant to page development without changing files.

Explicit invocation is available when needed: `$designer-dev-workflow` in Codex, `/designer-dev-workflow` in Claude Code. File installation alone is not proof of model-session activation.

## 3. Describe the complete 0→1 request

Start with the README's [complete request](../README.md#one-complete-01-request), replacing the business page, references and acceptance requirements.

| Stage | Delivery |
|---|---|
| Confirm evidence and constraints | Source-grounded core rules, technology proposal and confirmed scope |
| Build the design system | Actual runtime styles and needed component source, runnable Gallery and matching specifications |
| Build business pages | Pages/interactions consuming real assets, synchronized Gallery, runtime instructions and results |

Once scope is confirmed, the host continues through all three stages without repeating the same approval or stopping at the Gallery. Source must be written into the target project and connected to real entries. Missing implementation and unverified execution are reported separately.

Design-system-only requests finish the first two stages. References require host access; screenshots or structured data can substitute without turning unknowns into facts. Existing-project support, reference extraction and standalone Gallery work remain supplementary paths; do not create unused components. See the [Gallery contract](../skills/design-system-builder/references/gallery.md).

## 4. Use optional tools where useful

```bash
node packages/cli/bin/design-workflow.mjs scan /path/to/project --json
node packages/cli/bin/design-workflow.mjs init /path/to/project
node packages/cli/bin/design-workflow.mjs check /path/to/project
node packages/cli/bin/design-workflow.mjs doctor /path/to/project
```

`init` creates missing starter assets and refreshes the generated Adapter. Starter values need product evidence; `--force` permits replacing managed starter files. `check --strict` can fail CI on reported candidates. Structural diagnostics do not certify design or business readiness.

Token export and task evidence are independent opt-in enhancements: [Token integration](token-integration.md), [Task evidence](task-evidence.md).

## 5. Verify and continue development

Use the project build/static checks, browser previews and applicable interaction tests. High-risk changes require the relevant full state loop; static styling does not automatically require E2E. Keep actual tests and browser runtime preparation in the project/host workflow.

Synchronize meaningful token/component/page changes with the design system and relevant indexes. Report what was verified and what remains unverified. The next page reuses those assets rather than starting a fresh style.

## Update an existing installation

From a clean Harness checkout, run `git pull --ff-only`, then rerun the installer for the same target and host. Start a new session in the target project and repeat the discovery check. The installer updates copied Skills, not your product's tokens or generated Gallery implementation. Ask the host to apply relevant changes to project assets deliberately.

Keep `.design-workflow/host-installation.json`. If managed Skill content was edited locally, installation stops: inspect and reconcile the difference instead of overwriting it. See [Host integration](host-integration.md) for conflict behavior.

## Common first-use problems

| Symptom | Next action |
|---|---|
| Target does not exist | Create an empty directory or choose an existing project root |
| Host does not find the Skill | Confirm the target project is open, start a fresh session and explicitly invoke the Workflow Skill |
| Reference website is inaccessible | Supply screenshots, structured design data or source; leave unsupported values unresolved |
| Gallery is not present after installation | Ask the host to construct it; installation copies Skills, not a finished Gallery into your product |
| Local Skill changes block an update | Reconcile the conflicting content and retain the installation receipt |

For 0→1 work, the host uses the bundled [delivery gate](delivery-contract.md) by default; standalone task management remains optional. CI must invoke the same gate to enforce its verdict.
