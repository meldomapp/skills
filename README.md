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

**Updating.** The two providers differ, and the obvious command is wrong on one of them. Codex's needs the
marketplace name, or it upgrades every marketplace you have added:

```bash
claude plugin update meldom@meldom       # refreshes the marketplace itself; `plugin install` will NOT upgrade
codex plugin marketplace upgrade meldom  # replaces the version-keyed cache; no reinstall needed
```

**Removing** — `claude plugin uninstall meldom@meldom` or `codex plugin remove meldom@meldom`. Both leave the
marketplace registered, so installing again is one command.

## Skills

A **model-invoked** skill loads by itself when the work matches; a **user-invoked** one only runs when you ask
for it by name.

| Skill                           | What it does                                                                          | Invoked by    |
| ------------------------------- | ------------------------------------------------------------------------------------- | ------------- |
| `ask-meldom`                    | The map: which skill or flow fits your situation, and how they connect.               | user-invoked  |
| `to-spec`                       | Turn the conversation into a spec and publish it as a ticket of type `spec`.          | user-invoked  |
| `to-tickets`                    | Break a plan or spec into vertical-slice tickets with blocking edges.                 | user-invoked  |
| `implement`                     | Build a ticket or spec in the current session, test-first.                            | user-invoked  |
| `implement-spec`                | Implement a whole spec on one integration branch with parallel subagents.             | user-invoked  |
| `triage`                        | Move incoming tickets you did not author through categorise → verify → brief.         | user-invoked  |
| `improve-codebase-architecture` | Find deepening opportunities, show them as an HTML report, then grill the one you pick. | user-invoked  |
| `wayfinder`                     | Plan work too big for one session as a shared map of decision tickets.                | user-invoked  |
| `prototype`                     | Build a throwaway prototype to settle a design question before committing to it.      | model-invoked |
| `grilling`                      | Stress-test a plan or decision with a relentless interview.                           | model-invoked |
| `grill-with-docs`               | Grill a plan against the codebase, capturing terms and decisions as docs.             | user-invoked  |
| `code-review`                   | Review changes on two axes: repo coding standards, and the originating ticket.        | model-invoked |
| `security-audit`                | Audit exploitable security weaknesses and verify security fixes.                      | model-invoked |
| `diagnosing-bugs`               | The diagnosis loop for hard bugs and performance regressions.                         | model-invoked |
| `codebase-design`               | Shared vocabulary for designing deep modules, and where a seam belongs.               | model-invoked |
| `domain-modeling`               | Build and sharpen a project's domain model; writes GLOSSARY.md and ADRs.              | model-invoked |
| `tdd`                           | Test-driven development: the red-green-refactor loop.                                 | model-invoked |
| `writing-for-agents`            | Writing documents for agents: skills, AGENTS.md, CLAUDE.md.                           | model-invoked |
| `teach`                         | Teach a concept or skill, in this workspace, at the right depth.                      | user-invoked  |
| `handoff`                       | Compact the conversation into a handoff document, as a file and a meldom note.        | user-invoked  |
| `wait-what`                     | Stop — that last message did not land. Re-pitch it.                                   | user-invoked  |
| `retro`                         | Conduct a retrospective on a coding session.                                          | user-invoked  |
| `ship`                          | Commit and push from a Meldom chat through the ship review card.                      | model-invoked |
| `merge-worktree`                | Land a worktree end to end and remove it through `worktree_remove`.                   | model-invoked |
| `pr`                            | Write a PR body fast to review: a visual, before/after evidence, merge danger.        | model-invoked |
| `research`                      | Investigate a question against primary sources; capture it as a file and a note.      | model-invoked |
| `wizard`                        | Generate an interactive bash wizard for steps only a human can perform.               | model-invoked |
| `grill-me`                      | The same relentless interview as `grill-with-docs`, but stateless — no repo needed.   | user-invoked  |
| `to-questionnaire`              | Turn a decision you cannot answer into a questionnaire for someone else to fill in.   | user-invoked  |
| `setup-matt-pocock-skills`      | Configure the issue tracker (Meldom), triage labels and domain docs for the skills.   | user-invoked  |

## Customizing and syncing

Most of these skills are ports of [mattpocock/skills](https://github.com/mattpocock/skills): upstream's text,
with Meldom in place of the trackers upstream names, and Meldom's own additions in one `## On Meldom` section at
the bottom of each skill.
[PORTING.md](PORTING.md) is the ledger: one section per ported skill, listing every difference and the reason
for it, plus the global rules (namespacing, Meldom as the tracker) that hold across all of them.

If you change a ported skill, update its ledger section in the same commit. That is what lets the next upstream
sync tell a real upstream change from a deliberate local edit, instead of guessing.

## Contributing

`node scripts/validate.mjs` is what CI runs. It checks that both manifests parse and agree on name and version,
that both marketplace files reference the plugin, that every `skills/<name>/SKILL.md` declares a
`description` and a `name` equal to its folder, and that every skill carries an `agents/openai.yaml` whose
Codex policy agrees with the Claude `disable-model-invocation` flag. It also checks that every skill has a row
in the table above, an entry in the `ask-meldom` map, and a section in [PORTING.md](PORTING.md). Run it before
opening a pull request.

## Credits

Several of these workflows were shaped by [mattpocock/skills](https://github.com/mattpocock/skills), which is
worth reading on its own.

## License

MIT — see [LICENSE](LICENSE).
