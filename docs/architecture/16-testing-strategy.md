# 16. Testing Strategy

## 16.1 Testing Pyramid

```
             /\
            /  \
           / E2E \         10% - End-to-End (Playwright)
          /------\
         /        \
        / Integration\     30% - Integration (API routes, tRPC)
       /------------\
      /              \
     /   Unit Tests   \   60% - Unit (Vitest)
    /------------------\
```

## 16.2 Test Coverage Requirements

| Layer | Target Coverage |
|-------|-----------------|
| **Services** | >80% |
| **API Routes** | >70% |
| **tRPC Routers** | >80% |
| **React Components** | >60% |
| **Overall** | >75% |

## 16.3 Test Examples

**Unit Test** (Vitest):

```typescript
// packages/services/src/__tests__/conversation.service.test.ts

describe('ConversationService', () => {
  it('should classify intent and generate response', async () => {
    const result = await conversationService.processMessage(
      'agent-123',
      'I need a rental agreement'
    );

    expect(result.intent).toBe('GENERATE_DOCUMENT');
    expect(result.response).toContain('property address');
  });
});
```

**E2E Test** (Playwright):

```typescript
// apps/web/e2e/agent-management.spec.ts

test('should create new agent', async ({ page }) => {
  await page.goto('/agents');
  await page.click('button:has-text("Add Agent")');

  await page.fill('input[name="name"]', 'Test Agent');
  await page.fill('input[name="phoneNumber"]', '+35799888888');
  await page.fill('input[name="email"]', 'test@example.com');

  await page.click('button:has-text("Create")');

  await expect(page.locator('.toast-success')).toContainText('Agent created successfully');
});
```

---
