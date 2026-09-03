---
name: ask-meldom
description: Which skill or flow fits this situation. A map over the skills in this plugin. Use when unsure which meldom skill to run, when starting a new piece of work, or when the user asks what to do next.
---

# Ask Meldom

You don't remember every skill, so ask.

Seven skills are marked _(user-invoked)_: `grill-me`, `implement-spec`, `loop-me`, `retro`, `teach`, `to-questionnaire` and `wait-what`. No skill can call those, so when one is the right answer, tell the user to type it rather than reaching for the Skill tool.

A **flow** is a path through the skills. Most paths run along one **main flow**, and two **on-ramps** merge onto it. Everything else is standalone, or a vocabulary layer that runs underneath.

## The main flow: idea → ship

The route most work travels. You have an idea and want it built.

1. **`meldom:grill-with-docs`** sharpens the idea by interview. Start here whenever you are **working in a working directory**: it's stateful, retaining what it learns in `CONTEXT.md` and ADRs. (No working directory? Use `meldom:grill-me` instead, covered under Standalone. Both run the same `meldom:grilling` primitive; `grill-with-docs` is the one that leaves a paper trail, which makes it the better of the two whenever a repo is there to leave it in.)
2. **Branch: can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through a prototype, bridged by **`meldom:handoff`** in both directions (a prototype lives in its own directory, which is exactly what `meldom:handoff` is for; see Phase boundaries):
   - **`meldom:handoff`** out, then open a fresh session against that file,
   - **`meldom:prototype`** to answer the question with throwaway code,
   - **`meldom:handoff`** back what you learned, and reference it from the original idea thread.
3. **Branch: is this a multi-session build?**
   - **Yes** → **`meldom:to-tickets`**, which does both halves: Phase A turns the thread into a spec and publishes it as the parent ticket, Phase B splits it into tracer-bullet child tickets, each declaring its **blocking edges**. Those edges are native `blocked_by` links on the meldom board, so any ticket whose blockers are done can be grabbed: kick off **`meldom:implement`** per ticket, **`/clear`ing context between each one**. Each ticket is self-contained, so the last one's context is disposable.
   - **No** → **`meldom:implement`** right here, in the same context window.

   Either way, **`meldom:implement`** builds each ticket by driving **`meldom:tdd`** internally (one red-green slice at a time), then closes out by running **`meldom:code-review`**, a two-axis review (Standards + Spec) of the diff. It does **not** commit: that's step 4. Reach for **`meldom:tdd`** on its own when you just want to build a concrete behaviour test-first without a full spec, and **`meldom:code-review`** on its own whenever you want to review a branch or PR against a fixed point.

   **The heavy alternative**: **`meldom:implement-spec`** _(user-invoked)_ takes the whole PRD instead of one ticket, works the frontier with parallel subagents, commits each onto one branch behind a draft PR, and reviews before marking it ready. It's user-invoked, so no agent starts it for you, and it's deliberately heavier than `meldom:implement` — reach for it only when you want a whole spec landed as a single reviewable PR without babysitting it.

4. **Land it.** **`meldom:ship`** is the only way work commits from a Meldom chat: it validates the tree, writes a conventional commit message, and parks on the **ship review card** for your approval before staging exactly what you selected, pushing, and reporting the receipt. The card *is* the authorization — there is no raw-git path, and a ship with no card is a ship nobody approved.

   If the work lived in a worktree, **`meldom:merge-worktree`** does the whole landing end to end instead: ship the commit, push, merge, pull the main checkout, remove the worktree through `worktree_remove`, and delete the remote branch. Use it rather than `git worktree remove`, which destroys submodule commits.

### Context hygiene

Keep steps 1–3 in **one unbroken context window** (don't compact or clear until after `meldom:to-tickets`) so the grilling, spec, and tickets all build on the same thinking. Each `meldom:implement` then starts fresh, working from the ticket.

The limit on this is the **[smart zone](https://www.aihero.dev/ai-coding-dictionary/smart-zone)**: the window (~150k tokens on state-of-the-art models) within which the model still reasons sharply. If a session approaches it before `meldom:to-tickets`, don't push on degraded; `/compact` at the nearest phase boundary and carry on (see Phase boundaries).

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Bugs and requests piling up** → **`meldom:triage`**. It moves tickets through triage roles and produces agent-ready tickets, which **`meldom:implement`** later picks up.

  Triage is only for tickets **you didn't create**: bug reports, incoming feature requests, anything that arrives raw. Tickets that `meldom:to-tickets` produced are already agent-ready, so **don't triage them**.

- **Something's broken** → **`meldom:diagnosing-bugs`**. For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a **tight feedback loop** (one command that already goes red on *this* bug), then fixes with a regression test. Its post-mortem hands off to **`meldom:improve-codebase-architecture`** when the real finding is that there's no good seam to lock the bug down.

- **A huge, foggy effort: a greenfield project or a huge feature build, too big for one session** → **`meldom:wayfinder`**, the most cognitively demanding flow here. When the way from here to the destination isn't visible yet, it charts a **shared map** of **decision tickets** on the meldom board and resolves them one at a time, producing **decisions, not deliverables**, until the fog is pushed back and the way is clear. Where **`meldom:grill-with-docs`** sharpens an idea you can hold in one session, wayfinder is for the idea you can't, and it's slower and denser, so save it for exactly that, never a well-scoped feature.

  When the map clears, **it hands off, it doesn't build**: merge onto the main flow at **`meldom:to-tickets`**, whose Phase A collapses the map's linked decisions into a buildable spec before Phase B slices it, then `meldom:implement` as usual. Looping the map straight into `meldom:implement` skips that collapse and throws the linked detail away, so go straight to `meldom:implement` only when the effort turned out genuinely small.

## Codebase health

Not feature work, just upkeep.

- **`meldom:improve-codebase-architecture`** runs whenever you have a spare moment to keep the codebase good for agents to operate in. It surfaces **deepening opportunities**; picking one _generates an idea_ you can take into the main flow at `meldom:grill-with-docs`. It's the survey that finds the candidates; **`meldom:codebase-design`** (below) is the bench you design the chosen one on.

## Vocabulary underneath

Two model-invoked references that run *beneath* the other skills, each the single source of truth for its vocabulary. Reach for them directly when the **words**, not the process, are the problem; or let the skills above pull them in.

- **`meldom:domain-modeling`**: sharpen the project's *domain* language: challenge a fuzzy term, resolve an overloaded word ("account" doing three jobs), record a hard-to-reverse decision as an ADR. It's the active discipline `meldom:grill-with-docs` drives to keep `CONTEXT.md` a clean glossary.
- **`meldom:codebase-design`** is the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for designing a module's *shape*: a lot of behaviour behind a small interface at a clean seam. `meldom:tdd` and `meldom:improve-codebase-architecture` both speak it.

## Phase boundaries

A **phase** is a chunk of work inside a session: the grilling, the implementation, the QA. At the **boundary** between two of them you have five options, and picking between them is the fuzziest decision in this whole map:

- **Continue**: stay put. Costs nothing, loses nothing.
- **`/clear`**: empty the window, when nothing here matters to what's next.
- **`meldom:handoff`** writes a portable markdown file. Narrow: only for a **new harness**, a **new directory**, a **colleague**, or forking a side task **mid-phase**. What it buys is portability.
- **Subagent**: send a tightly-scoped task to its own window and get a report back.
- **`/compact`** compresses this context and seeds a fresh session with it. The **default**, at the bottom of the tree rather than the first reach.

Read [PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md) for the ordered tree: the five questions, the reasoning behind each branch, and why the primary-source cost makes **Continue** the one to rule out first. Make the decision **at** a boundary; mid-phase, continue or split the rest into subagents.

## Standalone

Off the main flow entirely.

- **`meldom:grill-me`** _(user-invoked)_: the same relentless interview as `meldom:grill-with-docs`, but **stateless**: it saves nothing locally and builds no `CONTEXT.md`. Reach for it when you are **not working in a working directory** (sharpening a plan, a design, a piece of writing, anything with no repo under it). If you are in a working directory, use `meldom:grill-with-docs` instead: it runs the same interview and leaves a paper trail, so it is strictly the better one.
- **`meldom:grilling`** is the interview primitive itself: rounds, the frontier, facts are the agent's job and decisions are yours. `meldom:grill-me` and `meldom:grill-with-docs` are the two named ways in, and `meldom:triage`, `meldom:wayfinder` and `meldom:improve-codebase-architecture` all run it internally. Reach for it directly only when you want the interview with no wrapper around it.
- **`meldom:resolving-merge-conflicts`** works an in-progress merge or rebase conflict hunk by hunk, resolving by **intent** traced to each side's primary source rather than by picking lines, then finishes the operation. It never runs `--abort`. Standalone and off every flow: reach for it when you are already mid-conflict.
- **`meldom:prototype`** is a small, throwaway program that answers one design question: does this state model feel right, or what should this UI look like. Throwaway is a constraint on how the code is written, not a promise to destroy it: the answer folds into the real code, and the prototype itself is kept as a **primary source** on a `prototype/<name>` branch out of main, pointed at from the implementation ticket. It's the detour in step 2 of the main flow, but reach for it any time a design question is hard to settle on paper.
- **`meldom:explore-approaches`** is `meldom:prototype`'s wider cousin: instead of one throwaway answering one question, it spawns parallel sub-agents under **different constraints** and compares the trade-offs side by side. Reach for it when the question isn't "does this feel right" but "what are the options at all" — the design-it-twice move. It picks a winner and stops there; take the winner into `meldom:to-tickets` to build it.
- **`meldom:bulletproof`** is the maximum-rigor pipeline: audit your assumptions, run an adversarial pass against your own work, cross-validate with a reviewer agent that has **not** seen your reasoning, and score the confidence with evidence behind it. It is slow on purpose. Reach for it when being wrong is expensive — a migration, a security boundary, a change you cannot walk back — and never as the default way to build.
- **`meldom:retro`** _(user-invoked)_ is the postmortem for a session that went badly **when the environment is the suspect**, not the model: the reviewer agent missed a class of mistake, `CLAUDE.md` pointed the wrong way, a skill's steps were ambiguous. It turns that into concrete edits to the docs and rules. User-invoked, so ask for it by name.
- **`meldom:research`**: delegate reading legwork to a **background agent**: it investigates a question against **primary sources**, then leaves a cited Markdown file in the repo. Keep working while it reads. The file it produces is something to take *into* the main flow at `meldom:grill-with-docs`, since research feeds the thinking rather than replacing it.
- **`meldom:to-questionnaire`** _(user-invoked)_ comes in when the thing blocking you isn't in your head or the codebase but in **someone else's**, and it writes them a questionnaire to fill in. It's the inverse of `meldom:grill-me`: instead of interviewing you about the subject, it interviews you about the **send** (who it's going to, what you need back) and aims the questions at the gap. What comes back is material for `meldom:grill-with-docs` or `meldom:to-tickets`.
- **`meldom:wizard`** is for the steps only a **human** can take: provisioning infrastructure, setting up credentials or CI secrets, clicking through an unfamiliar third-party dashboard, running a one-off migration or cutover. It generates an interactive bash script that opens each URL, captures each value, and writes it into `.env` and GitHub secrets, so the procedure stops being something you re-explain to an agent every time. Model-invoked, so the agent reaches for it the moment it hits a wall only you can pass. If the agent could just do it itself, it should; this is for where a human is genuinely in the loop.
- **`meldom:wait-what`** _(user-invoked)_ is the corrective for a message that didn't land. Use it mid-conversation, inside any other skill, and the agent re-pitches what it just said with the context you were missing, in plain English, using the `CONTEXT.md` vocabulary. It works after the fact; `meldom:grill-with-docs` is the upfront cure, because a shared language agreed early is what stops the jargon arriving at all.
- **`meldom:teach`** _(user-invoked)_: learn a concept over multiple sessions, using the current directory as a stateful workspace.
- **`meldom:loop-me`** _(user-invoked)_ runs the `meldom:grilling` interview aimed at one narrow target: the **workflows you want to build in this workspace**, written out as specs it creates and edits as the grilling resolves things. Reach for it when the thing you're designing is the process itself rather than a feature. User-invoked.
- **`meldom:writing-for-agents`** is the reference for writing documents agents consume: skills, AGENTS.md, pointed-at docs.

## Precondition

There isn't one. The tracker is Meldom itself — tickets, notes, comments and blocking edges are there from the start, and the MCP server announces the connection — so no skill here needs a setup step or a config file. **`meldom:code-review`** finds the originating spec from the board on its own: a ticket key you pass, then the tickets this conversation tracks, then a key in the branch name.

Two documents these skills read when they exist, and create lazily when they don't: `CONTEXT.md`, the project's domain glossary, and the ADRs beside it. Read them silently at the start of any flow that touches domain language; when the repo has neither, say nothing and carry on. **`meldom:domain-modeling`** is what writes them, as decisions land.
