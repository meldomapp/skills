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

To update, refresh the marketplace and reinstall; to remove, `claude plugin uninstall meldom@meldom` or
`codex plugin remove meldom@meldom`.

## Skills

| Skill   | What it does                                                                                 |
| ------- | -------------------------------------------------------------------------------------------- |
| `guide` | How Meldom works and how to drive it: tickets, notes, attachments, commands, terminals, worktrees. |

More land in the next release.

## Contributing

`node scripts/validate.mjs` is what CI runs. It checks that both manifests parse and agree on name and version,
that both marketplace files reference the plugin, and that every `skills/<name>/SKILL.md` declares a
`description` and a `name` equal to its folder. Run it before opening a pull request.

## Credits

Several of these workflows were shaped by [mattpocock/skills](https://github.com/mattpocock/skills), which is
worth reading on its own.

## License

MIT — see [LICENSE](LICENSE).
