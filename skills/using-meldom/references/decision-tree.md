# Decision Tree

One row per intent. Pick the first match. Chains that produce tickets end with `→ meldom:implement`.

## Classification Table

| User wants to...                                                  | Chain                                                   | Parent?        |
| ----------------------------------------------------------------- | ------------------------------------------------------- | -------------- |
| Build a feature (new, or has spec/parent)                         | meldom:to-tickets → meldom:implement                    | if 2+ tickets  |
| Implement already-specified work (PRD/tickets in hand, build now) | meldom:implement                                        | no             |
| Fix a bug                                                         | meldom:issue-intake → meldom:implement                  | no             |
| Report multiple bugs                                              | meldom:issue-intake → meldom:implement                  | yes if related |
| Triage incoming raw tickets (backlog you didn't author)           | meldom:triage                                           | no             |
| Diagnose hard bug (need repro/debug loop)                         | meldom:diagnosing-bugs → meldom:implement               | no             |
| Audit a codebase / find improvements / roadmap / suggest features | meldom:improve → meldom:implement                       | yes            |
| Refactor code (doesn't know what)                                 | meldom:improve-codebase-architecture → meldom:implement | yes            |
| Design/improve a module's interface, make code testable           | codebase-design                                         | no             |
| Pin down domain terms or record a decision                        | domain-modeling (writes CONTEXT.md/ADRs)                | no             |
| Loose idea with open questions (multi-session)                    | meldom:wayfinder → meldom:implement                     | yes            |
| Resolve a merge/rebase conflict                                   | resolving-merge-conflicts                               | no             |
| Explore multiple approaches to a problem                          | explore-approaches                                      | no             |
| Prototype a design (data model, state, UI)                        | meldom:prototype                                        | no             |
| Stress-test a plan                                                | meldom:grilling → reclassify after                      | no             |
| Sharpen an idea against the codebase (capture terms/decisions)    | grill-with-docs                                         | no             |
| Save/recall reference material (knowledge base)                   | note tools (no skill chain)                             | no             |
| Attach a file to a ticket/note/comment                            | attachment tools (no skill chain)                       | no             |
| Update documentation                                              | meldom:sync-docs                                        | no             |
| Review code changes (quality, security, reuse, spec conformance)  | meldom:review                                           | no             |
| Clean up after changes                                            | polish                                                  | no             |
| Deep research                                                     | research                                                | no             |
| Challenge assumptions                                             | meldom:skeptic                                          | no             |
| Maximum-rigor execution                                           | meldom:bulletproof                                      | no             |
| Land a whole PRD as one PR (parallel, heavy)                      | meldom:implement-spec †                                 | yes            |
| Retrospective on a coding session                                 | meldom:retro †                                          | no             |
| Ship changes                                                      | meldom:ship                                             | no             |
| Open a pull request                                               | pr                                                      | no             |

† **User-invoked only** (`disable-model-invocation: true`). You cannot reach these with `Skill()`. When one is the right answer, print the chain line, say the user should invoke it themselves, and hand back.

"Spec" and "PRD" name the **same object** — a `type: "prd"` parent ticket that `meldom:to-tickets` publishes. Holding one does not tell you which row to pick; the discriminator is **execution mode**: `meldom:implement` builds it in this session, `meldom:implement-spec` farms it out to subagents behind one PR.

## Main flow (idea → ship)

Most work travels one path. Use it to decide where a task enters and what comes next:

1. **Sharpen the idea** — `meldom:grilling` (no codebase), or `grill-with-docs` when you have one (it runs grilling _with_ `domain-modeling`, capturing terms in `CONTEXT.md` and decisions as ADRs as you go).
2. **Open questions?** If a question needs a runnable answer (state, logic, a UI you must see), detour through `meldom:prototype`. If it needs more than one session of investigation, `meldom:wayfinder` charts a shared map of decision tickets and drives them one at a time.
3. **Build:**
   - Multi-session / many slices → `meldom:to-tickets` (spec parent + child slices) → `meldom:implement` (in-context, test-first, no auto-commit).
   - One coherent piece, specified and clear now → `meldom:implement`.
   - A whole PRD you want landed as one PR with parallel subagents → `meldom:implement-spec` (user-invoked only; recommend it, don't call it). It is the heavy path; reach for it deliberately, not by default.
4. **Upkeep, not features** — `meldom:improve-codebase-architecture` (built on `codebase-design`, grills with `meldom:grilling`, keeps the model current with `domain-modeling`). Picking a candidate generates an idea that re-enters at step 1.
5. **After code lands** — `meldom:review` → `meldom:ship` → `pr` (standalone; don't auto-append). `meldom:retro` afterwards when a run went badly and the environment is the suspect (user-invoked only; recommend it, don't call it).

**On-ramp** — raw incoming tickets you didn't author (board/HTTP-filed reports, peer-synced, bug reports) go through `meldom:triage` first: categorise → verify → brief. It produces `ready-for-agent` tickets that `meldom:implement` then picks up. Don't meldom:triage tickets `meldom:to-tickets`/`meldom:improve` already produced — they're agent-ready.

`codebase-design`, `domain-modeling`, and `meldom:grilling` are also reached _by_ other skills mid-flow — they're the shared design/vocabulary skills, not just standalone entry points.

## Chain Details

### Feature

meldom:to-tickets picks its own phases: unclear scope gets a spec parent first (via `mcp__meldom__ticket_create({ "title": "...", "body": "..." })`), clear scope goes straight to slicing with a plain parent, and a passed parent ticket id skips parent creation. Child tickets link through the `parent_id` field in each entry. Tickets carry an `assignee` (`human` or `agent`, default `agent`); a slice the user will own gets `"assignee": "human"`. `meldom:implement` then builds that parent's subtree in this session.

### Bug fix

issue-intake runs an interactive session filing each bug as a meldom ticket. `meldom:implement` then builds just those tickets — their parent if one was created, or the explicit id list for a single bug.

### Diagnose (hard bug)

meldom:diagnosing-bugs runs the reproduce → minimise → hypothesise → instrument → fix → regression-test loop. Use when the bug needs disciplined debugging (mystery, regression, perf). Files a meldom ticket at Phase 6 if worth tracking.

### Audit / roadmap (broad)

improve surveys the whole codebase as a senior advisor across every category — bugs, security, performance, test coverage, tech debt, dependencies, DX, docs, and product direction — and files prioritized, self-contained meldom tickets for others to build. Use for "audit this", "find improvements", "what should we build next", "roadmap". It's read-only on source; `meldom:implement` builds the tickets it files.

### Refactor (exploratory)

meldom:improve-codebase-architecture finds what needs work and files tickets; `meldom:implement` builds them. **vs improve:** meldom:improve-codebase-architecture is narrow — architecture and testability (deep-module) refactors only; meldom:improve is the broad multi-category audit + roadmap. "Make this more testable / less tangled" → meldom:improve-codebase-architecture; "audit the whole thing / where do we take this" → meldom:improve.

### Triage (incoming tickets)

triage moves raw tickets you didn't author through a role state machine (category + state mapped to meldom labels/status/assignee), verifies the claim, grills if needed, and writes an agent brief into the ticket body. Output is `ready-for-agent` / `ready-for-human` / `needs-info` / `wontfix` tickets, not new work — `meldom:implement` picks up the agent-ready ones. Distinct from issue-intake, which _creates_ tickets from a conversation; triage _processes_ tickets that already exist.

### Implement (in-context build)

implement builds one coherent piece from a parent ticket (the spec) or a set of tickets, in the current session, test-first via tdd. Use when the work is already specified and you want it built now. It is the default build step for every ticket-producing chain; no auto-commit — leaves that to `meldom:ship`.

### Implement-spec (parallel, one PR)

implement-spec is **user-invoked only** — recommend it, never `Skill()` it. It takes a PRD (a `type: "prd"` parent ticket) whose children form a task graph and works the frontier with parallel implementer subagents, committing each onto one branch behind a draft PR, then runs `meldom:review` before marking the PR ready. It is deliberately heavier than `meldom:implement` — reach for it only when you want the whole PRD landed as a single reviewable PR without babysitting it.

### Wayfinder (multi-session investigation)

wayfinder charts a loose idea with open questions as a shared map — a parent ticket labelled `wayfinder:map` plus decision child tickets (research / prototype / grilling / task), wired with `blocked_by`, resolved one at a time until the way to the destination is clear. Use when the idea needs more than one session to settle before it can be planned. If grilling surfaces no fog, it skips the map and points at implement or meldom:to-tickets.

### Test-first alternative to implement

For a single, well-scoped feature or bug where the contract is clear, swap `meldom:implement` for `tdd` (red-green-refactor on one unit). `meldom:implement` covers a whole ticket set; `tdd` is depth on one unit.

### Explore approaches

explore-approaches spawns parallel sub-agents with different constraints, compares trade-offs, and picks a winner. This is a design exploration skill; it doesn't create tickets or produce implementation. The user can follow up with a new chain (e.g., meldom:to-tickets → meldom:implement) to build the chosen approach.

### Prototype

meldom:prototype builds throwaway code to answer a single design question — a single shareable HTML demo for a state/logic question, or several toggleable UI variations for a "what should this look like" question. No tickets, no kept implementation. Once the design settles, follow up with meldom:to-tickets → meldom:implement; decision-rich snippets from the meldom:prototype feed into it.

### Knowledge base (notes)

Reference material the user wants saved for later (project conventions, decisions, recall-on-demand context) maps to the `mcp__meldom__note_*` tools, not a skill chain. Write with `note_create`, pull back with `note_list`/`note_view`. When the material concerns specific tickets, attach it (`ticket_ids` on create, or `note_update` with `attach_to`) so it surfaces in their `ticket_view`. No new tickets, no implementation. Notes are per-project knowledge, separate from tickets.

### Attachments (files)

Attach a file you generated to the ticket, note, or comment it belongs to with `attachment_add({ target_id, path, file_name? })` (author `agent`); `attachment_delete({ id })` removes one. The generate-then-attach flow: write the file to a temp path, call `attachment_add` with that path and the target id, then drop the temp file. `ticket_view`/`note_view` return each attachment with its local blob `path` (Read it to load an image; `ticket_view` also returns per-comment attachments). The CLI mirror is `meldom attachment add|list|delete`. No skill chain, no new tickets.

### Post-execution quality

After any chain that writes code, the user can follow up with quality passes — `meldom:review` (which also checks the change against its originating ticket/spec when one exists), `polish`, `reduce` — then `meldom:ship` → `pr`. These are standalone; don't auto-append them.
