---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Call the Skill tool with "meldom:tdd" where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with "meldom:code-review" to review the work.

Commit your work to the current branch.

## On Meldom

- **Commit through the ship card.** Committing from a Meldom chat goes through the Skill tool with `meldom:ship`, never a raw `git commit`.
- **Claim before building.** Move the ticket you are about to build, and its parent spec, to `in_progress` with `mcp__meldom__ticket_batch_update`, keyed by each ticket's **ULID** (the `id` field), never its `KEY-42` key. Exactly one ticket is `in_progress` at a time.
- **Report progress.** On the first pass, send one plan with exactly one step per ticket, each sized `S`, `M` or `L`: `mcp__meldom__progress({ "goal": "<spec title>", "plan": ["<ticket title>:M"] })`. Send `{ "done": <step> }` with each ticket's move to `done`, `{ "add": ["<title>:S"] }` for each ticket added later, and `{ "finish": true }` with the run's last tool call. If the tool is not there after one search, skip every progress call silently.
- **Mark each ticket done as it passes.** The moment a ticket's acceptance criteria pass, `mcp__meldom__ticket_update` it to `done` with a `reason`, then claim the next one.
- **Build what you file.** Work the build surfaces beyond the tickets is a follow-up: file it at once with `mcp__meldom__ticket_create`, `parent_id` set to the spec or the ticket's own parent, and build it in this session. Before you finish, read `mcp__meldom__conversation_status`; while any ticket this session created is open, build it. The one exception is a step only a human can take: hand it over through `meldom:wizard` or a question.
- **Record the review.** For each ticket the review's Spec axis confirms, set `mcp__meldom__ticket_outcome({ "id": <ulid>, "outcome": "verified" })`. A ticket it contradicts gets `"failed"`, goes back to `open`, and is built again.
- **Close the parent.** Parent status never rolls up on its own: when every child is `done` or `closed`, move the parent to `done` with `reason: "All children done: <summary>"`, then check its own parent the same way.
