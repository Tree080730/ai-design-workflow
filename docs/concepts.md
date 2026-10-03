# Concepts

The design workflow and Skills are the core. The existing coding-agent host owns execution, models, permissions and sessions. CLI commands are optional helpers; managed token export and task evidence tracking are opt-in enhancements. See [Host integration](host-integration.md).

## Harness versus Skill

The Harness performs deterministic operations that should be repeatable and testable. Skills guide decisions that require context, interpretation, or design judgment.

| Concern | Owner |
|---|---|
| Detect stack and directories | Harness |
| Decide whether a component is semantically reusable | Skill |
| Create missing starter files | Harness |
| Choose a design direction | Skill + user confirmation |
| Detect hardcoded colors | Harness |
| Decide whether a new semantic token is justified | Skill |
| Run checks and report evidence | Harness |
| Explain tradeoffs and delivery risk | Skill |

## Project Adapter

The Adapter stores verified paths, commands, and project capabilities so each agent session does not start from zero. It must be revalidated against source code and configuration; it never overrides them.

## Rules, workflow, and design system

- `RULES.md`: durable cross-project-area constraints and approval boundaries.
- `DEV-WORKFLOW.md`: project-specific route mapping and verification commands.
- `design-system/`: visual values, component states, page patterns, layout, and interaction.
- Task spec: one delivery's scope, decisions, risks, and acceptance criteria.

Keeping these responsibilities separate prevents duplicated rules and stale values.

## Progressive disclosure

The proposal workflow first presents short directions, then expands only selected options, and finally renders only the selected previews. This reduces wasted generation without removing design exploration.
