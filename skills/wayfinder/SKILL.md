---
name: wayfinder
description: Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets in meldom, then resolve them one at a time until the way to the destination is clear. Use when a loose idea has open questions (research, prototype, or discussion) that must be settled across several sessions before it can be planned or built.
---

# Wayfinder

A loose idea has arrived — too big for one agent session, and wrapped in fog: the way from here to the **destination** isn't visible yet. Wayfinding is about finding that way, not charging at the destination. This skill charts the way as a **shared map** in meldom, then works its **decision tickets** — questions whose resolution is a decision, not slices of a build to execute — one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting — it shapes every ticket. It might be a spec to hand off and iterate on, a decision to lock before planning starts, or a change made in place like a data-structure migration. The map is domain-agnostic — engineering work, course content, whatever fits the shape.

## Plan, don't do

Wayfinder is **planning** by default: each ticket resolves a decision, and the map is done when the way is clear — nothing left to decide before someone goes and does the thing. The pull to just do the work is usually the signal you've reached the edge of the map and it's time to hand off. An effort can override this in its **Notes** — carrying execution into the map itself — but absent that, produce decisions, not deliverables.

## Refer by name

Every map and ticket is a meldom ticket, so it has a **title** and a key (`LOC-42`). In everything the human reads — narration, the map's Decisions-so-far — refer to it by its title, never by a bare id, number, or slug. A wall of `LOC-42, LOC-43, LOC-44` is illegible; titles read at a glance. The key doesn't vanish — it rides alongside the title — but it never stands in for it.

## The Map

The map is a meldom **parent ticket** labelled `wayfinder:map`, `assignee: "human"` (a planning artifact, not agent work) — the canonical map. Its tickets are child tickets (`parent_id` set to the map).

The map is an **index**, not a store. Its body lists the decisions made and points at the tickets that hold their detail; a decision lives in exactly one place — its ticket — so the map body never restates it, only gists it and links.

Meldom IS the tracker: the map is `mcp__meldom__ticket_view(map)`; its children and the frontier come from `mcp__meldom__ticket_list({ "parent_id": <map>, ... })` and `mcp__meldom__ticket_list({ "parent_id": <map>, "unblocked": true })`. There is no separate map file.

### The map body

The whole map at low resolution, loaded once per session via `ticket_view(map)`. Open tickets are **not** listed here — they are open child tickets, found by query.

```markdown
## Destination

<what reaching the end of this map looks like — the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index — one line per closed ticket: enough to judge relevance, then open the ticket for the detail it holds -->

- <closed ticket title> (LOC-N) — <one-line gist of the answer>

## Not yet specified

<!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- see "Out of scope": work ruled beyond the destination; closed, never graduates -->
```

### Tickets

Each ticket is a **child ticket** of the map (`parent_id` = the map's id); its meldom key is its identity. Its body is the question, sized to one 100K token agent session:

```markdown
## Question

<the decision or investigation this ticket resolves>
```

Each ticket carries a `wayfinder:<type>` label — one of `research`, `meldom:prototype`, `meldom:grilling`, `task` (see [Ticket Types](#ticket-types)).

A session **claims** a ticket by moving it to `in_progress` (`mcp__meldom__ticket_update`), **first**, before any work, so concurrent sessions skip it. An open, un-started ticket is unclaimed.

Blocking uses meldom's native `blocked_by`. A ticket is **unblocked** when every ticket blocking it is `done` or `closed`; the **frontier** is the open, unblocked, unclaimed children — the edge of the known. `mcp__meldom__ticket_list({ "unblocked": true })` returns the next frontier ticket.

The answer isn't part of the body — it's recorded on resolution (see [Work through the map](#work-through-the-map)). Assets created while resolving a ticket are linked from the ticket (a meldom note attached to it), not pasted in.

## Ticket Types

Every ticket is either **HITL** — human in the loop, worked _with_ a human who speaks for themselves — or **AFK**, driven by the agent alone. A HITL ticket only resolves through that live exchange; the agent never stands in for the human's side of it (a grilling agent that answers its own questions has broken this).

- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a **subagent** that calls the Skill tool with `research`; capture the summary as a meldom note attached to the ticket (or the map, when it's reference worth keeping). Use when knowledge outside the current working directory is required.
- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to — an outline, a rough take, a stub, or UI/logic code by calling the Skill tool with `meldom:prototype`. Use when "how should it look" or "how should it behave" is the key question.
- **Grilling** (HITL): Conversation. The default case. Always call the Skill tool twice, for `meldom:grilling` and `meldom:domain-modeling`.
- **Task** (HITL or AFK): Manual work that must happen before a _decision_ can be made — nothing to decide, prototype, or research, but the discussion is blocked until it's done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that _does_ rather than decides — and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.

## Fog of war

The map is _deliberately_ incomplete: don't chart what you can't yet see. Beyond the live tickets lies the **fog of war** — the dim view of decisions and investigations you can tell are coming but can't yet pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever's now specifiable into fresh tickets — one at a time, until the way to the destination is clear and no tickets remain.

The map's **Not yet specified** section is where that dim view is written down: the suspected question, the area to revisit later. It's the undiscovered frontier _toward_ the destination — everything here is in scope, just not sharp enough to ticket. Write as loosely or as fully as the view allows; it doubles as a signpost for collaborators reading where the effort is headed.

**Fog or ticket?** The test is whether you can state the question precisely now — _not_ whether you can answer it now.

- **Ticket when** the question is already sharp — even if it's blocked and you can't act on it yet.
- **Not yet specified when** you can't yet phrase it that sharply. Don't pre-slice the fog into ticket-sized pieces: it's coarser than a ticket, and one patch may graduate into several tickets, or none, once the frontier reaches it.

**Not yet specified** excludes what's already decided (Decisions so far), what's already a live ticket, and what's out of scope (the next section).

## Out of scope

Fog only ever gathers _toward_ the destination. The destination fixes the scope, so work beyond it is **out of scope** — it isn't fog, and it doesn't belong in **Not yet specified**. It gets its own **Out of scope** section on the map: work you've consciously ruled out of _this_ effort. Scope, not sharpness, lands it here.

Out-of-scope work never graduates — the frontier stops at the destination — so it returns only if the destination is redrawn, and then as a fresh effort, not a resumption.

Ruling something out of scope is a scoping act, not a step on the route. When a ticket that already exists turns out to sit past the destination — mis-scoped in while charting, or exposed by a resolution — **close it** (status `closed`, with a reason: a closed ticket is unambiguously off the frontier) and leave one line in the map's **Out of scope** section: the gist plus why it's out of scope, naming the closed ticket. It stays out of **Decisions so far**, which records the route actually walked — a scope boundary isn't a step on it.

## Invocation

Two modes. Either way, **never resolve more than one ticket per session** — with the exception of research tickets.

### Chart the map

User invokes with a loose idea.

1. **Name the destination.** Call the Skill tool twice, for `meldom:grilling` and `meldom:domain-modeling`, to pin down what this map is finding its way to — the spec, decision, or change. The destination fixes the scope, so it's settled first.
2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** — the way to the destination is already clear, the whole journey small enough for one session — you don't need a map. Stop and offer to skip it: recommend `meldom:implement` directly (the work is clear) or `meldom:to-tickets` to schedule a multi-session build.
3. **Create the map** — a parent ticket labelled `wayfinder:map`, `assignee: "human"`, its body Destination and Notes filled in, Decisions-so-far empty, the fog sketched into **Not yet specified**.
4. **Create the tickets you can specify now** as child tickets of the map (`mcp__meldom__ticket_batch_create`, `parent_id` = the map, each with its `wayfinder:<type>` label) — wire blocking with `blocked_by_index` in the same batch. Wiring sorts them into the frontier and the blocked; everything you can't yet specify stays in the fog — the **Not yet specified** section.
5. **Fire the research subagents.** For each `wayfinder:research` ticket you just created, spin up a subagent that calls the Skill tool with `research` to resolve it in parallel, each capturing its findings as a meldom note attached to its ticket.
6. Stop — charting is one session's work; it hand-resolves nothing.

### Work through the map

User invokes with a map (its key or id). A ticket is **optional** — without one, you pick the next decision, not the user.

1. Load the **map** — `ticket_view(map)`, the low-res view, not every ticket body.
2. Choose the ticket. If the user named one, use it. Otherwise take the next frontier ticket (`mcp__meldom__ticket_list({ "parent_id": <map>, "unblocked": true, "limit": 1 })`). **Claim it**: move it to `in_progress` before any work.
3. Resolve it — **zoom as needed**: `ticket_view` any related or closed ticket on demand for its full body; call the Skill tool for whichever skills the `## Notes` block names. If in doubt, call the Skill tool twice, for `meldom:grilling` and `meldom:domain-modeling`.
4. Record the resolution: post the answer as a **comment** (`mcp__meldom__comment_create`), set the ticket `done` (`mcp__meldom__ticket_update`), and append a one-line pointer to the map body's **Decisions so far**.
5. Add newly-surfaced tickets (batch-create, then they're wired); graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its new ticket. If the answer reveals a ticket — this one or another — sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If the decision invalidates other parts of the map, update or close those tickets.

The user may run unblocked tickets in parallel, so expect other sessions to be editing the map's subtree concurrently — re-read it before acting so you don't clobber a sibling's result.
