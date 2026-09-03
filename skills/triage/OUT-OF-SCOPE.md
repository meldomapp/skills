# Out-of-Scope Knowledge Base

Rejected feature requests are recorded as meldom **notes** labeled `out-of-scope` (one note per concept). The KB serves two purposes:

1. **Institutional memory** — why a feature was rejected, so the reasoning isn't lost when the ticket is closed.
2. **Deduplication** — when a new request matches a prior rejection, surface the previous decision instead of re-litigating it.

These are project notes, not files in the repo. Write with `mcp__meldom__note_create`, read back with `note_list({ "labels": ["out-of-scope"] })`.

## One note per concept

One note per **concept**, not per ticket. Multiple tickets requesting the same thing are grouped under one note. The note **title** is the concept ("Dark Mode", "Plugin System", "GraphQL API").

## Note body format

Write it as a short design document — paragraphs, code samples, examples — not a database entry:

```markdown
This project does not support dark mode or user-facing theming.

## Why this is out of scope

The rendering pipeline assumes a single palette defined in `ThemeConfig`.
Supporting multiple themes would require a theme context provider, per-component
theme-aware style resolution, and a persistence layer for user preferences —
a significant architectural change that doesn't align with the project's focus.

## Prior requests

- Ticket <id> — "Add dark mode support"
- Ticket <id> — "Night theme for accessibility"
```

Attach the note to the closed ticket(s) it covers (`ticket_ids` on `note_create`, or `note_update` with `attach_to`) so it surfaces in their `ticket_view`.

### Writing the reason

The reason must be substantive and durable — not "we don't want this" but why. Good reasons reference project scope/philosophy, technical constraints, or strategic decisions. Avoid temporary circumstances ("we're too busy right now") — those are deferrals, not rejections.

## When to check the KB

During triage (Gather context), read `note_list({ "labels": ["out-of-scope"] })`. Matching is by **concept similarity**, not keyword — "night theme" matches the "Dark Mode" note. On a match, surface it: "This is similar to the out-of-scope note 'Dark Mode' — we rejected this before because [reason]. Do you still feel the same way?" The maintainer may:

- **Confirm** — append the new ticket to the note's "Prior requests" list (`note_update`), then close it.
- **Reconsider** — delete or update the note (`note_delete` / `note_update`), and the ticket proceeds through normal triage.
- **Disagree** — related but distinct; proceed with normal triage.

## When to write to the KB

Only when an **enhancement** (not a bug) is _rejected_ as `wontfix`:

1. Check whether a matching out-of-scope note already exists (`note_list`).
2. If yes: append the new ticket to its "Prior requests" list (`note_update`).
3. If no: create a note (`note_create`, label `out-of-scope`) with the concept title, reason, and first prior request.
4. Post a comment on the ticket explaining the decision and naming the note.
5. Close the ticket (`status: closed` + label `wontfix`).

Do **not** write a note when something is closed as `wontfix` because it's **already implemented** — that would poison the dedup checks with false rejections. Point to where the feature lives in the closing comment instead.
