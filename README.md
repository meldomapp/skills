# Meldom skills

The agent workflows [Meldom](https://meldom.app) is built around, as one plugin for **Claude Code** and
**Codex**. Install it once per provider and the same recipes work in the Meldom app and in your own terminal.

Meldom itself ships no skill files and never writes into `~/.claude/skills` or `~/.agents/skills`. This
repository is the only copy, and installing it is your provider's own job.

## Install

**Claude Code**

```bash
claude plugin marketplace add meldomapp/skills
claude plugin install meldom@meldom
```

**Codex**

```bash
codex plugin marketplace add meldomapp/skills
codex plugin add meldom@meldom
```

Both providers namespace a plugin's skills, so they are invoked as `/meldom:<skill>` in Claude Code and
`$meldom:<skill>` in Codex. Nothing here can shadow a skill of your own that happens to share a name.

**Updating.** The two providers differ, and the obvious command is wrong on one of them:

```bash
claude plugin update meldom@meldom     # refreshes the marketplace itself; `plugin install` will NOT upgrade
codex plugin marketplace upgrade       # replaces the version-keyed cache; no reinstall needed
```

**Removing** — `claude plugin uninstall meldom@meldom` or `codex plugin remove meldom@meldom`. Both leave the
marketplace registered, so installing again is one command.

## Skills

A **model-invoked** skill loads by itself when the work matches; a **user-invoked** one only runs when you ask
for it by name.

| Skill                           | What it does                                                                          | Invoked by    |
| ------------------------------- | ------------------------------------------------------------------------------------- | ------------- |
| `guide`                         | How Meldom works and how to drive it: tickets, notes, commands, terminals, worktrees. | model-invoked |
| `using-meldom`                  | Route any task to the right skill chain, then run it.                                 | model-invoked |
| `to-tickets`                    | Turn a plan or conversation into a spec parent plus vertical-slice child tickets.     | model-invoked |
| `implement`                     | Build a ticket or spec in the current session, test-first.                            | model-invoked |
| `implement-spec`                | Land a whole PRD as one PR with parallel subagents.                                   | user-invoked  |
| `triage`                        | Move incoming tickets you did not author through categorise → verify → brief.         | model-invoked |
| `issue-intake`                  | File bugs conversationally, exploring the codebase for context as you talk.           | model-invoked |
| `improve`                       | Audit a codebase and file prioritised tickets for other agents. Never edits code.     | model-invoked |
| `improve-codebase-architecture` | Find deepening opportunities and propose refactors as tickets.                        | model-invoked |
| `wayfinder`                     | Plan work too big for one session as a shared map of decision tickets.                | model-invoked |
| `prototype`                     | Build a throwaway prototype to settle a design question before committing to it.      | model-invoked |
| `grilling`                      | Stress-test a plan or decision with a relentless interview.                           | model-invoked |
| `skeptic`                       | Adversarial review: challenge assumptions, hunt edge cases, poke holes.               | model-invoked |
| `review`                        | Review changes for correctness, security, quality, reuse — and against their spec.    | model-invoked |
| `bulletproof`                   | Maximum-rigor pipeline: assumption audit, adversarial pass, cross-validation.         | model-invoked |
| `diagnosing-bugs`               | The diagnosis loop for hard bugs and performance regressions.                         | model-invoked |
| `sync-docs`                     | Detect stale documentation and bring it back in line with the code.                   | model-invoked |
| `retro`                         | Retrospective on a session that went badly, when the environment is the suspect.      | user-invoked  |
| `ship`                          | Commit and push from a Meldom chat through the ship review card.                      | model-invoked |
| `merge-worktree`                | Land a worktree end to end and remove it through `worktree_remove`.                   | model-invoked |

## Contributing

`node scripts/validate.mjs` is what CI runs. It checks that both manifests parse and agree on name and version,
that both marketplace files reference the plugin, and that every `skills/<name>/SKILL.md` declares a
`description` and a `name` equal to its folder. Run it before opening a pull request.

## Credits

Several of these workflows were shaped by [mattpocock/skills](https://github.com/mattpocock/skills), which is
worth reading on its own.

## License

MIT — see [LICENSE](LICENSE).
