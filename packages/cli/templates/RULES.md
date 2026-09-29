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

## Temporary work

- Proposal previews must not call production APIs or create business side effects.
- Temporary routes and preview files must be removed before delivery.

## Verification

- Run the project build and available static checks.
- Exercise the primary interaction path.
- Record unverified behavior in the delivery summary.

## Rule boundaries

- Put project-wide invariants here.
- Put paths and commands in `DEV-WORKFLOW.md` and the Project Adapter.
- Put visual values and component details in `design-system/`.
- Put one-off decisions in the task specification.
