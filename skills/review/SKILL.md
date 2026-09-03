---
name: review
description: Code review across security, correctness, quality, reuse, efficiency, and AI slop — plus spec conformance when the change has an originating meldom ticket or spec. Use when user says "review", "review changes", "code review", "check my code", "review against the ticket/spec", or "review since <ref>".
---

# Review

Review code changes on two independent axes:

- **Quality** — 11 categories (security, AI slop, design consistency, correctness, code reuse, code quality, efficiency, blast radius, test quality, breaking changes, git hygiene) plus the smell baseline. Produces the PASS/FAIL verdict.
- **Spec** — does the change do what the originating ticket/spec asked? Reported beside the verdict, never merged into it: code can follow every standard and still build the wrong thing, and code can match the ticket while breaking conventions. Separate reporting stops one axis masking the other.

## Scope

| Invocation              | What gets reviewed                      |
| ----------------------- | --------------------------------------- |
| `meldom:review` (no args)     | Uncommitted changes (staged + unstaged) |
| `meldom:review --base main`   | Branch diff against base ref            |
| `meldom:review src/services/` | Specific files or directories           |
| `meldom:review --all`         | Entire codebase                         |

## Flow

### 1. Pin the scope — fail fast

- No args: `git diff` + `git diff --cached`
- `--base <ref>`: confirm the ref resolves (`git rev-parse <ref>`), then `git diff <ref>...HEAD` (three-dot — against the merge-base). Note the commit list: `git log <ref>..HEAD --oneline`
- Path args: read specified files/directories
- `--all`: all tracked files

A bad ref or empty diff stops here — "No changes to review." / "Unknown ref: <ref>" — never inside parallel sub-agents.

### 2. Find the spec

<!-- upstream source: mattpocock/skills `code-review` (spec axis) — port upstream diffs into this section only, never whole-file replace -->

The originating spec is usually a meldom ticket. Look in order:

1. A ticket id the user named, or one referenced in commit messages — fetch with `mcp__meldom__ticket_view`. The spec lives in a parent ticket's body; the work item is a child ticket's acceptance criteria. Read attached `notes[]` and `attachments[]` too.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch or feature.
4. Nothing found → the Spec axis skips; the report notes "no spec available". The quality verdict is unaffected.

The orchestrator fetches the ticket here — reviewer agents never call meldom.

### 3. Gather context

- Read CLAUDE.md (if present) for architecture and conventions
- Read changed files fully — not just diff hunks

### 4. Spawn agents in parallel

All in one message: 3 quality agents (`Agent(subagent_type: "meldom:meldom-reviewer")`, each given the changeset + project context + a focus directive) and, when step 2 found a spec, 1 spec agent. If no subagent by that name is available — Codex has no subagents at all — do the delegated work in the current session instead, following the same brief.

| Agent      | Focus directive                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Danger     | "Focus on security (category 1) and correctness (category 4): injection, secrets, path traversal, off-by-one, null access, races, leaks, boolean logic. Run other categories as encountered."                    |
| Quality    | "Focus on code reuse (category 5), code quality (category 6), and the smell baseline: search for existing utilities, flag duplicates, redundant state, leaky abstractions. Run other categories as encountered." |
| Efficiency | "Focus on efficiency (category 7): unnecessary work, missed concurrency, hot-path bloat, no-op updates, TOCTOU, memory, overly broad ops. Run other categories as encountered."                                  |

**Spec agent** — `Agent(subagent_type: "general-purpose")` with the diff command, commit list, and the spec contents from step 2 pasted in full (`meldom:meldom-reviewer` is wrong here — its "ignore issue metadata" rule contradicts this job). Brief: "Read-only: modify nothing, call no meldom tools. Report — quoting the spec line or acceptance criterion for each finding — (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Prose findings, under 400 words."

### 5. Verify BLOCKs adversarially

Zero BLOCKs → skip. Otherwise spawn one fresh `meldom:meldom-reviewer` per BLOCK finding (parallel, one message): "Try to refute this finding: <finding + its failure scenario>. Read the code yourself. Report REFUTED (with the evidence) or CONFIRMED." Refuted → downgrade to WARN, noting the refutation. This pass kills plausible-but-wrong findings before they gate anything.

### 6. Report

Two headings, never merged or reranked across them:

- `## Quality` — merged findings from the 3 quality agents plus verification outcomes, deduplicated by file:line + category. Verdict: **PASS** = zero surviving BLOCKs, **FAIL** otherwise.
- `## Spec` — the spec agent's report verbatim, or "no spec available".

End with one line per axis: finding count and the worst issue within that axis.

## Called from another skill

When a build skill (`meldom:implement`, `meldom:implement-spec`) runs this as its review step:

1. Run steps 4–5 on both axes — nothing else checks acceptance criteria, so the Spec axis carries that job
2. **PASS** -> print WARN/SUGGEST in summary, proceed to finish
3. **FAIL** -> spawn `meldom:meldom-worker` with all surviving BLOCK findings as fix context -> re-review (max 1 retry) -> still FAIL: print findings, escalate to user

## Gotchas

| Trap                               | Fix                                                 |
| ---------------------------------- | --------------------------------------------------- |
| Reviewer modifies files            | Agent violation — reviewer is read-only             |
| Reviewer calls meldom              | Agent violation — only orchestrator calls meldom    |
| Bad ref or empty diff              | Fail in step 1, before any agent spawns             |
| Spec findings changing the verdict | Spec axis never gates — the verdict is quality-only |
| BLOCK without a failure scenario   | Reviewer downgrades to WARN (see `meldom:meldom-reviewer`) |
| False positive BLOCKs              | Step 5 refutes them; downgrade when refuted         |
| Flagging formatting issues         | Skip — that's the formatter's job                   |
| Stack-specific lint rules flagged  | Skip — that's the linter's job                      |

## Edge Cases

| Scenario                 | Handling                                                      |
| ------------------------ | ------------------------------------------------------------- |
| Binary files in diff     | Skip binary content, check filename against git hygiene rules |
| No CLAUDE.md in project  | Rely on code exploration only                                 |
| No spec anywhere         | Spec axis reports "no spec available"; quality runs as normal |
| Huge codebase with --all | Review proceeds; agent explores methodically                  |
| No tests in project      | Skip test quality category, note in output                    |
| All findings are SUGGEST | Verdict is PASS — SUGGEST doesn't block                       |
