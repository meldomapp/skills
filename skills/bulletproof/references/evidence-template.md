# Evidence Report Template

Use in Phase 5 after all verification checks complete.

```
CONFIDENCE EVIDENCE:
- Tests: [PASS/FAIL] - [X/Y passed, output summary]
- Build: [PASS/FAIL] - [output summary]
- LSP Diagnostics (per-file): [X errors, Y warnings on affected files]
- LSP Diagnostics (project-wide): [X errors, Y warnings across the project]
- LSP Reference Check: [N dangling / all clean / unavailable]
- Structural Review: [N issues - X critical (all resolved), Y informational]
- Risk Level: [LOW/MEDIUM/HIGH/CRITICAL]
- Enum/Value Completeness: [traced N consumers - all handled / M gaps found and fixed]
- Independent Reviewer: [APPROVED/ISSUES FOUND] - [summary]
- Security Review: [CLEAN/FINDINGS/NOT APPLICABLE] - [summary]
- Assumptions: [X/Y verified, Z flagged as risks]
- Pre-mortem scenarios: [all addressed / N outstanding]
- Edge cases: [all handled / N not applicable / M outstanding]

CONFIDENCE LEVEL: [HIGH / MEDIUM / LOW] ([0-100]/100)
REMAINING RISKS: [list any, or "None identified"]
AREAS FOR HUMAN REVIEW: [specific areas where human judgment adds value]
```

## Confidence Level Definitions

| Level  | Meaning                                                       | Required                                                                                       |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| HIGH   | All checks pass, reviewer approved, no unresolved assumptions | Tests pass, build clean, reviewer approved, all assumptions verified, all pre-mortem addressed |
| MEDIUM | Most pass; minor gaps or unverifiable assumptions             | Tests pass, build clean, but reviewer had minor concerns OR 1-2 assumptions unverifiable       |
| LOW    | Significant gaps or unresolved issues                         | Tests incomplete, reviewer found unresolved issues, or critical assumptions unverifiable       |

Default to MEDIUM (not HIGH) when any assumption remains unverifiable, even if all other checks pass.

## Anti-Patterns

| #   | Pattern                                   | Why it matters                                                                                            |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | **Verification theater**                  | Running checks but not reading output. Every result must be read and each warning addressed.              |
| 2   | **Assumption laundering**                 | Moving "unverified" to "verified" without concrete evidence (test output, runtime proof, source reading). |
| 3   | **Scope creep via rigor**                 | Max confidence = maximum certainty within scope, not expanded scope.                                      |
| 4   | **Paralysis by analysis**                 | Pre-mortem generates 20+ scenarios. Prioritize by likelihood x impact.                                    |
| 5   | **Dismissing the verifier**               | Every finding must be addressed or justified with evidence.                                               |
| 6   | **Self-review as cross-validation**       | Same reasoning that produced the bug approves it. Independent verifier is mandatory.                      |
| 7   | **HIGH confidence with open assumptions** | Any unverifiable assumption forces MEDIUM.                                                                |

## Bad Examples

**Skipping cross-validation:**

```
"I've reviewed my own code carefully and it looks correct. All tests pass."
```

Bad: self-review is necessary but insufficient. Independent verifier is mandatory.

**Vague confidence claim:**

```
"I'm fairly confident this is correct. It should handle most edge cases."
```

Bad: "fairly confident", "should handle", "most edge cases" are hedged, evidence-free.

**Dismissing verifier feedback:**

```
Verifier: "Error handling in processPayment() silently swallows exceptions on line 42."
Response: "That's fine, it won't happen in practice."
```

Bad: "won't happen in practice" is an unverified assumption. Prove it or fix it.

**Claiming HIGH with open assumption:**

```
ASSUMPTIONS:
3. Redis cluster will be available during token refresh - STATUS: unverified

CONFIDENCE LEVEL: HIGH
```

Bad: unverifiable assumption forces MEDIUM. Disclose to user.
