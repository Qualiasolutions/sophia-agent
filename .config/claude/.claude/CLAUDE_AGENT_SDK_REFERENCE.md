# Claude Agent SDK - Production Reference Guide

> **Last Updated:** October 2025
> **SDK Version:** 1.x
> **Purpose:** Comprehensive reference for building production-level AI agents with Claude Agent SDK

---

## 📋 Table of Contents

1. [Migration Guide](#migration-guide)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [TypeScript SDK](#typescript-sdk)
5. [Python SDK](#python-sdk)
6. [Input Modes](#input-modes)
7. [Advanced Features](#advanced-features)
8. [System Prompt Customization](#system-prompt-customization)
9. [MCP Integration](#mcp-integration)
10. [Production Best Practices](#production-best-practices)
11. [Quick Reference](#quick-reference)

---

## 🔄 Migration Guide

### Package Rename
The SDK has been renamed from **Claude Code SDK** to **Claude Agent SDK** to reflect its evolution beyond coding tasks.

### TypeScript/JavaScript Migration
```bash
# Uninstall old package
npm uninstall @anthropic-ai/claude-code

# Install new package
npm install @anthropic-ai/claude-agent-sdk

# Update imports
# OLD: import { query } from '@anthropic-ai/claude-code'
# NEW: import { query } from '@anthropic-ai/claude-agent-sdk'
```

### Python Migration
```bash
# Uninstall old package
pip uninstall claude-code-sdk

# Install new package
pip install claude-agent-sdk

# Update imports
# OLD: from claude_code_sdk import query
# NEW: from claude_agent_sdk import query
```

### Breaking Changes
- **Python:** `ClaudeCodeOptions` → `ClaudeAgentOptions`
- **System Prompt:** No longer used by default (must be explicitly set)
- **Settings Sources:** Filesystem configs no longer automatically loaded (must use `settingSources`)

---

## 🚀 Quick Start

### Installation

**TypeScript/JavaScript:**
```bash
npm install @anthropic-ai/claude-agent-sdk
```

**Python:**
```bash
pip install claude-agent-sdk
```

### Authentication
Set your API key as an environment variable:
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

Also supports Amazon Bedrock and Google Vertex AI authentication.

### First Query - TypeScript
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

for await (const message of query({
  prompt: "Create a Python web server with FastAPI",
  options: {
    model: 'claude-sonnet-4-5',
    systemPrompt: { append: 'You are an expert backend developer' },
    allowedTools: ['Read', 'Write', 'Bash']
  }
})) {
  console.log(message);
}
```

### First Query - Python
```python
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        system_prompt="You are an expert Python developer",
        allowed_tools=["Read", "Write", "Bash"]
    )

    async for message in query(
        prompt="Create a Python web server",
        options=options
    ):
        print(message)
```

---

## 🧠 Core Concepts

### SDK Purpose
The Claude Agent SDK enables developers to build custom AI agents with:
- **Automatic context management**
- **Rich tool ecosystem** (file operations, code execution, web search)
- **Fine-grained permissions**
- **Production-ready infrastructure**
- **Optimized Claude integration**

### Agent Types You Can Build
1. **Coding Agents:** SRE diagnostics, security review bots, refactoring tools
2. **Business Agents:** Legal assistants, customer support, data analysis
3. **Content Agents:** Documentation generators, report creators, content analyzers

### Authentication Methods
- API Key (`ANTHROPIC_API_KEY`)
- Amazon Bedrock
- Google Vertex AI

### System Prompts
Define agent behavior and expertise through:
- CLAUDE.md files (project/global)
- Output styles (persistent configs)
- systemPrompt option (session-specific)
- Custom system prompts (full replacement)

### Tool Permissions
Control agent capabilities with:
- `allowedTools`: Whitelist specific tools
- `permissionMode`: Control interaction level
  - `'default'`: Standard permissions
  - `'acceptEdits'`: Auto-accept file edits
  - `'bypassPermissions'`: Skip all permission checks
  - `'plan'`: Planning mode without execution

---

## 💻 TypeScript SDK

### Core Functions

#### `query()`
Primary function for interacting with Claude. Returns an async generator that streams messages.

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = query({
  prompt: string | AsyncIterable<string>,
  options?: {
    model?: string,                    // 'claude-sonnet-4-5', 'claude-opus-4'
    systemPrompt?: string | { append: string },
    allowedTools?: string[],
    permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan',
    hooks?: Record<string, Hook[]>,
    settingSources?: string[],
    agents?: Record<string, AgentDefinition>,
    resume?: string,                   // Session ID to resume
    forkSession?: boolean,
    maxTurns?: number
  }
});

for await (const message of result) {
  // Process streaming messages
}
```

#### `tool()`
Creates type-safe MCP tool definitions.

```typescript
import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const weatherTool = tool(
  'get_weather',
  'Get current weather for a location',
  {
    location: z.string(),
    units: z.enum(['celsius', 'fahrenheit'])
  },
  async (args) => {
    // Implementation
    return { temperature: 22, conditions: 'sunny' };
  }
);
```

#### `createSdkMcpServer()`
Creates an in-process MCP server.

```typescript
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';

const customServer = createSdkMcpServer({
  name: 'my-custom-tools',
  version: '1.0.0',
  tools: [weatherTool, calculatorTool]
});
```

### Permission Modes

```typescript
// Plan mode - research without execution
query({
  prompt: "Analyze codebase structure",
  options: { permissionMode: 'plan' }
});

// Auto-accept edits
query({
  prompt: "Refactor authentication module",
  options: { permissionMode: 'acceptEdits' }
});

// Bypass all permissions (use with caution!)
query({
  prompt: "Deploy to production",
  options: { permissionMode: 'bypassPermissions' }
});
```

---

## 🐍 Python SDK

### Core Functions

#### `query()`
Async function for one-off interactions (stateless).

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        model='claude-sonnet-4-5',
        system_prompt='You are a data scientist',
        allowed_tools=['Read', 'Write', 'Bash'],
        permission_mode='acceptEdits',
        max_turns=10
    )

    async for message in query(
        prompt="Analyze sales data in data/sales.csv",
        options=options
    ):
        print(message)
```

#### `ClaudeSDKClient`
Maintains conversation context across multiple exchanges.

```python
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions

async def main():
    client = ClaudeSDKClient(
        options=ClaudeAgentOptions(
            system_prompt='You are a Python expert',
            allowed_tools=['Read', 'Write', 'Edit', 'Bash']
        )
    )

    # Multi-turn conversation
    async for message in client.query("Create a FastAPI server"):
        print(message)

    async for message in client.query("Add authentication"):
        print(message)

    async for message in client.query("Write tests"):
        print(message)
```

#### `tool()` Decorator
Define custom MCP tools.

```python
from claude_agent_sdk import tool

@tool(
    name='calculate_roi',
    description='Calculate return on investment',
    schema={
        'investment': {'type': 'number'},
        'return': {'type': 'number'}
    }
)
async def calculate_roi(investment: float, return_value: float) -> dict:
    roi = ((return_value - investment) / investment) * 100
    return {'roi_percentage': roi}
```

### Error Handling

```python
from claude_agent_sdk import (
    CLINotFoundError,
    ProcessError,
    CLIJSONDecodeError
)

try:
    async for message in query(prompt="Run analysis"):
        print(message)
except CLINotFoundError:
    print("Claude CLI not found")
except ProcessError as e:
    print(f"Process error: {e}")
except CLIJSONDecodeError as e:
    print(f"JSON decode error: {e}")
```

---

## 🔄 Input Modes

### Streaming Mode (Recommended)
Provides full access to SDK capabilities.

**Benefits:**
- ✅ Image uploads
- ✅ Queued messages
- ✅ Tool integration
- ✅ Lifecycle hooks
- ✅ Real-time feedback
- ✅ Persistent conversation context

```typescript
for await (const message of query({
  prompt: async function*() {
    yield 'Analyze this code:';
    yield { type: 'image', source: 'path/to/screenshot.png' };
    yield 'What improvements do you suggest?';
  },
  options: { /* ... */ }
})) {
  console.log(message);
}
```

### Single Message Mode
Simpler but limited approach.

**Use When:**
- One-shot responses needed
- Stateless environments (Lambda functions)
- No image attachments required
- No multi-turn conversations

```typescript
const result = await query({
  prompt: 'What is 2+2?',
  options: { /* ... */ }
});
```

**Limitations:**
- ❌ No direct image attachments
- ❌ Cannot queue messages dynamically
- ❌ No real-time interruption
- ❌ Limited hook integration
- ❌ Restricted multi-turn capabilities

---

## 🚀 Advanced Features

### Subagents
Specialized agents with distinct characteristics for parallel execution and context management.

**Benefits:**
1. **Context Management:** Separate contexts prevent information overload
2. **Parallelization:** Run multiple agents concurrently
3. **Specialized Instructions:** Tailor system prompts for specific expertise
4. **Tool Restrictions:** Limit agent access to specific tools

**Programmatic Definition (Recommended):**
```typescript
const result = query({
  prompt: "Review authentication module and write tests",
  options: {
    agents: {
      'code-reviewer': {
        description: 'Expert code review specialist',
        prompt: 'Review code for security, performance, and best practices',
        tools: ['Read', 'Grep', 'Glob'],
        model: 'claude-sonnet-4-5'
      },
      'test-writer': {
        description: 'Expert test engineer',
        prompt: 'Write comprehensive tests with high coverage',
        tools: ['Read', 'Write', 'Edit', 'Bash'],
        model: 'claude-sonnet-4-5'
      }
    }
  }
});
```

**Filesystem-Based Definition:**
Create `.claude/agents/code-reviewer.md`:
```markdown
---
description: Expert code review specialist
tools: [Read, Grep, Glob]
model: claude-sonnet-4-5
---

Review code for:
- Security vulnerabilities
- Performance issues
- Best practices
- Code style consistency
```

### Custom Tools
Extend Claude's capabilities with custom MCP tools.

**Creating Custom Tools:**
```typescript
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const customServer = createSdkMcpServer({
  name: 'real-estate-tools',
  version: '1.0.0',
  tools: [
    tool(
      'calculate_mortgage',
      'Calculate monthly mortgage payment',
      {
        principal: z.number(),
        interest_rate: z.number(),
        years: z.number()
      },
      async ({ principal, interest_rate, years }) => {
        const monthlyRate = interest_rate / 100 / 12;
        const numPayments = years * 12;
        const payment = principal *
          (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
        return { monthly_payment: payment.toFixed(2) };
      }
    )
  ]
});

// Use in query
const result = query({
  prompt: "Calculate mortgage for $300,000 at 4.5% for 30 years",
  options: {
    mcpServers: [customServer],
    allowedTools: ['mcp__real-estate-tools__calculate_mortgage']
  }
});
```

**Tool Naming Convention:**
Tools follow the format: `mcp__{server_name}__{tool_name}`

### Sessions
Continue conversations across multiple interactions.

**Getting Session ID:**
```typescript
for await (const message of query({ prompt: "Start task" })) {
  if (message.type === 'system' && message.sessionId) {
    console.log('Session ID:', message.sessionId);
    // Save for later: saveSessionId(message.sessionId);
  }
}
```

**Resuming Sessions:**
```typescript
const result = query({
  prompt: "Continue the previous task",
  options: {
    resume: 'session-xyz-123',  // Previous session ID
    forkSession: false          // Continue original session
  }
});
```

**Forking Sessions:**
```typescript
const result = query({
  prompt: "Try a different approach",
  options: {
    resume: 'session-xyz-123',
    forkSession: true  // Creates new session branch
  }
});
```

**Use Cases:**
- Continue long-running tasks
- Explore different approaches (forking)
- Maintain conversation context
- Test changes without modifying original

### Hooks
Event-driven automation and validation.

**Hook Events:**
- `PreToolUse`: Runs before tool execution
- `PostToolUse`: Runs after tool completes
- `Notification`: Triggered during notifications
- `UserPromptSubmit`: Runs when user submits prompt
- `Stop`: Runs when main agent finishes
- `SubagentStop`: Runs when subagent finishes
- `PreCompact`: Runs before context compaction
- `SessionStart`: Runs when session begins
- `SessionEnd`: Runs when session ends

**Configuration Example:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash:*",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Validating bash command...' && validate-command.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write:*.ts",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write ${file_path} && npx eslint --fix ${file_path}"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Session started at $(date)' >> session.log"
          }
        ]
      }
    ]
  }
}
```

**Programmatic Hooks (TypeScript):**
```typescript
query({
  prompt: "Refactor codebase",
  options: {
    hooks: {
      PreToolUse: [
        {
          matcher: 'Edit:*',
          hooks: [{
            type: 'command',
            command: 'git diff > pre-edit.patch'
          }]
        }
      ],
      PostToolUse: [
        {
          matcher: 'Edit:*',
          hooks: [{
            type: 'command',
            command: 'npm run lint && npm run test'
          }]
        }
      ]
    }
  }
});
```

**Security Notes:**
- ⚠️ Hooks execute shell commands automatically
- ⚠️ Always validate and sanitize inputs
- ⚠️ Review hook commands before implementation
- ✅ Use `claude --debug` to debug hook execution

### Slash Commands
Built-in and custom commands for controlling sessions.

**Built-in Commands:**
- `/compact`: Reduces conversation history by summarizing
- `/clear`: Starts fresh conversation
- `/hooks`: Show configured hooks

**Creating Custom Commands:**

**Location:**
- Project-specific: `.claude/commands/`
- Personal: `~/.claude/commands/`

**Example:** `.claude/commands/security-scan.md`
```markdown
---
allowed-tools: [Read, Grep, Glob]
description: Run security vulnerability scan
model: claude-sonnet-4-5
---

Analyze the codebase for security vulnerabilities including:
- SQL injection risks
- XSS vulnerabilities
- Exposed credentials
- Insecure dependencies
- Authentication/authorization issues

Provide a detailed report with:
1. Severity ratings
2. Affected files and line numbers
3. Remediation recommendations
```

**With Arguments:** `.claude/commands/test.md`
```markdown
---
description: Run tests for specific file
---

Run tests for {{file}}:
1. Execute test suite
2. Show coverage report
3. Identify failing tests
```

**Usage in SDK:**
```typescript
for await (const message of query({
  prompt: "/security-scan",
  options: { maxTurns: 5 }
})) {
  console.log(message);
}

// With arguments
for await (const message of query({
  prompt: "/test src/auth.ts"
})) {
  console.log(message);
}
```

**Namespacing:** Use subdirectories for organization
```
.claude/commands/
  ├── db/
  │   ├── migrate.md
  │   └── seed.md
  └── deploy/
      ├── staging.md
      └── production.md
```

Usage: `/db migrate`, `/deploy staging`

---

## 🎨 System Prompt Customization

### 1. CLAUDE.md Files (Project-Level)
Persistent project context and guidelines.

**Location:**
- Project: `./CLAUDE.md`
- Global: `~/.claude/CLAUDE.md`

**Usage:**
```typescript
query({
  prompt: "Build feature",
  options: {
    settingSources: ['./CLAUDE.md', '~/.claude/CLAUDE.md']
  }
});
```

**Example CLAUDE.md:**
```markdown
# Project Guidelines

## Tech Stack
- Next.js 15.5.4 with App Router
- TypeScript 5
- Supabase (PostgreSQL)
- Tailwind CSS

## Code Standards
- Use functional components
- Prefer async/await over promises
- Write tests with Vitest
- Follow Airbnb style guide

## Architecture Patterns
- Services in packages/services/
- API routes in apps/web/src/app/api/
- Shared types in packages/shared/
```

### 2. Output Styles
Reusable configurations for specialized behaviors.

**Create Style:** `~/.claude/styles/code-reviewer.md`
```markdown
---
model: claude-sonnet-4-5
allowed-tools: [Read, Grep, Glob]
---

You are an expert code reviewer. Review code for:
1. Security vulnerabilities
2. Performance issues
3. Best practices
4. Code maintainability
5. Test coverage

Provide actionable feedback with:
- File paths and line numbers
- Severity ratings (critical/high/medium/low)
- Specific remediation steps
```

**Usage:**
```typescript
query({
  prompt: "Review authentication module",
  options: {
    outputStyle: 'code-reviewer'
  }
});
```

### 3. systemPrompt with Append
Add session-specific instructions while preserving defaults.

```typescript
query({
  prompt: "Build REST API",
  options: {
    systemPrompt: {
      append: `
        Use these specific standards:
        - OpenAPI 3.0 specification
        - JWT authentication
        - Rate limiting: 100 req/min
        - Comprehensive error handling
      `
    }
  }
});
```

### 4. Custom System Prompts
Complete replacement of default prompt (advanced).

```typescript
query({
  prompt: "Specialized task",
  options: {
    systemPrompt: `
      You are a specialized AI agent for Cyprus real estate automation.

      Your capabilities:
      - WhatsApp message handling
      - Document generation
      - Property listing management
      - Real estate calculations

      Always respond in a professional, helpful manner.
      Use tools: Read, Write, Edit, Bash
    `
  }
});
```

**⚠️ Warning:** Custom prompts lose default tool instructions. Manually specify tool usage.

---

## 🔌 MCP Integration

### MCP Server Types

#### 1. stdio Servers (External Processes)
Run as separate processes, communicate via stdin/stdout.

**Configuration:** `.mcp.json`
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/path/to/allowed"],
      "env": {
        "ALLOWED_PATHS": "/Users/me/projects"
      }
    },
    "database": {
      "command": "node",
      "args": ["./mcp-servers/database-server.js"],
      "env": {
        "DB_CONNECTION": "postgresql://..."
      }
    }
  }
}
```

#### 2. HTTP/SSE Servers (Remote)
Network-based servers with HTTP communication.

**Configuration:** `.mcp.json`
```json
{
  "mcpServers": {
    "api-gateway": {
      "url": "https://api.example.com/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

#### 3. SDK MCP Servers (In-Process)
Run directly within your application.

```typescript
import { createSdkMcpServer, tool, query } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const realEstateServer = createSdkMcpServer({
  name: 'real-estate',
  version: '1.0.0',
  tools: [
    tool(
      'calculate_commission',
      'Calculate real estate agent commission',
      {
        sale_price: z.number(),
        commission_rate: z.number()
      },
      async ({ sale_price, commission_rate }) => {
        const commission = sale_price * (commission_rate / 100);
        return { commission, vat: commission * 0.19 };
      }
    )
  ]
});

// Use in query
for await (const message of query({
  prompt: "Calculate commission for €500,000 sale at 3%",
  options: {
    mcpServers: [realEstateServer],
    allowedTools: ['mcp__real-estate__calculate_commission']
  }
})) {
  console.log(message);
}
```

### MCP Best Practices
- ✅ Configure servers in project root (`.mcp.json`)
- ✅ Specify allowed tools explicitly
- ✅ Use environment variables for sensitive data
- ✅ Handle connection failures gracefully
- ✅ Log MCP server execution for debugging
- ❌ OAuth2 MCP authentication not currently supported

---

## 🏭 Production Best Practices

### 1. Error Handling
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function robustQuery(prompt: string) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = [];
      for await (const message of query({
        prompt,
        options: {
          model: 'claude-sonnet-4-5',
          maxTurns: 10,
          timeout: 30000
        }
      })) {
        result.push(message);
      }
      return result;
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

### 2. Performance Optimization
```typescript
// Use streaming for real-time feedback
for await (const message of query({
  prompt: "Analyze large codebase",
  options: {
    // Limit context size
    maxTurns: 20,

    // Use efficient tools
    allowedTools: ['Grep', 'Glob'], // Avoid 'Read' for large files

    // Enable compaction
    hooks: {
      PreCompact: [{
        hooks: [{
          type: 'command',
          command: 'echo "Compacting context..."'
        }]
      }]
    }
  }
})) {
  // Process incrementally
}
```

### 3. Security Considerations
```typescript
// Restrict tool access
query({
  prompt: userInput, // Never trust user input directly
  options: {
    allowedTools: [
      'Read',    // Limited to safe directories
      'Grep',    // Read-only search
      'Glob'     // Read-only file listing
    ],

    // Disable dangerous tools
    permissionMode: 'default', // Require approval

    // Validate with hooks
    hooks: {
      PreToolUse: [{
        matcher: 'Bash:*',
        hooks: [{
          type: 'command',
          command: 'validate-bash-safety.sh "${command}"'
        }]
      }]
    }
  }
});
```

### 4. Tool Permission Management
```typescript
// Production-safe configuration
const productionConfig = {
  // Read-only analysis
  analysis: {
    allowedTools: ['Read', 'Grep', 'Glob'],
    permissionMode: 'default'
  },

  // Automated refactoring (with review)
  refactoring: {
    allowedTools: ['Read', 'Edit', 'Write'],
    permissionMode: 'acceptEdits', // Auto-accept after validation
    hooks: {
      PostToolUse: [{
        matcher: 'Edit:*',
        hooks: [{
          type: 'command',
          command: 'npm run lint && npm test'
        }]
      }]
    }
  },

  // Deployment (maximum safety)
  deployment: {
    allowedTools: ['Bash'],
    permissionMode: 'default', // Manual approval required
    hooks: {
      PreToolUse: [{
        matcher: 'Bash:*',
        hooks: [{
          type: 'command',
          command: 'require-manual-approval.sh'
        }]
      }]
    }
  }
};
```

### 5. Context Management Strategies
```typescript
// Strategy 1: Use subagents to isolate context
query({
  prompt: "Audit and refactor entire codebase",
  options: {
    agents: {
      'auditor': {
        description: 'Code auditor - analyzes without editing',
        prompt: 'Audit code for issues',
        tools: ['Read', 'Grep', 'Glob']
      },
      'refactorer': {
        description: 'Code refactorer - applies fixes',
        prompt: 'Refactor based on audit findings',
        tools: ['Edit', 'Write']
      }
    }
  }
});

// Strategy 2: Use session forking for experimentation
const baseSession = await getSessionId();

// Fork 1: Try approach A
query({
  prompt: "Implement feature with approach A",
  options: { resume: baseSession, forkSession: true }
});

// Fork 2: Try approach B
query({
  prompt: "Implement feature with approach B",
  options: { resume: baseSession, forkSession: true }
});

// Strategy 3: Compact context regularly
query({
  prompt: "Long-running analysis",
  options: {
    maxTurns: 50,
    hooks: {
      PreCompact: [{
        hooks: [{
          type: 'command',
          command: 'backup-context.sh "${session_id}"'
        }]
      }]
    }
  }
});
```

### 6. Logging and Monitoring
```typescript
// Comprehensive logging
for await (const message of query({
  prompt: "Production task",
  options: {
    hooks: {
      SessionStart: [{
        hooks: [{
          type: 'command',
          command: 'log-session-start.sh "${session_id}"'
        }]
      }],
      PreToolUse: [{
        hooks: [{
          type: 'command',
          command: 'log-tool-use.sh "${tool_name}" "${args}"'
        }]
      }],
      PostToolUse: [{
        hooks: [{
          type: 'command',
          command: 'log-tool-result.sh "${tool_name}" "${result}"'
        }]
      }],
      SessionEnd: [{
        hooks: [{
          type: 'command',
          command: 'log-session-end.sh "${session_id}" "${duration}"'
        }]
      }]
    }
  }
})) {
  // Log messages
  console.log(`[${new Date().toISOString()}]`, message);
}
```

---

## 📚 Quick Reference

### Common Configurations

#### Code Analysis Agent
```typescript
query({
  prompt: "Analyze codebase architecture",
  options: {
    systemPrompt: { append: 'You are a senior software architect' },
    allowedTools: ['Read', 'Grep', 'Glob'],
    permissionMode: 'default',
    maxTurns: 15
  }
});
```

#### Automated Refactoring Agent
```typescript
query({
  prompt: "Refactor to use TypeScript strict mode",
  options: {
    systemPrompt: { append: 'Expert TypeScript developer' },
    allowedTools: ['Read', 'Edit', 'Write', 'Bash'],
    permissionMode: 'acceptEdits',
    hooks: {
      PostToolUse: [{
        matcher: 'Edit:*.ts',
        hooks: [{
          type: 'command',
          command: 'npm run type-check && npm test'
        }]
      }]
    }
  }
});
```

#### Testing Agent
```typescript
query({
  prompt: "Write comprehensive test suite",
  options: {
    systemPrompt: { append: 'Expert test engineer using Vitest' },
    allowedTools: ['Read', 'Write', 'Bash'],
    permissionMode: 'acceptEdits',
    maxTurns: 20,
    hooks: {
      PostToolUse: [{
        matcher: 'Write:*.test.ts',
        hooks: [{
          type: 'command',
          command: 'npm run test -- ${file_path}'
        }]
      }]
    }
  }
});
```

#### Deployment Agent
```typescript
query({
  prompt: "Deploy to production",
  options: {
    systemPrompt: { append: 'DevOps expert with zero-downtime deployment focus' },
    allowedTools: ['Bash', 'Read'],
    permissionMode: 'default', // Manual approval
    maxTurns: 10,
    hooks: {
      PreToolUse: [{
        matcher: 'Bash:*deploy*',
        hooks: [{
          type: 'command',
          command: 'require-approval.sh "${command}"'
        }]
      }],
      SessionEnd: [{
        hooks: [{
          type: 'command',
          command: 'notify-team.sh "Deployment complete"'
        }]
      }]
    }
  }
});
```

### Tool Naming Conventions

| Tool Type | Pattern | Example |
|-----------|---------|---------|
| Built-in | ToolName | `Read`, `Write`, `Bash` |
| MCP Tool | `mcp__{server}__{tool}` | `mcp__database__query` |
| Custom MCP | `mcp__{your-server}__{your-tool}` | `mcp__real-estate__calculate_roi` |

### Hook Event Types

| Event | Trigger | Use Case |
|-------|---------|----------|
| `SessionStart` | Session begins | Initialize logging, setup |
| `UserPromptSubmit` | User submits prompt | Validate input, add context |
| `PreToolUse` | Before tool execution | Validate, log, block |
| `PostToolUse` | After tool completes | Verify, test, format |
| `PreCompact` | Before context compression | Backup context |
| `Stop` | Main agent finishes | Cleanup, notify |
| `SubagentStop` | Subagent finishes | Collect results |
| `SessionEnd` | Session ends | Final logging, metrics |
| `Notification` | During notifications | Custom alerts |

### Permission Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `default` | Standard permissions, asks for approval | Production safety |
| `acceptEdits` | Auto-accept file edits | Trusted refactoring |
| `bypassPermissions` | Skip all permission checks | Fully automated (use with caution) |
| `plan` | Research mode, no execution | Analysis, planning |

### Model Options

| Model ID | Best For | Context Window |
|----------|----------|----------------|
| `claude-sonnet-4-5` | Balanced performance | 200K tokens |
| `claude-opus-4` | Complex reasoning | 200K tokens |
| `claude-haiku-4` | Fast responses | 200K tokens |

---

## 🎯 Production Agent Patterns for SophiaAI

### Pattern 1: Multi-Agent Pipeline
```typescript
// Orchestrate specialized agents
async function buildFeature(featureSpec: string) {
  // Agent 1: Architect
  const architecture = await query({
    prompt: `Design architecture for: ${featureSpec}`,
    options: {
      agents: {
        'architect': {
          description: 'Software architect',
          prompt: 'Design scalable, maintainable architecture',
          tools: ['Read', 'Grep']
        }
      }
    }
  });

  // Agent 2: Implementer
  const implementation = await query({
    prompt: `Implement based on architecture`,
    options: {
      agents: {
        'developer': {
          description: 'Senior developer',
          prompt: 'Implement clean, tested code',
          tools: ['Read', 'Write', 'Edit', 'Bash']
        }
      },
      permissionMode: 'acceptEdits'
    }
  });

  // Agent 3: Reviewer
  const review = await query({
    prompt: `Review implementation`,
    options: {
      agents: {
        'reviewer': {
          description: 'Code reviewer',
          prompt: 'Review for quality, security, performance',
          tools: ['Read', 'Grep', 'Glob']
        }
      }
    }
  });

  return { architecture, implementation, review };
}
```

### Pattern 2: Self-Healing Agent
```typescript
// Agent that detects and fixes issues
for await (const message of query({
  prompt: "Monitor and fix production issues",
  options: {
    systemPrompt: {
      append: 'You are a self-healing production agent. Monitor, detect, and fix issues automatically.'
    },
    allowedTools: ['Read', 'Bash', 'Edit', 'Write'],
    hooks: {
      PostToolUse: [{
        matcher: 'Bash:npm test',
        hooks: [{
          type: 'command',
          command: `
            if [ $? -ne 0 ]; then
              echo "Tests failed, triggering self-heal"
              exit 1
            fi
          `
        }]
      }]
    },
    maxTurns: 50
  }
})) {
  console.log(message);
}
```

### Pattern 3: Documentation Agent
```typescript
// Auto-generate and maintain docs
query({
  prompt: "Generate comprehensive documentation",
  options: {
    systemPrompt: {
      append: `
        Generate documentation that includes:
        - API reference with examples
        - Architecture diagrams (Mermaid)
        - Setup instructions
        - Troubleshooting guide
      `
    },
    allowedTools: ['Read', 'Write', 'Grep', 'Glob'],
    permissionMode: 'acceptEdits',
    hooks: {
      PostToolUse: [{
        matcher: 'Write:*.md',
        hooks: [{
          type: 'command',
          command: 'npx markdownlint ${file_path} --fix'
        }]
      }]
    }
  }
});
```

---

## 📖 Additional Resources

- **Official Docs:** https://docs.claude.com/en/api/agent-sdk
- **TypeScript SDK:** https://github.com/anthropics/claude-agent-sdk-typescript
- **Python SDK:** https://github.com/anthropics/claude-agent-sdk-python
- **MCP Servers:** https://github.com/modelcontextprotocol/servers
- **Report Issues:** GitHub Issues (respective SDK repo)

---

## 🔄 Changelog

### v1.0.0 (October 2025)
- ✅ Comprehensive SDK reference created
- ✅ TypeScript & Python coverage
- ✅ Production best practices
- ✅ SophiaAI agent patterns
- ✅ Complete MCP integration guide
- ✅ Advanced features (subagents, hooks, sessions)

---

**End of Reference Guide**

> This guide is maintained for SophiaAI production development. Update as SDK evolves.