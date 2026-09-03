---
name: implement
description: Build one coherent piece of work from a meldom parent ticket (a spec) or a set of tickets, in the current session. Use when the work is already specified and you want to build it now, test-first, rather than draining a queue. Use when the user says "implement this", "implement", "build the ticket", or hands you a spec/ticket to build in-context.
---

# Implement

Build the work described by a meldom parent ticket (a spec) or a set of tickets, in this session. This is the single-session, in-context build, and the default build step for every ticket-producing chain. To land a whole PRD as one PR with parallel subagents instead, recommend `meldom:implement-spec` and hand back — it is user-invoked only, so you cannot reach it with the Skill tool.

Completion means every in-scope ticket and acceptance criterion is implemented, verified, reviewed, and recorded. A parent includes all its open children unless the user explicitly narrows the scope.

1. **Read the work.** Pull the ticket(s) with `mcp__meldom__ticket_view({ "id": <id> })` — read the parent's body (the spec) and each child's acceptance criteria. Read any `attachments[]` (a mockup/spec image) to ground the build. Read the attached `notes[]` and the project's domain glossary (`CONTEXT.md`, if it exists) so names match the domain language.

2. **Claim the work.** Move the ticket you are about to build — and its parent spec — to `in_progress` with `mcp__meldom__ticket_batch_update({ "entries": { "<ulid>": { "status": "in_progress" }, ... } })`. Key its `entries` by the ticket's **ULID**, the `id` field step 1 returned, never the `KEY-42` form that `ticket_list` prints: `ticket_view` accepts either, but `ticket_batch_update` and `ticket_outcome` take only the ULID and reject a key outright. The board shows what is being worked on right now, so make the move before writing code, not after.

3. **Implement at the pre-agreed seams.** Call the Skill tool with `meldom:tdd` where a seam is testable — write the failing test at that seam, then the minimal code to pass. Reach for the Skill tool with `meldom:codebase-design` when an interface needs designing.

4. **Verify proportionally.** Use targeted tests while iterating, run typechecking regularly, and run the full test suite at most once per task, at the end. Never run repeated full-suite loops. If the task explicitly requires suite benchmarking, use one run per variant.

   Keep the board honest as you go: the moment a child ticket's acceptance criteria pass, `ticket_update` it to `done` with a `reason`, and claim the next one as `in_progress` before starting it. At any point exactly one ticket is `in_progress` and every finished one reads `done` — never batch the status moves up to the end of the session.

5. **Review, then record the outcome.** When the work is done, call the Skill tool with `meldom:code-review` over the changes. Its Spec axis is what checks each ticket against its acceptance criteria, so read that report per ticket and set `mcp__meldom__ticket_outcome({ "id": <ulid>, "outcome": "verified" })` for the ones it confirms. A ticket the report contradicts gets `"outcome": "failed"` and goes back to `open` — do not leave it reading `done`.

6. **Record in meldom, don't commit.** Every ticket you touched now carries its final status; close the gap for any that don't. Parent status never rolls up from children, so finish the spec explicitly: `ticket_view` the parent, and when every child is `done` or `closed`, `ticket_update` it to `done` with `reason: "All children done: <summary>"`. Then walk upward — a parent you just closed may complete *its* parent (a `wayfinder:map` over a spec, say) — and repeat until no parent qualifies. If any in-scope child remains open, return to step 3 and continue. Leave the parent open only when a concrete external blocker requires user input or new authority; name the blocker and exact unblock action in the summary. The conversation is already open — it auto-tracks the tickets you touch, so there's nothing to start or finish. Do NOT auto-commit — leave committing to the user or `meldom:ship` (meldom works on `main`; commit at the end, not mid-build).
