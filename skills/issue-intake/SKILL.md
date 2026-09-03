---
name: issue-intake
description: Interactive issue intake session where user describes problems conversationally, and the agent files meldom tickets. Explores the codebase in the background for context and domain language. Use when user wants to report bugs, file issues conversationally, or mentions "issue intake".
allowed-tools: AskUserQuestion
---

# Issue Intake

Run an interactive issue intake session. The user describes problems they're encountering. You clarify, explore the codebase for context, and file meldom tickets that are durable, user-focused, and use the project's domain language.

**Scope:** Clarify, explore the codebase for context, and file tickets. Do NOT write code or fix anything. Return control when the user ends the session — `meldom:implement` runs next in the chain.

## For each problem the user raises

### 1. Listen and lightly clarify

Let the user describe the problem in their own words. Use the `AskUserQuestion` tool for **at most 2-3 short clarifying questions** focused on:

- What they expected vs what actually happened
- Steps to reproduce (if not obvious)
- Whether it's consistent or intermittent

Provide concrete options where possible (e.g. "Consistent" / "Intermittent" / "Not sure"). Do NOT over-interview. If the description is clear enough to file, move on.

### 2. Explore the codebase in the background

While talking to the user, kick off an Agent (subagent_type=Explore, model=sonnet) in the background to understand the relevant area. The goal is NOT to find a fix — it's to:

- Learn the domain language used in that area
- Understand what the feature is supposed to do
- Identify the user-facing behavior boundary

This context helps you write a better ticket — but the ticket itself should NOT reference specific files, line numbers, or internal implementation details.

### 3. Assess scope: single ticket or breakdown?

Before filing, decide whether this is a **single ticket** or needs to be **broken down** into multiple tickets.

Break down when:

- The fix spans multiple independent areas (e.g. "the form validation is wrong AND the success message is missing AND the redirect is broken")
- There are clearly separable concerns that different people could work on in parallel
- The user describes something that has multiple distinct failure modes or symptoms

Keep as a single ticket when:

- It's one behavior that's wrong in one place
- The symptoms are all caused by the same root behavior

### 4. File the meldom ticket(s)

Call `mcp__meldom__ticket_create` with the ticket fields directly. Set `type: "bug"`, fill `body`, `labels`, `affected_files`. Optionally `blocked_by`, or `parent_id` when the bug belongs under an existing ticket. A bug that stands on its own is a deliberate root — pass `parent_id: null`; omitting `parent_id` files it under the current chat's home PRD, which is what you want only when the bug is a follow-up to what that chat is already working on. Tickets carry an `assignee` (`human` or `agent`, default `agent`); set `"assignee": "human"` when the bug is one the user will handle themselves. Do NOT ask for review - file and share the ID.

```json
{ "title": "...", "type": "bug", "body": "...", "labels": ["..."], "affected_files": ["..."] }
```

For breakdowns, call `mcp__meldom__ticket_batch_create({ "entries": [...] })` in one transaction. Use `blocked_by_index` (0-based) for intra-batch deps or concrete IDs for existing tickets.

Tickets must be **durable** — they should still make sense after major refactors. Write from the user's perspective.

#### For a single ticket

Use this template:

```
## What happened

[Describe the actual behavior the user experienced, in plain language]

## What I expected

[Describe the expected behavior]

## Steps to reproduce

1. [Concrete, numbered steps a developer can follow]
2. [Use domain terms from the codebase, not internal module names]
3. [Include relevant inputs, flags, or configuration]

## Additional context

[Any extra observations from the user or from codebase exploration that help frame the issue — e.g. "this only happens when using the Docker layer, not the filesystem layer" — use domain language but don't cite files]
```

#### For a breakdown (multiple tickets)

First create a parent tracking ticket via `mcp__meldom__ticket_create` with `parent_id: null` — a new tracking parent is a deliberate root — then call `mcp__meldom__ticket_batch_create({ "entries": [...] })` once with the full array, setting `parent_id` on every entry. Use `blocked_by_index` (0-based) to wire dependencies within the batch, or `blocked_by` with concrete IDs of previously-created tickets.

Use this template for each child ticket:

```
## Parent

Ticket <parent-id>

## What's wrong

[Describe this specific behavior problem — just this slice, not the whole report]

## What I expected

[Expected behavior for this specific slice]

## Steps to reproduce

1. [Steps specific to THIS ticket]

## Blocked by

Set `"blocked_by": [<id>]` or `"blocked_by_index": [<array-index>]` on the JSON entry. Also note in body:

- Ticket <id> (if this ticket can't be fixed until another is resolved)

Or "None — can start immediately" if no blockers.

## Additional context

[Any extra observations relevant to this slice]
```

When creating a breakdown:

- **Prefer many thin tickets over few thick ones** — each should be independently fixable and verifiable
- **Mark blocking relationships honestly** — if ticket B genuinely can't be tested until ticket A is fixed, say so. If they're independent, mark both as "None — can start immediately"
- **Prefer the single-batch array form** when tickets in the breakdown depend on each other — `blocked_by_index` keeps the dependency wiring inside one atomic create
- **Maximize parallelism** — the goal is that multiple people (or agents) can grab different tickets simultaneously

#### Rules for all ticket bodies

- **No file paths or line numbers** — these go stale
- **Use the project's domain language**
- **Describe behaviors, not code** — "the sync service fails to apply the patch" not "applyPatch() throws on line 42"
- **Reproduction steps are mandatory** — if you can't determine them, ask the user
- **Keep it concise** — a developer should be able to read the ticket in 30 seconds

After filing, print all ticket IDs (with blocking relationships summarized) and ask: "Next problem, or done? (If done, I hand back — the build runs separately.)"

### 5. Continue the session

Keep going until the user says they're done. Each ticket is independent — don't batch them. When done, STOP. Do not start implementing — the chain invokes `meldom:implement` next.

## Gotchas

| Failure                             | Fix                                                    |
| ----------------------------------- | ------------------------------------------------------ |
| Implementing fixes mid-session      | Never. This skill files tickets only. `meldom:implement` fixes. |
| Jumping to the build when user "done" | Stop. Return control to caller. `meldom:implement` is a sibling. |
| Over-interviewing                   | 2-3 clarifying questions max, then file.               |
| Citing file paths in ticket body    | Describe behaviors in domain language. Paths go stale. |

## Edge Cases

| Scenario                              | Handling                                                 |
| ------------------------------------- | -------------------------------------------------------- |
| User reports something unreproducible | File it, note "intermittent" in body, flag unknown repro |
| User describes a feature, not a bug   | Suggest switching to meldom:to-tickets                   |
| Single clear bug, not multiple        | File one ticket and run `meldom:implement`                      |

## See Also

`/meldom` for full MCP tool and CLI reference.
