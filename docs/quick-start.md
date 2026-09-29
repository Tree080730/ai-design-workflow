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

The command creates only missing files. Review generated starter tokens and replace them with product evidence before treating them as design decisions.

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

## Updating an existing project

Run `scan` first. `init` will preserve existing `RULES.md`, `DEV-WORKFLOW.md`, design-system files, and Harness state unless `--force` is explicitly provided.
