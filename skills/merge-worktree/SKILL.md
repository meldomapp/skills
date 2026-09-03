---
name: merge-worktree
description: Land a Meldom worktree end to end — commit through the ship card, push, merge with a merge commit, pull the main checkout, remove the worktree through `worktree_remove`, delete the remote branch, confirm. Use when the user presses "Ship it", says "merge worktree", "land this worktree", "finish the worktree", "land my branch", or wants a worktree's work carried all the way back into the main checkout.
---

# Meldom Merge Worktree

Land: commit → push → merge → pull main → remove the worktree → delete the remote branch → confirm. Run it FROM INSIDE the worktree being landed.

## Finish, don't stop

A landing runs to the end. A conflict, a dirty main checkout, a PR GitHub calls not mergeable, a peer landing already in flight — each is a pause you handle, then you carry on from the same phase.

**Exactly two things end a landing early:**

1. `worktree_remove` reports `git-failed` with `proof: 'local-only'` — commits exist on no remote ref, so removing would destroy the only copy. Report it verbatim and stop.
2. The user cancels a ship card.

Nothing else qualifies. Do not widen this list.

**Any conflict** — a merge, a rebase, a not-mergeable PR, a `git stash pop` — is resolved deliberately: read what each side intended, resolve every hunk, run the checks, commit, then carry on from the same phase. Never `git merge --abort`, never a forced push.

**A gitlink conflict** (a `UU` on a submodule pointer) is settled by the ancestor test, never by "the newest":

```bash
git -C <submodule-path> fetch origin                               # the other side may be a commit you have never seen
git -C <submodule-path> merge-base --is-ancestor <ours> <theirs>   # theirs contains ours -> take theirs
git -C <submodule-path> merge-base --is-ancestor <theirs> <ours>   # ours contains theirs -> take ours
```

Neither contains the other → a real divergence: resolve it with your own reading of both sides.

**A peer landing** — a merge in progress, `UU` entries, or a detached submodule in the main checkout that you did not create — is another agent's landing, never "unrelated changes". Wait and re-check until it clears, and touch nothing of theirs. There is no lock: this rule is the only thing keeping two landings out of each other's way.

## Phase 1 — Preflight

ONE chained Bash call from the worktree root:

```bash
git rev-parse --show-toplevel && git rev-parse --git-common-dir --git-dir && git branch --show-current && git remote get-url origin 2>/dev/null; test -f .gitmodules && echo HAS_SUBMODULES
```

- **Confirm this IS a worktree**: `--git-common-dir` differs from `--git-dir`. If they match, this is the main checkout — stop and say so.
- **Superrepo**: `.gitmodules` present at toplevel. If so, list every submodule whose checked-out commit differs from the recorded pointer: `git submodule status --recursive | awk '$1 ~ /^[+-]/ {print $2}'`.
- **Remote per repo**: `git remote get-url origin`. A `github.com` URL with `gh auth status` succeeding → the **remote path** (Phase 3). A **local filesystem path** → the [local-origin path](#local-origin-submodules). Nothing at all → the [no-remote path](#no-remote-path).
- **Original branch** (what this lands into): `git symbolic-ref refs/remotes/origin/HEAD`, falling back to `main` → `master` → `develop`.

## Phase 2 — Commit and push

One repo at a time, **every changed submodule before the superrepo** — a pointer-bump commit can only name a submodule commit that already exists on that submodule's remote.

1. **Commit** — invoke the `meldom:ship` skill. That is the ship card, and it is the only way your work commits here. Nothing to commit in this repo → move to the next.
2. **Push** — `git push -u origin <branch>`. The first push has no upstream yet, so set one. Never force.

## Phase 3 — Merge

Remote path, per repo:

```bash
gh pr create --base <original-branch> --head <branch>    # or reuse the open one
gh pr merge <number> --merge
gh pr view <number> --json state,mergeStateStatus        # poll until state is MERGED
```

- **A merge commit, always.** Never `--squash` and never `--rebase`: a squash mints a new commit the worktree's own checkout does not have, which is what makes a superrepo pointer stale and a worktree branch look unmerged.
- **Never delete the branch as part of the merge.** The remote branch goes in Phase 6, after removal has confirmed the work is durable.
- **Not mergeable** → repair it INSIDE the worktree, not on the remote: `git fetch origin <base>`, `git merge origin/<base>`, resolve, push, then merge the PR.
- **Blocked by required checks** → `gh pr merge <number> --merge --auto` and poll. Waiting is a pause, not an end.
- Confirm `state: MERGED` before moving on.

**Superrepo, right after a submodule merges**: move the worktree's own submodule checkout to the merged remote head before staging the pointer, so the pointer names a commit that is actually on the submodule's remote.

```bash
git -C <worktree>/<submodule-path> fetch origin
git -C <worktree>/<submodule-path> checkout <submodule-branch>
git -C <worktree>/<submodule-path> merge --ff-only origin/<submodule-branch>
git -C <worktree> add <submodule-path>      # then commit the pointer bump and land the superrepo
```

The pointer bump is your own commit, so it goes through `meldom:ship` like any other.

## Phase 4 — Pull the main checkout

**Record first, stash if dirty, pop afterwards. The user's files are never moved, deleted or excluded.**

```bash
# from the main checkout
# The record Phase 7 compares against. Name it after THIS worktree's slug: a peer landing on the same machine
# writes its own, and a shared filename would leave both confirming against the wrong baseline.
git status --porcelain > "/tmp/meldom-landing-<slug>.txt"
# anything listed? stash it, untracked included:
git stash push -u -m "meldom-auto: landing <slug>"

git pull --ff-only                                        # on its own branch, never detached
# per initialized submodule:
git -C <submodule-path> checkout <its branch> && git -C <submodule-path> pull --ff-only

git stash pop                                             # conflict -> resolve it, then carry on
```

**Never let git re-checkout the submodules from the superrepo's recorded pointer (`git submodule update`, `--init --recursive`) in the shared main checkout.** It leaves every submodule DETACHED at that pointer, and a peer landing then merges onto no branch — the merge is reachable from no ref and the next checkout orphans it. Check out each submodule's branch and pull it instead, as above. A submodule already left detached with no merge in progress goes back on its branch before anything merges into it.

The stash is the user's own work. Pop it before the landing ends, whatever else happened, and never `git stash drop` it.

## Phase 5 — Remove the worktree

Removal goes through the `worktree_remove` MCP tool (`mcp__meldom__worktree_remove`) and nowhere else.

**Never `git worktree remove`, forced or not, in any form.** `--force` is what a worktree with submodules needs (git refuses outright once submodules are initialized), and it deletes each submodule's own git dir — the only copy of any submodule commit that has not reached the main checkout. The tool instead fetches every submodule's HEAD into the main checkout first, verifies it is reachable, removes the worktree, deletes its branch, and confirms both are gone.

The tool's own `force: true` is a different thing and is safe: it waives only the requirement that this chat OWN the worktree, so a chat asked to clean up a sibling worktree can. It never waives a safety check — dirty work, unsafe submodule state and local-only commits refuse with it set exactly as without it. Use it when the answer says this chat does not own the target; do not reach for raw git.

Read the answer's `status`:

- **`removed`** → the worktree and its branch are gone. Note whether the answer reports `merged: true`, and continue to Phase 6.
- **`scheduled`** → everything landed, and the chat asking is still standing in that directory, so the app clears it when this turn goes idle. Continue to Phase 6 and say plainly that the directory goes at the idle boundary rather than reporting it already gone. Nothing retries that cleanup if the app restarts first, so if you later see the directory still on disk, call `worktree_remove` again — it is idempotent.
- **`live`** → a chat is still attached; the answer's `blockers` name which. Close it and call again.
- **`commands-running`** → the answer lists the running commands. Stop them, then call again.
- **`not-found`** → you passed the wrong target. Correct it and call again.
- **`git-failed`** → read the answer's `error` and its `proof`:
  - `proof: 'local-only'` is **the one stop**. The branch has commits on no remote ref (they are listed in `localOnlyCommits`), so removing would destroy the only copy. Report the error verbatim and stop. Never work around it with raw git, and never force.
  - Any other `git-failed` is a pause: fix exactly what the error names — uncommitted work goes back through Phase 2 — then call again.

A refusal can also come back as a tool error rather than a status (an unmanaged worktree, a target that is not Meldom's, no verified authority). Report those verbatim and stop; they are for the user to resolve, not for you to route around.

## Phase 6 — Delete the remote branch

Only after the PR reports `state: MERGED`, removal succeeded or was scheduled, **and that removal answer reports `merged: true`**:

```bash
git push origin --delete <worktree-branch>
```

`merged: false` means that remote branch is the durable proof the work exists somewhere — keep it, and say it remains. A `worktree-landing-<short sha>` branch published by the [local-origin path](#local-origin-submodules) is deleted here too, on the same condition.

## Phase 7 — Confirm

```bash
git status --porcelain | diff - "/tmp/meldom-landing-<slug>.txt"
```

**Clean means no landing residue**: the main checkout's status equals what Phase 4 recorded — the stash is back and nothing of the landing is left. An empty `git status --short` is NOT the criterion; the user keeps their own untracked files there and they belong there. Also confirm the superrepo and every submodule are ON their branches, not detached:

```bash
git symbolic-ref -q HEAD && git submodule foreach 'git symbolic-ref -q HEAD || echo "DETACHED: $name"'
```

Then report: what merged, what was removed, which remote branch went or stayed, and that the main checkout matches its pre-landing state.

## Local-origin submodules

A worktree submodule created before Meldom's GitHub-origin change has the **main checkout as its `origin`** — a local filesystem path, not a URL. Its branch can never reach GitHub on its own and carries no PR, so Phase 3's remote path does not apply. `git remote get-url origin` inside the worktree's submodule tells you which path you are on.

Land that submodule through the main checkout instead:

```bash
# 1. The main checkout's submodule must be ON its branch. A merge landed on a detached HEAD is reachable from
#    no ref, and the next checkout orphans it — losing every conflict resolution the merge recorded.
git -C <main-checkout>/<submodule-path> checkout <submodule-branch>

# 2. Bring the worktree submodule's branch across. Unforced on purpose: a recurring ticket-key slug can leave an
#    OLD refs/heads/<worktree-branch> from a previous incarnation, and forcing would overwrite it. A rejection
#    means exactly that — land it under a name that cannot collide and merge THAT instead.
git -C <main-checkout>/<submodule-path> -c protocol.file.allow=always \
    fetch <worktree-path>/<submodule-path> <worktree-branch>:<worktree-branch> \
  || git -C <main-checkout>/<submodule-path> -c protocol.file.allow=always \
    fetch <worktree-path>/<submodule-path> "$(git -C <worktree-path>/<submodule-path> rev-parse HEAD)":refs/heads/<worktree-branch>-landing

# 3. Merge whichever ref step 2 actually created — never assume the first one succeeded.
git -C <main-checkout>/<submodule-path> merge --no-ff <worktree-branch>      # conflict -> resolve it

# 4. Publish that merge commit to the submodule's REAL remote, so the superrepo pointer can name it.
sha=$(git -C <main-checkout>/<submodule-path> rev-parse --short HEAD)
git -C <main-checkout>/<submodule-path> push origin HEAD:refs/heads/worktree-landing-$sha

# 5. PR it, merge it with a merge commit, confirm MERGED, then fast-forward the main checkout.
gh pr create --base <submodule-branch> --head worktree-landing-$sha
gh pr merge <number> --merge && gh pr view <number> --json state
git -C <main-checkout>/<submodule-path> pull --ff-only
```

Then realign the worktree's own submodule checkout to that merged head (Phase 3's realign block) before staging the pointer, and delete `worktree-landing-<sha>` on the remote in Phase 6.

**You are the only thing that collects that branch.** Nothing sweeps it later, so a landing abandoned between this merge and Phase 6 leaves it on the remote for good. If you find one from an earlier run (`git -C <main-checkout>/<submodule-path> ls-remote --heads origin 'worktree-landing-*'`), delete it once you confirm its tip is already contained in the base branch.

Confirm before moving on: `git -C <main-checkout>/<submodule-path> symbolic-ref -q HEAD` prints a branch (not empty), and `git -C <main-checkout>/<submodule-path> log --oneline -1 <submodule-branch>` shows the merge.

## No-remote path

No `origin` at all for a repo, or one `gh` cannot serve: land it locally with a merge commit instead of Phase 3.

```bash
# from the main checkout — <original-branch> is checked out THERE, never inside the worktree
# (git refuses to check out a branch that's already checked out in another worktree)
cd <main-checkout>
git checkout <original-branch>
git merge --no-ff <worktree-branch>     # conflict -> resolve it, then carry on
```

Phase 6 has nothing to delete for that repo. Everything else is unchanged.

A superrepo on the remote path with a submodule that has **no shared remote at all** is the one extra refusal this path carries: a pointer commit may never name a commit that exists on this machine alone. Report that, naming the submodule and the reason, before any pointer is staged.

## Gotchas

| Trap                                                       | Fix                                                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `git worktree remove` in any form                          | Never. `worktree_remove` is the only removal path — git's `--force` destroys submodule commits that reached no remote          |
| `worktree_remove` says this chat does not own the target   | Retry the same call with `force: true` — it waives ownership only, never a safety check                                        |
| Pointer bump before the submodule reaches its remote       | Land every submodule fully (Phases 2–3) before touching the superrepo                                                          |
| Stale submodule SHA in the worktree                        | Fetch and check out the merged remote head in the worktree's submodule before staging the pointer                              |
| The shared submodule checkout comes back detached          | Something ran a recursive submodule update in the main checkout. Check out its branch and pull, never that                     |
| Untracked user files in the main checkout                  | `git stash push -u` before Phase 4, `git stash pop` after. Never move, delete or exclude them                                  |
| A peer's half-done merge in the shared checkout            | Wait and re-check. It is another landing, not unrelated changes                                                                |
| Squashing or rebasing the PR                               | Always `--merge`. A squash strands the worktree's own commits and makes the superrepo pointer stale                            |
| `gh pr merge` blocked by required checks                   | Queue with `--auto` and poll. Never force past a required check                                                                |
| `git checkout <original-branch>` fails inside the worktree | Git refuses a branch already checked out elsewhere — merge from the main checkout instead                                      |
| `ship_review` fails with an error                          | Follow `meldom:ship`'s rule: retry the card when it was retracted or the request died. Raw `git commit` is never the way past |
| Remote branch deleted too early                            | Only after MERGED, a successful removal, AND `merged: true`. Otherwise it is the only durable copy                             |

## Edge cases

| Scenario                             | Handling                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Nothing to commit anywhere           | "Nothing to land" — go straight to Phase 4 and finish the tail                                    |
| Already on the original branch       | Nothing to merge; still pull main, remove the worktree and confirm                                |
| PR already exists for this branch    | Merge that one instead of creating a second                                                       |
| Mixed remote/local-origin submodules | Each repo follows its own path independently; the submodules-before-superrepo order still applies |
| Worktree already removed on disk     | Nothing to remove; confirm the branch was actually merged before treating this as done            |

Task: $ARGUMENTS
