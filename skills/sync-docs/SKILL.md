---
name: sync-docs
description: Detect stale documentation and update it to match current codebase state using incremental git-based sync. Use when user says "sync docs", "update docs", "docs are outdated", "refresh docs", "update readme", or documentation doesn't reflect current functionality.
---

# Sync Docs

Incremental doc sync powered by git diff. Tracks last sync commit in `.claude/meldom-settings.json`. Generates and maintains `docs/` + root files + CLAUDE.md.

**Flags:** `--full` (force full resync) | `<path>` (sync specific file)

## Phase 1 - Determine Scope

Read `.claude/meldom-settings.json` for `lastSyncCommit`. Three paths:

| Condition                | Action                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hash exists + valid      | `git diff <hash>..HEAD --name-only` + `git diff --name-only` (unstaged) + `git diff --cached --name-only` (staged). Merge into changed file set. |
| Hash missing or `--full` | Full resync. Spawn agents to explore entire codebase.                                                                                            |
| `<path>` argument        | Skip discovery, sync that file only.                                                                                                             |

Group changed files by directory. Spawn 1 Explore agent per affected directory (cap at 5) to understand what changed and how it affects docs.

## Phase 2 - Explore Codebase

**Full resync** (no hash or `--full`): discover project structure from root. Spawn parallel Explore agents across top-level source directories. Each agent reports: purpose of the directory, key modules, data flow, domain concepts, public interfaces.

**Incremental**: agents only explore directories with changes. Report what changed and whether it affects architecture, domain concepts, or CLI surface.

## Phase 3 - Generate/Update Docs

Managed files:

| File                   | Content                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md` (root)     | Minimal: project purpose, commands, architecture summary, key conventions. Links to deeper docs. Under 200 lines. |
| `docs/architecture.md` | Layer structure, data flow, design decisions. Where things live and why.                                          |
| `README.md` (root)     | What it is, install, quick start. Project entry point.                                                            |

See [doc-writing-rules.md](references/doc-writing-rules.md) for content rules.

## Phase 4 - Cross-Doc Check

After writing all docs, scan for:

- Same concept described differently across files
- Duplicated content that should be a link instead
- Stale references to renamed or removed things

Fix contradictions inline. Do not defer to user.

## Phase 5 - Finalize

Update `.claude/meldom-settings.json` with current HEAD hash.

## Output

```
Sync Docs - Done

Scope: incremental (abc1234..def5678, 12 files changed)
Agents: 3 (3 affected directories)

Updated:
  docs/architecture.md - added work session layer
  README.md - refreshed CLI commands
  CLAUDE.md - updated documentation links

Contradictions fixed: 1 (README said "ticket", architecture.md said "issue")
Last sync commit: def5678
```

## Gotchas

| Trap                                               | Fix                                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Writing code details (classes, functions, imports) | Docs describe architecture and purpose only. See doc-writing-rules.md                                      |
| Em dashes in generated text                        | Voice rule bans them. Use hyphens (-) or rewrite.                                                          |
| Duplicating content across docs                    | If it exists in one doc, LINK to it from others. Do not copy.                                              |
| CLAUDE.md exceeding 200 lines                      | Documentation section is links only. One line per doc.                                                     |
| `git diff` empty on squash-merged history          | Fall back to file mtime comparison                                                                         |
| Overwriting manual doc edits                       | Check git status of doc files before writing. Warn if uncommitted changes.                                 |
| README command table duplicating skill             | README is for humans (install, quick start). Skills are for agents. Different audiences, different detail. |

## Edge Cases

| Scenario                        | Handling                            |
| ------------------------------- | ----------------------------------- |
| No .claude/meldom-settings.json | Create it. Treat as full resync.    |
| No docs/ directory              | Create it. Full resync.             |
| `--full`                        | Ignore lastSyncCommit, full explore |
| Specific file arg               | Sync that file only                 |
| No changes since last sync      | "Docs are up to date"               |
| Git unavailable                 | Fall back to file mtime. Warn.      |

Task: $ARGUMENTS
