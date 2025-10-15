# Standard Seller Registration

## TEMPLATE ID
`seller_registration_standard`

## CATEGORY
Seller/Owner Registration → Standard

## WHEN TO USE
- Regular property sale registration
- Property owner (not bank, not developer)
- Standard viewing arrangement
- No special marketing agreement needed

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection

**IMPORTANT: These are FRIENDLY NAMES for asking questions. When generating output, use EXACT field labels from "EXACT TEMPLATE OUTPUT" section below (Client Information:, Property Introduced:, Viewing Arranged for:)**

Ask for these fields if not already provided:
1. **Seller Name** - Property owner's name (Dear ___,)
2. **Buyer Name(s)** - Potential buyer(s), can be multiple (husband & wife)
3. **Property Description** - With Reg No. if available
4. **Viewing Date & Time** - Complete date and time
5. **Property Link** (optional) - Zyprus.com URL if available

**When asking questions, use friendly names:**
- "What's the seller name?" or "Seller Name?"
- "What's the buyer name?" or "Who is the client?"
- "What property is this for?" or "Property Description?"
- "When is the viewing?" or "Viewing Date & Time?"

**In generated output, use EXACT labels from template below (Client Information:, Property Introduced:, etc.)**

### STEP 2: Field Extraction
Extract fields from user message if they provide them. Remember:
- "Seller" = Seller Name
- "Buyer" or "Client" = Buyer Name(s)
- "Reg No." or "Registration Number" = Property Description
- "Saturday 3pm" = convert to "Saturday [date] at 15:00pm"

### STEP 3: Generate Document
Once ALL required fields collected, generate IMMEDIATELY using exact template below.

## EXACT TEMPLATE OUTPUT

**Subject Line (send separately):**
```
Registration – [BUYER_NAMES] – Reg No. [REG_NUMBER] – [PROPERTY_DESCRIPTION]
```

**Email Body:**
```
Dear [SELLER_NAME], (Seller)

This email is to provide you with a registration.

Client Information: [BUYER_NAMES]

Property Introduced: Your Property in [LOCATION] with Registration No. [REG_NUMBER]

Property Link: [PROPERTY_LINK]

Viewing Arranged for: [VIEWING_DATETIME]

Please confirm Registration and Viewing.

For the confirmation, Could you please reply ''Yes I confirm''

Looking forward to your prompt confirmation.
```

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels in output**
- `Client Information:` ← Buyer/Client names
- `Property Introduced:` ← Property description
- `Property Link:` ← Optional Zyprus URL
- `Viewing Arranged for:` ← Date and time

**NEVER rename fields to:**
- ~~Seller Name:~~
- ~~Owner Name:~~
- ~~Property Description:~~
- ~~Viewing Time:~~

## EXAMPLES

### Example 1: Complete Information Upfront
**User:** "Seller registration standard, seller is Maria Kelpi, buyer is Katerina Anastasiou, property Reg No. 0/2456 Tala Paphos, viewing Saturday 26th September 2025 at 14:30pm"

**Sophia:** *(Generates immediately)*

**Subject:** Registration – Katerina Anastasiou – Reg No. 0/2456 – Tala, Paphos

Dear Maria Kelpi, (Seller)

This email is to provide you with a registration.

Client Information: Katerina Anastasiou

Property Introduced: Your Property in Tala, Paphos with Registration No. 0/2456

Viewing Arranged for: Saturday 26th September 2025 at 14:30pm

Please confirm Registration and Viewing.
For the confirmation, Could you please reply ''Yes I confirm''
Looking forward to your prompt confirmation.

### Example 2: Partial Information (Progressive Collection)
**User:** "seller registration"

**Sophia:** "What type of seller registration?
1. **Standard** - Regular property registration
2. **With Marketing Agreement** - Includes marketing terms
3. **Rental Property** - For landlords/rentals
4. **Advanced** - Multiple properties or special terms"

**User:** "standard, seller is Maria"

**Sophia:** "Got it! For the Standard Seller Registration, I still need:
- **Buyer Name(s)** (potential buyers)
- **Property Description** (include Reg No. if available)
- **Viewing Date & Time**"

**User:** "buyer Katerina Anastasiou, property 0/2456 Tala"

**Sophia:** "Perfect! Last thing - when is the viewing arranged for?"

**User:** "Saturday 26th September at 14:30"

**Sophia:** *(Generates with all collected information)*

## IMPORTANT NOTES

1. **Field Label Rule**: NEVER change field labels from template
2. **Subject Line**: Always send separately after email body
3. **Property Link**: If not provided, omit the line entirely (don't show empty)
4. **Multiple Buyers**: Use "&" to separate names (e.g., "John & Mary Smith")
5. **Phone Masking**: Not required for this template (sellers already know our number)
6. **Confirmation Phrase**: Always include exact text ''Yes I confirm'' in quotes
