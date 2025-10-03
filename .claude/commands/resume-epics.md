---
description: Resume SophiaAI development from where it left off
allowed-tools: [Task, Read]
---

# Resume Epic Development

Resume the autonomous development system from its last checkpoint.

## Steps

1. **Read Progress**: Check `.claude/epic-progress.json` for current state

2. **Activate Master Orchestrator**: Use Task tool to resume

```markdown
Task: master-orchestrator
Prompt: |
  Resume SophiaAI development from current progress tracker state

  Current Status:
  - Epic 1: ✅ COMPLETE (Production - 2025-10-03)
  - Epic 2: READY TO START - Document Generation System
  - Next story: 2.1 - Document Template Database Schema

  Instructions:
  - Read .claude/epic-progress.json to confirm current state
  - Begin Epic 2: Document Generation System
  - Start with Story 2.1 (database-architect agent)
  - Maintain autonomous execution
  - Deploy epics as they complete
  - Update progress tracker after each story
  - Report progress

  Resume execution now.
```

The master orchestrator will:
- Identify where development stopped
- Continue from the next story
- Activate appropriate specialized agents
- Continue until all epics complete
