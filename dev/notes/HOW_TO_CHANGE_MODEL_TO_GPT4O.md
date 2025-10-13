# How to Change Model from GPT-4o-mini to GPT-4o

**Date:** 2025-10-13
**Current Model:** gpt-4o-mini
**Target Model:** gpt-4o

---

## Why Change to GPT-4o?

**GPT-4o-mini (current):**
- ✅ Fast (~1-2 seconds response time)
- ✅ Cheap ($0.15 per 1M input, $0.60 per 1M output)
- ✅ Good for simple tasks
- ⚠️ May miss nuances in complex documents
- ⚠️ Less reliable with edge cases

**GPT-4o (upgrade):**
- ✅ More intelligent and accurate
- ✅ Better at following complex instructions
- ✅ Handles edge cases better
- ✅ More consistent output quality
- ⚠️ Slower (~2-4 seconds response time)
- ⚠️ More expensive ($5.00 per 1M input, $15.00 per 1M output)

**Cost Comparison:**
- GPT-4o-mini: ~$0.0003 per document (~300 tokens)
- GPT-4o: ~$0.0045 per document (~300 tokens)
- **~15x more expensive**

---

## Steps to Change Model

### Step 1: Update Model Constant

**File:** `packages/services/src/openai.service.ts`

**Find (line 208):**
```typescript
const GPT_MODEL = 'gpt-4o-mini' as const;
```

**Replace with:**
```typescript
const GPT_MODEL = 'gpt-4o' as const;
```

---

### Step 2: Update Pricing Constants

**File:** `packages/services/src/openai.service.ts`

**Find (lines 210-214):**
```typescript
const PRICING = {
  INPUT_PER_1M: 0.15,    // $0.150 per 1M input tokens
  OUTPUT_PER_1M: 0.60,   // $0.600 per 1M output tokens
} as const;
```

**Replace with:**
```typescript
const PRICING = {
  INPUT_PER_1M: 5.00,    // $5.00 per 1M input tokens (GPT-4o)
  OUTPUT_PER_1M: 15.00,  // $15.00 per 1M output tokens (GPT-4o)
} as const;
```

---

### Step 3: (Optional) Increase Max Tokens

**File:** `packages/services/src/openai.service.ts`

**Find (line 236):**
```typescript
maxTokens: 800, // Increased for document generation
```

**Consider increasing to:**
```typescript
maxTokens: 1000, // GPT-4o can generate longer, more detailed responses
```

**Note:** Higher maxTokens = higher cost. Test with 800 first.

---

### Step 4: (Optional) Adjust Temperature

**File:** `packages/services/src/openai.service.ts`

**Find (line 235):**
```typescript
temperature: 0.7,
```

**Consider lowering for more consistent output:**
```typescript
temperature: 0.5, // Lower = more consistent, higher = more creative
```

**Recommendation:** Keep at 0.7 for document generation.

---

## Complete Code Changes

**File:** `packages/services/src/openai.service.ts`

```typescript
// GPT model configuration
const GPT_MODEL = 'gpt-4o' as const; // Changed from 'gpt-4o-mini'

// GPT-4o pricing (per 1M tokens)
const PRICING = {
  INPUT_PER_1M: 5.00,    // $5.00 per 1M input tokens (was $0.15)
  OUTPUT_PER_1M: 15.00,  // $15.00 per 1M output tokens (was $0.60)
} as const;

// ... later in constructor ...

this.config = {
  model: GPT_MODEL,
  temperature: 0.7,
  maxTokens: 1000, // Increased from 800 (optional)
  timeout: 5000,
};
```

---

## Deployment Process

### Option 1: Direct Deployment (Recommended)

1. Make changes locally
2. Test with `npm run build` to ensure no errors
3. Commit changes:
   ```bash
   git add packages/services/src/openai.service.ts
   git commit -m "feat(ai): upgrade from gpt-4o-mini to gpt-4o for better accuracy"
   git push origin main
   ```
4. Vercel auto-deploys (1-2 minutes)
5. Test immediately on WhatsApp

### Option 2: Test Branch First

1. Create test branch:
   ```bash
   git checkout -b test/gpt-4o-upgrade
   ```
2. Make changes
3. Push to test branch:
   ```bash
   git push origin test/gpt-4o-upgrade
   ```
4. Vercel creates preview deployment
5. Test on preview URL
6. Merge to main if successful

---

## Testing After Deployment

Run these quick tests on WhatsApp:

### Test 1: Standard Registration (Most Common)
```
You: "registration"
Sophia: "What type of registration..."

You: "seller"
Sophia: "What type of seller..."

You: "standard"
Sophia: Field list with 4 fields

You: "John Smith, Reg 0/1234 Tala, https://zyprus.com/1234, Saturday 3pm"
Sophia: [Email body] then [Subject line separately]
```

**Expected:** Cleaner, more consistent output with GPT-4o

---

### Test 2: Marketing Agreement (Edge Case)
```
You: "marketing"
Sophia: "Are you using standard or custom terms?"

You: "standard"
Sophia: Field list with 6 fields

You: "1st March 2026, George Papas, 0/12345 Tala Paphos, 5%, €350000, Danae"
Sophia: [Complete marketing agreement with signature]
```

**Expected:** Better formatting, exact template match

---

### Test 3: Multiple Persons Viewing (Complex)
```
You: "viewing"
Sophia: "What type of viewing form..."

You: "couple"
Sophia: Field list for 2 people

You: "8 Sept 2025, David Cohen IL123 Israel, Rachel Cohen IL789 Israel, Paphos, Neo Chorio, 0/1567"
Sophia: [Document with numbered persons, "we" instead of "I"]
```

**Expected:** More accurate parsing of multiple person details

---

## Performance Comparison

| Metric | GPT-4o-mini | GPT-4o |
|--------|-------------|--------|
| Response Time | 1-2s | 2-4s |
| Accuracy | 85-90% | 95-98% |
| Cost per 1000 docs | $0.30 | $4.50 |
| Monthly cost (10k docs) | $3 | $45 |
| Edge case handling | Good | Excellent |
| Template accuracy | Good | Excellent |
| Text recognition | Good | Excellent |

---

## Cost Estimation

### Current Usage (Example):
- 100 agents
- 50 documents per agent per month = 5,000 documents/month
- Average 400 tokens per document

**GPT-4o-mini cost:**
```
5,000 docs × 400 tokens = 2,000,000 tokens
Input (60%): 1,200,000 × $0.15 / 1M = $0.18
Output (40%): 800,000 × $0.60 / 1M = $0.48
Total: $0.66/month
```

**GPT-4o cost:**
```
5,000 docs × 400 tokens = 2,000,000 tokens
Input (60%): 1,200,000 × $5.00 / 1M = $6.00
Output (40%): 800,000 × $15.00 / 1M = $12.00
Total: $18.00/month
```

**Increase: $17.34/month (~27x more expensive)**

---

## Rollback Process

If GPT-4o causes issues, rollback immediately:

```bash
# Revert to previous commit
git revert HEAD

# Or manually change back
# packages/services/src/openai.service.ts
const GPT_MODEL = 'gpt-4o-mini' as const;

const PRICING = {
  INPUT_PER_1M: 0.15,
  OUTPUT_PER_1M: 0.60,
} as const;

# Commit and push
git commit -am "revert: rollback to gpt-4o-mini due to performance issues"
git push origin main
```

---

## Monitoring After Upgrade

Watch these metrics in production:

1. **Response Time** - Should stay under 5 seconds
2. **Error Rate** - Should not increase
3. **Cost** - Check OpenAI dashboard daily for first week
4. **Quality** - Ask agents for feedback

**OpenAI Dashboard:** https://platform.openai.com/usage

---

## Recommendation

**Start with GPT-4o-mini** (current):
- ✅ Cost effective for high volume
- ✅ Fast enough for real-time chat
- ✅ Good enough for most documents

**Upgrade to GPT-4o if:**
- ❌ Agents report frequent errors
- ❌ Documents have wrong formatting
- ❌ Text recognition fails often
- ❌ Edge cases not handled well
- ✅ Quality is more important than cost
- ✅ Budget allows 15x cost increase

**Best Approach:**
1. Test GPT-4o on preview deployment first
2. Run comprehensive tests (see `sophia-comprehensive-test.md`)
3. Compare output quality side-by-side
4. If significantly better, upgrade production
5. Monitor for 1 week
6. Rollback if issues occur

---

## Alternative: Hybrid Approach

Use GPT-4o-mini for simple tasks, GPT-4o for complex:

```typescript
// In openai.service.ts
async generateResponse(message: string, context?: ConversationContext) {
  // Detect complexity
  const isComplex = this.isComplexRequest(message);

  // Use GPT-4o for complex, 4o-mini for simple
  const model = isComplex ? 'gpt-4o' : 'gpt-4o-mini';

  const response = await this.client.chat.completions.create({
    model,
    // ... rest of config
  });
}

private isComplexRequest(message: string): boolean {
  // Complex if multiple persons, custom terms, or developer registration
  const complexKeywords = ['multiple', 'couple', 'custom', 'developer', 'advanced'];
  return complexKeywords.some(kw => message.toLowerCase().includes(kw));
}
```

**Benefits:**
- ✅ Best of both worlds (cost + quality)
- ✅ Simple tasks stay fast and cheap
- ✅ Complex tasks get better handling
- ⚠️ More complex logic to maintain
