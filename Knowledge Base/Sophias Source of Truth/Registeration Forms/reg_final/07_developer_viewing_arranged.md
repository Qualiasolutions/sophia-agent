# Developer Registration - Viewing Arranged

## TEMPLATE ID
`developer_registration_viewing`

## CATEGORY
Developers Registration → Viewing Arranged

## WHEN TO USE
- New construction/development project
- Developer company (not individual seller)
- Viewing IS scheduled/arranged
- Agent knows developer contact person

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection
Ask for these fields if not already provided:
1. **Developer Contact Name** - Person at developer company agent communicates with
2. **Client Name(s)** - Buyer name(s)
3. **Project Name** (optional) - Development project name if mentioned
4. **Location** (optional) - Area/city if mentioned
5. **Viewing Date & Time** - Complete date and time
6. **Agency Fee** - Percentage + VAT (default: 8% + VAT)
7. **Payment Terms** - When fee is payable (default: "in full on the first 30% payment")

### STEP 2: Field Extraction
Remember:
- Developer fee is usually higher than regular sellers (8% + VAT is common)
- Payment terms: "Payable in full on the first 30% payment" is standard
- Project name and location are optional but helpful

### STEP 3: Generate Document
Once ALL required fields collected, generate IMMEDIATELY.

## EXACT TEMPLATE OUTPUT

**Subject Line (send separately):**
```
Registration – [CLIENT_NAMES] – [PROJECT_NAME] – [LOCATION]
```
*(If project name and location not provided, omit them)*

**Email Body:**
```
Dear [DEVELOPER_CONTACT_NAME],

This email is to provide you with the registration of our below client, under our Estate Agency: CSC Zyprus Property Group LTD.

Registration Details: [CLIENT_NAMES]

Viewing Arranged for: [VIEWING_DATETIME]

Fees: [AGENCY_FEE] on the Agreed/Accepted Sold price
Payable in full on the first [PAYMENT_PERCENTAGE]% payment

Please confirm registration

Acceptance of registration implies the acceptance of the fees, terms and content of this email.
```

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels**
- `Registration Details:` ← Client name(s)
- `Viewing Arranged for:` ← Date and time (uppercase "Arranged")
- `Fees:` ← Agency fee percentage on "Agreed/Accepted Sold price"
- `Payable in full on the first [X]% payment` ← Payment terms

## EXAMPLES

### Example 1: Complete Information
**User:** "Developer registration with viewing, contact Fotis, clients Thomais Leonidou and Doros Antoniou, project Limas Project, viewing Wednesday 21st October 2025 at 16:00pm, fee 8% + VAT, payable on first 30% payment"

**Sophia:** *(Generates immediately)*

**Subject:** Registration – Thomais Leonidou and Doros Antoniou – Limas Project

Dear Fotis,

This email is to provide you with the registration of our below client, under our Estate Agency: CSC Zyprus Property Group LTD.

Registration Details: Thomais Leonidou and Doros Antoniou

Viewing Arranged for: Wednesday 21st October 2025 at 16:00pm

Fees: 8%+VAT on the Agreed/Accepted Sold price
Payable in full on the first 30% payment

Please confirm registration

Acceptance of registration implies the acceptance of the fees, terms and content of this email.

### Example 2: Minimal Information (No Project/Location)
**User:** "Developer with viewing, contact Aris, client Neville Bester, viewing Friday at 3pm, fee 8%"

**Sophia:** "I'll need a complete date for the viewing (e.g., Friday 15th March 2025)"

**User:** "Friday 15th March 2025"

**Sophia:** *(Generates without project name/location in subject)*

**Subject:** Registration – Neville Bester

Dear Aris,

This email is to provide you with the registration of our below client, under our Estate Agency: CSC Zyprus Property Group LTD.

Registration Details: Neville Bester

Viewing Arranged for: Friday 15th March 2025 at 15:00pm

Fees: 8%+VAT on the Agreed/Accepted Sold price
Payable in full on the first 30% payment

Please confirm registration

Acceptance of registration implies the acceptance of the fees, terms and content of this email.

## IMPORTANT NOTES

1. **NO "Please confirm Registration and Viewing."** - Different from seller registrations
2. **Acceptance Clause**: "Acceptance of registration implies the acceptance of the fees, terms and content of this email."
3. **Agency Fee**: Default 8% + VAT (higher than regular sellers), but always ask agent to confirm
4. **Payment Terms**: "Payable in full on the first 30% payment" is standard for developers
5. **Project Name Optional**: Include in subject if mentioned, omit if not
6. **Developer Contact**: Use first name (Fotis, Aris) not "Dear Mr./Mrs."
7. **Looking Forward**: Don't include "Looking forward to your prompt reply." at end
