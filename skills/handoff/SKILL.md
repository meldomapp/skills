---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: 'What will the next session be used for?'
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## Also store it in meldom

A file in the OS temporary directory does not survive the machine, and the next agent may not be on this one — so after writing the file, store the same document as a meldom note:

```
mcp__meldom__note_create({
  "title": "Handoff: <what the next session picks up>",
  "body": "<the handoff document>",
  "labels": ["handoff"],
  "ticket_ids": [<the tickets this conversation tracks, if any>]
})
```

Get the tracked tickets from `mcp__meldom__conversation_status`. With none, create the note without `ticket_ids` — it is still findable through `note_list({ "labels": ["handoff"] })`. Report both the file path and the note key.
