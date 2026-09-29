# Quick Start

## 1. Inspect before writing

```bash
node packages/cli/bin/design-workflow.mjs scan /path/to/project
```

Use `--json` when another tool or agent will consume the result.

## 2. Initialize missing workflow assets

```bash
node packages/cli/bin/design-workflow.mjs init /path/to/project
```

The command creates only missing project files and refreshes the generated Project Adapter. Review starter tokens and replace them with product evidence before treating them as design decisions.

## 3. Install Skills

Install the desired directories under `skills/` using your agent's supported Skill installation mechanism. The recommended set is:

- `designer-dev-workflow`
- `design-system-builder`
- `proposal-with-preview`
- `rules-governance` for audits

## 4. Work through a task

The Workflow Skill should read the generated Project Adapter, create a task specification in `.design-workflow/specs/`, and wait for explicit confirmation before implementation.

## 5. Check and diagnose

```bash
node packages/cli/bin/design-workflow.mjs check /path/to/project
node packages/cli/bin/design-workflow.mjs doctor /path/to/project
```

Use `check --strict` in CI when any reported issue should fail the job.

## 6. Verify high-risk flows

Routing, asynchronous recovery, cross-page state, persistence, and reversible actions should be verified as complete user-state loops. Reuse the project's existing E2E framework when available; static styling changes do not require E2E by default.

Test dependencies and browser runtimes are separate. For example, a Playwright project may still require an explicit `npx playwright install chromium` before its first run. The Harness does not perform that download automatically, and browser binaries, traces, and reports should remain local or in CI artifacts.

## Updating an existing project

Run `scan` first. `init` preserves existing `RULES.md`, `DEV-WORKFLOW.md`, and design-system files unless `--force` is explicitly provided. The generated Project Adapter is refreshed because it is a cache of current project facts.
