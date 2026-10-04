# Project Development Workflow

> Use with `RULES.md`. Source code and executable configuration remain authoritative.

## Primary 0→1 workflow

| Stage | Input | Required output |
|---|---|---|
| Confirm evidence and constraints | Product needs, user flows, platform and references | Source-grounded core rules, implementation scope and accepted specification |
| Build design-system source and Gallery | Confirmed constraints and currently needed assets | Real runtime styles/components, runnable Gallery, matching specifications and indexes |
| Build business pages and deliver | Real design assets and accepted business scope | Connected page/route/interaction source, synchronized Gallery patterns, runtime commands and verification results |

Continue through all confirmed stages; do not stop at scaffolding or the Gallery for a complete page request. Design-system-only requests finish the first two stages. Reuse the accepted scope without repeating identical approval; confirm high-impact scope changes. Register page-dependent components and patterns incrementally, not a speculative full component library.

## Before implementation

1. Read `.design-workflow/project-adapter.json` and verify relevant paths and commands.
2. Clarify the user flow, affected surfaces, states, and acceptance criteria.
3. Create a task specification under `.design-workflow/specs/` and obtain confirmation.

## Minimum 0→1 startup

Include a runnable Design System Gallery even on the minimum path. Start with real runtime tokens, then register implemented shared components and page patterns. Empty sections must be explicit, not filled with invented assets. Reuse an existing preview site or create a project development entry; record its command, URL and source in the design-system index. CLI `init` creates templates, not a runnable Gallery.

## Supplementary routing for existing assets

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

## Required source output

Write confirmed implementation into actual project source and connect its runtime entry. Record source paths, reuse, dependencies and startup/build commands. Minimum 0→1 startup includes runtime styles, the requested page/components and Gallery source. CLI initialization creates templates, not completed implementation.

## Delivery

- Run `design-workflow check` plus the project build, lint, and tests when available.
- For routing, asynchronous recovery, cross-page state, persistence, or reversible actions, verify the complete state loop: success, failure recovery, refresh persistence, reversal, and the final empty or boundary state.
- Reuse the project's existing E2E framework. Installing a test package does not guarantee its browser runtime is installed; prepare that runtime explicitly and keep binaries and reports out of source control.
- Static or styling-only changes do not require E2E unless they affect a critical interaction path.
- Synchronize design-system documents, Gallery specimens and indexes. For 0→1 delivery, a missing or non-runnable Gallery remains incomplete.
- Remove temporary proposal previews; retain the persistent Gallery.
- Produce a delivery summary with decisions, files, verification, and known risks.


## Task evidence and resumption

Only when the user requests evidence tracking or the project already adopts it, persist accepted scope and criteria with `design-workflow task create`. Track relevant implementation, shared consumers, configuration, test definitions and specification files. Use `task run` for actual static/build/E2E command results and `task record` for manual attachments and observed page/state/viewport coverage. Never treat unconfigured, unexecuted or stale checks as passed.

For projects using task tracking, start a resumed session with `task list` and `task status`. Use `task recover` only after the interrupted owner has exited, then rerun unfinished checks. `task finish` blocks when required evidence is absent or stale; optional gaps remain explicit risks. These records complement the task specification and do not grant new authorization.

Host-native planning and verification records remain sufficient for ordinary work; CLI token export and task state are not required to use the Design Harness.
