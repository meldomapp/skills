---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
4. Store the same findings as a meldom note, so a later session finds them from the board rather than from a path it has to guess:

```
mcp__meldom__note_create({
  "title": "Research: <the question>",
  "body": "<the findings, with their citations>",
  "labels": ["research"],
  "ticket_ids": [<the ticket this research was asked from, if there is one>]
})
```

The ticket is whichever one prompted the question — the id you were given, or one from `mcp__meldom__conversation_status`. With no ticket, create the note without `ticket_ids`. Report the file path and the note key together.
