# ai-design-workflow CLI

```bash
npx ai-design-workflow scan
npx ai-design-workflow init
npx ai-design-workflow check
npx ai-design-workflow doctor
```

The CLI is deterministic and agent-agnostic. It creates only missing files by default; use `init --force` only when replacing managed starter artifacts is intentional.

`scan` records common unit and E2E directories, including `e2e`, `playwright`, and `cypress/e2e`, in the generated Project Adapter. This is structural discovery only: the CLI does not install browser runtimes, generate business tests, or claim that detected tests passed.
