# Quick Start

## 1. Install into a project

From the repository checkout:

```bash
node scripts/install-host.mjs /path/to/project --host codex
# Or use --host claude; --host both supports both.
```

For 0→1, create an empty target directory first. For existing projects, use the actual project root. Preview with `--dry-run`; existing project instructions are preserved. See [Host integration](host-integration.md).

## 2. Confirm discovery in the host

Open the project and start a new host session. Ask the host to locate `designer-dev-workflow/SKILL.md` and identify the project constraints relevant to page development without changing files.

Explicit invocation is available when needed: `$designer-dev-workflow` in Codex, `/designer-dev-workflow` in Claude Code. File installation alone is not proof of model-session activation.

## 3. Describe the page request

Use normal conversation. The Workflow Skill organizes project understanding, specification, reuse, implementation, verification and design-asset maintenance. The host uses its own tools and existing project capabilities. New projects establish minimum usable constraints; existing projects retain their design system and token pipeline.

No per-request CLI setup, token migration or parallel task-record system is required.

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
