---
name: bulletproof
description: Maximum-rigor execution pipeline with assumption auditing, adversarial analysis, independent cross-validation, and evidence-backed confidence scoring. Use when user says "bulletproof", "max confidence", "rock solid", "no margin for error", "high stakes", or needs absolute certainty on critical changes.
---

# Bulletproof

Structured rigor pipeline for high-stakes changes. Skip for prototypes, trivial changes, or when user says "move fast".

## Rules

1. Never say "should work" or "I believe." Every claim needs evidence.
2. Every significant decision: Builder / Attacker / Maintainer analysis.
3. Spawn a separate verifier that has NOT seen your reasoning. Never skip.
4. Default to MEDIUM confidence when any assumption is unverifiable.
5. Always read the FULL user message + all prior conversation. Synthesize a task statement - do NOT ask the user to restate.
6. NEVER create tickets. No `ticket_create`, no `ticket_batch_create`, no delegating ticket creation to a sub-agent, no "I filed a follow-up." Leftover work goes in the evidence report as text; the user decides what becomes a ticket. Updating the ticket you were already handed is fine.
7. "Make sure" means loop, not report. Keep working until the Completion Gate passes; do not hand back a partial result with a list of what is still broken.

## Pipeline

### Phase 1 - Analyze

1. Announce activation. Confirm task understanding from conversation context.
2. Read all relevant files. Use the harness's LSP tool where it has one (find references, go to definition, diagnostics), Grep where it does not. Map dependencies. Identify blast radius.
3. **Assumption audit**: list every assumption with STATUS: verified / unverified / challenged.
4. **Pre-mortem**: failure scenarios + mitigations, ranked by likelihood x impact.

### Phase 2 - Adversarial Design

5. Multi-perspective table:

| Perspective | Focus                                                |
| ----------- | ---------------------------------------------------- |
| Builder     | Cleanest path, patterns to use                       |
| Attacker    | How it fails, gets exploited, produces wrong results |
| Maintainer  | Clear in 6 months? What confuses a future reader?    |

6. Edge case enumeration: boundary, state, external, data, integration.
7. **Alternative approaches**: why this approach over alternatives? Is there a simpler way?
8. Risk classification: LOW / MEDIUM / HIGH / CRITICAL. See [risk heuristics](references/detection-patterns.md) and [structural review](references/structural-review.md).

### Phase 3 - Implement

9. Implement the change.
10. Two-pass self-review against [detection patterns](references/detection-patterns.md). Fix all CRITICAL before Phase 4. For >3000 lines: parallel 3-agent delegation per [structural review](references/structural-review.md).

### Phase 4 - Cross-Validate

See [cross-validation](references/cross-validation.md) for full verifier and security reviewer spawn templates.

11. Spawn `Agent(subagent_type: "meldom:meldom-reviewer")` with detection patterns. Fresh eyes, has NOT seen your reasoning. If no subagent by that name is available — Codex has no subagents at all — do the delegated work in the current session instead, following the same brief.
12. If change touches input/auth/data/APIs: spawn second reviewer focused on security.
13. Address ALL findings. No dismissals without evidence.

### Phase 5 - Evidence

14. Fresh tests, fresh build, diagnostics on the affected files and on the project root, find-references on removed/renamed symbols. See [evidence template](references/evidence-template.md).
15. Compile evidence report with confidence level.

### Phase 6 - Deliver

15. Present evidence report, remaining risks, areas for human review.
16. If not HIGH confidence: explain what prevented it and what would help.

## Completion Gate

ALL must be true: tests pass (fresh — through the project's own test script, never a bare runner over a whole tree), build clean (fresh), two-pass review 0 CRITICAL open, independent reviewer approved, all assumptions verified or flagged, pre-mortem addressed, project-wide diagnostics 0 errors (or "LSP unavailable" noted), 0 dangling references on removed/renamed symbols.

**Confidence:** Report as `LEVEL (N/100)`. HIGH = 85-100, all pass + no open assumptions. MEDIUM = 60-84, most pass + minor gaps. LOW = 0-59, significant gaps. Default MEDIUM when any assumption unverifiable. Score deductions: -5 per unverified assumption, -10 per unresolved reviewer finding, -15 per failing check, -5 per outstanding pre-mortem/edge case.

## Gotchas

| Trap                                  | Fix                                                                              |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| Self-review = cross-validation        | Same reasoning that wrote the bug approves it. Always spawn independent reviewer |
| "Should work" as evidence             | Require test output, build output, or runtime proof                              |
| Dismissing reviewer findings          | "Won't happen in practice" is unverified. Prove it or fix it                     |
| HIGH confidence with open assumptions | Any unverifiable assumption forces MEDIUM                                        |
| Scope creep via rigor                 | Max certainty within scope, not expanded scope                                   |
| Pre-mortem paralysis (20+ scenarios)  | Rank by likelihood x impact, address top ones, acknowledge rest                  |
| Filing tickets for findings           | Findings belong in the evidence report. Never create a ticket mid-bulletproof    |

## Edge Cases

| Scenario                                  | Handling                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| LSP unavailable                           | Fall back to Grep + build/test. Note in evidence report                        |
| Change > 3000 lines                       | Parallel 3-agent review delegation per detection-patterns.md                   |
| Reviewer and implementer disagree         | Escalate to user with both perspectives                                        |
| Confidence stuck at MEDIUM after 2 cycles | Escalate with specific blockers                                                |
| User says "stop" or "good enough"         | Respect intent. Show current confidence + remaining risks                      |
| No tests exist                            | Note as verification gap. Rely on build, LSP, reviewer. Recommend adding tests |
| Security finding with no clear mitigation | Escalate to user. Do not ship                                                  |

Task: $ARGUMENTS
