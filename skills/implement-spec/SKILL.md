---
name: implement-spec
description: "Implement a meldom PRD across all its tickets in parallel, landing one PR."
disable-model-invocation: true
---

You have been provided a **PRD** — a meldom parent ticket of `type: "prd"`, holding the spec in its body. Its child tickets are the vertical slices that implement it, the ones `meldom:to-tickets` published.

The goal is a PR which implements the whole PRD on a single branch.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the PRD, its tickets, attached notes, and previous commits. Don't duplicate information already available via pointers.

This is the heavy path — many subagents, a branch, a PR, then a full review pass. It costs several times what `meldom:implement` costs for the same tickets. Reach for it only when you want the whole PRD landed as one reviewable PR without babysitting it; otherwise use `meldom:implement`.

## Rules

- **ONLY `mcp__meldom__*` tools** for ticket data. You own every ticket state transition; subagents never call meldom. `ticket_batch_update` keys its `entries` by ticket **ULID**, not the `KEY-3` form that `ticket_list` prints.
- **Never run `git worktree add`.** Worktree creation is user-driven.
- **Concurrency follows isolation, and nothing else.** Two subagents writing one checkout cannot be committed apart — when one finishes, the other's half-written files are sitting in the same tree.
  - **Worktrees the user already gave you** → one implementer per worktree, run in the background for real concurrency.
  - **No worktrees (the default)** → **one implementer at a time.** Let it finish, commit it, then start the next. Slower, but every commit is exactly one ticket.
- **Commit only the paths that ticket touched** (`git add <paths>`), never `git add -A` or `git commit -a`. Guards attribution even when something unexpected is dirty.
- **Committing from a Meldom chat goes through the ship card**, per `meldom:guide`: call the Skill tool with `meldom:ship` for each commit rather than raw `git commit`. Only commit with raw git when you are not in a Meldom chat.
- Subagents never commit and never push. You own the branch.

## Steps

1. Read the PRD and its tickets — `mcp__meldom__ticket_view({ "id": <prd-id> })` for the PRD body, then its children with their `blocked_by` edges. Read enough to understand the task graph. Read attached `notes[]` and `attachments[]`; an attachment's local `path` is Readable.

2. (optional) Use an **exploration subagent** to conduct any exploration required by the tickets - relevant codebase files or external documentation. Ensure the exploration subagent can save files - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **implementer subagents** focus on implementation rather than exploration.

3. Create the branch. Hold the draft PR until after the first commit — `gh pr create` fails on a branch with no commits between it and base.

4. Work the frontier with **implementer subagents** (`Agent(subagent_type: "meldom:meldom-worker")`), at the concurrency the Rules allow. If the provider has no subagents at all — Codex does not — do this work in the current session instead, following the same brief. Move each ticket to `in_progress` with `mcp__meldom__ticket_batch_update` before spawning, and hand the subagent the ticket body itself — a subagent cannot call meldom, so a ticket id is not a pointer it can follow. Inspect the `{id, success, error?}[]` the batch call returns: it never throws, so an unchecked failure leaves a ticket stranded.

5. When a subagent reports success, commit its paths and move the ticket to `done` with a `reason`. Open the draft PR here if it does not exist yet, pointing at the PRD and listing the child ticket keys. If the subagent reports failure, do **not** commit and do **not** mark it done — leave it `in_progress`, record why, and carry it to the final summary. The frontier must never advance onto a broken base.

6. Recompute the **frontier** and continue until no ticket is left.

7. Once all tickets are complete, call the Skill tool with `meldom:review` on the PR branch. Fix all issues raised by the review in a single **implementer subagent**. Record each ticket the review's Spec axis confirms with `mcp__meldom__ticket_outcome({ "id": <id>, "outcome": "verified" })`, and any it contradicts as `"failed"`.

8. Mark the PR as ready for review, and move the PRD to `done` once every child is `done` or `closed` — parent status never rolls up on its own. Walk upward too: a closed PRD may complete its own parent. Any ticket left `in_progress` from step 5 keeps the PRD open; say so in the summary.

9. Print a summary and set `mcp__meldom__conversation_update({ "summary": "<1-2 sentences on what this run built>" })`.
