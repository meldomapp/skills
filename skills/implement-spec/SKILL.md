---
name: implement-spec
description: "Implement the result of /meldom:to-spec and /meldom:to-tickets in code."
---

You have been provided a spec. This spec should have tickets associated with it, describing how to implement the spec.

The issue tracker should have been provided to you. If not, tell the user to run `/meldom:setup-matt-pocock-skills`.

The goal is the entire spec implemented on a single **integration branch**, with every ticket resolved the way the issue tracker closes work.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

**Implementer subagents** should be run in the background where possible for maximum concurrency.

## Steps

1. Read the spec and tickets to understand the task graph.

2. (optional) Use an **exploration subagent** to conduct any exploration required by the tickets - relevant codebase files or external documentation. Ensure the exploration subagent can save files - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **implementer subagents** focus on implementation rather than exploration.

3. Create the integration branch. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first merge in step 5 (a branch with no commits ahead of main can't open one), marked as closing the spec and tickets.

4. Use **implementer subagents** to implement each ticket, each in its own worktree on its own branch. Each implementer subagent:
   - confirms its worktree is based on the integration branch before starting, and resets onto it if not;
   - calls the Skill tool with `meldom:tdd` to build the ticket;
   - merges the integration branch tip into its own branch before reporting done

5. Once an **implementer subagent** completes, merge its work to the integration branch with a **merger subagent**.

6. If this changes the **frontier** of available tickets, kick off more **implementer subagents** to work on the new tickets. This allows for maximum concurrency.

7. Once all tickets are complete, call the Skill tool with `meldom:code-review` on the integration branch. Fix all issues raised by the code review in a single **implementer subagent**.

8. If a draft PR exists, mark it ready for review. Otherwise, resolve each ticket the way the issue tracker closes work, and report the integration branch.

9. Clean up all **implementer subagent** worktrees.

## On Meldom

- **Worktrees go through Meldom.** Give implementers separate worktrees whenever isolation helps; no user request is needed. Create each with `mcp__meldom__worktree_create` (`base` set to the integration branch, and `enter: false`, or this chat moves into it) and hand the implementer its `path`, or open a chat in it with `mcp__meldom__conversation_start`'s `worktree: { enabled, name, base }`. Never `git worktree add`: it is denied, because Meldom lists and cleans up only the worktrees it created. This chat owns every worktree it creates (`mcp__meldom__worktree_list` marks them `ownedByCaller`); remove each with `mcp__meldom__worktree_remove` in step 9. The app also removes a merged or never-used one on its own, but only as a safety net.
- **Shared checkout.** When the tickets run in this checkout instead, use the current branch as the integration branch. Capture `git rev-parse HEAD` before building. Run implementers one at a time in this checkout, following the blocking relationships; each leaves its changes uncommitted. Skip branch creation, branch resets, merges and worktree cleanup. After all tickets are implemented, run the full checks and review the combined changes against the captured commit. Fix findings, rerun affected checks and review until there are no findings, then commit through `meldom:ship`. Open a requested PR after that commit.
- **Separate worktrees.** Steps 4–6 require commits before merging. These commits go through `meldom:ship`; step 7 reviews the complete integration branch. Fix findings, rerun affected checks and review until there are no findings before step 8.
- **You own every ticket state.** Implementer subagents never call Meldom, so hand each one the ticket **body**, not its key. Move each ticket to `in_progress` with `mcp__meldom__ticket_batch_update` (keyed by ULID) before spawning its implementer, and check the `{id, success, error?}[]` it returns: it never throws.
- **No subagents?** If the current environment has no subagent tools, do the work in this session instead, following the same brief.
- **Commits** go through the Skill tool with `meldom:ship`, staging only the paths that ticket touched, never `git add -A`.
- **Report progress.** Send one plan with exactly one step per ticket, each its ticket's key and sized `S`, `M` or `L`: `mcp__meldom__progress({ "goal": "<spec title>", "plan": ["KEY-42:M"] })`. Moving a ticket to `done` marks its step done, so send no `done` for it. Send `{ "add": ["KEY-43:S"] }` for each ticket added later, and `{ "finish": true }` with the run's last tool call. If the tool is not there after one search, skip every progress call silently.
- **Record the final review per ticket.** Step 7 reviews all tickets together. For each ticket the review's Spec axis confirms, set `mcp__meldom__ticket_outcome({ "id": <ulid>, "outcome": "verified" })`, and `"failed"` for any it contradicts.
