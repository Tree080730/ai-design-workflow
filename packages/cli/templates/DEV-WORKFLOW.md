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
