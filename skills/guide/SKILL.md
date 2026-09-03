---
name: guide
description: "How Meldom works and how to drive it — the ticket board, notes, comments, attachments, project commands (dev servers and watchers), terminals, threads and worktrees, all through the `mcp__meldom__*` tools. Use for any work inside Meldom: creating or updating tickets, checking status, wiring blockers, writing notes, attaching files, running or reading a project's dev processes, or deciding what to work on next."
---

# Meldom

Meldom is an agentic development environment: one SQLite database holding tickets, notes, conversations, worktrees, commands and terminals, reachable from the desktop app, a CLI, and this MCP server. Everything below goes through the `mcp__meldom__*` tools, with arguments as structured objects. All output is JSON.

## Routing

Pick the right tool the first time — these are the mistakes that cost the most calls:

- **Browsing or filtering many tickets** → `ticket_list` (lean rows, no body). **One ticket in full** → `ticket_view`. Never list-then-view-each.
- **Several changes at once** → `ticket_batch_update`, not a loop of `ticket_update`.
- **What should I work on next?** → `ticket_list({ unblocked: true })`: only open tickets whose blockers are all done or closed, in dependency order. `limit: 1` for the single top pick.
- **A long-running process** (dev server, watcher, build) → a Meldom command, never a background shell of your own. See [Project commands](#project-commands).
- **Unsure who or where you are** → `whoami`. **What is this conversation tracking** → `conversation_status`.
- **Need depth on an area** → `help({ topic })`; the whole tool list → `help()`.

## Tickets

| Tool                  | What it does                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `status`              | Project summary: ticket counts by status, total, purgeable count                                                                 |
| `ticket_create`       | Create one ticket                                                                                                                |
| `ticket_batch_create` | Create many in one transaction (`{ entries }`), with `blocked_by_index` wiring within the batch                                  |
| `ticket_view`         | One ticket in full, with `comments[]`, attached `notes[]`, `attachments[]` and children                                          |
| `ticket_list`         | List and filter (status, statuses, type, parent, labels, query, assignee); `unblocked: true` for ready work in dependency order  |
| `ticket_update`       | Patch fields; `status` (+ `reason`) moves it; `blocked_by` and `labels` REPLACE the whole array                                   |
| `ticket_batch_update` | `{ entries: { "<id>": <patch> } }` in one transaction; per-id partial failure, never throws                                       |
| `ticket_outcome`      | Mark a tracked ticket `verified` or `failed`; `failed` reopens an `in_progress` ticket to `open`                                  |
| `ticket_plan`         | An execution plan built from the dependency graph                                                                                 |
| `ticket_delete`       | Remove a ticket outright — prefer `closed` to archive, unless it should never have existed                                        |

Comments and notes hang off the same board: `comment_create` / `comment_update` / `comment_delete` / `comment_view`, and `note_create` / `note_view` / `note_list` / `note_update` / `note_delete`. A note is project knowledge rather than ticket state — `ticket_ids` on create attaches it, `attach_to`/`detach_from` later.

Most tools take an optional `project_id` (a ULID, not a project key) to target a project other than the current directory's. Schemas are strict, so passing it to a tool that does not declare it comes back as `Input validation error: … Unrecognized key: "project_id"` — harmless and obvious. Omitting it where it IS accepted raises nothing and silently uses the cwd project, which is the quieter mistake. The families are split, so do not generalise from a sibling: `conversation_status` and `conversation_update` accept it while the other `conversation_*` tools do not, and `whoami` accepts it while `status` does not.

## Status flow

`backlog → open → in_progress → done → closed`. Transitions are any-to-any — every status reaches every other directly, and the only rejected move is a same-status no-op. New tickets default to `open`.

- **Claim before working:** `ticket_update({ id, status: "in_progress" })`. The board shows what is being worked on right now, so make the move before writing code, not after.
- **Finish when the acceptance criteria pass:** `status: "done"` with a `reason`. That is the "I finished it" step.
- **`closed` is the human's archive**, taking a done ticket off the active board. Agents do not close on completion.
- **`backlog` parks work** you are not ready to start; it stays out of `unblocked` results until moved back to `open`.
- **A parent's status is its own**, never rolled up from its children. Finish a spec explicitly once every child is `done` or `closed`.
- **Blocking is advisory.** A `done` or `closed` blocker unblocks its dependents, but nothing prevents work on a blocked ticket.

`ticket_outcome`, `ticket_plan`, `conversation_status` and `conversation_update` are bookkeeping — none of them changes `ticket.status`. The one exception: `ticket_outcome({ outcome: "failed" })` reopens a tracked `in_progress` ticket to `open`. And `conversation_update({ done: true })` refuses while any tracked ticket is still `in_progress`.

Conversations are auto-created: the first ticket mutation get-or-creates yours for this session and project, and auto-tracks the ticket you touched. There is nothing to start up front. Set a `summary` with `conversation_update` mid-run, or with `done: true` when finishing — the ticket's "Agent activity" list shows it.

## Project commands

A project's dev processes — dev server, watcher, build — live in Meldom. **Use these instead of spawning a long-running process yourself:** a Meldom command is visible and controllable in the app, and its output stays readable afterwards. A bare background shell is invisible to the user and dies with your turn.

- `command_list({})` — every definition with its live `instances` (Main plus any worktree). `id` is a raw ULID; commands carry no human key.
- `command_create({ name, command, cwd?, auto_start? })` — define one. `cwd` is relative to the project root (default `.`), `auto_start` spawns it at app boot (default false). Creating never starts it.
- `command_update({ id, name, command, cwd?, auto_start? })` — a full OVERWRITE, not a patch: send every field, or an omitted `cwd`/`auto_start` resets to `.`/false. It also STOPS every running instance of that command, so start it again to pick up the new shell string.
- `command_delete({ id })` — remove the definition; its running instances are stopped first.
- `command_start` / `command_stop` / `command_restart({ id, target? })` — drive one instance; omit `target` for Main, `{ slug, folder? }` selects a worktree.
- `command_output({ id, lines?, target? })` — tail that instance's output (default 200 lines, max 2000, ANSI stripped). Check it after a start to see whether the process came up clean.

All of them need the Meldom app running (the process registry lives only there) and fail naming the app when it is not.

## Terminals, threads and worktrees

- `terminal_list` / `terminal_output` — read the project's terminals. Read-only: you can see what a terminal has printed, not type into it.
- `thread_list` / `thread_read` / `thread_send` / `thread_delete`, plus `parent_read` / `parent_search` — forked-thread reads and writes. Nothing about a thread is injected automatically; you pay tokens only when you call one.
- `worktree_list` — the project's worktrees with branch, dirty/ahead state, attached chats and running commands.
- `worktree_remove` — the ONLY way to remove a Meldom worktree. Never `git worktree remove`: `--force` (which a worktree with submodules needs) deletes each submodule's own git dir, and with it any commit that has not reached the main checkout. There is no `worktree_create` — creating one is the user's choice in the app.

To land a worktree end to end, run `/meldom-merge-worktree`. To commit from a chat, run `/meldom-ship` — the ship card is the authorization, never raw git.

## Attachments

Attach the media you generate — screenshots, diagrams, exports — to the ticket, note or comment it belongs to.

- `attachment_add({ target_id, path, file_name? })` reads the file into the blob store as author `agent`. The path must be INSIDE the project (or the app-owned generated-asset dir) and at most 25 MiB, so write it there first — a `/tmp` path is refused. `file_name` defaults to the basename; mime comes from the extension.
- `attachment_delete({ id })` soft-deletes the row and refcount-unlinks the blob.
- `attachment_list({ target_id? })` lists the project's attachments with a `count` and `total_bytes`; pass `target_id` to narrow to one entity.

`ticket_view` and `note_view` return an `attachments[]` array, each row carrying the local blob `path` — Read that path to load an attached image.

## Examples

```jsonc
// Create a single ticket
ticket_create({ "title": "Fix login", "type": "bug" })

// A parent, then children under it, the second blocked by the first
ticket_create({ "title": "Auth overhaul", "type": "prd" })   // -> id "01JGXXAB3DEF4GH5JK6MN7PQ8R"
ticket_batch_create({
  "entries": [
    { "title": "First slice", "parent_id": "01JGXXAB3DEF4GH5JK6MN7PQ8R" },
    { "title": "Second slice", "parent_id": "01JGXXAB3DEF4GH5JK6MN7PQ8R", "blocked_by_index": [0] }
  ]
})

// Claim, then finish
ticket_update({ "id": "01JGXXBC4EFG5HJ6KM7NP8QR9S", "status": "in_progress" })
ticket_update({ "id": "01JGXXBC4EFG5HJ6KM7NP8QR9S", "status": "done", "reason": "card renders, tests green" })

// Several at once
ticket_batch_update({ "entries": {
  "01JGXXBC4EFG5HJ6KM7NP8QR9S": { "status": "done", "reason": "shipped" },
  "01JGXXCD5FGH6JK7MN8PQ9RS0T": { "status": "closed", "reason": "duplicate" }
} })

// What is ready to start
ticket_list({ "unblocked": true, "limit": 1 })

// A note attached to the tickets it concerns
note_create({ "title": "API conventions", "body": "...", "labels": ["api"], "ticket_ids": ["MEL-42"] })

// Run the dev server as a Meldom command, then check it came up
command_create({ "name": "dev", "command": "bun run ui", "auto_start": false })
command_start({ "id": "<command-ulid>" })
command_output({ "id": "<command-ulid>", "lines": 50 })

// Attach a file you generated (project-relative path, not /tmp)
attachment_add({ "target_id": "01JGXXBC4EFG5HJ6KM7NP8QR9S", "path": "docs/evidence/diagram.png" })
```

## `meldom://` references

The UI emits refs that point at exactly one entity:

| Shape   | Pattern                              | Resolve with           |
| ------- | ------------------------------------ | ---------------------- |
| Ticket  | `meldom://proj/{name}/tickets/{id}`  | `ticket_view({ id })`  |
| Note    | `meldom://proj/{name}/notes/{id}`    | `note_view({ id })`    |
| Comment | `meldom://proj/{name}/comments/{id}` | `comment_view({ id })` |

The project `{name}` is display-only; resolution uses the trailing ULID alone, which is globally unique. No tool resolves a ref string — parse the id out yourself.

Entity keys work too: `KEY-<n>` is a ticket, `KEY-N<n>` a note, `KEY-C<n>` a comment, `KEY-S<n>` a session or conversation.

## Replacing `gh issue`

| gh issue                                     | meldom                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `gh issue create --title "..." --body "..."` | `ticket_create({ title, body })`                                                  |
| `gh issue view <n>`                          | `ticket_view({ id: <n> })`                                                        |
| `gh issue list`                              | `ticket_list({})`                                                                 |
| `gh issue close <n>`                         | `ticket_update({ id, status: "done", reason })` — `closed` is the human's archive |
| `gh issue edit <n> --add-label "x"`          | `ticket_update({ id, labels: [...] })` — replaces the whole array                  |

## Gotchas

| Trap                                        | Fix                                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Listing, then viewing each row               | `ticket_list` already carries what you need to choose. View only the one you picked                |
| A loop of `ticket_update` calls              | `ticket_batch_update` — one transaction, per-id results                                            |
| Labels or blockers appended                  | Both arrays REPLACE. Include the existing entries in the patch or you will drop them               |
| `unblocked: true` returns nothing            | Every open ticket may be blocked. List without the filter to see why                               |
| Parent still open after the last child       | Parent status never rolls up. Finish it explicitly with a `reason` naming the children             |
| Status moves batched up at the end of a run  | Move each ticket as it happens: exactly one `in_progress`, every finished one `done`               |
| A dev server started as a background shell   | Define it as a Meldom command instead — otherwise the user cannot see, stop or read it             |
| `command_update` used as a patch             | It overwrites AND stops running instances. Send every field, then start it again                   |
| `attachment_add` from `/tmp`                 | The path must be inside the project. Write the file there first                                    |
| A stray project appeared                     | A tool call in an unregistered directory auto-registers it. Remove the stray, then run from the right directory |

## Edge cases

| Scenario                               | Handling                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| Empty labels or affected_files          | Legal — both default to `[]` on create                                     |
| `sort_order` omitted                    | Auto-assigned as `MAX(sort_order) + 10` within the project                 |
| Unknown JSON key                        | Strict validation rejects it; re-run without the key                       |
| Cwd inside an existing registered path  | The tool runs against the parent project — no new project is created       |
| Cwd inside a git worktree               | Resolves to the main repo's project, not a separate one                    |
| A command tool fails naming the app     | The process registry lives only in the app. Ask the user to start it       |

Task: $ARGUMENTS
