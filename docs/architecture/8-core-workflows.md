# 8. Core Workflows

## 8.1 Message Processing Workflow

```
Agent sends WhatsApp message
         │
         ▼
WhatsApp webhook → /api/webhooks/whatsapp
         │
         │ 1. Verify signature
         │ 2. Rate limit check
         │ 3. Return 200 immediately
         │
         ▼
Async processing (fire and forget)
         │
         ▼
Acquire distributed lock (Redis NX)
         │
         ├─ Lock acquired? NO ─→ Queue message
         │
         ▼ YES
Retrieve conversation state (Redis)
         │
         ▼
Classify intent with OpenAI
         │
         ▼
Update conversation state (Redis)
         │
         ├─ Intent: GENERATE_DOCUMENT ─→ Document workflow
         ├─ Intent: UPLOAD_LISTING ─→ Listing workflow
         ├─ Intent: CALCULATE ─→ Calculator workflow
         └─ Intent: UNKNOWN ─→ Generic response
         │
         ▼
Generate response (OpenAI)
         │
         ▼
Send WhatsApp message
         │
         ▼
Release lock (Redis DEL)
         │
         ▼
Process queued messages (Redis LPOP)
```

## 8.2 Document Generation Workflow

```
Intent: GENERATE_DOCUMENT detected
         │
         ▼
Ask: "Which document type?" (list templates)
         │
         ▼
Agent selects template
         │
         ▼
Retrieve template required fields
         │
         ▼
For each required field:
    Ask agent for field value
    Extract from response
    Store in conversation state
         │
         ▼
All fields collected?
         │
         ▼ YES
Generate document (PDF)
         │
         ├─ Render template with data
         ├─ Convert to PDF
         └─ Upload to Supabase Storage
         │
         ▼
Send download link via WhatsApp
         │
         ▼
Store generation record (DB)
```

## 8.3 Listing Upload Workflow

```
Intent: UPLOAD_LISTING detected
         │
         ▼
Create listing draft (DB)
         │
         ▼
Ask: "What type of property?"
         │
         ▼
Ask: "Where is it located?"
         │
         ▼
Ask: "How many bedrooms?"
         │
         ▼
Ask: "How many bathrooms?"
         │
         ▼
Ask: "What's the area (sqm)?"
         │
         ▼
Ask: "What's the price?"
         │
         ▼
Ask: "Send photos" (1-10)
         │
         ├─ Download from WhatsApp
         └─ Upload to Supabase Storage
         │
         ▼
Ask: "Brief description?"
         │
         ▼
Confirm: "Ready to upload?" (show summary)
         │
         ▼ YES
Upload to zyprus.com API
         │
         ├─ Success ─→ Confirm upload
         └─ Failure ─→ Store attempt, retry later
```

## 8.4 Calculator Workflow

```
Intent: CALCULATE detected
         │
         ▼
Ask: "Which calculator?" (list available)
         │
         ▼
Agent selects calculator
         │
         ▼
Retrieve calculator input fields
         │
         ▼
For each input field:
    Ask agent for value
    Validate and store
         │
         ▼
All inputs collected?
         │
         ▼ YES
Execute formula (safe eval)
         │
         ▼
Format result (currency, percentage)
         │
         ▼
Send result via WhatsApp
         │
         ▼
Store calculation in history (DB)
```

## 8.5 Error Handling Workflow

```
Error occurs during processing
         │
         ├─ OpenAI API timeout
         │      ├─ Retry with backoff (3x)
         │      └─ Use fallback classification
         │
         ├─ Database connection lost
         │      ├─ Retry with backoff (3x)
         │      └─ Log error, alert admin
         │
         ├─ WhatsApp API failure
         │      ├─ Queue message for retry
         │      └─ Send generic error to agent
         │
         └─ Unexpected error
                ├─ Log to Sentry with context
                ├─ Send generic error to agent
                └─ Store for manual review
```

---
