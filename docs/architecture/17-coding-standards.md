# 17. Coding Standards

## 17.1 TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## 17.2 Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| **Files** | kebab-case | `conversation.service.ts` |
| **Interfaces/Types** | PascalCase | `Agent`, `ConversationState` |
| **Functions** | camelCase | `processMessage()` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| **React Components** | PascalCase | `AgentCard` |
| **Database Tables** | snake_case | `agents`, `conversation_messages` |

## 17.3 Git Commit Convention

**Format**: Conventional Commits

```bash
feat(agents): add phone number validation
fix(webhooks): prevent race condition in message processing
docs(architecture): update database schema
test(api): add integration tests for WhatsApp webhook
```

## 17.4 Pre-commit Hooks

```bash
# .husky/pre-commit

npx lint-staged   # ESLint + Prettier
npm run type-check
npm run test -- --run --passWithNoTests
```

---
