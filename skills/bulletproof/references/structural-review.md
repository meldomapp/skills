# Structural Review Process

Independent code review pass using detection patterns. Catches structural issues that automated tools and self-review miss.

## When to Run

| Phase                      | Purpose                                   |
| -------------------------- | ----------------------------------------- |
| Phase 2 (Analysis)         | Classify risk level before implementation |
| Phase 3 (Self-Review)      | Scan your own changes - two-pass          |
| Phase 4 (Cross-Validation) | Verifier runs same patterns independently |

## Two-Pass Review

| Pass                   | Focus                                                                                                                           | Gate               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Pass 1 (CRITICAL)      | Data access safety, race conditions, trust boundary, enum/value completeness, input validation parity, framework runtime safety | Blocks completion  |
| Pass 2 (INFORMATIONAL) | Type safety, over-engineering, performance, conditional logic, test gaps, API response security                                 | Report in evidence |

Full pattern catalog: `detection-patterns.md`

## Risk Classification

| Level    | Criteria                                                        | Action                             |
| -------- | --------------------------------------------------------------- | ---------------------------------- |
| LOW      | Isolated, no shared code, good test coverage                    | Proceed normally                   |
| MEDIUM   | Shared modules, 10-20 dependents, minor issues                  | Proceed with extra attention       |
| HIGH     | Core services, 20+ dependents, anti-patterns, missing tests     | Extra verification cycle           |
| CRITICAL | Security vulnerability, production data risk, cascading failure | Fix before implementation proceeds |

### Risk Scoring Inputs

| Source             | Signals                                                                           |
| ------------------ | --------------------------------------------------------------------------------- |
| Diff scope         | File count, line count, shared code touched, schema migrations, API route changes |
| Domain context     | Financial/billing, auth/authz, async workers, third-party integrations            |
| Dependency fan-out | Files that import/reference modified symbols (via `lsp_find_references` or grep)  |
| Static analysis    | Linter/type-checker errors, anti-pattern matches, complexity thresholds           |

### Quick Risk Heuristics

| Signal                                         | Minimum Level |
| ---------------------------------------------- | ------------- |
| Schema migration on high-traffic table         | MEDIUM        |
| Touches financial/billing/payment logic        | HIGH          |
| Environment access outside config layer        | HIGH          |
| Raw queries without parameterized bindings     | CRITICAL      |
| Disabled mass-assignment protection            | CRITICAL      |
| Changes to auth/authorization middleware       | HIGH          |
| New synchronous external call in request cycle | MEDIUM        |

## Change Scope Classification

| Tier                         | Examples                                                |
| ---------------------------- | ------------------------------------------------------- |
| Read-only / observational    | Alerts, logging, notifications, metrics                 |
| External dependency          | LLM calls, webhook dispatches, third-party integrations |
| Destructive / state-mutating | Deletions, status transitions on production data        |
| Operational tooling          | CLI commands for backfill, calibration, admin scripts   |

Flag when tiers are mixed - destructive components buried in large changes receive diluted review scrutiny.

## Large-Change Handling (>3000 lines)

1. **Build manifest** from diff stats. Record every changed file and line count.
2. **Prioritize by risk tier**: business logic > data layer > request layer > infrastructure > tests
3. **Build modified function/method list** for scope boundaries - only flag issues in these or newly created files.
4. **Delegate to 3 parallel agents** (spawn all 3 in one message):
   - Agent A - Critical: data safety, race conditions, trust boundary, enum completeness
   - Agent B - Structural: type safety, over-engineering, anti-patterns, dead code
   - Agent C - Runtime & Tests: performance, time safety, type coercion, test gaps
5. **Merge and deduplicate.** Classify per gate levels.

Include detection pattern content in each agent prompt - agents don't inherit parent context.

## Documentation Staleness Check

After implementation, for each doc file relevant to changed features:

- If doc was NOT updated but code it describes WAS changed, flag as INFORMATIONAL
- Never critical - just awareness

## Output Format

```
Structural Review: N issues (X critical, Y informational)
Risk Level: [LOW/MEDIUM/HIGH/CRITICAL]

CRITICAL (blocking):
- [file:line] Problem description -> Fix: suggested fix

INFORMATIONAL (non-blocking):
- [file:line] Problem description -> Fix: suggested fix

Change Scope: [risk tier classification]
```
