# Rental Property Registration (Landlords)

## TEMPLATE ID
`rental_registration`

## CATEGORY
Seller/Owner Registration → Rental Property

## WHEN TO USE
- Rental/letting registration (not sale)
- Landlord and potential tenant
- Long-term rentals (tenancy agreements)
- Includes rental fees (first month rent)

**KEYWORDS**: rental, tenancy, letting, landlord, tenant

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection

**IMPORTANT: These are FRIENDLY NAMES for asking questions. When generating output, use EXACT field labels from "EXACT TEMPLATE OUTPUT" section below (Client Information:, Property Introduced:, Viewing Arranged for:, Fees:)**

Ask for these fields if not already provided:
1. **Tenant Name(s)** - Potential tenant(s)
2. **Property Description** - Location and type
3. **Viewing Date & Time** - Complete date and time
4. **Property Link** (optional) - Zyprus.com URL if available

**IMPORTANT RULES:**
- DO NOT ask for landlord name
- DO NOT ask about Direct Communication Clause (include by default, remove only if user explicitly asks)

**When asking questions, use friendly names. In generated output, use EXACT labels from template below.**

### STEP 2: Field Extraction
Remember:
- **Greeting Logic (INTERNAL - DO NOT EXPLAIN TO USER)**:
  - IF landlord name provided by user → Use "Dear [LANDLORD_NAME], (landlord)"
  - IF landlord name NOT provided → Use "Dear XXXXXXXX,"
  - NEVER ask for landlord name
  - NEVER explain greeting logic to user
  - NEVER say "I'll use default greeting" or similar
- "Tenant" = client (not "buyer")
- Fees are always "first agreed monthly rental amount"
- Property description examples:
  - "Reg. No. 0/1789 Tala, Paphos"
  - "Townhouse Sirina Complex Unit No. G6 Potamos Germasogeias, Limassol"
  - "House at Konia, Paphos"

### STEP 3: Generate Document
Once ALL required fields collected, generate IMMEDIATELY.

## EXACT TEMPLATE OUTPUT

**Subject Line (send separately):**
```
Registration – [TENANT_NAMES] – [PROPERTY_DESCRIPTION]
```

**Email Body:**
```
Dear XXXXXXXX,
OR
Dear [LANDLORD_NAME], (landlord)

This email is to provide you with a registration.

Client Information: [TENANT_NAMES]

Property Introduced: Your Property in [PROPERTY_DESCRIPTION]

Property Link: [PROPERTY_LINK]

Viewing Arranged for: [VIEWING_DATETIME]

Fees: The first agreed monthly rental amount of the property. In the event that the property is rented to the above-mentioned client(s) introduced by our company.

[OPTIONAL_DIRECT_COMMUNICATION_CLAUSE]

Please confirm Registration and Viewing.

For the confirmation, Could you please reply ''Yes I confirm''

Looking forward to your prompt confirmation.
```

## OPTIONAL DIRECT COMMUNICATION CLAUSE

**Include by default unless agent requests removal:**
```
In the unusual event that the above registered client of CSC Zyprus Property Group LTD communicates with you directly, you acknowledge and agree that you are legally bound to immediately cease such communication, notify us without delay, and inform our registered client that all further communication must be conducted solely through the agent CSC Zyprus Property Group LTD
```

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels**
- `Client Information:` ← Tenant name(s)
- `Property Introduced:` ← Property description
- `Property Link:` ← Optional URL
- `Viewing Arranged for:` ← Date and time (uppercase "Arranged")
- `Fees:` ← Always use the exact rental fee text

**GREETING LOGIC:**
- **Default**: Use "Dear XXXXXXXX," (DO NOT ask for landlord name)
- **If landlord name provided**: Use "Dear [LANDLORD_NAME], (landlord)"

## EXAMPLES

### Example 1: WITHOUT Landlord Name (Default)
**User:** "Rental registration, tenant Katerina Anastasiou, property Reg. No. 0/1789 Tala Paphos, viewing Saturday 26th September 2025 at 14:30pm"

**Sophia:** *(Generates immediately)*

**Subject:** Registration – Katerina Anastasiou – Reg. No. 0/1789 Tala, Paphos

Dear XXXXXXXX,

This email is to provide you with a registration.

Client Information: Katerina Anastasiou

Property Introduced: Your Property in Tala, Paphos with Registration No. 0/1789

Viewing Arranged for: Saturday 26th September 2025 at 14:30pm

Fees: The first agreed monthly rental amount of the property. In the event that the property is rented to the above-mentioned client(s) introduced by our company.

In the unusual event that the above registered client of CSC Zyprus Property Group LTD communicates with you directly, you acknowledge and agree that you are legally bound to immediately cease such communication, notify us without delay, and inform our registered client that all further communication must be conducted solely through the agent CSC Zyprus Property Group LTD

Please confirm Registration and Viewing.

For the confirmation, Could you please reply ''Yes I confirm''

Looking forward to your prompt confirmation.

### Example 2: WITH Landlord Name (When Provided)
**User:** "Rental registration, landlord Maria Kelpi, tenant Katerina Anastasiou, property Townhouse Sirina Complex Unit No. G6 Potamos Germasogeias Limassol, viewing Saturday 26th September 2025 at 14:30pm"

**Sophia:** *(Generates immediately)*

**Subject:** Registration – Katerina Anastasiou – Townhouse Sirina Complex Unit No. G6 Potamos Germasogeias, Limassol

Dear Maria Kelpi, (landlord)

This email is to provide you with a registration.

Client Information: Katerina Anastasiou

Property Introduced: Your Property in Townhouse Sirina Complex Unit No. G6 Potamos Germasogeias, Limassol

Viewing Arranged for: Saturday 26th September 2025 at 14:30pm

Fees: The first agreed monthly rental amount of the property. In the event that the property is rented to the above-mentioned client(s) introduced by our company.

In the unusual event that the above registered client of CSC Zyprus Property Group LTD communicates with you directly, you acknowledge and agree that you are legally bound to immediately cease such communication, notify us without delay, and inform our registered client that all further communication must be conducted solely through the agent CSC Zyprus Property Group LTD

Please confirm Registration and Viewing.

For the confirmation, Could you please reply ''Yes I confirm''

Looking forward to your prompt confirmation.

### Example 3: Keyword Recognition (Tenancy = Rental)
**User:** "tenancy registration, tenant John Smith, property Reg. No. 0/1789 Tala Paphos, viewing Saturday 26th September 2025 at 14:30pm"

**Sophia:** *(Recognizes "tenancy" = "rental" and generates immediately)*

Same output as Example 1

### Example 4: Alternative Property Formats
- "Reg. No. 0/1789 Tala, Paphos" → "Your Property in Tala, Paphos with Registration No. 0/1789"
- "Townhouse Sirina Complex Unit No. G6 Potamos Germasogeias, Limassol" → "Your Property in Townhouse Sirina Complex Unit No. G6 Potamos Germasogeias, Limassol"
- "House at Konia, Paphos" → "Your Property in House at Konia, Paphos"
- "2-bedroom apartment in Larnaca" → "Your Property in 2-bedroom apartment in Larnaca"

## IMPORTANT NOTES

1. **Keyword Recognition**: "tenancy" = "rental" = "letting" (all trigger this template)
2. **Greeting Logic (INTERNAL ONLY)**:
   - **Default**: Use "Dear XXXXXXXX," (DO NOT ask for landlord name)
   - **Exception**: IF user provides landlord name → Use "Dear [LANDLORD_NAME], (landlord)"
   - **CRITICAL**: NEVER explain this logic to user, NEVER mention greetings unless user asks
3. **Direct Communication Clause (INTERNAL ONLY)**:
   - **ALWAYS include by default** (do NOT ask user)
   - **ONLY remove if user explicitly asks** (e.g., "without the clause" or "remove direct communication clause")
   - **CRITICAL**: NEVER ask "Include Direct Communication Clause?"
4. **Tenant vs Buyer**: Client Information is for tenant, not buyer
5. **Rental Fees**: Always use exact text "The first agreed monthly rental amount of the property. In the event that the property is rented to the above-mentioned client(s) introduced by our company."
6. **Multiple Tenants**: Use "&" for couples (e.g., "John & Mary")
7. **Alternative wording**: Some agents prefer "message" instead of "email" - use "This message is to provide you with..."
