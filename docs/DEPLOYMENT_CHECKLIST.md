# Document Generation Enhancement - Deployment Checklist

## ⚠️ CRITICAL STEP - Update OpenAI Assistant

**THIS MUST BE DONE FOR THE ENHANCEMENT TO WORK**

1. Go to https://platform.openai.com/assistants
2. Find your assistant: `asst_H5PrzEjjbSF5p4OWKJounBzi`
3. Click "Edit"
4. Go to "Instructions" section
5. **Replace ALL existing instructions** with contents from:
   ```
   docs/openai-assistant-instructions.md
   ```
6. Click "Save"

**Why critical?** The Assistant is what generates documents. Without these instructions, it won't know to:
- Ask for complete information
- Clarify document types
- Apply phone masking
- Follow template-specific rules

---

## ✅ Verification Steps

### 1. Database Migration (Already Applied ✅)

```bash
# Verify document_request_sessions table exists
# Already applied via Supabase MCP during implementation
```

**Status**: ✅ Complete

### 2. Run Tests

```bash
npm run test
```

**Expected**: `Test Files  2 passed (2) Tests  101 passed (101)`

**Status**: ✅ All 101 tests passing

### 3. Build & Deploy

```bash
# Build web app
cd apps/web
npm run build

# Should complete without errors
```

**Expected**: Build succeeds with no TypeScript errors

```bash
# Deploy to Vercel
vercel deploy --prod
```

**Expected**: Deployment succeeds

---

## 🧪 Testing Document Generation

### Test 1: Ambiguous Request

**Send**: "Sophia I need a registration"

**Expected Response**:
```
Which registration form do you need?
1) Banks/REMU (for bank-owned properties)
2) Developers (for developer projects)
3) Property Owners (for private sellers)
4) Rental (for rental properties)

Please let me know!
```

**✅ Pass Criteria**: Sophia asks for clarification, provides options

---

### Test 2: Complete Bank Registration

**Send**:
```
Sophia reg_banks for John Doe, phone +357 99 07 67 32,
property https://www.remuproperties.com/listing-123,
my phone 99 12 34 56
```

**Expected Response**:
```
Got it! I have:
- Client: John Doe
- Client phone: +357 99 ** 67 32
- Property: https://www.remuproperties.com/listing-123
- Bank: Remu Team
- Your phone: 99 ** 34 56

Should I generate the registration now?
```

**Then send**: "Yes"

**Expected**: Complete registration document with:
- ✅ Phone numbers masked: 99 ** 67 32
- ✅ Bank name detected: "Remu Team"
- ✅ All fields filled correctly

**✅ Pass Criteria**:
- Phones masked
- Bank detected
- Complete document generated

---

### Test 3: Incomplete Request

**Send**: "Create a viewing form for Andreas"

**Expected Response**:
```
I need more details for the viewing form. First, which viewing form?
1) Advanced (includes legal terms)
2) Standard (simple confirmation)

Also, please provide:
- Client full name
- Client ID/Passport number
- Property Reg Number
- District, Municipality, Locality
- Viewing date
```

**✅ Pass Criteria**: Sophia asks which form AND lists required fields

---

### Test 4: Partial Information

**Send**: "Sophia I want reg_owners for Maria"

**Expected Response**:
```
For an Owner/Seller registration, I need:
1) Seller name [provided: Maria]
2) Buyer name(s)
3) Property description
4) Property location
5) Viewing date & time

Please provide the missing details.
```

**✅ Pass Criteria**: Sophia acknowledges what's provided, asks for missing fields

---

## 📊 Success Criteria Summary

- [ ] OpenAI Assistant instructions updated on platform.openai.com
- [ ] All 101 tests passing
- [ ] Build completes without errors
- [ ] Deployed to Vercel successfully
- [ ] Test 1: Sophia clarifies ambiguous requests ✅
- [ ] Test 2: Phone masking works (99 ** 67 32) ✅
- [ ] Test 3: Bank detection works (Remu Team, etc.) ✅
- [ ] Test 4: Sophia lists missing fields ✅
- [ ] Test 5: Sophia confirms before generating ✅

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `docs/openai-assistant-instructions.md` | **Copy to Assistant dashboard** |
| `docs/DOCUMENT_GENERATION_ENHANCEMENT_SUMMARY.md` | Complete technical documentation |
| `packages/shared/src/types/document-templates.ts` | 35+ template catalog |
| `packages/services/src/document-validator.service.ts` | Phone masking, validation |
| `packages/services/src/document-collection.service.ts` | Multi-turn conversation tracking |
| `packages/database/supabase/migrations/010_document_request_sessions.sql` | Database schema |

---

## 🚨 Troubleshooting

### Issue: Sophia still assumes information

**Cause**: OpenAI Assistant instructions not updated

**Fix**:
1. Go to platform.openai.com/assistants
2. Update instructions from `docs/openai-assistant-instructions.md`
3. Save and test again

---

### Issue: Phone numbers not masked

**Cause**: Assistant not applying phone masking rule

**Fix**:
1. Verify Assistant instructions include phone masking section
2. Check examples in `docs/openai-assistant-instructions.md` section "Phone Number Masking"
3. Update Assistant and test

---

### Issue: Bank name not detected

**Cause**: URL doesn't match known bank patterns

**Supported banks**:
- remuproperties.com → "Remu Team"
- gordian.com → "Gordian Team"
- altia.com → "Altia Team"
- altamira.com → "Altamira Team"

**Fix for unknown banks**:
- Agent can provide bank name manually
- Or add new bank mapping to `document-validator.service.ts`

---

### Issue: Tests failing

**Run**:
```bash
npm run test -- document-validator.service.test.ts
```

**Check**:
- All 31 document validator tests should pass
- If failing, check import paths in:
  - `packages/services/src/document-validator.service.ts`
  - `packages/services/src/document-collection.service.ts`
- Should import from `@sophiaai/shared` not `@sophiaai/shared/types/document-templates`

---

## 🎯 Next Steps (Optional Enhancements)

1. **Resume Capability**: Implement "continue my document" feature
   - Use `document_request_sessions` table
   - Allow agents to resume partial requests

2. **Analytics Dashboard**: Track most-used document types
   - Query `document_request_sessions` grouped by template_id

3. **Template Editor**: Admin interface to modify template requirements
   - Update `document-templates.ts` via UI

4. **Additional Banks**: Add more bank detection patterns
   - Extend `extractBankNameFromURL()` in validator service

---

## ✨ Summary

**What Changed**:
- Sophia now asks for ALL required fields before generating
- Automatic phone masking (99 ** 67 32)
- Automatic bank detection
- 35+ templates fully documented
- 101 tests ensuring reliability

**Most Important Action**:
📌 **Update OpenAI Assistant instructions** at platform.openai.com

**Status**: Production ready after Assistant update 🚀
