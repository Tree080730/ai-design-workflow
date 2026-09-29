# Interaction

## Shared states

- Loading: preserve layout where practical and communicate progress.
- Empty: explain the state and provide a relevant next action.
- Error: identify what failed and whether retry or recovery is possible.
- Disabled: keep the reason discoverable when it is not obvious.

## Feedback

- Confirm destructive or difficult-to-reverse actions.
- Keep focus visible and keyboard order predictable.
- Avoid motion that is required to understand state changes; respect reduced-motion preferences.