# Issue tracker: Meldom

Issues and specs for this repo live as Meldom tickets. Use the `mcp__meldom__*` tools for all operations.

## Conventions

- **Create a ticket**: `mcp__meldom__ticket_create({ "title": "...", "body": "..." })`, or `mcp__meldom__ticket_batch_create({ "entries": [...] })` for several at once.
- **Read a ticket**: `mcp__meldom__ticket_view({ "id": "<key>", "response_format": "detailed" })`, which also returns its comments and labels. While the result carries `next_body_cursor`, call again with `body_offset: <next_body_cursor>`.
- **List tickets**: `mcp__meldom__ticket_list` with appropriate `labels` and `status` filters.
- **Make a ticket a child of a parent**: pass `parent_id` on create, or `mcp__meldom__ticket_update({ "id": "<child>", "parent_id": "<parent>" })` afterwards.
- **Comment on a ticket**: `mcp__meldom__comment_create`.
- **Apply / remove labels**: `mcp__meldom__ticket_update` with `labels`. It replaces the whole array, so keep the labels the ticket already has.
- **Close**: `mcp__meldom__ticket_update({ "id": "<key>", "status": "closed", "reason": "..." })`.

The MCP server announces the connection and the project, so there is nothing to infer.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/meldom:triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as tickets, using the GitHub `gh pr` commands:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

A Meldom ticket is named by its key (`KEY-42`), so a bare `#42` is always a PR.

## When a skill says "publish to the issue tracker"

Create a Meldom ticket. A spec is `"type": "spec"`. Pass `parent_id` explicitly: the parent's key, or `null` for a root (omitting it files the ticket under the current chat's home spec).

## When a skill says "resolve a ticket the way the issue tracker closes work"

`mcp__meldom__ticket_update` to `done` with a `reason`. Meldom does not close work through PRs. A parent never closes on its own: move it to `done` once every child is `done` or `closed`.

## When a skill says "fetch the relevant ticket"

Run `mcp__meldom__ticket_view` as in **Read a ticket**.

## Wayfinding operations

Used by `/meldom:wayfinder`. The **map** is a single ticket with **child** tickets.

- **Map**: a single ticket labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `mcp__meldom__ticket_create` with `"labels": ["wayfinder:map"]`.
- **Child ticket**: a ticket with `parent_id` set to the map. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: Meldom's native `blocked_by` edges. Create several children with `mcp__meldom__ticket_batch_create` and wire their edges in the same call with `blocked_by_index`; add an edge later with `mcp__meldom__ticket_update` and `blocked_by` (it replaces the whole array). A ticket is unblocked when every blocker is `done` or `closed`.
- **Frontier query**: `mcp__meldom__ticket_list({ "parent_id": "<map>", "unblocked": true })`, dropping any ticket already `in_progress`; first in map order wins.
- **Claim**: `mcp__meldom__ticket_update` to `in_progress`, the session's first write.
- **Resolve**: `mcp__meldom__comment_create` with the answer, then `mcp__meldom__ticket_update` to `done`, then append a context pointer (gist + link) to the map's Decisions-so-far.
