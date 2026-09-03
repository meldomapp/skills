# Commit Conventions Reference

## Type Definitions

| Type       | When to use                                        | Example                                               |
| ---------- | -------------------------------------------------- | ----------------------------------------------------- |
| `feat`     | New capability visible to user/caller              | `feat(BA-42): add bulk export to CSV`                 |
| `fix`      | Corrects defect - wrong output, crash, regression  | `fix(PL-99): prevent null dereference on empty cart`  |
| `refactor` | Internal restructuring, no behaviour change        | `refactor: extract payment retry into service class`  |
| `tests`    | Add/update tests only, no prod code changes        | `tests(BA-10): cover edge cases in coupon validation` |
| `docs`     | Documentation, comments, README only               | `docs: document rate-limit behaviour on auth routes`  |
| `style`    | Formatting, whitespace, lint - zero logic change   | `style: apply prettier formatting`                    |
| `chore`    | Maintenance not fitting other types (deps, config) | `chore: bump typescript to 5.6`                       |
| `perf`     | Measurable performance improvement                 | `perf(BA-77): cache product list query result`        |
| `ci`       | CI pipeline, GitHub Actions, deployment config     | `ci: add typecheck step to PR workflow`               |
| `build`    | Build system, bundler, compiler scripts            | `build: switch bundler from webpack to vite`          |

## Ambiguous Cases

**feat vs fix**: did this capability exist before?

- Existed but broken -> `fix` | Genuinely new -> `feat` | Existed, implementation changed -> `refactor`

**fix vs refactor**: was there observable broken behaviour?

- Yes (wrong output, exception, missing data) -> `fix` | No (just messy code) -> `refactor`

**feat vs refactor**: does any external interface or user-visible output change?

- Yes -> `feat` | No (same result, different internals) -> `refactor`

When genuinely ambiguous, prefer `fix` > `feat` > `refactor`.

## Ticket ID Rules

Extract from branch using `[A-Z]+-[0-9]+`. Never write empty parens.

```
BA-1121-add-auth  ->  feat(BA-1121): add JWT auth
add-dark-mode     ->  feat: add dark mode toggle
```

## Multi-File Changes

Summarize intent, not the file list.

- WRONG: `refactor: update UserController, AuthService, and SessionManager`
- RIGHT: `refactor: consolidate session handling into AuthService`

If a commit spans unrelated concerns, split into two. If not possible, lead with the dominant type.

## Body Bullets

```
# Good
feat(BA-42): add bulk export with progress toast

- add CSV export endpoint with streaming response
- show progress toast while export runs
- fix off-by-one in row count shown on completion

# Bad — bullets the noise filter should have dropped
feat(BA-42): add bulk export with progress toast

- add CSV export endpoint
- run prettier on touched files       # formatting
- add company logo to header          # asset
- update bun.lock                     # lockfile churn
```

## Good vs Bad Examples

```
# Good
feat(BA-1121): add JWT auth with refresh token rotation
fix(PL-342): handle null user on checkout page
refactor: simplify payment service error handling
tests(BA-10): add coverage for expired coupon edge case

# Bad
fix: bug fix                          # too vague
feat(BA-1121): added user auth        # past tense
feat: Add dark mode                   # uppercase
fix(PL-10): handle null pointer.      # trailing period
refactor: update UserController.php   # describes files not intent
feat(): new dashboard widget          # empty parens
```
