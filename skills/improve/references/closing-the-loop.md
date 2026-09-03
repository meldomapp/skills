# Closing the Loop — execute, reconcile

The advisor's job doesn't end at the ticket. This file covers the two follow-through flows: dispatching an executor and reviewing its work (`execute`), and keeping the ticket backlog alive (`reconcile`).

The founding rule survives unchanged: **the advisor never edits source code.** In `execute`, a _separate executor subagent_ edits code in an isolated git worktree; the advisor dispatches, reviews, and renders a verdict — like a tech lead who doesn't push commits to your branch.

---

## `execute <ticket-id>` — dispatch and review

### Preconditions (check all before dispatching)

- The repo is a git repository (worktree isolation requires it). If not: stop and say so.
- Read the ticket with `mcp__meldom__ticket_view`, including its `attachments[]` (Read an attached image — a screenshot or diagram — when one is present). Every ticket in its `blocked_by` must be `done` or `closed`. If not: stop, name the open blocker.
- Run the ticket's drift check yourself. If in-scope files changed since `Planned at`, reconcile the ticket first (see below) — don't hand a stale ticket to an executor.

### Dispatch

Spawn **one** `general-purpose` subagent. Use `isolation: "worktree"` only when the user asked for a worktree in this conversation; otherwise run it in the current checkout. Executor model: default `sonnet`; use what the user named if they named one (`execute <id> haiku`).

The subagent prompt must contain:

1. **The full ticket body, inlined.** The ticket lives in meldom, not in the worktree — the executor can't read it from disk. Always paste the body in.
2. The executor preamble:

> You are the executor for the implementation ticket below. Follow it step by
> step. Run every verification command and confirm the expected result before
> moving on. Touch only the files listed as in scope. If any STOP condition
> occurs, stop immediately and report. Do not improvise around obstacles.
> Commit your work in the worktree following the ticket's git workflow section.
> One override: do NOT change the ticket's status in meldom — your reviewer owns
> it. Before reporting, audit every claim in your report against an actual tool
> result from this session — only report what you can point to evidence for; if
> a verification failed or was skipped, say so plainly. When finished, reply
> with exactly the report format below.

3. The report format:

```
STATUS: COMPLETE | STOPPED
STEPS: per step — done/skipped + verification command result
STOPPED BECAUSE: (only if STOPPED) which STOP condition, what was observed
FILES CHANGED: list
NOTES: anything the reviewer should know (deviations, surprises, judgment calls)
```

### Review (the advisor's real job here)

Note on fresh worktrees: they share git history but not `node_modules` or build artifacts — the executor must install dependencies first, and check tooling that resolves from `dist/` may need one build even though the ticket's command table (recon'd in the main tree) didn't mention it. Expect this; it isn't a deviation.

Review like a tech lead reviewing a PR against the spec — never fix anything yourself:

1. **Re-run every done criterion** in the worktree. Don't trust the executor's report — verify.
2. **Scope compliance**: `git -C <worktree> diff --stat` against the ticket's in-scope list. Any file outside scope fails review, full stop.
3. **Read the full diff.** Judge it against "Why this matters" (does it solve the actual problem?) and the repo conventions named in the ticket (does it look like the rest of the codebase?).
4. **Audit the new tests.** Executors game criteria — a test that asserts nothing meaningful passes `pnpm test` and proves nothing. Read what the tests assert.

### Verdict

**Documented deviations are judged on merit, not reflex-blocked.** "Do not improvise" exists to stop silent drift; an executor that hits a real obstacle (e.g. the ticket's approach breaks existing test mocks), adapts minimally, and explains it in NOTES has done the right thing. Approve it if the adaptation serves the ticket's intent and stays in scope; treat _undocumented_ deviations as review failures.

| Verdict     | When                                                                     | Action                                                                                                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **APPROVE** | Criteria pass, scope clean, quality holds                                | `mcp__meldom__ticket_update` the ticket to `done` with a one-line reason (`closed` is the human's later archive). Present to the user: diff summary, worktree path and branch, anything from NOTES. **Merging is the user's decision — never merge, push, or commit to their branch.** |
| **REVISE**  | Fixable gaps                                                             | SendMessage to the same executor with specific, actionable feedback ("criterion 3 fails: X; the error handling in `api.ts:90` swallows the error — use the Result pattern per the ticket"). **Max 2 revision rounds**, then BLOCK.                                                     |
| **BLOCK**   | STOP condition hit, scope violated unrecoverably, or revisions exhausted | Leave the ticket `open` and add a `mcp__meldom__comment_create` with the reason. Refine or rewrite the ticket body with what was learned. Tell the user what happened and what changed.                                                                                                |

Running verification commands inside the executor's worktree is fine — it's isolated and disposable. The no-mutating-commands rule protects the user's working tree, not the worktree.

---

## `reconcile` — keep the backlog alive

Process what happened since the last session. Pull the improve tickets with `mcp__meldom__ticket_list` (filter by the `meldom:improve` label) and `ticket_view` each, then per status:

- **done** — spot-check that the done criteria still hold on the current HEAD (cheap ones only). Don't reopen on a pass — done tickets are the record.
- **open with a blocker comment** — read the reason. Investigate the underlying obstacle in the codebase. Either rewrite the body around it (or file a new ticket if the approach changed fundamentally) or close it with a one-line rejection reason.
- **in_progress** (stale) — flag it to the user; an executor probably died mid-run. Check the worktree if one exists.
- **open, ready** — run the drift check. If drifted: re-verify the finding still exists (it may have been fixed in passing), then refresh the "Current state" excerpts and `Planned at` SHA in the body. If the finding is gone, close it ("fixed independently").

Finish with a short report: what's verified done, what was refreshed, what's rejected, and what's executable right now (`ticket_list` with `unblocked: true`).
