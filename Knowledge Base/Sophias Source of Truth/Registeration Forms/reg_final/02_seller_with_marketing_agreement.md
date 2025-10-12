# Seller Registration with Marketing Agreement

## TEMPLATE ID
`seller_registration_marketing`

## CATEGORY
Seller/Owner Registration → With Marketing Agreement

## WHEN TO USE
- Property has "For Sale" sign/label outside
- Riskier cases requiring marketing terms upfront
- Seller needs to agree to fees and terms in registration
- Optional direct communication clause needed

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection

**IMPORTANT: These are FRIENDLY NAMES for asking questions. When generating output, use EXACT field labels from "EXACT TEMPLATE OUTPUT" section below (Client Information:, Property Introduced:, Viewing arranged for:, Fees:)**

Ask for these fields if not already provided:
1. **Seller Name** - Property owner's name
2. **Buyer Name(s)** - Potential buyer(s)
3. **Property Description** - With Reg No. or Unit No.
4. **Viewing Date & Time** - Complete date and time
5. **Agency Fee** - Percentage + VAT (e.g., "5% + VAT")
6. **Property Link** (optional) - Zyprus.com URL if available
7. **Include Direct Communication Clause?** - Ask agent if they want this (default: YES)

**When asking questions, use friendly names. In generated output, use EXACT labels from template below.**

### STEP 2: Field Extraction
Remember:
- Always ask for agency fee if not mentioned
- Default fee is usually 5% + VAT but always confirm
- Direct communication clause is optional (agent can request removal)

### STEP 3: Generate Document
Once ALL required fields collected, generate IMMEDIATELY.

## EXACT TEMPLATE OUTPUT

**Subject Line (send separately):**
```
Registration – [BUYER_NAMES] – Reg No. [REG_NUMBER] – [PROPERTY_DESCRIPTION]
```

**Email Body:**
```
Dear [SELLER_NAME], (seller)

Following our communication,

With this email, we kindly ask for your approval for the below registration and viewing.

Client Information: [BUYER_NAMES]

Property Introduced: Your property with Registration No.[REG_NUMBER] [LOCATION]

Property Link: [PROPERTY_LINK]

Viewing arranged for: [VIEWING_DATETIME]

Fees: [AGENCY_FEE] based on the final agreed sold price. If sold to the above-mentioned purchaser introduced to you by CSC Zyprus Property Group LTD.

[OPTIONAL_DIRECT_COMMUNICATION_CLAUSE]

If you agree with the above terms and conditions, could you please reply to this email stating: ''Yes I confirm''
```

## OPTIONAL DIRECT COMMUNICATION CLAUSE

**Include by default unless agent requests removal:**
```
In the unusual event that the above registered client of CSC Zyprus Property Group LTD communicates with you directly, you acknowledge and agree that you are legally bound to immediately cease such communication, notify us without delay, and inform our registered client that all further communication must be conducted solely through the agent CSC Zyprus Property Group LTD
```

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels**
- `Client Information:` ← Buyer names
- `Property Introduced:` ← Property with Reg No.
- `Property Link:` ← Optional URL
- `Viewing arranged for:` ← Date and time (lowercase "arranged")
- `Fees:` ← Agency fee percentage

## EXAMPLES

### Example 1: Complete Information
**User:** "Registration with marketing agreement, seller Hillyar Michael, buyers Costas & Anna Mylonas, property Reg No. 0/5763 Erimi Limassol, viewing Sunday 20th June 2026 at 10:30am, fee 5% + VAT"

**Sophia:** *(Generates immediately)*

**Subject:** Registration – Costas Mylonas & Anna Mylonas – Reg No. 0/5763 – Townhouse – Erimi, Limassol

Dear Hillyar Michael, (seller)

Following our communication,

With this email, we kindly ask for your approval for the below registration and viewing.

Client Information: Costas Mylonas & Anna Mylonas

Property Introduced: Your property with Registration No.0/5763 Erimi, Limassol

Viewing arranged for: Sunday 20th of June 2026 at 10:30am

Fees: 5% + VAT based on the final agreed sold price. If sold to the above-mentioned purchaser introduced to you by CSC Zyprus Property Group LTD.

In the unusual event that the above registered client of CSC Zyprus Property Group LTD communicates with you directly, you acknowledge and agree that you are legally bound to immediately cease such communication, notify us without delay, and inform our registered client that all further communication must be conducted solely through the agent CSC Zyprus Property Group LTD

If you agree with the above terms and conditions, could you please reply to this email stating: ''Yes I confirm''

### Example 2: Agent Requests Clause Removal
**User:** "Remove the direct communication part"

**Sophia:** *(Regenerates without the clause)*

## IMPORTANT NOTES

1. **Always include "Following our communication,"** at the start
2. **Agency fee must be specified** - ask if not provided
3. **Direct communication clause** - Include by default, remove only if agent asks
4. **Confirmation phrase**: Use exact wording ''Yes I confirm''
5. **Optional reminder**: Add "*Add the copy of the title deed as well. (Reminder for agent to do this..)" if agent mentions it
6. **Alternative property format**: Can use "Your property within the project [PROJECT_NAME] with Unit No. [UNIT_NO]"
