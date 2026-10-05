# Delivery contract and gate / 默认交付检查

0→1 delivery now uses a project-level `.design-workflow/delivery.json` and a portable verifier installed with the Workflow Skill. The host records confirmed scope, real source/entries, Gallery/page URLs and required checks; the verifier blocks missing artifacts, incomplete static integration, failed or missing checks and stale evidence. It reuses the existing task engine, without a new agent runtime or CLI installation requirement.

See the portable [contract, commands, evidence format and enforcement boundaries](../skills/designer-dev-workflow/references/delivery-gate.md) and [JSON starting point](../skills/designer-dev-workflow/references/delivery-contract-template.json). Commands are identical for all hosts; replace the installed path for Claude Code.

```bash
node .agents/skills/designer-dev-workflow/scripts/verify-project.mjs status .
```

This read-only gate returns JSON and exits 2 until all mandatory declared checks pass, then exits 0. Add it to CI to enforce the result. Individual `run`/`record` commands return 0 when their own criterion passes; this does not mean the whole delivery passed.

The React + Vite example includes a **pending**, design-system-only contract. Its Gallery is a candidate demonstration, not a confirmed or fully verified business delivery. Do not automatically mark it confirmed or reuse historical browser notes as current evidence.

Task evidence is local and Git-ignored. CI must rerun command checks and obtain matching browser/design artifacts for the same source revision. The gate does not authenticate manual observations or prevent a writable project from changing its own contract. Static reachability is conservative; alias/framework wiring requires explicit runtime mode and actual browser evidence. Passing declared acceptance is not a universal visual-quality guarantee.
