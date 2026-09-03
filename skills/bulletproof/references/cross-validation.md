# Cross-Validation & Evidence

## Independent Verifier

Fresh eyes catch what familiar eyes miss. The verifier has NOT seen your reasoning. Use the strongest available model for verification (prefer opus). Include detection patterns **inline** so the reviewer checks concrete signals, not just vibes.

If the `meldom:meldom-reviewer` agent is unavailable, fall back to the `general-purpose` agent with the same prompt. If the provider has no subagents at all — Codex does not — do the work in the current session instead, following the same brief.

```
Agent(
  subagent_type: "meldom:meldom-reviewer",
  model: "opus",
  prompt: "INDEPENDENT VERIFICATION REQUEST:
    Review changes with maximum scrutiny. Look for: bugs, logic errors,
    missed edge cases, security vulnerabilities, incorrect assumptions,
    race conditions, resource leaks, wrong results.

    Changed files: [list]
    Purpose: [what these changes do]
    Acceptance criteria: [specific criteria]

    TWO-PASS REVIEW - classify every finding as CRITICAL or INFORMATIONAL:

    PASS 1 - CRITICAL (blocks completion):
    - Data access safety: query interpolation, TOCTOU, bypassing ORM, N+1, mass assignment, schema mismatch
    - Race conditions: find-then-create without constraint, upsert without unique index, non-atomic state transitions, side effects inside transactions, lock without transaction scope, async worker overlap
    - Trust boundary: unvalidated external input, missing sanitization (XSS), missing shape/type checks, invalid input coerced to valid, incomplete validation pipeline
    - Enum/value completeness: search ENTIRE codebase for sibling values, verify new value handled in all consumers, allowlists, branching logic, serialization
    - Input validation parity: validation gap across API surfaces, raw request passthrough, missing validation layer
    - Framework runtime safety: env access outside config, missing type casting, HTTP client without timeout, IDOR, broad exception swallowing, sync I/O blocking request cycle

    PASS 2 - INFORMATIONAL (report, don't block):
    - Type safety: primitive obsession, magic strings, loose types, config type leakage, repeated defensive patterns
    - Over-engineering: premature abstraction, speculative generality, unnecessary indirection, impossible-state defense
    - Performance: query-per-item loops, unbounded collection load, large set ops without index, blocking I/O in hot path
    - Conditional/logic: conditional side effects, misleading logs, stale comments, deep nesting, circular deps
    - Test gaps: happy-path-only, missing negative assertions, untested public surface, untested security enforcement
    - API response security: sensitive fields in responses, wildcard column selection, nested relation leakage, privilege escalation in field visibility

    SUPPRESSIONS - DO NOT flag: harmless redundancy aiding readability, 'add a comment' suggestions, tighter-but-sufficient assertions, consistency-only changes, impossible-state edge cases, empirically-tuned thresholds, anything already addressed in the diff, harmless no-ops.

    ENUM COMPLETENESS: When new values are introduced, search the ENTIRE
    codebase for sibling values and verify the new value is handled everywhere.
    This requires reading code OUTSIDE the diff.

    OUTPUT FORMAT:
    CRITICAL (blocking): [file:line] Problem -> Fix: suggested fix
    INFORMATIONAL (non-blocking): [file:line] Problem -> Fix: suggested fix

    DO NOT assume correctness. Actively find problems. Report EVERY
    concern, no matter how small. If zero issues found, explain WHY
    you believe the code is correct - passive approval is not acceptable."
)
```

## Security Reviewer

Required when change touches input handling, auth, data, or APIs:

```
Agent(
  subagent_type: "meldom:meldom-reviewer",
  model: "opus",
  prompt: "Security review of [changes]. Check: injection, auth bypass,
    data leakage, SSRF, path traversal, insecure defaults, missing
    validation. Report all findings with severity."
)
```

## Addressing Findings

Never dismiss without explicit evidence-backed justification. "Won't happen in practice" is not justification - prove it or fix it.

## Escalation Conditions

| Condition                                   | Action                                          |
| ------------------------------------------- | ----------------------------------------------- |
| Verifier finds critical issues              | Fix and re-verify - never dismiss               |
| Confidence cannot reach HIGH                | Report why and what would help                  |
| Same issue recurs after 3 fix attempts      | Escalate to user with full context              |
| Unverifiable assumptions                    | Flag explicitly in final report                 |
| User says "stop" / "good enough"            | Respect intent; show current confidence + risks |
| Testing infrastructure unavailable          | Note as verification gap in evidence report     |
| Confidence stuck at MEDIUM after 2 cycles   | Escalate to user                                |
| Verifier and implementer disagree on design | Escalate to user                                |
| Critical assumption needs production access | Escalate to user                                |
| Security finding with no clear mitigation   | Escalate to user                                |
| Scope larger than initially apparent        | Escalate to user before expanding               |

## Evidence Collection

Collect fresh output (not cached):

- Fresh test run - capture full output
- Fresh build - capture full output
- `lsp_diagnostics` on all affected files
- `lsp_diagnostics_directory` on project root (catches cross-file issues)
- `lsp_find_references` on removed/renamed symbols - confirm 0 dangling
- If no LSP: note "LSP unavailable," rely on build/test/lint

## Example - Independent verifier catching a real issue

```
Verifier: ISSUE FOUND - Race condition in session refresh.

refreshSession() reads token, validates, then writes new token.
Between read and write, another request reads the same old token
and also refreshes - double-refresh invalidates the first new token.

SEVERITY: Medium - intermittent auth failures under load.
FIX: Add mutex or atomic compare-and-swap on the token.
```

Implementer was on the happy path; independent verifier found the concurrency bug from fresh eyes.
