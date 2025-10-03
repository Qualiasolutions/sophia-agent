---
description: Start autonomous development of SophiaAI Epics 2-6
allowed-tools: [Task, Read, Write, Edit, Bash, Glob, Grep]
---

# Start Autonomous Epic Development

You are now activating the **Master Orchestrator** agent to complete all remaining SophiaAI development (Epics 2-6).

## Your Task

1. **Read Progress**: Check `.claude/epic-progress.json` for current state
2. **Activate Master Orchestrator**: Use the Task tool to invoke the master-orchestrator agent
3. **Pass Control**: Let the orchestrator coordinate all specialized agents

## Command Execution

Use the Task tool to activate the master orchestrator:

```markdown
Task: master-orchestrator
Prompt: |
  Start autonomous execution of SophiaAI Epics 2-6

  Current Status:
  - Epic 1: ✅ COMPLETE (Production - 2025-10-03)
    * All 6 stories completed
    * Live at https://sophia-agent.vercel.app
    * Response time: 2-3 seconds
    * Conversation history working
  - Epics 2-6: Ready to start (40 stories remaining)

  Resources Available:
  - Knowledge Base/Templates/ - 27 document templates
  - Knowledge Base/Calculator Links/ - 3 calculator URLs
  - docs/prd.md - Complete requirements

  Instructions:
  - Start with Epic 2, Story 2.1
  - Progress through all stories autonomously
  - Deploy each epic when complete
  - Report progress clearly
  - Escalate only for blockers (missing credentials, API docs)

  Begin execution now.
```

## What Happens Next

The master-orchestrator will:
1. Read Epic 2 requirements from `docs/prd.md`
2. Activate **database-architect** for schema work
3. Activate **backend-developer** for API routes
4. Activate **integration-specialist** for external APIs
5. Activate **ai-llm-specialist** for conversation flows
6. Activate **testing-qa** for validation
7. Activate **devops-deployment** for production deployment
8. Continue through all 40 stories across Epics 2-6

You'll see progress updates like:
- "✅ Story 2.1 complete - Database schema created"
- "🚀 Epic 2 deployed to production"
- "⚠️ Blocker: Need Gmail API credentials for Epic 5"

The system will run autonomously until all epics are complete!
