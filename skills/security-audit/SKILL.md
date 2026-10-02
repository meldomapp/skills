---
name: security-audit
description: Audit a codebase for exploitable security weaknesses. Use when asked for a security audit or to check that a security fix is complete.
---

# Security audit

Find security issues worth the owner's time to fix, whether obvious or subtle. Choose your own investigation strategy from the system and the evidence. The quality of the findings matters more than their number.

## Investigate the system

Write down a threat model: the assets, the entry points where outside data or control arrives, every attacker position — direct users, anyone who can write data the system later reads, upstream and downstream services, the network path, other tenants or local users, and readers of its outputs and artifacts — and each place where trust changes. Identify deployment assumptions you cannot verify.

Work backward from consequential outcomes an attacker would want. For each outcome you investigate, state what must remain true to prevent it, then trace where the complete execution path establishes that guarantee. Use targeted reading and experiments to connect attacker influence to the final effect. Also trace sensitive assets forward: follow secrets, credentials, and personal data to every place they land — logs, errors, telemetry, URLs, caches, storage, third parties — and compare each place's audience with the data's.

Follow relevant behavior beyond the repository into dependencies, integrations, configuration, and the build and deployment environment. Treat scanner output, advisories, earlier audits, and the project's history of security fixes as leads whose reachability and impact still need establishing; each past fix names a guarantee that once broke, so run variant analysis against it.

Treat a protection as a claim to examine, even when each component looks reasonable on its own: establish exactly what it guarantees, and compare that with what later behavior assumes. Map its coverage: which parts of the input and state it actually binds, and which parts continue onward under its verdict. Anything that travels under the verdict without being bound is attacker-controlled data carrying a trusted label.

Stress each guarantee along three axes. Failure: trace what happens when it cannot reach a verdict — missing, empty, or malformed input, absent configuration or secrets, a caught exception, a timeout, an unavailable dependency; any path that proceeds is fail-open. Time: test whether the verdict still holds when the action is replayed, reordered, run concurrently, or performed after the permission, secret, or state behind it has changed, including state shared across requests or tenants. Range: hold it to the weakest point of everything the system supports — runtime and dependency versions, platforms, defaults, and every option a caller or operator can set.

Later behavior includes consumers outside the repository. For a library, SDK, API, or shared service, its callers are part of the system: compare each guarantee with what its name, documentation, and examples lead a reasonable caller to assume, and test against the weakest plausible caller as well as the code in view.

Where two components interpret the same data — a check and the code that acts on it, a router and a handler, two parsers — compare their interpretations: casing, encoding, normalization, duplicates, ordering, types, prefixes, and defaults for missing values. Each difference is a candidate parser differential: an input one side accepts as safe and the other reads as something else.

Generate counterexamples from the system's own behavior. Starting from an ordinary allowed interaction, ask what an attacker could change while keeping the apparent protections satisfied but causing a forbidden outcome. Choose experiments that distinguish a real guarantee from an assumption. Chain smaller weaknesses into larger outcomes.

Keep exploration broader than reporting. A promising hypothesis needs investigation before it needs proof; carry uncertainty forward until evidence supports or refutes it. A hypothesis is refuted when the forbidden outcome is shown unreachable for every plausible consumer and path, with the code or experiment that blocks this exact path cited to the same standard as a finding; until then it stays open as a lead. Before concluding, revisit the highest-impact outcomes, the weakest assumptions in their defenses, and your refutations. You are done when every entry point and consequential outcome in your threat model has a verdict: confirmed, refuted with cited evidence, or open with the deciding fact named.

## Earn each finding

For each candidate, establish a credible path from an attacker's starting access and controlled input to a security consequence. Trace the relevant protections and actively try to disprove the issue. Resolve the assumptions that decide whether the attack works.

Support the result with a minimal, safe reproduction using synthetic data when practical, or a precise code and configuration trace when it is not. Distinguish observed behavior from inferred behavior. State any remaining conditions explicitly; a missing fact that decides exploitability makes a lead unresolved, not confirmed.

When a finding is confirmed, name the broken guarantee in general terms, then run variant analysis: search for every other input, encoding, path, and entry point that breaks the same guarantee. The reproduced instance is the evidence; the broken guarantee is the finding.

Use local, isolated checks within the user's authorized scope. An audit alone does not authorize changes to the product or active testing of external systems. Redact secrets in evidence.

## Check a fix

To judge whether a fix is complete, restate the guarantee it should restore, rerun the original reproduction against the patched code, then run variant analysis against the patch. Read the fix's own tests and comments as its authors' threat model, and check each defended case against the unpatched code; any that reproduces is a finding the audit missed. A fix is complete when the guarantee holds for the variants as well as the reproduced input.

## Report what deserves action

Rank findings by realistic impact and exploitability. Include only issues with a supported attack path and a concrete security consequence. Group symptoms with the same root cause.

For each finding, explain concisely:

- What an attacker can achieve and why it matters.
- Required access, conditions, and the attack path.
- Evidence and precise source locations, including what was verified.
- The smallest fix that restores the broken guarantee at its root, and how to verify it as in Check a fix.

Keep the report proportional to the findings. Include a brief scope and limitations note. Surface unresolved leads separately only when their potential impact warrants follow-up, with the missing evidence needed to decide them. Zero supported findings is a valid result; it is not proof the system is secure.
