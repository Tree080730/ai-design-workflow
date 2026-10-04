# Project Rules

## Sources of truth

- Source code and executable configuration define current project behavior.
- `design-system/` defines visual tokens, component states, and page patterns.
- `.design-workflow/project-adapter.json` is an index and cache, not a source of truth.

## Required behavior

1. Read the relevant implementation and its callers before changing code.
2. Reuse existing semantic tokens, components, and page patterns before adding new ones.
3. Clarify missing product or interaction decisions instead of inventing them.
4. Confirm high-impact changes before implementation: shared components, global tokens, routing, state foundations, build configuration, and new dependencies.
5. Keep loading, empty, error, disabled, and boundary states explicit when they apply.
6. Synchronize design-system documents and indexes after changing shared design assets.

## Source delivery

Page, component and design-system implementation requests require editable source in the target project, connected to real entries/consumers. Deliver necessary styles/token integration, current components, Gallery and runtime configuration within the confirmed scope. Documentation, screenshots, token JSON, dist output and temporary previews alone are not implementation. Missing required source or disconnected entries mean incomplete; unexecuted runtime checks remain unverified.

## Temporary work

- Proposal previews must not call production APIs or create business side effects.
- Temporary proposal routes and preview files must be removed before delivery; retain the persistent Gallery and formal implementation.

## Verification

- Run the project build and available static checks.
- Exercise the primary interaction path.
- When a change affects recovery, persistence, cross-page state, or reversible actions, verify the resulting state after failure, refresh, retry, and reversal where applicable; the presence of a control alone is not evidence that the flow works.
- Record unverified behavior in the delivery summary.

## Rule boundaries

- Put project-wide invariants here.
- Put paths and commands in `DEV-WORKFLOW.md` and the Project Adapter.
- Put visual values and component details in `design-system/`.
- Put one-off decisions in the task specification.
