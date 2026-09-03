# Meldom skills

The agent workflows [Meldom](https://meldom.com) is built around, as one plugin for **Claude Code** and
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
| `ask-meldom`                    | The map: which skill or flow fits your situation, and how they connect.               | user-invoked  |
| `to-tickets`                    | Turn a plan or conversation into a spec parent plus vertical-slice child tickets.     | model-invoked |
| `implement`                     | Build a ticket or spec in the current session, test-first.                            | model-invoked |
| `implement-spec`                | Land a whole PRD as one PR with parallel subagents.                                   | user-invoked  |
| `triage`                        | Move incoming tickets you did not author through categorise → verify → brief.         | model-invoked |
| `improve-codebase-architecture` | Find deepening opportunities and propose refactors as tickets.                        | model-invoked |
| `wayfinder`                     | Plan work too big for one session as a shared map of decision tickets.                | model-invoked |
| `prototype`                     | Build a throwaway prototype to settle a design question before committing to it.      | model-invoked |
| `grilling`                      | Stress-test a plan or decision with a relentless interview.                           | model-invoked |
| `grill-with-docs`               | Grill a plan against the codebase, capturing terms and decisions as docs.             | model-invoked |
| `explore-approaches`            | Generate several radically different approaches in parallel, then compare them.       | model-invoked |
| `code-review`                   | Review changes on two axes: repo coding standards, and the originating spec.          | model-invoked |
| `bulletproof`                   | Maximum-rigor pipeline: assumption audit, adversarial pass, cross-validation.         | model-invoked |
| `diagnosing-bugs`               | The diagnosis loop for hard bugs and performance regressions.                         | model-invoked |
| `codebase-design`               | Shared vocabulary for designing deep modules, and where a seam belongs.               | model-invoked |
| `domain-modeling`               | Build and sharpen a project's domain model; writes CONTEXT.md and ADRs.               | model-invoked |
| `tdd`                           | Test-driven development: the red-green-refactor loop.                                 | model-invoked |
| `resolving-merge-conflicts`     | Resolve an in-progress git merge or rebase conflict.                                  | model-invoked |
| `writing-for-agents`            | Writing documents for agents: skills, AGENTS.md, CLAUDE.md.                           | model-invoked |
| `teach`                         | Teach a concept or skill, in this workspace, at the right depth.                      | user-invoked  |
| `handoff`                       | Compact the conversation into a handoff document for another agent.                   | model-invoked |
| `wait-what`                     | Stop — that last message did not land. Re-pitch it.                                   | user-invoked  |
| `retro`                         | Retrospective on a session that went badly, when the environment is the suspect.      | user-invoked  |
| `ship`                          | Commit and push from a Meldom chat through the ship review card.                      | model-invoked |
| `merge-worktree`                | Land a worktree end to end and remove it through `worktree_remove`.                   | model-invoked |
| `research`                      | Investigate a question against primary sources and capture it as a Markdown file.     | model-invoked |
| `wizard`                        | Generate an interactive bash wizard for steps only a human can perform.               | model-invoked |
| `setup-matt-pocock-skills`      | Configure a repo for these skills: issue tracker, triage labels, domain docs.         | user-invoked  |
| `loop-me`                       | Grill you about the specs for the workflows you want to build in this workspace.      | user-invoked  |
| `grill-me`                      | The same relentless interview as `grill-with-docs`, but stateless — no repo needed.   | user-invoked  |
| `to-questionnaire`              | Turn a decision you cannot answer into a questionnaire for someone else to fill in.   | user-invoked  |

## Contributing

`node scripts/validate.mjs` is what CI runs. It checks that both manifests parse and agree on name and version,
that both marketplace files reference the plugin, and that every `skills/<name>/SKILL.md` declares a
`description` and a `name` equal to its folder. Run it before opening a pull request.

## Credits

Several of these workflows were shaped by [mattpocock/skills](https://github.com/mattpocock/skills), which is
worth reading on its own.

## License

MIT — see [LICENSE](LICENSE).
