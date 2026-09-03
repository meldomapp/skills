---
name: to-tickets
description: Turn a plan, spec, or conversation into Meldom tickets — a spec parent when the scope needs one, then independently-grabbable child tickets as tracer-bullet vertical slices. Use when the user wants to write a spec, convert a plan into tickets, break work down, or file implementation tickets.
---

# Meldom To Tickets

One skill for ticket creation. It decides the parent and the children: Phase A writes a spec and publishes it as the parent ticket; Phase B breaks the work into child tickets. Pick the phases, then run them in order.

## Phase routing

| Situation                                        | Run                                                                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The user passed a parent ticket id               | Phase B only — fetch it with `ticket_view({ id })`, and read its `attachments[]` too (Read an attached mockup or spec image to ground the child slices) |
| Scope unclear or cross-cutting (warrants a spec) | Phase A, then Phase B                                                                                                                                   |
| Scope clear, no parent yet                       | Phase B only — it creates a plain parent itself                                                                                                         |

If the whole task fits in one ticket, publish that single ticket and stop — no parent, no spec. A parent exists to organize two or more children, never one.

If the user asked only for a spec, stop after Phase A.

## Phase A — the spec parent

Take the current conversation and your understanding of the codebase and produce a spec. Do NOT interview the user — synthesize what you already know.

1. Explore the repo to understand the current state of the code, if you have not already.

2. Sketch the seams at which the feature will be tested. Prefer existing seams to new ones, and use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase the better — the ideal number is one. State them briefly and move on; do not wait for sign-off.

3. Write the spec using the template below, then publish it as the parent with `ticket_create({ title, body, type: "prd", parent_id: null })`. A spec is a deliberate root, so say `parent_id: null` explicitly — omitting it files the spec under the current chat's home PRD, which is right only for a follow-up to that PRD. Phase B's children link back through `parent_id`.

<spec-template>

## Problem Statement

The problem the user faces, from the user's perspective.

## Solution

The solution, from the user's perspective.

## User Stories

A LONG, numbered list. Each one in the format:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see the balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list should be extensive and cover every aspect of the feature.

## Implementation Decisions

The decisions that were made. This can include:

- The modules that will be built or modified
- The interfaces of those modules
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include file paths or code snippets — they go stale fast.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (a state machine, a reducer, a schema, a type shape), inline it in the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts.

## Testing Decisions

Include:

- What makes a good test here (external behavior, never implementation details)
- Which modules will be tested
- Prior art — similar tests already in the codebase

## Out of Scope

What this spec deliberately does not cover.

## Further Notes

Anything else worth recording.

</spec-template>

## Phase B — the child slices

Break the plan into independently-grabbable tickets using vertical slices (tracer bullets).

### 1. Gather context

Work from whatever is already in the conversation, including a Phase A spec. If the user passed a parent ticket id, it was fetched during routing.

### 2. Explore the codebase

If you have not already, explore to understand the current state of the code. Look for prefactoring that would make the implementation easier: make the change easy, then make the easy change.

### 3. Draft vertical slices

Each ticket is a thin vertical slice cutting through ALL integration layers end to end, never a horizontal slice of one layer.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Each slice fits in a single fresh context window
- Any prefactoring comes first
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

**Wide refactors are the exception.** A wide refactor is one mechanical change — rename a column, retype a shared symbol — whose blast radius fans across the codebase, so a single edit breaks thousands of call sites and no vertical slice can land green. Sequence it as expand–contract instead. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping the build green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches cannot stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket — green is promised only there.

### 4. State the breakdown, then publish

Present the slices as a numbered list for transparency — title, blocked by, what it delivers end to end, and which user stories it covers. Then publish immediately. Do not ask whether the granularity or the dependencies are right and do not wait for a go-ahead; the user can redirect after seeing what was created.

### 5. Publish

Call `ticket_batch_create({ entries: [...] })` — one transaction. If no parent exists yet, create one first with `ticket_create` and `parent_id: null` (a new parent is a deliberate root), then set its id as `parent_id` on every entry; a lone slice needs none. Use `blocked_by_index` (0-based, within the batch) for dependencies between the new tickets. Entries carry an optional `assignee` (`human` or `agent`, default `agent`) — set `"assignee": "human"` for any slice the user will do themselves.

```jsonc
ticket_batch_create({
  "entries": [
    { "title": "Publish installs the skill", "parent_id": "<spec-id>", "body": "..." },
    { "title": "App surfaces name it", "parent_id": "<spec-id>", "body": "...", "blocked_by_index": [0] }
  ]
})
```

Use this body template for each child:

<ticket-template>
## Parent

Ticket <parent-id>

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not a layer-by-layer implementation.

Avoid file paths and code snippets — they go stale fast. Exception: a prototype snippet that encodes a decision more precisely than prose can (a state machine, a reducer, a schema, a type shape); inline it and say it came from a prototype, trimmed to the decision-rich parts.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- A reference to the blocking ticket (if any)

Or "None - can start immediately" when there are no blockers.

</ticket-template>

Task: $ARGUMENTS
