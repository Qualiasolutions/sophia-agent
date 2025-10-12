# Bank Land Registration

## TEMPLATE ID
`bank_registration_land`

## CATEGORY
Banks Registration → Land

## WHEN TO USE
- LAND (not property/house/apartment) owned by bank
- Banks: REMU, Gordian, Altia, Altamira, etc.
- Requires viewing form attachment
- Bank link provided

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection
Same as Bank Property Registration PLUS:
1. **Bank Name** - Auto-detect from property link OR ask agent
2. **Agent Mobile** - The agent's phone number (will be masked)
3. **Client Name** - Buyer's full name
4. **Client Phone** - Buyer's phone number (will be masked)
5. **Property Link** - URL from bank website (remuproperties.com, etc.)

### STEP 2: Auto-Detection Rules
- **Bank Name from URL** - Same as template 05
- **Phone Masking** - Same as template 05

### STEP 3: Generate Document + Reminder
Generate document AND remind agent to attach viewing form.

## EXACT TEMPLATE OUTPUT

**Email Body:**
```
Dear [BANK_NAME] Team,

This email is to provide you with a registration.

Please find attached the viewing form for the below Land.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

Registration Details: [CLIENT_NAME] [CLIENT_PHONE_MASKED]

Property: [PROPERTY_LINK]

Looking forward to your prompt reply.
```

**IMPORTANT REMINDER TO AGENT (send after email):**
```
⚠️ REMINDER: Please attach the viewing form to this email before sending. Banks require viewing forms for land registrations.
```

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels**
- `Dear [BANK_NAME] Team,` ← Auto-detect from URL
- `Please find attached the viewing form for the below Land.` ← ALWAYS include this line
- `Registration Details:` ← Client name + client phone (masked)
- `Property:` ← Bank land URL

**NO "My Mobile:" line** - Land registrations don't include agent mobile

## PHONE MASKING RULES
Same as template 05:
- `99 07 67 32` → `99 ** 67 32`
- `+44 79 83 24 71` → `+44 79 ** 83 24 71`

## EXAMPLES

### Example 1: Complete Information
**User:** "Bank land registration, client Natasha Stainthorpe +44 79 83 24 71, property https://www.remuproperties.com/Cyprus/listing-29190"

**Sophia:** *(Generates email + viewing form reminder)*

Dear Remu Team,

This email is to provide you with a registration.

Please find attached the viewing form for the below Land.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

Registration Details: Natasha Stainthorpe +44 79** 832471

Property: https://www.remuproperties.com/Cyprus/listing-29190

Looking forward to your prompt reply.

---

⚠️ REMINDER: Please attach the viewing form to this email before sending. Banks require viewing forms for land registrations.

## IMPORTANT NOTES

1. **NO Subject Line**: Bank registrations don't have subject lines
2. **NO Agent Mobile**: Land registrations don't include "My Mobile:" line
3. **Viewing Form MANDATORY**: Always remind agent to attach viewing form
4. **WHY Viewing Form?**: Banks don't attend viewings, so they need viewing form as proof that registration was made
5. **Phone Masking**: Same rules as property registration
6. **Attachment Line**: "Please find attached the viewing form for the below Land." is REQUIRED
