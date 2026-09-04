---
name: resolving-merge-conflicts
description: 'Use when you need to resolve an in-progress git merge/rebase conflict.'
---

1. **See the current state** of the merge/rebase. Check git history, and the conflicting files.

2. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

3. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, pick the one matching the merge's stated goal and note the trade-off. Do **not** invent new behaviour. Always resolve; never `--abort`.

4. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Run each as its own step and read its own exit code; never chain them through a pipe (`a | tail && b` reports the pipe's last status, so the gate never gates). Run tests through the project's own test script, and never a bare test runner pointed at a whole tree. Fix anything the merge broke.

5. **Finish the merge/rebase.** Stage everything and commit. If rebasing, continue the rebase process until all commits are rebased.
