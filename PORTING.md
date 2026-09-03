# Porting ledger

Most of the skills here are ports of [mattpocock/skills](https://github.com/mattpocock/skills). This file is
the single source of truth for **what we changed and why**. A sync agent reads it to tell a real upstream
change from a deliberate local edit: a difference in *behaviour* that is not written down here is a bug in the
port. A difference in *wording* usually is not — see the fidelity check below for how to tell them apart.

- **Upstream baseline**: `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`
- **Upstream buckets**: `skills/engineering/`, `skills/productivity/`, `skills/in-progress/`, `skills/misc/`.
  Skills are matched by **leaf folder name**, not by bucket.
- **Mapping**: the sync tool keeps a machine-readable `upstream name -> local name` map alongside the commit it
  last checked. That map is mechanical; every *reason* lives in this file.

## Fidelity check

```bash
git clone --depth 1 https://github.com/mattpocock/skills /tmp/mp-skills
diff -ru /tmp/mp-skills/skills/<bucket>/<upstream-name> skills/<local-name>
```

Run it per skill, over every file, and over every row of the mapping table below.

**What it proves, and what it does not.** It surfaces every difference, and there are a lot of them: about
1,400 lines across the mapped skills at baseline `6654f6b`. That is expected. Most of it is **wording**, not
drift: upstream ran a house-style pass that removed em-dashes *and rewrote the clauses around them*, and we did
not follow it (Global rule 2), so a ported file often says the same thing in different words.

Do not try to filter that out mechanically. Mapping `—` to `-` on both sides looks like it should help and
**removes nothing** — measured over every mapped skill, zero diff lines — because upstream replaced each dash
with a colon or a semicolon and reflowed the sentence. There is no cheap normalization here.

So the check is a **reading list**, not a pass/fail gate. Work through the hunks; for each, decide whether it is
a divergence this file names, our wording, or a real upstream content change nobody ported. Only the third is a
finding. When you find one, port it and add a bullet here.

## Global rules

These hold for every ported file. They are not repeated in the per-skill sections.

### 1. Namespacing

The plugin is installed as `meldom`, so both providers address its skills as `meldom:<name>`. Exactly two
things get the prefix:

- an **operative instruction to call the Skill tool** (`Call the Skill tool with "meldom:tdd"`), and
- a **mention of a skill by name in prose** (`the meldom:code-review skill`).

Never prefixed: label values, file names, directory names, URL paths, ordinary English words. `wayfinder:<type>`
labels stay the plain strings `research`, `prototype`, `grilling`, `task`. A prototype route named after the
skill is `prototype`, not `meldom:prototype`.

Upstream writes skill dependencies as `Call the Skill tool with "grilling"`; we write
`Call the Skill tool with "meldom:grilling"`. A bare name would not resolve for someone who installed only this
plugin. This substitution is expected in **every** ported file and is not listed per skill.

The two agents ship under the plugin too, so their subagent type is `meldom:meldom-reviewer` and
`meldom:meldom-worker`. The doubled word is correct: the folder is `agents/meldom-reviewer.md` and the plugin
namespace is `meldom:`.

### 2. Punctuation and formatting

**Never rewrite punctuation.** Upstream removed em-dashes as a house style; we did not follow, and we are not
going to sweep our prose to match. Two cases, and neither involves editing a sentence for punctuation:

- A file we take **wholesale from upstream** keeps upstream's text exactly as upstream wrote it, punctuation
  included. That is not us changing the style, it is simply the file we copied.
- A file we have **rewritten for Meldom** (`triage`, `wayfinder`, `implement`, `implement-spec`, `to-tickets`,
  and everything under Meldom-only) keeps its own writing, em-dashes and all. Porting an upstream change into
  it means porting the *content* of that change, in our voice, not retyping our paragraphs in upstream's.

There is no mechanical way to hide the resulting noise, and the sync should not pretend otherwise: mapping the
dashes to `-` on both sides removes zero diff lines, because upstream swapped each one for a colon and reflowed
the clause. The fidelity check above says how to read the diff instead.

Never run a formatter over `skills/` or `agents/`: a prettier pass rewrites quotes and reflows lines, and every
one of those becomes a phantom hunk in the next sync.

### 3. Invocation

Upstream's own convention is [`.agents/invocation.md`](https://github.com/mattpocock/skills/blob/main/.agents/invocation.md). A user-invoked skill sets
`disable-model-invocation: true` in `SKILL.md` **and** `policy.allow_implicit_invocation: false` in
`agents/openai.yaml`; a model-invoked skill sets neither. The two must always agree, and `scripts/validate.mjs`
enforces it.

Meldom runs AFK agents that must be able to reach a skill without a human typing its name. So these upstream
**user-invoked** skills are **model-invoked** here, each with a model-facing description carrying trigger
phrasing:

`implement`, `to-tickets`, `triage`, `wayfinder`, `improve-codebase-architecture`, `grill-with-docs`,
`handoff`, `ask-meldom`.

These stay **user-invoked**, because firing them without being asked is the failure mode:

`grill-me`, `implement-spec`, `loop-me`, `retro`, `teach`, `to-questionnaire`, `wait-what`.

### 4. Meldom is the tracker

Every skill that touches a tracker uses `mcp__meldom__*` tools and nothing else. No `gh issue`, no
`docs/agents/issue-tracker.md`, no `.scratch/` directory, no GitHub or GitLab templates, no "run
`/setup-matt-pocock-skills` first" precondition. The MCP server announces the connection on its own, so there is
nothing to configure.

### 5. Ticket keys in prose

A Meldom ticket key is written `KEY-N` when it is a placeholder. Never `LOC-` (a dead tracker), never `MEL-`
(this repo's own project prefix, meaningless on a user's board).

### 6. Nothing personal, nothing from the product repo

The plugin is public and MIT. No path into the Meldom desktop repo, no `~/.meldom/` runtime path, no
maintainer-specific rule file names, no harness-specific tool names presented as if every harness has them, no
`model:` pin on an agent.

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
| `engineering/improve-codebase-architecture` | `improve-codebase-architecture` | yes     |
| `engineering/prototype`                     | `prototype`                     | yes     |
| `engineering/research`                      | `research`                      | yes     |
| `engineering/resolving-merge-conflicts`     | `resolving-merge-conflicts`     | yes     |
| `engineering/tdd`                           | `tdd`                           | yes     |
| `engineering/to-spec`                       | `to-tickets` (Phase A)          | yes     |
| `engineering/to-tickets`                    | `to-tickets` (Phase B)          | yes     |
| `engineering/triage`                        | `triage`                        | yes     |
| `engineering/wayfinder`                     | `wayfinder`                     | yes     |
| `engineering/wizard`                        | `wizard`                        | yes     |
| `in-progress/implement-spec`                | `implement-spec`                | yes     |
| `in-progress/loop-me`                       | `loop-me`                       | yes     |
| `in-progress/retro`                         | `retro`                         | yes     |
| `productivity/grill-me`                     | `grill-me`                      | yes     |
| `productivity/grilling`                     | `grilling`                      | yes     |
| `productivity/handoff`                      | `handoff`                       | yes     |
| `productivity/teach`                        | `teach`                         | yes     |
| `productivity/to-questionnaire`             | `to-questionnaire`              | yes     |
| `productivity/wait-what`                    | `wait-what`                     | yes     |
| `productivity/writing-for-agents`           | `writing-for-agents`            | yes     |

**Meldom-only, no upstream source.** The sync never diffs these and never rewrites them:
`bulletproof`, `explore-approaches`, `merge-worktree`, `ship`, `agents/meldom-worker.md`, and
`agents/meldom-reviewer.md` (except its Smell Baseline section, below).

## Per-skill divergences

### ask-meldom (`engineering/ask-matt`)

- **Renamed** `ask-matt` to `ask-meldom`; the frontmatter `name` and the folder follow.
- **Model-invoked** (global rule 3) with a model-facing description, so an agent that is unsure which skill fits
  loads the map on its own instead of waiting to be asked.
- Router entries name skills as `meldom:<name>` rather than `/<name>`, so the name copies straight into a Skill
  tool call on either provider.
- The map covers **every skill folder in this plugin**, so the Meldom-only skills (`ship`, `merge-worktree`, `bulletproof`,
  `explore-approaches`) are added to the groups they belong to, and `to-spec` collapses into the
  single `meldom:to-tickets` entry.
- Upstream's `## Precondition` section pointed at `/setup-matt-pocock-skills`. Replaced: Meldom is the tracker
  and needs no setup, and domain docs (`CONTEXT.md`, ADRs) are read when present and created lazily by
  `meldom:domain-modeling`.
- `PHASE-BOUNDARIES.md` tracks upstream unchanged.

### code-review (`engineering/code-review`)

- The Spec axis finds its spec in Meldom instead of `docs/agents/issue-tracker.md`, in this order: a ticket key
  or ULID passed as an argument, the tickets this conversation tracks
  (`mcp__meldom__conversation_status`), a `[A-Z]+-[0-9]+` key in the branch name, a spec path passed as an
  argument, then ask. The ticket is read with `mcp__meldom__ticket_view`, including its `attachments[]` and
  `notes[]`.
- Standards sources are `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, or a standards file the repo documents. No
  `.scratch/`.
- After aggregating, confirmed Spec findings are posted as one `mcp__meldom__comment_create` comment on the
  ticket, when a ticket was found, so the review is visible on the board.
- The Smell Baseline stays inline **and** is mirrored into `agents/meldom-reviewer.md`, which `bulletproof`
  spawns. That section carries an HTML comment naming this skill as its upstream source; a smell-baseline
  change ports into both places.

### codebase-design (`engineering/codebase-design`)

No divergence beyond the global namespacing rule. Wording differs where upstream rewrote it (global rule 2).

### diagnosing-bugs (`engineering/diagnosing-bugs`)

- Upstream Phase 4 is kept verbatim. The former "Meldom: flip the debug flag" section is **removed**: it
  documented the Meldom desktop app's own logging layer, linked into that repo (`../../../docs/logging.md`) and
  named a runtime path (`~/.meldom/logs/`) that means nothing on a user's machine.
- One Meldom addition in Phase 4: when the app under test runs as a Meldom command, read its output with
  `mcp__meldom__command_output` instead of asking the user to paste logs.
- Phase 6 files a worth-tracking bug with `mcp__meldom__ticket_create` instead of the upstream tracker.

### domain-modeling (`engineering/domain-modeling`)

No divergence beyond the global namespacing rule. Wording differs where upstream rewrote it (global rule 2).

### grill-me (`productivity/grill-me`)

- Its `Call the Skill tool` target is `meldom:grilling` (global rule 1). A bare `grilling` does not resolve for
  someone who installed only this plugin.

### grill-with-docs (`engineering/grill-with-docs`)

- **Model-invoked** (global rule 3), with a model-facing description.
- Calls `meldom:grilling` and `meldom:domain-modeling`.

### grilling (`productivity/grilling`)

- Adds a closing paragraph: end with a one-bullet-per-decision recap, produce no tickets and no files beyond the
  domain model, and leave the recap in the conversation ready for `meldom:to-tickets`. Upstream stops at "do not
  act on it until the user confirms"; on Meldom the next step is always ticket creation, and without this the
  skill invented tickets of its own.

### handoff (`productivity/handoff`)

- **Model-invoked** (global rule 3): a long session hits a phase boundary without the user thinking to ask.
- Still writes the Markdown file to the OS temporary directory, and **additionally** stores it as a Meldom note
  (`mcp__meldom__note_create`, label `handoff`, `ticket_ids` = the conversation's tracked tickets when there are
  any). A file in `/tmp` does not survive the machine; the note does.

### implement (`engineering/implement`)

- **Model-invoked** (global rule 3).
- Rewritten against Meldom throughout: the spec is a parent ticket read with `mcp__meldom__ticket_view`, the
  claim is `mcp__meldom__ticket_batch_update` to `in_progress`, per-ticket completion is `ticket_update` to
  `done` with a reason, the review outcome is `mcp__meldom__ticket_outcome`, and the parent is closed explicitly
  because Meldom never rolls parent status up from children.
- Hands off to `meldom:implement-spec` for the parallel, one-PR path, and says that skill is user-invoked so it
  cannot be reached with the Skill tool.
- Does not commit: Meldom works on `main` and committing is the user's or `meldom:ship`'s job.

### implement-spec (`in-progress/implement-spec`)

- The PRD is a Meldom parent ticket of `type: "prd"`; its children are the slices. Ticket state is owned by this
  session through `mcp__meldom__*`; subagents never call Meldom, so they are handed the ticket **body**, not an
  id.
- Implementer subagents are `Agent(subagent_type: "meldom:meldom-worker")`, with an explicit fallback for
  providers that have no subagents at all.
- **Concurrency is looked up, not asked.** Before choosing one-at-a-time versus parallel, call
  `mcp__meldom__worktree_list`: worktrees that already exist and belong to this chat are the only source of
  parallelism. Never run `git worktree add`; worktree creation is user-driven.
- Committing from a Meldom chat goes through `meldom:ship`, not raw `git commit`.

### improve-codebase-architecture (`engineering/improve-codebase-architecture`)

- **Model-invoked** (global rule 3).
- Refactor steps are filed as Meldom tickets (`mcp__meldom__ticket_create`, and a parent plus children for a
  multi-step refactor) instead of the upstream tracker.
- Upstream deleted `DEEPENING.md`, `INTERFACE-DESIGN.md` and `LANGUAGE.md` from this skill; the local copies are
  deleted too. `DEEPENING.md` lives on in `codebase-design`, where upstream keeps it.

### loop-me (`in-progress/loop-me`)

No divergence beyond the global namespacing rule: the stateful session it runs is `meldom:grilling`. Wording differs where upstream rewrote it (global rule 2).

### prototype (`engineering/prototype`)

- Global namespacing rule only. Note the trap it fixes: the throwaway route is named `prototype`, a **file
  name**, so it is never prefixed.

### research (`engineering/research`)

- Still writes the cited Markdown file where the repo keeps such notes, and **additionally** stores the findings
  as a Meldom note (`mcp__meldom__note_create`, label `research`) attached to the ticket it was asked from, so a
  later session finds the research from the board instead of from a path it has to guess.

### resolving-merge-conflicts (`engineering/resolving-merge-conflicts`)

No recorded divergence. Wording differs from upstream where upstream rewrote it (global rule 2).

### retro (`in-progress/retro`)

- Improvement candidates the user accepts are filed as meldom tickets (`mcp__meldom__ticket_create`) so they
  land in the same backlog as everything else.
- Step 2 says where session logs live **per harness** (Claude Code `~/.claude/projects/<slug>/*.jsonl`, Codex
  `~/.codex/sessions/`, otherwise ask). Upstream says only "session logs on this machine".
- The coding-standards candidate names the plugin's own reviewer agent, `meldom:meldom-reviewer`, and its Smell
  Baseline, because that is where a new rule would actually go here.

### tdd (`engineering/tdd`)

No divergence beyond the global namespacing rule. Wording differs where upstream rewrote it (global rule 2).

### teach (`productivity/teach`)

No recorded divergence. Wording differs from upstream where upstream rewrote it (global rule 2).

### to-questionnaire (`productivity/to-questionnaire`)

No recorded divergence. Wording differs from upstream where upstream rewrote it (global rule 2).

### to-tickets (`engineering/to-spec` + `engineering/to-tickets`)

- **Two upstream skills, one local skill.** Upstream splits spec-writing (`to-spec`) from ticket-splitting
  (`to-tickets`); Meldom publishes both into the same board, and the parent-plus-children shape is one act. So
  `to-tickets` has a routing table and two phases: **Phase A** writes the spec and publishes it as the parent
  ticket (`ticket_create`, `type: "prd"`, `parent_id: null`), **Phase B** breaks the work into child tickets
  (`ticket_batch_create`). A `to-spec` diff ports into Phase A, a `to-tickets` diff into Phase B. Never
  whole-file replace.
- **Model-invoked** (global rule 3).
- Blocking edges are Meldom's native `blocked_by`, never text in a file under `.scratch/`.
- Single-ticket work publishes one ticket and stops: a parent exists to organize two or more children.

### triage (`engineering/triage`)

- **Model-invoked** (global rule 3).
- Roles map onto **Meldom ticket fields** (`status`, `assignee`, labels) instead of the label vocabulary
  `setup-matt-pocock-skills` used to write into a config file. There is no label file to read.
- `OUT-OF-SCOPE.md`: the rejected-request knowledge base is Meldom **notes** labelled `out-of-scope`, one per
  concept, attached to the tickets they cover, instead of files under `.out-of-scope/`.
- `AGENT-BRIEF.md`: the brief is written into the ticket **body** with `ticket_update`, so upstream's
  "post a structured comment" framing and its `## Agent Brief` heading are dropped. Its examples are rewritten
  against a Meldom ticket field so they read as this tracker's work.
- **External PRs are not a triage surface.** Upstream triages an external pull request as "an issue with
  attached code". A Meldom ticket has no attached diff, so the PR deltas, the PR discovery filter and the PR
  agent-brief example are all dropped. A PR is reviewed with `meldom:code-review`, not triaged.
- Ticket keys in prose are `KEY-N` (global rule 5).

### wait-what (`productivity/wait-what`)

No recorded divergence. Wording differs from upstream where upstream rewrote it (global rule 2).

### wayfinder (`engineering/wayfinder`)

- **Model-invoked** (global rule 3).
- Meldom **is** the tracker. The map is a parent ticket labelled `wayfinder:map` with `assignee: "human"`; its
  decisions are child tickets with `parent_id` set to the map; blocking is native `blocked_by`; the frontier is
  `ticket_list({ parent_id, unblocked: true })`; a resolution is a `comment_create` plus `ticket_update` to
  `done`.
- `wayfinder:<type>` labels are the plain strings `research`, `prototype`, `grilling`, `task` (global rule 1).
  They are label values, so they are never namespaced, even though three of them share a name with a skill.
- The Skill tool calls inside the type descriptions **are** namespaced: `meldom:research`,
  `meldom:prototype`, `meldom:grilling`, `meldom:domain-modeling`.
- A research subagent captures its findings as a **Meldom note** attached to the ticket, instead of upstream's
  throwaway `research/<name>` branch with a context pointer from the issue.
- Ticket keys in prose are `KEY-N` (global rule 5).

### wizard (`engineering/wizard`)

- `template.sh` is generated by `meldom:wizard`, so its header comment names the namespaced skill.

### writing-for-agents (`productivity/writing-for-agents`)

No recorded divergence. Wording differs from upstream where upstream rewrote it (global rule 2).

## Tombstones

Upstream skills this plugin deliberately does not ship. `localMapping` maps each to `null`.

| Upstream skill               | Why not                                                                                                            | Watch |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----- |
| `setup-matt-pocock-skills`   | Writes GitHub / GitLab / `.scratch` tracker config that no Meldom skill reads, and triage labels Meldom never opens. Its domain-docs paragraph moved into `ask-meldom`'s precondition; the tracker connection is announced by the MCP server. | **yes** |
| `claude-handoff`             | Claude Code specific; `handoff` covers it harness-neutrally.                                                        | no    |
| `setup-ts-deep-modules`      | TypeScript project scaffolding, not a Meldom workflow.                                                              | no    |
| `writing-beats`              | Prose-writing skill, off this plugin's subject.                                                                     | no    |
| `writing-fragments`          | Prose-writing skill, off this plugin's subject.                                                                     | no    |
| `writing-shape`              | Prose-writing skill, off this plugin's subject.                                                                     | no    |
| `git-guardrails-claude-code` | Claude Code specific, and Meldom's own git rules live in `meldom:ship` and `meldom:merge-worktree`.                  | no    |
| `migrate-to-shoehorn`        | One library's migration, not a Meldom workflow.                                                                     | no    |
| `scaffold-exercises`         | Teaching-material scaffolding, off this plugin's subject.                                                           | no    |
| `setup-pre-commit`           | Repo scaffolding, not a Meldom workflow.                                                                            | no    |

**Watched** means the sync still diffs it every run and asks one question: does this change add a config section
that a skill we *do* ship now reads? A yes is ported or consciously dropped; silence is the failure mode this
column exists to prevent. Everything else is skipped without a diff.
