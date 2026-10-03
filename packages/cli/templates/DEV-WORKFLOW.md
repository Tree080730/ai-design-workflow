# Project Development Workflow

> Use with `RULES.md`. Source code and executable configuration remain authoritative.

## Before implementation

1. Read `.design-workflow/project-adapter.json` and verify relevant paths and commands.
2. Clarify the user flow, affected surfaces, states, and acceptance criteria.
3. Create a task specification under `.design-workflow/specs/` and obtain confirmation.

## Routing

| Path | Change type | Primary destination | Required verification |
|---|---|---|---|
| A | Token or global visual value | Token source and design-system tokens | References and preview |
| B | Existing component | Component implementation and document | Shared impact and states |
| C | New reusable component | Component directory and index | Reuse justification and accessibility |
| D | New page or route | Page and router | Reachability and page document |
| E | Business flow | Feature or page data/state layer | Full success and failure path |
| F | Combined change | Split by component/page/business layer | Incremental verification |

## No-design-input path

For a new page or component without a clear design reference, use the proposal workflow: scan reuse candidates, present concise directions, preview only selected directions, and implement only after confirmation.

## Delivery

- Run `design-workflow check` plus the project build, lint, and tests when available.
- For routing, asynchronous recovery, cross-page state, persistence, or reversible actions, verify the complete state loop: success, failure recovery, refresh persistence, reversal, and the final empty or boundary state.
- Reuse the project's existing E2E framework. Installing a test package does not guarantee its browser runtime is installed; prepare that runtime explicitly and keep binaries and reports out of source control.
- Static or styling-only changes do not require E2E unless they affect a critical interaction path.
- Synchronize design-system documents and indexes.
- Remove temporary previews.
- Produce a delivery summary with decisions, files, verification, and known risks.


## Task evidence and resumption

Only when the user requests evidence tracking or the project already adopts it, persist accepted scope and criteria with `design-workflow task create`. Track relevant implementation, shared consumers, configuration, test definitions and specification files. Use `task run` for actual static/build/E2E command results and `task record` for manual attachments and observed page/state/viewport coverage. Never treat unconfigured, unexecuted or stale checks as passed.

For projects using task tracking, start a resumed session with `task list` and `task status`. Use `task recover` only after the interrupted owner has exited, then rerun unfinished checks. `task finish` blocks when required evidence is absent or stale; optional gaps remain explicit risks. These records complement the task specification and do not grant new authorization.

Host-native planning and verification records remain sufficient for ordinary work; CLI token export and task state are not required to use the Design Harness.
