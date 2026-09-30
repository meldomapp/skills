# Commit approved patches

Use this after a confirmed patch-mode `ship_review`. It builds the commit in a private index, so the shared index and every working file stay as they are.

1. **Select.** Keep the exact patch bytes you sent on the card, keyed by path. When `selectedAllProposed` is true, take every proposed file; otherwise take exactly the returned `selectedFiles`. Concatenate only those files' original patch bytes into a temporary patch file. Never rebuild them from disk after approval. Write the decision's `message` (the user may have edited it) to a temporary message file.
2. **Rename, if confirmed.** With a confirmed branch rename, run `git branch -m '<new-name>'` first; the card's branch below then means the new name.
3. **Refuse stale or conflicting state.** Stop, commit nothing, and say why when:
   - `git rev-parse HEAD` is not `baseCommit`, or the current branch is not the card's branch. A fresh proposal and review are needed.
   - `git diff --cached --name-only -- <selected paths>` lists anything. Someone staged those paths; do not unstage their work. Staged changes on other paths do not matter.
   - `git apply --numstat <patch>` names a path outside the selection.
4. **Build the tree.** With a new temporary index file (`tmp` below, created by `mktemp`):
   ```bash
   GIT_INDEX_FILE="$tmp" git read-tree "$base" \
     && GIT_INDEX_FILE="$tmp" git apply --cached --check "$patch" \
     && GIT_INDEX_FILE="$tmp" git apply --cached "$patch" \
     && tree=$(GIT_INDEX_FILE="$tmp" git write-tree)
   ```
   No `--3way`, `--recount` or fuzzy application: the patch must apply exactly as reviewed.
5. **Commit and move the branch.**
   ```bash
   sign=; [ "$(git config --bool commit.gpgSign)" = true ] && sign=-S
   commit=$(git commit-tree $sign "$tree" -p "$base" -F "$message_file") \
     && git update-ref -m "commit: <subject>" HEAD "$commit" "$base"
   ```
   `update-ref` moves the branch only if HEAD is still `$base`; if another commit landed meanwhile it fails, the branch is unchanged, and you refuse as in step 3. `commit-tree` ignores `commit.gpgSign`, hence the explicit `-S`.
6. **Sync the shared index** for the committed paths. First run `git diff --cached --quiet "$base" -- <selected paths>`: if it fails, someone staged one of them after step 3, so leave the index alone and report it. Otherwise run `git reset -q -- <selected paths>`. Working files are untouched, so excluded edits stay unstaged in place.
7. **Clean up and finish.** Delete the temporary index, patch and message files. Push only if the card approved it; after a failed push, retry pushing the existing commit, never commit again. Then call `ship_receipt` with the actual result.

Keep every shell variable and path quoted.

`commit-tree` runs no Git hooks at all: no pre-commit, commit-msg or post-commit. A pre-commit hook that formats and re-stages files would pull other agents' lines into the commit. So the patch and message must already pass the project's formatting and message rules. Checks run on the shared working folder include excluded edits, so they do not prove the partial commit passes by itself; state what was tested. If the selected patch depends on excluded changes, rebuild the proposal and review it again.
