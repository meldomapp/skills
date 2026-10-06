# Changelog

All notable changes to the `meldom` plugin. The version is the one both manifests carry, and every release is
tagged `v<version>`.

## 1.0.14

Every ported skill is upstream's text again, synced to mattpocock/skills `6fd9479`. Meldom's additions sit in one
`## On Meldom` section at the bottom of a skill; above it, a skill differs from upstream only where upstream
names a tracker or a mechanism Meldom replaces.

- **Run `/meldom:setup-matt-pocock-skills` once per repo.** It records Meldom as the issue tracker in
  `docs/agents/issue-tracker.md`, sets the triage labels, and lays out the domain docs, as upstream's setup does.
  The engineering skills ask for it when it has not run.
- **Breaking: `CONTEXT.md` is now `GLOSSARY.md`**, and `CONTEXT-MAP.md` is `GLOSSARY-MAP.md`, as upstream
  renamed them. If a repo has the old files, `git mv` them: the skills only look for the new names.
- **Breaking: invocation follows upstream.** `ask-meldom`, `to-spec`, `to-tickets`, `implement`, `triage`,
  `wayfinder`, `improve-codebase-architecture`, `grill-with-docs` and `handoff` are user-invoked, so only a
  user typing `/meldom:<name>` starts them; no agent can reach them through the Skill tool.
- `implement` is upstream's loop, committing through `meldom:ship`, with the Meldom steps on top: claim, progress
  bar, follow-ups built in the same session, review outcome, parent closing. Typechecking runs regularly, as
  upstream says, instead of once at the end.
- `implement-spec` lands the spec on one integration branch. Implementers use the worktrees this chat owns, and
  are cleaned up with `worktree_remove`.
- `triage` handles external PRs when the tracker doc's flag says so, and keeps out-of-scope records as notes
  labelled `out-of-scope`.
- `ask-meldom` puts `retro` at the end of the main flow and points `diagnosing-bugs` at `retro`.
- `handoff` names where the OS temp directory is (`$TMPDIR`, else `/tmp`; `%TEMP%` on Windows).
- `pr`'s component-tree example is a readable tree again.
- `wizard`'s `template.sh` and `diagnosing-bugs`' HITL loop script are upstream's again: the wizard clears each stage
  without waiting for Enter, and the HITL loop prints the two example captures by name.
- `resolving-merge-conflicts` is removed, as upstream removed it.
- `loop-me` is removed: upstream keeps it in `in-progress/`, its beta bucket.
- `bulletproof` and `explore-approaches` are removed, and so are the `meldom-worker` and `meldom-reviewer` agents:
  upstream's skills use the harness's own subagents.

## 1.0.13

`code-review` reviews uncommitted work.

- The review covers `git diff $(git merge-base <fixed-point> HEAD)` — commits since the merge-base plus staged
  and unstaged changes — and every untracked file, read whole. It stops before its sub-agents only on a bad ref
  or an empty change set.
- With no fixed point on a dirty tree, the fixed point is `HEAD`, so the uncommitted work is reviewed without a
  question. A clean tree with no fixed point still asks.
- `implement` calls `code-review` with `HEAD`, so its review step sees exactly what the session built before
  anything is committed.
- The README's Codex update command is `codex plugin marketplace upgrade meldom`. Without the name, Codex
  upgrades every Git marketplace you have added.
- `bulletproof` Phase 6 is steps 16 and 17, so no step number repeats.
- In `bulletproof`, a change over 3000 lines is split across three review agents per
  `references/structural-review.md`, which is where that procedure lives.
- `code-review`'s description says what it reviews: the commits since a fixed point plus staged, unstaged and
  untracked work, and with no fixed point on a dirty tree, the uncommitted work against `HEAD`.
- `bulletproof`'s edge-case table links `references/structural-review.md`, as its steps do.
- `implement`, `implement-spec`, `triage` and `to-tickets` read a ticket in its `detailed` form and page its body
  and relations, as `code-review` does, so a long spec is never read trimmed.
- `meldom-worker` says it receives the ticket body, which is what `implement-spec` hands it.
- `explore-approaches` asks the user in plain words rather than naming one provider's question tool.
- A `wizard` waits for Enter before clearing each finished stage, so its confirmations are read, and its summary
  lists the GitHub variables it set.
- `merge-worktree` waits on required checks with `gh pr checks --watch --fail-fast --required` and on a peer's
  landing with one 30-second re-check loop, instead of an open-ended poll, and says to give those waits a long
  timeout or run them in the background.
- `merge-worktree`'s peer-landing loop finds the main checkout's `MERGE_HEAD` by its absolute path, so it sees a
  merge in progress from any working directory.
- `merge-worktree`'s waits end. The peer-landing loop gives up after 30 minutes and reports a detached
  submodule instead of waiting on it; the merge wait stops on a closed PR or a cancelled auto-merge and gives up
  after 20 minutes; `gh pr checks` reporting no checks right after a push is run again after 30 seconds.
- `code-review`, `implement`, `implement-spec`, `triage` and `to-tickets` page a ticket body by the field
  `ticket_view` returns: while the result carries `next_body_cursor`, they call again with
  `body_offset: <next_body_cursor>`.

## 1.0.12

New `security-audit` skill for finding exploitable security weaknesses and checking security fixes.

- The audit instructions are copied unchanged from the local Claude skill.
- Available in Claude Code and Codex as `meldom:security-audit`, with entries in the skill map and README.

## 1.0.11

`ship --mine` ships only your own lines from a file other sessions also edited.

- Under `--mine`, a shared file is proposed as your exact Git patch. The card sends `baseCommit` and a `patch`
  on every file row, and shows those patches instead of the live whole-file diff.
- After approval, `references/partial-staging.md` commits the selected patches from a temporary index with
  `git commit-tree` and moves the branch with `git update-ref` only while HEAD is still the reviewed base. Other
  sessions' edits stay uncommitted in the working files, and their staged work on other paths is untouched.
- A moved HEAD, a changed branch, or a selected path someone else staged stops the ship with nothing committed.
- Patch-mode commits run no Git hooks, so the patch and message must already be formatted and checked.

## 1.0.10

`implement` and `implement-spec` report their progress to the Meldom session progress bar.

- `implement` and `implement-spec` call `mcp__meldom__progress`: one `plan` after the claim, with exactly one
  step per ticket (or slice) sized `S`, `M` or `L` and nothing else; `done` in the same message as that ticket's
  (or slice's) move to `done`; `finish` with the last call of the run. `implement` sends its `plan` on the first
  pass only and `add`s each follow-up it files and each ticket review sends back to `open`.
- When the tool is not there — an older app or a session outside Meldom — the skill searches for it once, then
  skips every progress call silently and carries on, with nothing to retry. Turning the Session progress setting
  off only hides the bar: the tool is still there, so the skill still reports.

## 1.0.9

`implement` builds without stopping to ask, and the reviewer reads `AGENTS.md`.

- `implement` treats the handed-over work as confirmation of its test seams, so it builds without asking.
- `meldom-reviewer` reads `CLAUDE.md` or `AGENTS.md` first, so a repo that keeps its rules in `AGENTS.md` is
  reviewed against them.

## 1.0.8

`implement` reviews and checks once, at the end, and the new `pr` skill writes pull request bodies.

- New `pr` skill, ported from upstream: the shape a pull request body should take — a summary visual (pseudocode,
  call tree, file tree, Mermaid or a diff sketch), a before/after pair of evidence, and a merge-danger call (one-way
  or two-way door, blast radius). Model-invoked; `ask-meldom` points to it from the landing step.
- `retro` classifies a coding-standards finding before writing it: a mechanical violation gets a deterministic
  check (a linter rule, a pre-commit hook or a CI job), and `CODING_STANDARDS.md` is kept for judgement calls. It
  reads the repo's own check command first, and flags a repo with no guardrail at all as a finding. Its steering
  file candidate is `AGENTS.md` again, and its Files list matches upstream.
- `implement` and `implement-spec` run the review and whole-project checks once, at the end. While building,
  only the tests covering what was just touched run. After the last ticket, `code-review` runs, and a ticket
  it fails is rebuilt; then the full suite, lint, format, typecheck and build run once as the **gate**. `tdd`
  points to review instead of calling it, and `meldom-worker` leaves the gate to the orchestrator. The
  `bun`-only examples in `implement` and `tdd` are gone, so the guidance fits any stack.
- `ship --mine` marks every file the agent edited or created, untracked ones included, as `agentTouched: true`:
  the ship card pre-checks exactly those and adds nothing of its own. The confirmed-selection check compares
  against that same set.

## 1.0.7

`implement` builds every ticket it creates.

- `implement` closes the loophole 1.0.6 left open. Its scope is every ticket the session creates, whatever its
  type, cause or age: a "pre-existing" bug found mid-build is built here, not filed as a board root and handed
  back. Step 6 reads `conversation_status` and loops until every ticket the session created is `done`, and the
  final-message rule — implemented and reviewed, never an open ticket or a next step — now opens the skill.

## 1.0.6

`implement` finishes what it starts, `to-spec` and `to-tickets` are two skills again, and the spec ticket type is
`spec`.

- `implement` files every follow-up inside the family of the ticket being built: under the spec, or under the
  ticket's own parent, and a root ticket with no parent is first given a spec and moved under it. `parent_id` is
  always passed; a follow-up is never a board root.
- `implement` builds its follow-ups in the same session. Its scope is what it was handed plus every follow-up it
  files; once a pass is done it goes back to step 1 with the scope's open tickets, and repeats until a pass
  files nothing new. Done means every ticket in the scope is `done`, implemented and reviewed, and the final
  message says exactly that — never a list of open tickets or next steps left for the user. The one exception
  is a step only a human can take, handed over through `meldom:wizard` or a question.
- `to-tickets` is split back into upstream's two skills. `to-spec` turns the conversation into a spec and
  publishes it as a ticket of type `spec`; `to-tickets` breaks a plan or spec into tracer-bullet tickets with
  native blocking edges, quizzing the user on the breakdown before publishing, as upstream does. Both follow
  their upstream text, with Meldom as the only tracker. The `ask-meldom` map, `grilling`, the README and the
  ledger name both.
- The spec ticket type is `spec`, the word every skill already used for the thing itself. Every `ticket_create`
  that publishes a spec passes `type: "spec"`, which needs a Meldom desktop that knows the type.

## 1.0.5

`implement` keeps its scope, and every skill that tells an agent to run tests says how.

- `implement` fixes its scope at the read: a parent means its open children as of step 1. Anything the build
  surfaces past that — a bug beside the seam, a piece the spec skipped, a refactor that would help — is a
  follow-up, filed the moment it is seen as a ticket under the spec (or, with no spec, under the chat's home PRD
  through the MCP create-time default), and the agent returns to the criterion it was on. Once every in-scope
  ticket is done, it starts again at step 1 with the parent so the follow-ups become the next run's scope; the
  parent closes in the run that files nothing new. Work an in-scope criterion cannot pass without stays in scope
  and gets built.
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
