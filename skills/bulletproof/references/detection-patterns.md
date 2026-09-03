# Detection Patterns

Concrete patterns for two-pass structural review. A match is a signal, not a verdict - read surrounding code before classifying.

## CRITICAL - Blocks Completion

### Data Access Safety

| Pattern                   | Signal                                                                   |
| ------------------------- | ------------------------------------------------------------------------ |
| Query interpolation       | Raw queries with string concatenation instead of parameterized bindings  |
| TOCTOU races              | Check-then-set that should be atomic conditional update                  |
| Bypassing model/ORM layer | Direct DB access when model exists - bypasses validation, scopes, events |
| Eager loading missing     | Relation access inside loops without batch prefetching (N+1)             |
| Mass assignment           | Creating/updating from raw input without explicit field allowlists       |
| Schema mismatch           | Queries referencing columns not present in schema/migration              |

### Race Conditions

| Pattern                             | Signal                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Find-then-create without constraint | Lookup then insert without unique DB constraint - concurrent calls create duplicates                  |
| Upsert without unique index         | Find-or-create/upsert on columns without unique DB index                                              |
| Non-atomic state transitions        | Status update without conditional WHERE on current state                                              |
| Side effects inside transactions    | Async side effects dispatched inside transaction - consumers may execute before commit                |
| Lock without transaction scope      | Pessimistic lock outside transaction boundary - releases immediately                                  |
| Async worker overlap                | Retry/poll interval shorter than task timeout - second worker picks up task while first still running |

### Trust Boundary

| Pattern                          | Signal                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Unvalidated external input to DB | Values from LLMs, APIs, webhooks written without validation                                 |
| Missing input sanitization       | User content rendered as raw HTML without escaping (XSS)                                    |
| Missing shape/type checks        | Structured data from external sources accepted without schema validation before persistence |
| Invalid input coerced to valid   | Malformed values silently becoming zero/empty/default instead of rejected                   |
| Incomplete validation pipeline   | Input accepted without full chain: presence -> type -> normalization -> validation          |

### Value & Enum Completeness

When diff introduces a new enum/status/type/constant:

| Check                          | How                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Trace every consumer           | Search for sibling values across entire codebase, read each file, verify new value handled |
| Check allowlists/filter arrays | Collections of sibling values must include new value                                       |
| Check branching logic          | Does new value fall through to wrong default in switch/match/if-elseif?                    |
| Check serialization            | Is new value in API responses, exports, search filters, UI dropdowns?                      |

**Value completeness requires reading code OUTSIDE the diff.** Most commonly missed pattern.

### Input Validation Parity

| Pattern                            | Signal                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| Validation gap across API surfaces | Rule enforced on one endpoint but missing on another serving same resource                       |
| Raw request passthrough            | Creating/updating from full request payload instead of validated/filtered subset                 |
| Missing request validation layer   | Handler/controller accepting input without dedicated validation (FormRequest, schema, Zod, etc.) |

### Framework Runtime Safety

Auto-detect framework from project files. Apply relevant patterns. Skip silently for unrecognized frameworks.

| Pattern                                 | Signal                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Environment access outside config layer | Direct env var reads in app code - breaks when config is cached                                  |
| Missing type casting on stored data     | JSON/date/boolean fields without cast - returns raw strings                                      |
| HTTP client without timeout             | Outbound requests without timeout hang indefinitely                                              |
| Async worker overlap                    | Retry/poll interval shorter than task timeout                                                    |
| Non-backward-compatible schema changes  | Renaming/dropping columns still referenced during zero-downtime deploy                           |
| Resource access without ownership check | Route param resolves any record by ID regardless of ownership (IDOR)                             |
| Broad exception swallowing in workers   | Catching base Exception prevents retry mechanism                                                 |
| Synchronous I/O blocking request cycle  | Email, file processing, bulk DB ops, external API calls blocking HTTP response instead of queued |

---

## INFORMATIONAL - Report But Don't Block

### Type Safety

| Pattern                          | Signal                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| Primitive obsession              | Untyped maps/arrays where 2+ consumers extract same keys - should be DTO/struct         |
| Magic strings as domain concepts | Status/type compared as raw strings in 3+ files - should be enums/constants             |
| Loose parameter/return types     | `any`, `mixed`, untyped collections when concrete type exists                           |
| Config type leakage              | Configuration values used in typed context without explicit casting                     |
| Repeated defensive patterns      | Same null-check, type-coercion, parsing pattern duplicated 3+ times - extract to helper |

### Over-Engineering

| Pattern                                  | Signal                                                                |
| ---------------------------------------- | --------------------------------------------------------------------- |
| Premature abstraction                    | Interface with single implementation. Helper for one-time 3-line op   |
| Speculative generality                   | Config with exactly one value. Generic resolving to one concrete type |
| Unnecessary indirection                  | Service proxying another without adding logic                         |
| Defensive code against impossible states | Null checks on values guaranteed non-null by type system              |

### Performance

| Pattern                            | Signal                                                            |
| ---------------------------------- | ----------------------------------------------------------------- |
| Query-per-item in loops            | Individual query inside iteration that could be batch prefetch    |
| Unbounded collection load          | Entire table into memory for computation doable at data layer     |
| Large set operations without index | Filtering/joining on high-cardinality sets without covering index |
| Blocking I/O in hot path           | Synchronous external calls in request-handling code               |
| Full-row fetch when subset needed  | All columns including blobs when only scalars used                |

### Conditional & Logic Issues

| Pattern                   | Signal                                                               |
| ------------------------- | -------------------------------------------------------------------- |
| Conditional side effects  | Code branches on condition but forgets a side effect on one branch   |
| Misleading log messages   | Log claims action happened when the action was conditionally skipped |
| Stale comments/docstrings | Comments describe old behavior after code changed                    |
| Deep nesting              | Logic nested 4+ levels (if/for/try/callback)                         |
| Circular dependencies     | Module A imports B which imports A                                   |

### Test Gaps

| Pattern                       | Signal                                                 |
| ----------------------------- | ------------------------------------------------------ |
| Happy-path-only coverage      | Tests assert success but not failure-path side effects |
| Missing negative assertions   | Code should NOT trigger action but no test verifies    |
| New public surface untested   | New endpoints/methods/exports without tests            |
| Security enforcement untested | Auth/RBAC without integration tests                    |

### API Response Security

| Pattern                                  | Signal                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Sensitive fields in responses            | Credentials, tokens, PII not hidden/excluded from serialized output               |
| Wildcard column selection                | `SELECT *` or equivalent instead of explicit field lists in user-facing endpoints |
| Nested relation data leakage             | Eagerly loaded related entities expose sensitive fields from their own schema     |
| Privilege escalation in field visibility | Making hidden fields visible without admin/owner authorization scoping            |

---

## Suppressions - DO NOT Flag

| Suppress                                           | Why                                        |
| -------------------------------------------------- | ------------------------------------------ |
| Harmless redundancy aiding readability             | Readability trumps DRY for simple cases    |
| "Add a comment explaining this"                    | Comments rot - naming should self-document |
| "This assertion could be tighter"                  | If it covers the behavior, it's sufficient |
| Consistency-only changes with no functional impact | Not worth the noise                        |
| Edge cases for constrained inputs that can't occur | Don't defend against impossible states     |
| Empirically-tuned threshold changes                | Domain-specific tuning is intentional      |
| Anything already addressed in the diff             | Read full diff before flagging             |
| Harmless no-ops                                    | Zero risk, zero value in flagging          |
