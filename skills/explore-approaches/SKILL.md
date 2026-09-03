---
name: explore-approaches
description: Generate multiple radically different approaches to a design problem using parallel sub-agents, then compare trade-offs. Use when user wants to explore options, compare approaches, think through alternatives, or mentions "design it twice".
allowed-tools: AskUserQuestion
---

# Explore Approaches

Based on "Design It Twice" from "A Philosophy of Software Design": your first idea is unlikely to be the best. Generate multiple radically different designs, then compare.

## Workflow

### 1. Gather Requirements

Before designing, understand:

- [ ] What problem does this module solve?
- [ ] Who are the callers? (other modules, external users, tests)
- [ ] What are the key operations?
- [ ] Any constraints? (performance, compatibility, existing patterns)
- [ ] What should be hidden inside vs exposed?

Use the `AskUserQuestion` tool to gather requirements: "What does this module need to do? Who will use it?"

### 2. Generate Designs (Parallel Sub-Agents)

Spawn 3+ sub-agents simultaneously using the Agent tool. If the provider has no subagents at all — Codex does not — do this work in the current session instead, one approach at a time, following the same brief. Each must produce a **radically different** approach.

```
Prompt template for each sub-agent:

Design an interface for: [module description]

Requirements: [gathered requirements]

Constraints for this design: [assign a different constraint to each agent]
- Agent 1: "Minimize method count - aim for 1-3 methods max"
- Agent 2: "Maximize flexibility - support many use cases"
- Agent 3: "Optimize for the most common case"
- Agent 4: "Take inspiration from [specific paradigm/library]"

Output format:
1. Interface signature (types/methods)
2. Usage example (how caller uses it)
3. What this design hides internally
4. Trade-offs of this approach
```

### 3. Present Designs

Show each design with:

1. **Interface signature** - types, methods, params
2. **Usage examples** - how callers actually use it in practice
3. **What it hides** - complexity kept internal

Present designs sequentially so user can absorb each approach before comparison.

### 4. Compare Designs

After showing all designs, compare them on:

- **Interface simplicity**: fewer methods, simpler params
- **General-purpose vs specialized**: flexibility vs focus
- **Implementation efficiency**: does shape allow efficient internals?
- **Depth**: small interface hiding significant complexity (good) vs large interface with thin implementation (bad)
- **Ease of correct use** vs **ease of misuse**

Discuss trade-offs in prose, not tables. Highlight where designs diverge most.

### 5. Synthesize

Often the best design combines insights from multiple options. Use `AskUserQuestion` to ask:

- "Which design best fits your primary use case?" — list each design as an option with a description of its trade-offs
- "Any elements from other designs worth incorporating?" — use `multiSelect: true` to allow picking elements from multiple designs

### 6. Incremental Design Approval

After a design is chosen, present it in sections scaled to complexity. Get approval on each section before moving to the next. Sections to cover:

- Architecture / component boundaries
- Data flow and interfaces
- Error handling
- Testing strategy

If the user rejects a section, revise it before continuing. Don't present the full design as a wall of text.

## Evaluation Criteria

From "A Philosophy of Software Design":

**Interface simplicity**: Fewer methods, simpler params = easier to learn and use correctly.

**General-purpose**: Can handle future use cases without changes. But beware over-generalization.

**Implementation efficiency**: Does interface shape allow efficient implementation? Or force awkward internals?

**Depth**: Small interface hiding significant complexity = deep module (good). Large interface with thin implementation = shallow module (avoid).

## Anti-Patterns

- Don't let sub-agents produce similar designs - enforce radical difference
- Don't skip comparison - the value is in contrast
- Don't implement - this is purely about interface shape
- Don't evaluate based on implementation effort

## Gotchas

| Trap                                    | Fix                                                       |
| --------------------------------------- | --------------------------------------------------------- |
| Sub-agents produce similar designs      | Enforce radically different constraints per agent         |
| Skipping comparison                     | The value is in contrast; always compare before choosing  |
| Designing implementation, not interface | Focus on the shape callers see, not internal structure    |
| Too many designs (5+)                   | 3 is enough for meaningful comparison; more dilutes focus |

## Edge Cases

| Scenario                           | Handling                                                          |
| ---------------------------------- | ----------------------------------------------------------------- |
| Module has only one obvious design | Still generate alternatives; the "obvious" design may not be best |
| All designs are poor               | Ask user to relax constraints or redefine requirements            |
| User rejects all designs           | Synthesize elements from multiple designs; ask what's missing     |
