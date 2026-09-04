# Changelog

All notable changes to the `meldom` plugin. The version is the one both manifests carry, and every release is
tagged `v<version>`.

## 1.0.5

One rule, in every skill that tells an agent to run tests.

- `tdd` and `implement` now say how to run them, with examples: through the project's own test script, scoped to
  the files you touched, the whole suite through that same script and only when you need it — never a bare runner
  pointed at a whole tree, and never a pipe as a gate. `resolving-merge-conflicts` and `bulletproof`, which also
  tell an agent to run checks, carry the same rule in one line each. Both reasons are concrete rather than stylistic. A project's script is
  where the flags that keep a suite survivable live (parallel workers, per-file isolation, memory bounds); on
  2026-09-03 a bare runner over a whole suite grew to 35 GB, and five of them in fifteen minutes froze the
  machine mid-task. And `a | tail && b` never gates, because without `pipefail` the pipeline's exit status is
  `tail`'s — the same day, that ran a whole suite over a failing typecheck.

## 1.0.4

Fixes found by reviewing 1.0.3 after it shipped. No behaviour change to any workflow.

- `diagnosing-bugs`' HITL loop script no longer dies at the finish line. Its epilogue printed two hardcoded
  variable names from outside the `edit below/above` markers, so renaming the example captures — which the
  instructions invite — left `set -u` killing the script after the human had completed every manual step, losing
  every answer they had just typed. `capture` now records the names it fills and the epilogue prints whatever
  is there, so any naming works and removing the examples entirely is fine too.
- `scripts/validate.mjs` no longer fails on Windows. The `SKILL.md` placement check compared a
  platform-separator path against a hardcoded `/`, so every skill failed there and the file lost its own
  self-exemption from the banned-string scan along with it.
- `scripts/validate.mjs` no longer skips its coverage checks when `README.md` or `PORTING.md` is empty. A
  truncated file silently passed every router, table and ledger check instead of failing them.
- `scripts/validate.mjs` now validates the two shipped agents: each needs a name and a description, and neither
  may pin `model:`. An agent runs on whatever model the user's harness provides; nothing checked before.
- `PORTING.md` links upstream's invocation convention on GitHub rather than citing a `/tmp` clone path that only
  exists mid-sync.

## 1.0.3

Every skill ported from [mattpocock/skills](https://github.com/mattpocock/skills) now drives the Meldom board
and nothing else, with each intentional difference recorded in `PORTING.md`. Four skills are Meldom's own and
have no upstream source: `ship`, `merge-worktree`, `bulletproof` and `explore-approaches`.

### The skill set

- Fifteen more skills, so the plugin carries the whole working set rather than half of it. Ten already shipped
  in the app's own bundle:
  `codebase-design`, `domain-modeling`, `explore-approaches`, `grill-with-docs`, `handoff`,
  `resolving-merge-conflicts`, `tdd`, `teach`, `wait-what` and `writing-for-agents`. Five come from upstream:
  `research` (investigate against primary sources, capture as Markdown), `wizard` (generate an interactive bash
  wizard for steps only a human can perform), `loop-me` (grill you about the specs for workflows you want to
  build), `grill-me` (the stateless interview, for when there's no repo to leave a paper trail in) and
  `to-questionnaire` (turn a decision you cannot answer into a questionnaire for someone else).
- Cross-references to them are namespaced now that they live here — `implement` reaches `meldom:tdd`, and
  `improve-codebase-architecture` reaches `meldom:codebase-design`. Only two things get the prefix: a Skill-tool
  call and a mention of a skill in prose. Labels and paths stay plain, so a `wayfinder:prototype` ticket label
  and a `prototype/` route are spelled exactly that way.
- Dropped `improve`, `sync-docs` and `issue-intake`. `improve` came from `shadcn/improve`, not from Meldom, and
  `sync-docs` and `issue-intake` are personal tools rather than part of the shared workflow. Bug entry now runs
  through `meldom:diagnosing-bugs` for a mystery, and straight to `meldom:to-tickets` otherwise.
- Dropped `guide` and `skeptic`. The Meldom MCP server documents its own tools — it ships instructions and a
  `help(topic=…)` tool — so `guide` restated in a skill what the server already answers on demand.
  `implement-spec` no longer cites it for the ship-card rule; the rule is stated where it applies.
- No `setup` skill. Configuring an issue tracker, triage labels and a doc layout is what upstream's setup skill
  did, and nothing here reads that config: Meldom is the tracker, the MCP server announces the connection,
  `triage` maps onto ticket fields rather than a label file, and domain docs are created lazily by
  `domain-modeling`. It stays a **watched tombstone** in `PORTING.md`, so a future upstream change to it gets a
  conscious decision rather than silence.

### Meldom-native, everywhere

- `review` is now `code-review`, carrying upstream's two-axis shape: Standards (does the diff follow the repo's
  documented coding standards, plus a Fowler smell baseline) beside Spec (does it implement what the originating
  ticket asked). It needs a fixed point — a commit, branch or tag — and asks for one when the caller omits it.
  Callers move with it: `implement`, `implement-spec`, `tdd` and `retro`. The Spec axis finds its spec on the
  board: a ticket key you pass, then the tickets this conversation tracks, then a `KEY-123` in the branch name,
  then a spec path, then it asks. It reads the ticket with `ticket_view`, images and notes included, and posts
  its Spec findings back as one comment on that ticket. `implement` and `implement-spec` still record
  `ticket_outcome` from what it reports.
- `using-meldom` is gone, replaced by **`ask-meldom`** — a map of every skill and how they connect. Ported from
  upstream `ask-matt` and adapted: the main flow (idea → ship), the on-ramps that merge onto it, codebase
  health, the vocabulary layer underneath, phase boundaries, and everything standalone. It is **model-invoked**,
  so an agent unsure which skill fits loads the map itself instead of waiting to be asked. Its
  `PHASE-BOUNDARIES.md` covers the five options at a phase boundary and why `compact` is the default.
- `diagnosing-bugs` no longer ships Meldom's own internals. The "flip the debug flag" section is gone with its
  link into the desktop repo and its `~/.meldom/logs/` path; upstream's Phase 4 is back. What stays: when the app
  under test runs as a Meldom command, read its output with `command_output` instead of pasting logs, and Phase 6
  files a worth-tracking bug with `ticket_create`.
- `handoff` and `research` survive the machine. Both still write their file, and both now also store the same
  content as a Meldom note (labels `handoff` and `research`) attached to the tickets in play.
- `implement-spec` looks up its concurrency. It calls `worktree_list` before choosing one-at-a-time versus
  parallel, rather than asking a question the board already answers.
- `triage` roles map onto ticket fields (`status`, `assignee`, labels), and its rejected-request knowledge base
  is Meldom notes labelled `out-of-scope`, one per concept, rather than a directory of files.

### Portable, not personal

- Nothing harness-specific or personal. `bulletproof` says "the harness's LSP tool where it has one, grep where
  it does not" instead of naming tools that may not exist. `meldom-worker` dropped its `model:` pin, and both
  agents load `CLAUDE.md` / `AGENTS.md` and whatever rules the project points at, instead of the maintainer's own
  rule paths. `retro` says where session logs live per harness.
- `explore-approaches` and `codebase-design`'s design-it-twice pass say what to do when the provider has no
  subagents.
- `meldom-reviewer` keeps its own copy of the smell baseline. `bulletproof` spawns it as a subagent, and an agent
  loads its file standalone, so the list has to sit inline there as well as in `code-review`.
- Every skill carries `agents/openai.yaml`, so Codex shows a real display name in its picker, and a user-invoked
  skill carries `policy.allow_implicit_invocation: false` so the model cannot fire it.
- Stale ticket keys replaced: `LOC-42` and friends became `KEY-42` / `KEY-N`, the placeholder for a Meldom key.
- Three dead files removed from `improve-codebase-architecture` (`DEEPENING.md`, `INTERFACE-DESIGN.md`,
  `LANGUAGE.md`). Upstream deleted them and nothing referenced them; `DEEPENING.md` lives on in
  `codebase-design`, where upstream keeps it.

### Keeping it honest

- **`PORTING.md`**, the porting ledger. One section per ported skill listing every intentional difference from
  upstream and why, plus global rules for namespacing, invocation and punctuation, a mapping table, and the
  tombstones. It carries the fidelity command, so anyone can re-check a port in one line.
- Punctuation is never rewritten. A file copied from upstream keeps upstream's text as upstream wrote it; a file
  rewritten for Meldom keeps its own writing. `PORTING.md` says plainly what that costs — a fidelity diff of
  roughly 1,400 lines, most of it wording — and how to read it, rather than pretending a normalization step can
  filter it out.
- The validator guards all of it. New rules: every skill has an `openai.yaml` with a display name and short
  description; the two providers agree on invocation; no file carries a `LOC-` key, an `.out-of-scope/` path, a
  `gh issue` call, another tracker's config path, a harness-specific diagnostics tool, or a Meldom runtime path;
  and every skill has a row in the README table, an entry in the `ask-meldom` map, and a section in `PORTING.md`.

Commit `cf9e260` carried "1.1.0" in its message, but no `v1.1.0` was ever tagged and the manifests stayed on
1.0.x. This is the 1.0.3 release, and it supersedes that message.

## 1.0.2

- `using-meldom`: restore the prose heading "Main flow (idea → ship)". The port's chain-namespacing pass matched
  every line containing an arrow, so it rewrote a heading that names a phase, not a skill.

## 1.0.1

- Fix the README's update instructions. `claude plugin install` does not upgrade an installed plugin and
  `claude plugin marketplace update` does not either — only `claude plugin update` does. Codex updates with
  `codex plugin marketplace upgrade` alone.
- `meldom-worker` no longer declares a `tdd` skill the plugin does not ship.
- `implement-spec`, `skeptic` and `issue-intake` now say what to do when the provider has no subagents.

## 1.0.0

- First public release. The repository is open; nothing about the plugin's contents changed from 0.2.0.

## 0.2.0

- The full skill set: `using-meldom`, `implement`, `implement-spec`, `triage`, `improve`,
  `improve-codebase-architecture`, `wayfinder`, `issue-intake`, `review`, `skeptic`, `retro`, `sync-docs`,
  `prototype`, `diagnosing-bugs`, `grilling`, `bulletproof`, `ship`, `merge-worktree` and `to-tickets` join
  `guide` — twenty in all.
- The `meldom-worker` and `meldom-reviewer` agents ship with the plugin, so a skill that delegates works
  without the user installing agents by hand.
- Every cross-reference between skills is written in the namespaced, provider-neutral form
  ("invoke the `meldom:implement` skill"), so neither provider's invocation syntax is baked into the text.

## 0.1.1

- Probe release: a version bump with no content change, to measure how each provider refreshes a marketplace.

## 0.1.0

- First release: the plugin skeleton for Claude Code and Codex, and the `guide` skill.
