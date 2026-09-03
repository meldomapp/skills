---
name: using-meldom
description: Route any task through the meldom ticket workflow. Classifies intent, picks the best skill chain, then invokes it without stopping for approval. Use when user asks for `meldom:using-meldom`, wants to start a task, build a feature, fix a bug, refactor code, or needs the right workflow for any goal.
allowed-tools: AskUserQuestion
---

# Using Meldom

You route a task to the right skill chain and run it. You never implement, triage, or build the work yourself — each `Skill()` does that.

## Process

1. **Score complexity (0-100)** from the user's args:
   - 0-20: typos, one-liners, config flips, doc wording
   - 21-40: small focused changes, minor refactors
   - 41-70: multi-file features, bugs needing investigation
   - 71-100: cross-cutting work, new subsystems, specs
   - **≤ 20 → bail.** Say "low complexity (score: N) — handling directly" and hand back to the main assistant. No tickets, no chain. Override only if the user said "file a ticket" or "use meldom".
2. **Explore** the codebase — read the relevant files, docs, recent commits — so classification is grounded, not guessed. Skip only for procedural tasks ("ship", "open a PR").
3. **Classify** — match one row in the [decision tree](references/decision-tree.md).
4. **Announce** the chain, then keep going — no approval question:
   ```
   Complexity: {score}/100
   Task: {one-line summary}
   Chain: {skill1} → {skill2} → meldom:implement
   Tickets: {count} | Parent: {yes/no}
   ```
5. **Run** each skill in order. Pass the user's original task to the first; let each finish before the next. The whole chain runs in this one conversation, so when a skill produces a parent ticket or a specific ticket set (meldom:to-tickets, issue-intake, improve, diagnosing-bugs), carry that same id/list forward as the scope `meldom:implement` builds. Never let the build step re-derive a whole-project drain when the chain already narrowed the scope.

## Disambiguation

| Ambiguity               | Pick this                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Bug or feature?         | Bug = broken behavior. Feature = new capability. Default: meldom:issue-intake                                                                  |
| Bug obvious or mystery? | Obvious → meldom:issue-intake. Mystery/regression/perf → meldom:diagnosing-bugs                                                                       |
| Audit vs refactor?      | Broad multi-category audit / roadmap / "where next" → meldom:improve. Narrow architecture/testability refactor → meldom:improve-codebase-architecture |
| Refactor scope unclear? | meldom:improve-codebase-architecture                                                                                                           |
| Explore vs prototype?   | Several full approaches → explore-approaches. One throwaway to feel out a data model/state/UI → meldom:prototype                               |
| No tickets yet?         | meldom:to-tickets — it decides whether the work needs a spec parent first                                                               |
| Build now or as a PR?   | Default `meldom:implement` (in-session, cheap). `meldom:implement-spec` is user-invoked only — recommend it, hand back, don't `Skill()` it            |

## Gotchas

| Trap                                  | Fix                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Stopping to ask "run this chain?"     | Don't. Pick the best chain and run it                                                                    |
| Running the chain silently            | Print the chain line first, then proceed                                                                 |
| Adding a parent for a single ticket   | Only when 2+ tickets                                                                                     |
| Doing the work yourself               | You call `Skill()`. It implements, not you                                                               |
| Running skills in parallel            | Sequential only — each feeds the next                                                                    |
| Build step drains the whole project   | Pass the parent/ticket scope the earlier skill produced; never let it re-derive a bare project-wide plan |

## Edge Cases

| Scenario                             | Handling                                                       |
| ------------------------------------ | -------------------------------------------------------------- |
| No task description                  | Ask what they want via `AskUserQuestion`                       |
| Maps to multiple chains              | Pick the most specific; note the alternative in the chain line |
| User interrupts after the chain line | Reclassify from their feedback, reprint the chain, continue    |
| Mid-chain failure                    | Stop. Report which skill failed and why                        |
| User wants to skip a skill           | Drop it from the chain, run the rest                           |
