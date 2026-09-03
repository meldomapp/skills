# Writing Agent Briefs

An agent brief is what you write into a meldom ticket's **body** when it moves to `ready-for-agent`. It is the authoritative specification an AFK agent will work from. The original report and the ticket's comments are context — the brief in the body is the contract.

## Principles

### Durability over precision

The ticket may sit in `ready-for-agent` for days or weeks, and the codebase will change. Write the brief so it stays useful even as files are renamed, moved, or refactored.

- **Do** describe interfaces, types, and behavioral contracts
- **Do** name specific types, function signatures, or config shapes the agent should look for or modify
- **Don't** reference file paths — they go stale
- **Don't** reference line numbers
- **Don't** assume the current implementation structure will remain the same

### Behavioral, not procedural

Describe **what** the system should do, not **how** to implement it. The agent will explore the codebase fresh and make its own implementation decisions.

- **Good:** "The `TicketInput` type should accept an optional `dueDate` field of type `ISODate`"
- **Bad:** "Open src/domain/ticket.ts and add a field on line 42"
- **Good:** "When a user runs `meldom:triage` with no arguments, they should see a summary of tickets needing attention"
- **Bad:** "Add a switch statement in the main handler function"

### Complete acceptance criteria

The agent needs to know when it's done. Every brief must have concrete, testable acceptance criteria, each independently verifiable.

- **Good:** "`ticket_list` with the `needs-triage` label returns tickets that have been through initial classification"
- **Bad:** "Triage should work correctly"

### Explicit scope boundaries

State what is out of scope. This prevents the agent from gold-plating or making assumptions about adjacent features.

## Template

```markdown
**Category:** bug / enhancement
**Summary:** one-line description of what needs to happen

**Current behavior:**
Describe what happens now. For bugs, this is the broken behavior.
For enhancements, this is the status quo the feature builds on.

**Desired behavior:**
Describe what should happen after the agent's work is complete.
Be specific about edge cases and error conditions.

**Key interfaces:**

- `TypeName` — what needs to change and why
- `functionName()` return type — what it currently returns vs what it should return
- Config shape — any new configuration options needed

**Acceptance criteria:**

- [ ] Specific, testable criterion 1
- [ ] Specific, testable criterion 2
- [ ] Specific, testable criterion 3

**Out of scope:**

- Thing that should NOT be changed or addressed in this ticket
- Adjacent feature that might seem related but is separate
```

## Examples

### Good agent brief (bug)

```markdown
**Category:** bug
**Summary:** Description truncation drops mid-word, producing broken output

**Current behavior:**
When a description exceeds 1024 characters, it is truncated at exactly
1024 characters regardless of word boundaries, ending mid-word
(e.g. "Use when the user wants to confi").

**Desired behavior:**
Truncation should break at the last word boundary before 1024 characters
and append "..." to indicate truncation.

**Key interfaces:**

- The metadata type's `description` field — no type change needed, but the
  validation/processing logic that populates it needs to respect word boundaries

**Acceptance criteria:**

- [ ] Descriptions under 1024 chars are unchanged
- [ ] Descriptions over 1024 chars are truncated at the last word boundary before 1024 chars
- [ ] Truncated descriptions end with "..."
- [ ] The total length including "..." does not exceed 1024 chars

**Out of scope:**

- Changing the 1024 char limit itself
- Multi-line description support
```

### Good agent brief (enhancement)

```markdown
**Category:** enhancement
**Summary:** Add a `due_date` field to tickets

**Current behavior:**
Tickets have no notion of a deadline. Urgency lives only in prose in the body.

**Desired behavior:**
A ticket can carry an optional due date that surfaces in list and view output
and can be set on create and update.

**Key interfaces:**

- The ticket row + `TicketInput` — a nullable `due_date` (ISO date string)
- `ticket_create` / `ticket_update` accept and persist it
- `ticket_view` / `ticket_list` return it

**Acceptance criteria:**

- [ ] A ticket created with a `due_date` round-trips through view and list
- [ ] Omitting `due_date` leaves it null
- [ ] An invalid date is rejected by the service layer with a clear error

**Out of scope:**

- Sorting or filtering the board by due date
- Notifications when a due date passes
```

### Bad agent brief

```markdown
**Summary:** Fix the triage bug

**What to do:**
The triage thing is broken. Look at the main file and fix it.
The function around line 150 has the issue.

**Files to change:**

- src/triage/handler.ts (line 150)
```

This is bad because: no category; vague description; references file paths and line numbers that go stale; no acceptance criteria; no scope boundaries; no current-vs-desired behavior.
