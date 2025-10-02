# How to Start the SophiaAI Autonomous Agent System

## Quick Start Guide

### Option 1: Using Slash Command (Easiest)

In your Claude Code chat, type:

```
/master-orchestrator Start autonomous execution of SophiaAI Epics 2-6. Begin now.
```

This will activate the master orchestrator agent who will coordinate all other agents.

---

### Option 2: Ask Claude to Start It

Simply say in chat:

```
Start the master orchestrator to complete all SophiaAI epics
```

Or:

```
Begin autonomous development of Epics 2-6
```

Claude will invoke the master-orchestrator agent for you.

---

### Option 3: Start Specific Epic

To start a single epic:

```
/master-orchestrator Execute Epic 2: Document Generation System only
```

---

## What Happens Next

Once you start the system:

1. **Master Orchestrator** reads `.claude/epic-progress.json`
2. **Identifies** next story to work on (starts with Epic 2, Story 2.1)
3. **Activates** database-architect agent to create schema
4. **Monitors** progress through acceptance criteria
5. **Activates** next agent (backend-developer, ai-llm-specialist, etc.)
6. **Deploys** each epic to production when complete
7. **Continues** automatically through all 40 stories in Epics 2-6

---

## Monitoring Progress

### Check Progress File
```bash
cat .claude/epic-progress.json
```

### View Current Status
```bash
cat .claude/epic-progress.json | jq '.current_epic, .epic_2.status'
```

### See Completed Stories
```bash
cat .claude/epic-progress.json | jq '.epic_2.stories'
```

---

## What to Expect

### Timeline
- **Epic 2** (Documents): ~1-2 days autonomous work
- **Epic 3** (Calculators): ~1 day autonomous work
- **Epic 4** (Listings): ~2 days autonomous work
- **Epic 5** (Email): ~1-2 days autonomous work
- **Epic 6** (Telegram/Dashboard): ~2-3 days autonomous work

**Total: 5-7 days of continuous autonomous development**

### You'll See
- Agents reporting completion: "✅ Story 2.1 complete"
- Epic completions: "🎉 Epic 2 complete! Deploying..."
- Deployment confirmations: "🚀 Deployed to https://sophia-agent.vercel.app"
- Blockers if needed: "⚠️ Need Gmail API credentials for Epic 5"

---

## Important Notes

### Knowledge Base Integration ✅
The agents are configured to use:
- **Templates**: `Knowledge Base/Templates/` (27 document templates)
- **Calculators**: `Knowledge Base/Calculator Links/calculator links` (3 URLs)
- **General Knowledge**: `Knowledge Base/General Knoweldge/`

### When You're Needed
Agents will pause and ask for:
- **API Credentials**: Gmail OAuth, zyprus.com API keys
- **External Resources**: API documentation if unavailable
- **Decisions**: Architecture choices that need human input

### Resuming
If interrupted, just say:
```
Resume SophiaAI development
```

The master orchestrator reads `.claude/epic-progress.json` and continues from where it left off.

---

## Example Start Session

```
You: /master-orchestrator Start autonomous execution of SophiaAI Epics 2-6. Begin now.

Master Orchestrator: 🚀 Starting SophiaAI Development
- Current Epic: 2 (Document Generation System)
- Total Stories: 40 remaining
- Starting with: Epic 2, Story 2.1

Activating database-architect agent...

Database Architect: ✅ Story 2.1 Complete - Document Template Schema
- Created: document_templates table
- Created: document_generations table
- Added: Indexes and RLS policies
- Migration: packages/database/supabase/migrations/20251003120000_document_templates.sql
- Ready for: Story 2.2 (backend-developer)

Master Orchestrator: Story 2.1 ✅ | Activating backend-developer for Story 2.2...

Backend Developer: Working on Story 2.2 - Template Variable Extraction...

[... continues autonomously through all 40 stories ...]

Master Orchestrator: 🎉 ALL EPICS COMPLETE!
- Epic 2: ✅ Deployed
- Epic 3: ✅ Deployed
- Epic 4: ✅ Deployed
- Epic 5: ✅ Deployed
- Epic 6: ✅ Deployed

SophiaAI is now fully functional with all features!
```

---

## Ready to Begin?

Type:
```
/master-orchestrator Start autonomous execution of SophiaAI Epics 2-6. Begin now.
```

The agents will handle everything! 🤖✨
