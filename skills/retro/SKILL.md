---
name: retro
description: "Conduct a retrospective on a coding session."
disable-model-invocation: true
---

The user has asked for a **retrospective**. You are suggesting improvements to the coding agent's **environment** to improve future runs.

## Steps

1. Call the Skill tool with `meldom:writing-for-agents` for the writing style guide.

2. Read the primary sources for the session the user specifies. For the **current** session you already hold the transcript — use it, do not re-read the log. For a **past** session, the logs live where the harness puts them: Claude Code at `~/.claude/projects/<project-slug>/*.jsonl`, Codex at `~/.codex/sessions/`, any other harness wherever it says — ask rather than guess. They are large either way, so grep them rather than reading them whole.

3. Look for candidates for improvement in these categories.

- **Navigation**: how easy was it for the agent to find the right files? Are there hidden dependencies between files? Would a **navigation pointer** make it easier? _Use when_ the session took a long time to find a piece of information.
- **Automated checks**: are there automated checks that could catch errors the agent made? Linting, typing, tests, filesystem linters? _Use when_ the agent made a mistake that could have been caught by an automated check.
- **Coding standards**: should the **reviewer agent** (the plugin's `meldom:meldom-reviewer`, or its Smell Baseline) be given a new rule to enforce? Should an existing rule be removed or clarified? _Use when_ the reviewer agent failed to catch a mistake.
- **Global CLAUDE.md**: are there any steering instructions that should be moved to coding standards (or automated checks) instead? _Use when_ the CLAUDE.md file is particularly large - in the repo OR the user's global scope.
- **Tool economy**: did the agent make expensive tool calls that could be streamlined? Is there any custom tooling (CLI's, MCP's) that is particularly token-inefficient? _Use when_ the agent made an expensive tool call.
- **No-ops**: look for instructions in steering files that don't modify the agent's behavior. _Use when_ the steering files are large and unwieldy.
- **Information access**: look for opportunities to increase the agent's access to information. Teeing dev server logs, readonly access to third-party services. _Use when_ a crucial piece of information was not available to the agent.

4. Present these candidates to the user, in order of severity. Offer to file the ones they accept as meldom tickets (`mcp__meldom__ticket_create`) so they land in the same backlog as everything else.

## Reference

### Implementation vs Review

Remember that all work goes through two stages: implementation and review. The implementation agent has the most **context pressure**. They are responsible for exploration, writing code, and debugging failures.

The review agent has the least context pressure - it receives a diff, so no exploration needed. It often does not need to write code or debug.

This means that the review agent should be responsible for imposing coding standards, not the implementation agent.

### Files

The steering files worth weighing, some per-repo and some global to this machine:

- `CLAUDE.md`/`AGENTS.md`: these files are pushed to the context window of any agent working in this repo. They should be used incredibly sparingly, usually only for **navigation pointers** to other files.
- The reviewer agent's rules (`meldom:meldom-reviewer`) and the `meldom:code-review` skill: read during review, not implementation. Add **navigation pointers** to docs folders rather than growing them past ~1,000 lines.
- Docs: use docs as references files, pointed to by other files. Look for existing docs before writing new ones.
- Skills: use skills for docs (since their description goes into the agent's context window), or for user-invoked commands. Follow the advice in the `meldom:writing-for-agents` skill.
