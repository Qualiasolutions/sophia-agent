# Sophia AI Agent Commands

This directory contains specialized AI agents for the Sophia WhatsApp AI project. Each agent is an expert in a specific domain and can help you complete tasks efficiently.

## Quick Start

### Main Orchestrator (Start Here!)
```bash
/sophia
```
The orchestrator analyzes your project state and recommends the best next action. It delegates work to specialized agents automatically.

## Specialized Agents

### 1. Story Executor (`/sophia-story`)
**Purpose:** Execute BMAD stories end-to-end with full implementation and testing.

**Use when:**
- Starting a new story
- Continuing story implementation
- Need to complete acceptance criteria
- Writing tests for a story

**Commands:**
- `/sophia-story start <number>` - Begin a story (e.g., `/sophia-story start 1.6`)
- `/sophia-story continue` - Resume current story
- `/sophia-story test` - Run test suite
- `/sophia-story review` - Prepare for review
- `/sophia-story status` - Show progress

**Example:**
```bash
/sophia-story start 2.1  # Start Epic 2, Story 1 (Document Generation)
```

---

### 2. WhatsApp Specialist (`/sophia-whatsapp`)
**Purpose:** Build and optimize WhatsApp integration, messaging, and conversational flows.

**Use when:**
- Adding WhatsApp features
- Optimizing message delivery
- Debugging webhook issues
- Creating template messages
- Handling media messages

**Commands:**
- `/sophia-whatsapp optimize` - Improve performance
- `/sophia-whatsapp flow <name>` - Design conversation flow
- `/sophia-whatsapp template <name>` - Create template
- `/sophia-whatsapp monitor` - Check delivery metrics
- `/sophia-whatsapp debug <issue>` - Fix problems

**Example:**
```bash
/sophia-whatsapp optimize  # Improve delivery rate and response time
```

---

### 3. AI Conversation Designer (`/sophia-ai`)
**Purpose:** Design AI-powered conversations, OpenAI integration, and prompt engineering.

**Use when:**
- Designing conversation flows
- Optimizing OpenAI prompts
- Adding intent recognition
- Building multi-turn conversations
- Reducing token costs

**Commands:**
- `/sophia-ai design <flow>` - Create conversation flow
- `/sophia-ai prompt <intent>` - Write/optimize prompt
- `/sophia-ai test <scenario>` - Test conversation
- `/sophia-ai optimize` - Reduce costs
- `/sophia-ai analyze` - Review conversation logs

**Example:**
```bash
/sophia-ai design document-generation  # Create document gen flow
```

---

### 4. Database Architect (`/sophia-db`)
**Purpose:** Design schemas, create migrations, optimize queries, manage Supabase.

**Use when:**
- Creating new database tables
- Writing migrations
- Adding RLS policies
- Optimizing queries
- Implementing data retention

**Commands:**
- `/sophia-db schema` - Show current schema
- `/sophia-db migrate <name>` - Create migration
- `/sophia-db optimize` - Improve performance
- `/sophia-db rls <table>` - Design policies
- `/sophia-db cleanup` - Data retention

**Example:**
```bash
/sophia-db migrate document_templates  # Create templates table
```

---

### 5. Testing Specialist (`/sophia-test`)
**Purpose:** Write tests, ensure quality, achieve coverage targets.

**Use when:**
- Writing test suites
- Fixing failing tests
- Improving coverage
- Creating E2E tests
- Performance testing

**Commands:**
- `/sophia-test run` - Execute tests
- `/sophia-test coverage` - Coverage report
- `/sophia-test write <feature>` - Create tests
- `/sophia-test e2e <scenario>` - E2E tests
- `/sophia-test performance` - Speed tests

**Example:**
```bash
/sophia-test write document-generation  # Write document gen tests
```

---

### 6. Deployment Engineer (`/sophia-deploy`)
**Purpose:** Deploy to production, manage environments, monitoring, CI/CD.

**Use when:**
- Deploying to staging/production
- Managing environment variables
- Setting up monitoring
- Configuring CI/CD
- Handling incidents

**Commands:**
- `/sophia-deploy status` - Deployment status
- `/sophia-deploy <env>` - Deploy to env (staging/production)
- `/sophia-deploy logs` - View logs
- `/sophia-deploy health` - Health checks
- `/sophia-deploy monitor` - Set up monitoring

**Example:**
```bash
/sophia-deploy staging  # Deploy to staging first
```

---

## Workflow Examples

### Example 1: Complete Story 1.6
```bash
# Orchestrator recommends next action
/sophia next

# Execute story tasks
/sophia-story continue

# Run tests
/sophia-test run

# Deploy to staging
/sophia-deploy staging

# Deploy to production
/sophia-deploy production
```

### Example 2: Start Epic 2 (Document Generation)
```bash
# Check project status
/sophia status

# Design the database schema
/sophia-db migrate document_templates
/sophia-db migrate document_generations

# Design AI conversation flow
/sophia-ai design document-generation

# Start implementing the story
/sophia-story start 2.1

# Write comprehensive tests
/sophia-test write document-generation

# Deploy when ready
/sophia-deploy production
```

### Example 3: Optimize WhatsApp Performance
```bash
# Check WhatsApp metrics
/sophia-whatsapp monitor

# Optimize delivery
/sophia-whatsapp optimize

# Test improvements
/sophia-test performance

# Deploy optimizations
/sophia-deploy staging
```

## Agent Coordination

The orchestrator (`/sophia`) can coordinate multiple agents:

```bash
# Orchestrator analyzes and delegates
/sophia plan epic-2

# Might delegate to:
# - /sophia-db for schema
# - /sophia-ai for conversation design
# - /sophia-story for implementation
# - /sophia-test for quality
# - /sophia-deploy for production
```

## Tips for Using Agents

1. **Start with the orchestrator** (`/sophia`) - It analyzes your situation and recommends the best agent
2. **One task at a time** - Each agent is focused on its specialty
3. **Follow BMAD methodology** - Agents understand the story-driven workflow
4. **Test before deploying** - Always use `/sophia-test` before `/sophia-deploy`
5. **Check status frequently** - Use `/sophia status` to track progress

## Current Project State

As of Story 1.6:
- ✅ Epic 1 (Core WhatsApp Integration) - 95% complete
- ⏳ Manual testing needed for Story 1.6
- 🎯 Next: Complete Story 1.6, then start Epic 2 (Document Generation)

## Getting Help

Each agent provides context-aware help. Just run the agent command to see:
- Current status in its domain
- Available commands
- Recommendations for next actions

**Start here:**
```bash
/sophia
```

The orchestrator will guide you!
