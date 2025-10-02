---
description: Check the current status of SophiaAI epic development
allowed-tools: [Read, Bash]
---

# Check Epic Development Status

Read and display the current progress of SophiaAI development.

## Steps

1. Read the progress tracker:

```bash
cat .claude/epic-progress.json | jq '.'
```

2. Display a formatted summary:

```bash
cat .claude/epic-progress.json | jq '{
  current_epic: .current_epic,
  overall: .overall_progress,
  epic_2_status: .epic_2.status,
  epic_3_status: .epic_3.status,
  epic_4_status: .epic_4.status,
  epic_5_status: .epic_5.status,
  epic_6_status: .epic_6.status
}'
```

3. Show recently completed stories:

```bash
cat .claude/epic-progress.json | jq '.epic_2.stories | to_entries | map(select(.value.status == "completed")) | .[].key'
```

## Summary Report

Provide a clear summary:

```
SophiaAI Development Status
===========================

Current Epic: [X]

Progress:
- Epic 1: ✅ Complete (Production)
- Epic 2: [status] ([X]/8 stories)
- Epic 3: [status] ([X]/7 stories)
- Epic 4: [status] ([X]/9 stories)
- Epic 5: [status] ([X]/8 stories)
- Epic 6: [status] ([X]/9 stories)

Overall: [X]/40 stories completed

Recent Activity:
- [Last completed story]
- [Current story in progress]

Blockers: [List any blockers]
```
