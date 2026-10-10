# Porting ledger

Most of the skills here are ports of [mattpocock/skills](https://github.com/mattpocock/skills). This file is
the single source of truth for **what we changed and why**. A sync agent reads it to tell a real upstream
change from a deliberate local edit: a difference from upstream that is not written down here is a bug in the
port.

- **Upstream baseline**: `6fd9479` (checked 2026-10-06)
- **Upstream buckets**: `skills/engineering/`, `skills/productivity/`, `skills/in-progress/`, `skills/misc/`.
  Skills are matched by **leaf folder name**, not by bucket.
- **Mapping**: the sync tool keeps a machine-readable `upstream name -> local name` map alongside the commit it
  last checked. That map is mechanical; every *reason* lives in this file.

## Fidelity check

```bash
git clone --depth 1 https://github.com/mattpocock/skills /tmp/mp-skills
diff -ru /tmp/mp-skills/skills/<bucket>/<upstream-name> skills/<local-name>
```

Run it per skill, over every file, and over every row of the mapping table below. Each ported file is
upstream's text as upstream wrote it, so every differing line is one of the global rules below or a bullet in
that skill's section. A differing line that is neither is a finding: port upstream's text, or add the bullet.

## Global rules

These hold for every ported file. They are not repeated in the per-skill sections.

### 1. Namespacing

The plugin is installed as `meldom`, so both providers address its skills as `meldom:<name>`. Exactly these
get the prefix:

- an **operative instruction to call the Skill tool**: upstream's `Call the Skill tool with "grilling"` is
  `Call the Skill tool with "meldom:grilling"`; a bare name does not resolve for someone who installed only
  this plugin;
- a **slash mention of a skill**: upstream's `/grill-me` is `/meldom:grill-me`, the command a user types;
- a **mention of a skill by name in prose**: `the meldom:code-review skill`.

Never prefixed: label values, file names, directory names, URL paths, ordinary English words. `wayfinder:<type>`
labels stay the plain strings `research`, `prototype`, `grilling`, `task`. A prototype route named after the
skill is `prototype`, not `meldom:prototype`.

### 2. Upstream's text

A ported file is upstream's file, word for word and punctuation included, with only the changes these rules
and its ledger section name. Porting an upstream change means taking upstream's new text.

Meldom's own additions live in one place: a `## On Meldom` section at the **bottom** of the skill's `SKILL.md`.
Everything above it, and every other file in the skill, is upstream's text with only the global rules and the
replacements its ledger section names. A replacement is allowed only where upstream's text names a mechanism
Meldom replaces (another tracker, `.scratch/`, `.out-of-scope/`) or contradicts it. Where an addition and
upstream disagree, upstream wins and the addition goes.

Never run a formatter over `skills/`: a prettier pass rewrites quotes and reflows lines, and every
one of those becomes a phantom hunk in the next sync.

### 3. Invocation

Upstream's convention is [`.agents/invocation.md`](https://github.com/mattpocock/skills/blob/main/.agents/invocation.md), and every port follows upstream's flag. A
user-invoked skill sets `disable-model-invocation: true` in `SKILL.md` **and**
`policy.allow_implicit_invocation: false` in `agents/openai.yaml`; a model-invoked skill sets neither. The two
must always agree, and `scripts/validate.mjs` enforces it.

One exception, so Meldom agents working without a human can build from tickets, find the right skill and hand
off at a phase boundary: `implement`, `implement-spec`, `to-spec`, `to-tickets`, `ask-meldom` and `handoff` are
**model-invoked** here, though upstream makes them user-invoked. Their
`disable-model-invocation` line and `policy` block are dropped; everything else stays upstream's.

### 4. Meldom is the tracker

The issue tracker is Meldom. `meldom:setup-matt-pocock-skills` records it in `docs/agents/issue-tracker.md` from
its `issue-tracker-meldom.md` template, which maps every tracker operation to an `mcp__meldom__*` tool. So
upstream's "The issue tracker should have been provided to you" lines and its generic "publish to the issue
tracker" wording stay as upstream wrote them.

A ported skill changes only where upstream names a tracker other than Meldom, or a mechanism Meldom replaces:

| Upstream                                         | Meldom                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| GitHub, GitLab or local-markdown tracker steps   | the Meldom operation, from the tracker doc or as an `mcp__meldom__*` call         |
| issue numbers (`#42`) for a tracker issue        | `KEY-42` (rule 5)                                                                 |
| the `.out-of-scope/` directory                   | Meldom notes labelled `out-of-scope`                                              |
| commit your work                                 | the Skill tool with `meldom:ship`                                                 |
| a worktree per subagent, cleaning them up        | the worktrees `mcp__meldom__worktree_list` reports for this chat, `mcp__meldom__worktree_remove` |

No `gh issue`, no `.scratch/` directory, no `.out-of-scope/` directory.

### 5. Ticket keys in prose

A Meldom ticket key is written `KEY-N` when it is a placeholder. Never `LOC-` (a dead tracker), never `MEL-`
(this repo's own project prefix, meaningless on a user's board).

### 6. Nothing personal, nothing from the product repo

The plugin is public and MIT. No path into the Meldom desktop repo, no `~/.meldom/` runtime path, no
maintainer-specific rule file names, no harness-specific tool names presented as if every harness has them, no
`model:` pin on an agent.

### 7. Every wait and every read has an end

A wait names one blocking command (`gh pr checks --watch --fail-fast --required`) or one shell loop with an
interval and a ceiling ("every 30 seconds for up to 30 minutes"), never an open-ended "poll until". A ticket
read asks `ticket_view` for `response_format: "detailed"` and pages the body by `next_body_cursor`, so a long
spec is never read trimmed.

## Mapping

| Upstream                                    | Local                           | Section |
| ------------------------------------------- | ------------------------------- | ------- |
| `engineering/ask-matt`                      | `ask-meldom`                    | yes     |
| `engineering/code-review`                   | `code-review`                   | yes     |
| `engineering/codebase-design`               | `codebase-design`               | yes     |
| `engineering/diagnosing-bugs`               | `diagnosing-bugs`               | yes     |
| `engineering/domain-modeling`               | `domain-modeling`               | yes     |
| `engineering/grill-with-docs`               | `grill-with-docs`               | yes     |
| `engineering/implement`                     | `implement`                     | yes     |
| `engineering/implement-spec`                | `implement-spec`                | yes     |
| `engineering/improve-codebase-architecture` | `improve-codebase-architecture` | yes     |
| `engineering/pr`                            | `pr`                            | yes     |
| `engineering/prototype`                     | `prototype`                     | yes     |
| `engineering/research`                      | `research`                      | yes     |
| `engineering/retro`                         | `retro`                         | yes     |
| `engineering/setup-matt-pocock-skills`      | `setup-matt-pocock-skills`      | yes     |
| `engineering/tdd`                           | `tdd`                           | yes     |
| `engineering/to-spec`                       | `to-spec`                       | yes     |
| `engineering/to-tickets`                    | `to-tickets`                    | yes     |
| `engineering/triage`                        | `triage`                        | yes     |
| `engineering/wayfinder`                     | `wayfinder`                     | yes     |
| `engineering/wizard`                        | `wizard`                        | yes     |
| `productivity/grill-me`                     | `grill-me`                      | yes     |
| `productivity/grilling`                     | `grilling`                      | yes     |
| `productivity/handoff`                      | `handoff`                       | yes     |
| `productivity/teach`                        | `teach`                         | yes     |
| `productivity/to-questionnaire`             | `to-questionnaire`              | yes     |
| `productivity/wait-what`                    | `wait-what`                     | yes     |
| `productivity/writing-for-agents`           | `writing-for-agents`            | yes     |

**Meldom-only, no upstream source.** The sync never diffs these and never rewrites them:
`merge-worktree`, `security-audit` and `ship`.

## Per-skill divergences

### ask-meldom (`engineering/ask-matt`)

- **Renamed** `ask-matt` to `ask-meldom`: the frontmatter `name`, the `# Ask Meldom` heading, the
  `display_name` and the folder.
- Replacement: step 3's local-tracker sentence becomes the Meldom board's native blocking links, and the
  Precondition drops "Custom issue trackers also work": the tracker is Meldom.
- `## On Meldom`: the Meldom-only skills (`meldom:ship`, `meldom:merge-worktree`, `meldom:security-audit`), each
  with where it sits in the map, so the map names every
  skill folder in this plugin.
- `PHASE-BOUNDARIES.md` differs only by global rule 1.

### code-review (`engineering/code-review`)

- Replacement: spec source 1 is Meldom ticket keys (`KEY-123`) in the commit messages, and spec source 3 drops
  `.scratch/`.
- `## On Meldom`: uncommitted work is in scope (on a dirty tree, `git diff $(git merge-base <fp> HEAD)` plus
  every untracked file, and `HEAD` as the default fixed point), because `meldom:implement` reviews before it
  commits; a ticket key argument, the conversation's tickets and a key in the branch name are checked first as
  spec sources; `CLAUDE.md` and `AGENTS.md` count as standards; and the Spec findings are posted to the ticket
  with `mcp__meldom__comment_create`.
- `## On Meldom`: done bug tickets for the touched area are searched with `mcp__meldom__ticket_list`, and
  a match is named in the findings as a class of bug that bit the project before. Past fixes live on bug tickets,
  not in a second store, so this is where review recalls them.

### codebase-design (`engineering/codebase-design`)

- `## On Meldom`: with no subagents (Codex), the `DESIGN-IT-TWICE.md` work runs in the current session, one
  approach at a time.

### diagnosing-bugs (`engineering/diagnosing-bugs`)

- `## On Meldom`: an app running as a Meldom command has its output read with `mcp__meldom__command_output`
  instead of pasted logs, and a bug worth tracking is filed with `mcp__meldom__ticket_create`.
- `## On Meldom`: done bug tickets are searched for the error before debugging
  (`mcp__meldom__ticket_list` with `type: "bug"`, `statuses: ["done"]` and a short query, 2-3 phrasings); a fixed
  bug's ticket states the symptom, root cause and fix with its affected files; and the non-obvious why of a fix is
  a comment next to the code, never removed unread. Past fixes live on bug tickets rather than in a memory store,
  and the why lives where the next agent editing that code reads it.

### domain-modeling (`engineering/domain-modeling`)

No divergence.

### grill-me (`productivity/grill-me`)

Global rule 1 only.

### grill-with-docs (`engineering/grill-with-docs`)

Global rule 1 only.

### grilling (`productivity/grilling`)

- `## On Meldom`: end with a one-bullet-per-decision recap and produce no tickets and no files beyond the domain
  model, ready for `meldom:to-spec` or `meldom:to-tickets`. Without it the skill invented tickets of its own.

### handoff (`productivity/handoff`)

- `## On Meldom`: the document is also stored as a Meldom note (`mcp__meldom__note_create`, label `handoff`),
  attached to the conversation's tracked tickets. A file in the OS temporary directory does not survive the
  machine; the note does.

### implement (`engineering/implement`)

- `## On Meldom`: commit through `meldom:ship`; claim tickets as `in_progress`; report to the progress bar; mark
  each ticket `done` as it passes; build every follow-up the session files, under the ticket's parent; record
  the review's outcome per ticket; and close the parent once every child is done. Meldom never rolls parent
  status up, and without the follow-up rule the build left tickets it had filed open.
- `## On Meldom`: the same three bug rules as `diagnosing-bugs` — search done bug tickets before
  debugging, keep a fixed bug's ticket useful, write the why as a comment next to the code — since an implement run
  meets errors and fixes bugs as it builds.

### implement-spec (`engineering/implement-spec`)

- `## On Meldom`: worktrees are the ones `mcp__meldom__worktree_list` reports for this chat, never
  `git worktree add`, and are removed with `mcp__meldom__worktree_remove`; the orchestrator owns every ticket
  state and hands subagents the ticket body; an in-session fallback for providers without subagents; commits go through `meldom:ship` with only the ticket's paths; progress-bar
  reporting; and the review's outcome per ticket.

### improve-codebase-architecture (`engineering/improve-codebase-architecture`)

Global rule 1, plus `## On Meldom`: the approved refactor is filed as Meldom tickets, a parent plus children for a
multi-step refactor.

### pr (`engineering/pr`)

No divergence: every file, `CREDITS.md` included, is upstream's text.

### prototype (`engineering/prototype`)

No divergence.

### research (`engineering/research`)

- `## On Meldom`: the findings are also stored as a Meldom note (`mcp__meldom__note_create`, label `research`),
  attached to the ticket the question came from, so a later session finds them from the board.

### retro (`engineering/retro`)

Global rule 1, plus `## On Meldom`: where Claude Code and Codex keep session logs, and accepted candidates can be
filed as Meldom tickets.

### setup-matt-pocock-skills (`engineering/setup-matt-pocock-skills`)

- The issue tracker is Meldom, so Section A proposes it with nothing else to choose, and the exploration drops
  the `git remote` and `.scratch/` checks.
- The GitHub, GitLab and local-markdown templates are replaced by `issue-tracker-meldom.md`. It keeps the GitHub
  template's shape: conventions, the PRs-as-a-request-surface flag (with the `gh pr` commands, since PRs still
  live on GitHub), the "publish" and "fetch" sections, a "resolve a ticket" section `implement-spec` relies on,
  and the wayfinding operations, each as an `mcp__meldom__*` call.

### tdd (`engineering/tdd`)

Global rule 1, plus `## On Meldom`: the loop runs the seam's tests, and whole-project checks run once, after the
last slice. `meldom:implement` drives this skill once per ticket, so without it each ticket ran the full suite.
The same section carries the three bug rules of `diagnosing-bugs`: search done bug tickets before
debugging, keep a fixed bug's ticket useful, write the why as a comment next to the code.

### teach (`productivity/teach`)

No divergence.

### to-questionnaire (`productivity/to-questionnaire`)

No divergence.

### to-spec (`engineering/to-spec`)

Global rule 1 only. The spec ticket's `type` and `parent_id` come from the tracker doc.

### to-tickets (`engineering/to-tickets`)

- Replacement: step 5's local-files branch and its template are dropped, so the closing "In either form" is
  "Avoid".
- `## On Meldom`: with no source issue, a plain parent is created first so the tickets share one family on the
  board; a lone ticket needs none.

### triage (`engineering/triage`)

- Replacement: the rejected-request knowledge base is Meldom **notes** labelled `out-of-scope`, one per concept,
  attached to the issues that asked for it, instead of files under `.out-of-scope/`. `OUT-OF-SCOPE.md` is
  rewritten for notes, and `SKILL.md`'s mentions of the directory follow.
- Replacement: `AGENT-BRIEF.md` posts the brief on a Meldom ticket or a PR, its `gh issue list` example is a
  `ticket_list` one, and its enhancement example's hypothetical feature stores its records in `docs/rejected/`.

### wait-what (`productivity/wait-what`)

No divergence.

### wayfinder (`engineering/wayfinder`)

- With no tracker provided, it defaults to Meldom instead of the local-markdown tracker.

### wizard (`engineering/wizard`)

Global rule 1 only: `template.sh`'s header names `/meldom:wizard`.

### writing-for-agents (`productivity/writing-for-agents`)

No divergence.

## Tombstones

Upstream skills this plugin deliberately does not ship. `localMapping` maps each to `null`. Upstream keeps all of
them out of its own plugin too.

| Upstream skill               | Why not                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `chief-of-staff`             | `in-progress/`: beta, and upstream says it can change or disappear without warning. |
| `claude-handoff`             | `in-progress/`: beta.                                                           |
| `loop-me`                    | `in-progress/`: beta.                                                           |
| `setup-ts-deep-modules`      | `in-progress/`: beta.                                                           |
| `writing-beats`              | `in-progress/`: beta.                                                           |
| `writing-fragments`          | `in-progress/`: beta.                                                           |
| `writing-shape`              | `in-progress/`: beta.                                                           |
| `git-guardrails-claude-code` | `misc/`: frozen upstream, so it gets no fixes.                                  |
| `migrate-to-shoehorn`        | `misc/`: frozen upstream, so it gets no fixes.                                  |
| `scaffold-exercises`         | `misc/`: frozen upstream, so it gets no fixes.                                  |
| `setup-pre-commit`           | `misc/`: frozen upstream, so it gets no fixes.                                  |

When upstream promotes one into `engineering/` or `productivity/`, the next sync ports it.
