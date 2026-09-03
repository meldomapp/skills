# Changelog

All notable changes to the `meldom` plugin. The version is the one both manifests carry, and every release is
tagged `v<version>`.

## 1.0.3

- Sixteen more skills, so the plugin carries the whole working set rather than half of it. Ten are Meldom's own:
  `codebase-design`, `domain-modeling`, `explore-approaches`, `grill-with-docs`, `handoff`,
  `resolving-merge-conflicts`, `tdd`, `teach`, `wait-what` and `writing-for-agents`. Six come from upstream:
  `research` (investigate against primary sources, capture as Markdown), `wizard` (generate an interactive bash
  wizard for steps only a human can perform), `setup-matt-pocock-skills` (configure a repo's issue tracker,
  triage labels and domain docs), `loop-me` (grill you about the specs for workflows you want to build),
  `grill-me` (the stateless interview, for when there's no repo to leave a paper trail in) and
  `to-questionnaire` (turn a decision you cannot answer into a questionnaire for someone else).
- Cross-references to them are namespaced now that they live here — `implement` reaches `meldom:tdd`, and
  `improve-codebase-architecture` reaches `meldom:codebase-design`.
- `review` is now `code-review`, carrying upstream's two-axis shape: Standards (does the diff follow the repo's
  documented coding standards, plus a Fowler smell baseline) beside Spec (does it implement what the originating
  issue asked). It needs a fixed point — a commit, branch or tag — and asks for one when the caller omits it.
  Callers move with it: `implement`, `implement-spec`, `tdd` and `retro`. The Spec axis reads
  `docs/agents/issue-tracker.md`, whose variants cover GitHub, GitLab and a local file — so it no longer fetches
  a Meldom ticket on its own and asks where the spec is instead. `implement` and `implement-spec` still record
  `ticket_outcome` from what it reports.
- `using-meldom` is gone, replaced by **`ask-meldom`** — a map you read rather than a router that runs. Ported
  from upstream `ask-matt` and adapted: it lays out the main flow (idea → ship), the on-ramps that merge onto it,
  codebase health, the vocabulary layer underneath, phase boundaries, and everything standalone. Being
  user-invoked, no agent reaches it; type it when you want to see how the skills connect. Its
  `PHASE-BOUNDARIES.md` covers the five options at a phase boundary and why `compact` is the default.
- Dropped `improve`, `sync-docs` and `issue-intake`. `improve` came from `shadcn/improve`, not from Meldom, and
  `sync-docs` and `issue-intake` are personal tools rather than part of the shared workflow. Bug entry now runs
  through `meldom:diagnosing-bugs` for a mystery, and straight to `meldom:to-tickets` otherwise.
- Dropped `guide` and `skeptic`. The Meldom MCP server documents its own tools — it ships instructions and a
  `help(topic=…)` tool — so `guide` restated in a skill what the server already answers on demand.
  `implement-spec` no longer cites it for the ship-card rule; the rule is stated where it applies.
- `explore-approaches` and `codebase-design`'s design-it-twice pass say what to do when the provider has no
  subagents.
- `meldom-reviewer` keeps its own copy of the smell baseline. `bulletproof` spawns it as a subagent, and an agent
  loads its file standalone, so the list has to sit inline there as well as in `code-review`.

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
