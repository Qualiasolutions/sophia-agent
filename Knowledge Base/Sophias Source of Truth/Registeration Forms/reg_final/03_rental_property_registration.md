# Rental Property Registration (Landlords)

## TEMPLATE ID
`rental_registration`

## CATEGORY
Seller/Owner Registration → Rental Property

## WHEN TO USE
- Rental/letting registration (not sale)
- Landlord and potential tenant
- Long-term rentals
- Includes rental fees (first month rent)

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection

**IMPORTANT: These are FRIENDLY NAMES for asking questions. When generating output, use EXACT field labels from "EXACT TEMPLATE OUTPUT" section below (Client Information:, Property Introduced:, Viewing Arranged for:, Fees:)**

Ask for these fields if not already provided:
1. **Landlord Name** - Property owner's name
2. **Tenant Name(s)** - Potential tenant(s)
3. **Property Description** - Location and type
4. **Viewing Date & Time** - Complete date and time
5. **Property Link** (optional) - Zyprus.com URL if available
6. **Include Direct Communication Clause?** - Ask agent (default: YES)

**When asking questions, use friendly names. In generated output, use EXACT labels from template below.**

### STEP 2: Field Extraction
Remember:
- "Landlord" = property owner (not "seller")
- "Tenant" = client (not "buyer")
- Fees are always "first agreed monthly rental amount"
- Property description examples: "Limas Building, Flat No. 103 Tala, Paphos"

### STEP 3: Generate Document
Once ALL required fields collected, generate IMMEDIATELY.

## EXACT TEMPLATE OUTPUT

**Subject Line (send separately):**
```
Registration – [TENANT_NAMES] – [PROPERTY_DESCRIPTION]
```

**Email Body:**
```
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

## EXAMPLES

### Example 1: Complete Information
**User:** "Rental registration, landlord Maria Kelpi, tenant Katerina Anastasiou, property Limas Building Flat No. 103 Tala Paphos, viewing Saturday 26th September 2025 at 14:30pm"

**Sophia:** *(Generates immediately)*

**Subject:** Registration – Katerina Anastasiou – Limas Building, Flat No. 103 Tala, Paphos

Dear Maria Kelpi, (landlord)

This email is to provide you with a registration.

Client Information: Katerina Anastasiou

Property Introduced: Your Property in Limas Building, Flat No. 103 Tala, Paphos

Viewing Arranged for: Saturday 26th September 2025 at 14:30pm

Fees: The first agreed monthly rental amount of the property. In the event that the property is rented to the above-mentioned client(s) introduced by our company.

In the unusual event that the above registered client of CSC Zyprus Property Group LTD communicates with you directly, you acknowledge and agree that you are legally bound to immediately cease such communication, notify us without delay, and inform our registered client that all further communication must be conducted solely through the agent CSC Zyprus Property Group LTD

Please confirm Registration and Viewing.

For the confirmation, Could you please reply ''Yes I confirm''

Looking forward to your prompt confirmation.

### Example 2: Alternative Property Formats
- "House at Konia, Paphos"
- "Townhouse Sirina Complex Unit No. G6 Potamos Germasogeias, Limassol"
- "2-bedroom apartment in Larnaca"

## IMPORTANT NOTES

1. **Landlord vs Seller**: Always use "(landlord)" not "(seller)" in greeting
2. **Tenant vs Buyer**: Client Information is for tenant, not buyer
3. **Rental Fees**: Always use exact text "The first agreed monthly rental amount of the property. In the event that the property is rented to the above-mentioned client(s) introduced by our company."
4. **Direct Communication Clause**: Include by default, remove only if agent asks
5. **Multiple Tenants**: Use "&" for couples (e.g., "John & Mary")
6. **Alternative wording**: Some agents prefer "message" instead of "email" - use "This message is to provide you with..."
