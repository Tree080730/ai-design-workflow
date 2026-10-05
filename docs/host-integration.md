# Host-first Design Harness

The product focuses on 0→1 design-system construction and business-page development inside an existing coding agent. The default sequence confirms evidence and constraints, implements design-system source and a Gallery, then builds business pages using those assets. Existing-project support is supplementary. The host supplies the model, agent execution loop, permissions, file/shell/browser tools and sessions. The Harness supplies Skills, project constraints, reuse decisions and verification guidance. A standalone agent runtime and GUI are outside the current scope.

## Install from this checkout

Requires Node.js 18+ for the installer. The target project must already exist; it may be empty for 0→1 work.

```bash
node scripts/install-host.mjs /path/to/project --host codex
node scripts/install-host.mjs /path/to/project --host claude
```

Use `--host both` for both hosts. `--dry-run` previews the full write set without changes; `--json` produces the installation receipt. This does not install a model, register MCP servers, change permissions, execute Skills or initialize product tokens.

| Host | Project Skill directory | Project instruction entry |
|---|---|---|
| Codex | `.agents/skills/` | `AGENTS.override.md` when present, otherwise `AGENTS.md` |
| Claude Code | `.claude/skills/` | Existing root `CLAUDE.md`, otherwise existing `.claude/CLAUDE.md`, otherwise new root `CLAUDE.md` |

The same four Skill directories are copied, including references, templates and the standalone scanner. No symlinks or dependencies on the checkout are required after installation. Skills can also be copied manually to the documented directories, with an equivalent scoped entry added to the host instruction file.

The short entry selects `designer-dev-workflow` for page/component/style/interaction work. It does not embed the entire workflow in every prompt or trigger full rule audits for unrelated tasks. Other Skills are invoked conditionally.

Existing instruction text is preserved. The installer manages only its marked block and Skill files recorded in `.design-workflow/host-installation.json`. Reinstall updates unchanged managed files and is otherwise idempotent. User-modified resources, malformed markers, obsolete source resources, changed instruction locations and conflicting same-name Skills stop installation before planned writes. Resolve those deliberately rather than force overwriting. Extra untracked files in Skill directories are preserved.

All conflicts are checked before writing, and each file replacement is atomic. Installation is not a transaction across all files or a concurrent multi-process operation: an I/O failure can leave a partial install; inspect the receipt and files, then retry. The installer rejects symlinked destination paths. Keep the receipt with the project for reliable updates.

This iteration installs project-scoped Skills. Global installation, plugin-marketplace distribution, automatic hooks and uninstall management are not provided.

## Open the host and converse

Start a new session in the project. Ask:

> Tell me which Design Harness workflow is available, locate its SKILL.md, and identify the project constraints you would use for page development. Do not modify files yet.

Then use an ordinary development request:

> Implement the settings page using this project's existing design rules and reusable components. Verify the applicable states and desktop/narrow layouts.

If discovery fails, explicitly invoke the Skill: `$designer-dev-workflow` in Codex, or `/designer-dev-workflow` in Claude Code. Check working directory, allowed skill sources, project instruction resolution and host policies. Installing files alone does not prove the host loaded them or will follow every instruction. Nested instruction files can alter behavior; review them when working in subdirectories.

## Keep the core small

- Required product capability: Skills guide the host to read/build necessary constraints, reuse assets, implement and verify pages, and maintain the design system.
- Optional engineering helpers: CLI scan/init/check/doctor when useful to the current project.
- Optional enhancements: managed token export, explicit asset mapping and persisted task evidence when deliberately adopted.

For 0→1 delivery, the host uses the bundled [delivery contract and gate](delivery-contract.md) by default. A user need not create a task plan, switch token formats or run manual CLI steps for each request. The host executes suitable tools behind the conversation. Missing optional configurations are not evidence that the Harness failed to load.

The installer does not initialize starter design assets. In 0→1 work, the host establishes the minimum usable constraints as part of development; in existing projects, it adopts actual code, components and the existing token pipeline.

## Verified scope

Repository tests cover installation, instruction preservation, conflicts, idempotence, source updates, active instruction locations and portable scanner execution after copying. They do not exercise actual Codex or Claude Code model sessions. Perform the conversational self-check above in the target host before claiming end-to-end activation.

## Official basis

Checked on 2026-10-03:

- [Codex Skills](https://learn.chatgpt.com/docs/build-skills) documents project discovery in `.agents/skills` and explicit Skill invocation.
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) documents project instructions and override precedence.
- [Claude Code Skills](https://code.claude.com/docs/en/skills) documents project Skills in `.claude/skills` and invocation.
- [Claude Code Memory](https://code.claude.com/docs/en/memory) documents CLAUDE.md loading. A CLAUDE.md entry is used for predictable compatibility rather than depending on conditional AGENTS.md fallback.

Project entries guide model behavior; they are not a hard enforcement or permissions layer.
