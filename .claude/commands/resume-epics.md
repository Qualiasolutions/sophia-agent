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

  Instructions:
  - Read .claude/epic-progress.json to find last completed story
  - Continue from next pending story
  - Maintain autonomous execution
  - Deploy epics as they complete
  - Report progress

  Resume execution now.
```

The master orchestrator will:
- Identify where development stopped
- Continue from the next story
- Activate appropriate specialized agents
- Continue until all epics complete
