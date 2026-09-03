# Doc Writing Rules

Rules for all generated documentation. No exceptions.

## Content - What to Write

- Project purpose and who it's for
- Architecture: layers, data flow, where things live and why
- CLI commands and flags (what they do, not how they're implemented)
- Design decisions that aren't obvious from code (the "why")
- Relationships between components (A calls B, C depends on D)

## Content - What to NEVER Write

- Class names, function signatures, method lists
- Import paths or file paths (directory-level names like "services/" are OK)
- Code snippets longer than a single CLI example
- Implementation details (algorithms, data structures, internal state)
- Type definitions or interfaces
- Test descriptions or coverage info
- Dependency lists (package.json has those)

## Structure

- Each doc starts with a one-sentence summary of what it covers
- Use `##` headers to break into scannable sections
- Bullet points over paragraphs
- Link between docs: `[architecture](docs/architecture.md)` not inline duplication

## CLAUDE.md Rules

Primary file Claude reads at session start. Under 200 lines. Every line must earn its place.

**Recommended section order:**

```
# Project Name
One-sentence purpose.

## Commands
Build, test, lint, format commands. Table or code block.

## Architecture
Layer names and responsibilities. 2-3 sentences per layer.
Link to docs/architecture.md for depth.

## Key Design Decisions
Rules that aren't obvious from code. Status machines, validation boundaries, naming conventions.

## After Changing X
Maintenance notes: what else to update when specific areas change.

## Documentation
One-line links to deeper docs (docs/architecture.md, etc.)
```

**Include:**

- Project purpose (1-2 sentences)
- Build/test/lint commands (Claude cannot infer these)
- Architecture summary (layers, not details)
- Conventions that tools can't enforce
- Domain rules and status machines
- `## Documentation` links to deeper docs

**Exclude:**

- Anything a linter or formatter handles (use hooks instead)
- Generic advice ("write clean code", "follow best practices")
- Full architecture details (link to docs/architecture.md)
- Personality instructions ("be a senior engineer")
- Things Claude already knows (standard library APIs, language syntax)

**Pruning test:** for each line, ask "if I remove this, will Claude make a mistake?" If no, delete it.

**Scope rule:** more specific files override less specific. Put module-specific rules in `.claude/rules/` with path frontmatter, not in root CLAUDE.md.

## No Duplication

- If content exists in one doc, link to it from others. Never copy.
- README command table is for humans (install, quick start). Skill command tables are for agents. Different audiences OK.
- Architecture details go in docs/architecture.md. CLAUDE.md gets a 2-3 sentence summary with a link.

## Tone

- `.claude/rules/voice.md` auto-applies. Follow it.
- No em dashes. Use hyphens (-) or rewrite.
- Direct, factual, no filler
- Write for a developer joining the project tomorrow
- If you'd skip it while onboarding, don't write it
