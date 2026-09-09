---
name: implement
description: Build one coherent piece of work from a meldom parent ticket (a spec) or a set of tickets, in the current session. Use when the work is already specified and you want to build it now, test-first, rather than draining a queue. Use when the user says "implement this", "implement", "build the ticket", or hands you a spec/ticket to build in-context.
---

# Implement

Build the work described by a meldom parent ticket (a spec) or a set of tickets, in this session. This is the single-session, in-context build, and the default build step for every ticket-producing chain. To land a whole spec as one PR with parallel subagents instead, recommend `meldom:implement-spec` and hand back — it is user-invoked only, so you cannot reach it with the Skill tool.

The **scope** is the set of tickets handed to you at step 1 — a parent means all its open children as of that read, unless the user explicitly narrows it — plus every follow-up this session files. Completion means every ticket in the scope reads `done` or `closed`, each implemented, verified and reviewed here. Work that surfaces after the read is a follow-up (step 3), and it joins the scope: this same session builds it in its next pass (step 6).

1. **Read the work.** Pull the ticket(s) with `mcp__meldom__ticket_view({ "id": <id> })` — read the parent's body (the spec) and each child's acceptance criteria. Read any `attachments[]` (a mockup/spec image) to ground the build. Read the attached `notes[]` and the project's domain glossary (`CONTEXT.md`, if it exists) so names match the domain language.

2. **Claim the work.** Move the ticket you are about to build — and its parent spec — to `in_progress` with `mcp__meldom__ticket_batch_update({ "entries": { "<ulid>": { "status": "in_progress" }, ... } })`. Key its `entries` by the ticket's **ULID**, the `id` field step 1 returned, never the `KEY-42` form that `ticket_list` prints: `ticket_view` accepts either, but `ticket_batch_update` and `ticket_outcome` take only the ULID and reject a key outright. The board shows what is being worked on right now, so make the move before writing code, not after.

3. **Implement at the pre-agreed seams.** Call the Skill tool with `meldom:tdd` where a seam is testable — write the failing test at that seam, then the minimal code to pass. Reach for the Skill tool with `meldom:codebase-design` when an interface needs designing.

   Work an in-scope acceptance criterion cannot pass without is in scope: build it. Everything else the build surfaces — a bug beside the seam, a piece the spec skipped, a refactor that would help — is a **follow-up**: file it the moment you see it with `mcp__meldom__ticket_create({ "title": "...", "body": "<what you saw, where, and its acceptance criteria>", "parent_id": "<parent ulid>" })`, then return to the criterion you were on. A follow-up always lives inside the family of the ticket you are building, so always pass `parent_id` explicitly: the parent is the spec from step 1, or the ticket's own parent when it has one. When the ticket you are building is a root with no parent, give it one first — `ticket_create({ "title": "<the ticket's title>", "body": "<one line naming the ticket it groups>", "type": "spec", "parent_id": null })`, then `ticket_update({ "id": "<ticket ulid>", "parent_id": "<new spec ulid>" })` — and file the follow-up under that spec. A follow-up filed as a board root is a mistake; reparent it at once.

4. **Verify proportionally.** Use targeted tests while iterating, run typechecking regularly, and run the full test suite at most once per task, at the end. Never run repeated full-suite loops. If the task explicitly requires suite benchmarking, use one run per variant.

   Run tests through the project's own test script, scoped to what you touched:

   ```bash
   bun test tests/checkout.test.ts   # while iterating
   bun run test                      # the whole suite, through the project's script, once at the end
   ```

   ```bash
   bunx bun test                             # never: a bare runner over a whole tree
   bun run typecheck | tail && bun run test  # never: without pipefail the gate never gates
   ```

   The project's script is where the flags that keep a suite survivable live — parallel workers, per-file
   isolation, memory bounds — and a bare runner over a whole tree gets none of them: on 2026-09-03 one grew to
   35 GB and froze the machine mid-task. The piped gate is worse than useless: the pipeline's exit status is
   `tail`'s, so that command ran the suite over a **failing** typecheck. Run each check as its own step and read
   its own exit code.

   Keep the board honest as you go: the moment a child ticket's acceptance criteria pass, `ticket_update` it to `done` with a `reason`, and claim the next one as `in_progress` before starting it. At any point exactly one ticket is `in_progress` and every finished one reads `done` — never batch the status moves up to the end of the session.

5. **Review, then record the outcome.** When the work is done, call the Skill tool with `meldom:code-review` over the changes. Its Spec axis is what checks each ticket against its acceptance criteria, so read that report per ticket and set `mcp__meldom__ticket_outcome({ "id": <ulid>, "outcome": "verified" })` for the ones it confirms. A ticket the report contradicts gets `"outcome": "failed"` and goes back to `open` — do not leave it reading `done`.

6. **Build the follow-ups, then record in meldom, don't commit.** An open follow-up is not a stopping point. `ticket_view` the parent to see the scope's state: if any ticket in the scope is still open — one handed to you, or a follow-up this session filed — go back to step 1 with those open tickets and build them. Repeat until a pass files nothing new and leaves nothing in the scope open. Only then finish: every ticket you touched carries its final status, and parent status never rolls up from children, so when every child of the parent is `done` or `closed`, close it explicitly with `ticket_update` to `done` and `reason: "All children done: <summary>"`. Then walk upward — a parent you just closed may complete *its* parent (a `wayfinder:map` over a spec, say) — and repeat until no parent qualifies. The one exception is a step only a human can take — a credential, a third-party dashboard, an external system: hand it over through `meldom:wizard` or a question to the user, and leave only that ticket open. The conversation is already open — it auto-tracks the tickets you touch, so there's nothing to start or finish. Do NOT auto-commit — leave committing to the user or `meldom:ship` (meldom works on `main`; commit at the end, not mid-build).

   The final message says the work is implemented and reviewed, per ticket. It never lists open tickets, next steps, or anything left for the user: there is nothing left, or the session is not finished.
