# Task state, verification evidence and recovery

A task stores its accepted scope and checks independently of a chat session. This is an opt-in execution record, not a replacement for the task specification or user decisions. Creating a task does not execute its commands. It creates local task state and appends a task-directory ignore rule to the project `.gitignore` if needed, preserving existing entries.

## Create a plan

```json
{
  "schemaVersion": 1,
  "id": "settings-page",
  "title": "Implement settings page",
  "changeTypes": ["page"],
  "inputs": ["src/Settings.tsx", "src/styles/theme.css", "package.json", "package-lock.json", ".design-workflow/config.json"],
  "criteria": [
    {"id": "static", "kind": "static", "title": "Project static checks", "command": ["npm", "run", "lint"]},
    {"id": "build", "kind": "build", "title": "Project build", "command": ["npm", "run", "build"]},
    {
      "id": "layout", "kind": "visual", "title": "Rendered layout review",
      "context": {"pages": ["/settings"], "viewports": ["desktop", "narrow"]}
    }
  ]
}
```

Select commands that actually exist in the project. `inputs` lists the relevant source, tokens, shared consumers, configuration, test definitions and specification files. Inputs may initially be missing, so a new page can be tracked before creation. Only listed files are hashed; untracked changes, new files outside the list, tools outside the project and environment changes are not detected automatically. Include indirect dependencies relevant to the acceptance result.

The plan is copied into task state and is immutable through these commands. If scope or acceptance changes materially, create a follow-up task with a new id and record its relation in the specification. Existing task ids are never replaced.

Paths in plans and attachment records are relative to the project. `--file` is resolved relative to the invoking terminal's current directory.

```bash
node packages/cli/bin/design-workflow.mjs task create /path/to/project --file /path/to/plan.json
node packages/cli/bin/design-workflow.mjs task run /path/to/project --task settings-page --check static
node packages/cli/bin/design-workflow.mjs task run /path/to/project --task settings-page --check build
```

Commands use an executable/argument array, run in the project directory, and do not use a shell implicitly. A command must use a real executable available on the calling platform. `timeoutMs` defaults to 60000 and supports 1–60000 milliseconds. Longer checks should be split into bounded checks or use an existing runner separately; manual notes cannot turn an automated criterion into a pass.

`task run` persists the running attempt before execution, then stores stdout/stderr, exit code, signal/error, and hashes. Nonzero exit, launch failure, timeout or output-buffer failure is a failure. Inputs changing during execution produce a stale result, even if the command exits zero. Rerun after changes settle. No dependencies or browser runtimes are installed automatically.

A successful command proves execution and its exit result, not the quality of its assertions. Planned E2E context is labeled `declaredContext`; it is not automatically inferred from logs or reported as observed coverage.

## Record manual verification

Example evidence JSON:

```json
{
  "criterionId": "layout",
  "status": "passed",
  "note": "Observed /settings at 1440×900 and 390×844. Checked alignment, overflow, text wrapping and controls.",
  "artifacts": ["verification/settings-desktop.png", "verification/settings-narrow.png", "verification/layout-notes.md"],
  "context": {"pages": ["/settings"], "viewports": ["desktop", "narrow"]}
}
```

```bash
node packages/cli/bin/design-workflow.mjs task record /path/to/project --task settings-page --file /path/to/evidence.json
```

Manual statuses are `passed`, `failed`, `unverified`, and `not-applicable`. A pass needs existing attachment files, a note and the criterion's declared page/state/viewport coverage. Attachments are hashed; they must stay outside task state. This validates that evidence was supplied, not its truth: a screenshot, note or test report still needs human/agent interpretation. The record is explicitly marked `manual` and is not an automated E2E result.

Automated criteria cannot be manually passed. Static/build/E2E criteria must declare executable commands; manual browser checks use `interaction`. `not-applicable` is available only when the plan explicitly sets `allowNotApplicable: true`, and always needs a reason.

## Risk and minimum coverage

Supported change types: `token`, `component`, `page`, `layout`, `routing`, `async`, `cross-page`, `persistence`, `reversible`, `docs`. These labels are declared by the task author; the CLI does not infer them from code diffs.

- Every task needs at least one required criterion.
- Code changes need mandatory static and build criteria that cannot be marked not applicable.
- Token, component, page and layout changes also need required visual criteria with page/preview identifiers and desktop plus narrow viewports.
- Routing, async, cross-page, persistence and reversal changes are high risk and need required interaction/E2E criteria with page identifiers and success coverage. Additional applicable states: `not-found`, `failure`/`recovery`, `cross-page`, `refresh`, `reversal`/`final-state` respectively.

Multiple required criteria can collectively cover the expected viewports or states. The application may have further states and dimensions beyond these minimum labels; add them to acceptance criteria. For high-risk manual verification without E2E infrastructure, use interaction evidence and explicitly document that automated E2E remains unverified.

## Finish, resume and recovery

```bash
node packages/cli/bin/design-workflow.mjs task list /path/to/project
node packages/cli/bin/design-workflow.mjs task status /path/to/project --task settings-page
node packages/cli/bin/design-workflow.mjs task finish /path/to/project --task settings-page
```

`status` provides criteria, latest results, full attempt history, blockers, risks, next actions and the state-file location. `list` discovers tasks for a fresh session, including errors in unreadable state files.

Required checks must be passed or explicitly not applicable before finishing. Otherwise finish is blocked and exits 2. Optional incomplete/failed/stale criteria remain visible as risks and produce `completed-with-risks`. A missing or changed attachment, or any changed tracked input, invalidates old evidence. A previously completed task with mandatory stale evidence displays `verification-stale` until checks are rerun and completion is recorded again.

A new attempt preserves old history and reopens the task. Evidence logs and state persist under `.design-workflow/tasks/<id>/`, excluded from Git by default. Plan templates may be tracked; actual local records remain local. Users should preserve or deliberately export this directory when moving to another machine; a Git checkout alone does not carry ignored task evidence.

State writes are atomic and mutations take an exclusive per-task lock. Read-only status does not execute commands. After a process interruption:

```bash
node packages/cli/bin/design-workflow.mjs task recover /path/to/project --task settings-page
```

Recovery removes a lock only if its owning PID no longer exists, then returns the current state. It does not pass or silently retry an interrupted check. A surviving `running` attempt needs a fresh execution. PID reuse or an invalid lock requires inspection; recovery never steals a live process's lock. There is no distributed lock across copied directories or hosts.

## Example

The React + Vite fixture includes `.design-workflow/task-plan.json`:

```bash
node packages/cli/bin/design-workflow.mjs task create examples/react-vite --file examples/react-vite/.design-workflow/task-plan.json
node packages/cli/bin/design-workflow.mjs task run examples/react-vite --task token-integration --check static
node packages/cli/bin/design-workflow.mjs task run examples/react-vite --task token-integration --check build
node packages/cli/bin/design-workflow.mjs task finish examples/react-vite --task token-integration
```

The final command remains blocked until real visual evidence is recorded. Static/build success must not be substituted for the visual check.
