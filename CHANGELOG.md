# Changelog

All notable changes to the `meldom` plugin. The version is the one both manifests carry, and every release is
tagged `v<version>`.

## 1.1.0

- Dropped `improve`, `sync-docs` and `issue-intake`. `improve` came from `shadcn/improve`, not from Meldom, and `sync-docs` and `issue-intake` are personal
  tools rather than part of the shared workflow. Bug entry now runs through `meldom:diagnosing-bugs` for a
  mystery, and straight to `meldom:to-tickets` otherwise.
- Ten more skills, so the plugin carries the whole working set rather than half of it:
  `codebase-design`, `domain-modeling`, `explore-approaches`, `grill-with-docs`, `handoff`,
  `resolving-merge-conflicts`, `tdd`, `teach`, `wait-what` and `writing-for-agents`.
- Cross-references to them are namespaced now that they live here — `implement` reaches `meldom:tdd`,
  `improve-codebase-architecture` reaches `meldom:codebase-design`, and the router's decision tree names all ten.
- `explore-approaches` and `codebase-design`'s design-it-twice pass say what to do when the provider has no
  subagents.

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
