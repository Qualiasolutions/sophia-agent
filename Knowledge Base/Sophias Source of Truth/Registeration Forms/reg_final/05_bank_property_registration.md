# Bank Property Registration

## TEMPLATE ID
`bank_registration_property`

## CATEGORY
Banks Registration → Property

## WHEN TO USE
- Property (house/apartment) owned by bank
- Banks: REMU, Gordian, Altia, Altamira, etc.
- NOT for land (land requires viewing form - use template 06)
- Bank link provided (remuproperties.com, etc.)

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection

**IMPORTANT: These are FRIENDLY NAMES for asking questions. When generating output, use EXACT field labels from "EXACT TEMPLATE OUTPUT" section below (My Mobile:, Registration Details:, Property:)**

Ask for these fields if not already provided:
1. **Bank Name** - Auto-detect from property link OR ask agent
2. **Agent Mobile** - The agent's phone number (will be masked)
3. **Client Name** - Buyer's full name
4. **Client Phone** - Buyer's phone number (will be masked)
5. **Property Link** - URL from bank website (remuproperties.com, etc.)

**When asking questions, use friendly names. In generated output, use EXACT labels from template below.**

### STEP 2: Auto-Detection Rules
- **Bank Name from URL**:
  - `remuproperties.com` → "Dear Remu Team,"
  - `gordian` → "Dear Gordian Team,"
  - `altia` → "Dear Altia Team,"
  - `altamira` → "Dear Altamira Team,"
  - If URL doesn't show bank → ask agent

- **Phone Masking**:
  - +357 99 07 67 32 → 99 ** 67 32 (hide middle 2 digits)
  - +44 79 83 24 71 → +44 79 ** 83 24 71

### STEP 3: Fallback Property Identification
If property link NOT available (rare), ask for:
- Reg No. (e.g., "Reg No. 0/1678 Tala, Paphos")
- OR Property description (e.g., "Limas Building, Unit No. 103 Tala, Paphos")

### STEP 4: Generate Document
Once ALL required fields collected, generate IMMEDIATELY.

## EXACT TEMPLATE OUTPUT

**Email Body:**
```
Dear [BANK_NAME] Team,

This email is to provide you with a registration.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

My Mobile: [AGENT_MOBILE_MASKED]

Registration Details: [CLIENT_NAME] [CLIENT_PHONE_MASKED]

Property: [PROPERTY_LINK]

Looking forward to your prompt reply.
```

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels**
- `Dear [BANK_NAME] Team,` ← Auto-detect from URL or ask
- `My Mobile:` ← Agent phone (masked)
- `Registration Details:` ← Client name + client phone (masked)
- `Property:` ← Bank property URL

**NO Subject Line**: Banks registrations don't use subject lines

## PHONE MASKING RULES

**Format: Hide middle 2 digits with **:**
- `99 07 67 32` → `99 ** 67 32`
- `+357 99 07 67 32` → `99 ** 67 32` (remove country code)
- `+44 79 83 24 71` → `+44 79 ** 83 24 71` (keep country code for international)

## EXAMPLES

### Example 1: Complete Information with Auto-Detection
**User:** "Bank property registration, my mobile 99 07 67 32, client Natasha Stainthorpe +44 79 83 24 71, property https://www.remuproperties.com/Cyprus/listing-29190"

**Sophia:** *(Generates immediately, auto-detects "Remu Team")*

Dear Remu Team,

This email is to provide you with a registration.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

My Mobile: 99 ** 67 32

Registration Details: Natasha Stainthorpe +44 79 ** 83 24 71

Property: https://www.remuproperties.com/Cyprus/listing-29190

Looking forward to your prompt reply.

### Example 2: No Property Link (Fallback)
**User:** "Bank registration, Gordian bank, my mobile 99 12 34 56, client John Smith +357 96 11 22 33, property Reg No. 0/1678 Tala Paphos"

**Sophia:** *(Generates with Reg No. instead of link)*

Dear Gordian Team,

This email is to provide you with a registration.

Please register the following client under CSC Zyprus Property Group LTD and send me a confirmation.

My Mobile: 99 ** 34 56

Registration Details: John Smith +357 96 ** 22 33

Property: Reg No. 0/1678 Tala, Paphos

Looking forward to your prompt reply.

## IMPORTANT NOTES

1. **NO Subject Line**: Bank registrations don't have subject lines
2. **Bank Auto-Detection**: Extract bank name from property URL when possible
3. **Phone Masking is MANDATORY**: Always mask middle 2 digits
4. **Property Link Priority**:
   - First: Use property URL from bank
   - Second: Use Reg No. if no URL
   - Third: Use property description if neither available
5. **Simple Format**: Banks prefer short, direct registrations
6. **Confirmation Request**: Always end with "Looking forward to your prompt reply."
7. **CSC Zyprus Property Group LTD**: Always use full company name
