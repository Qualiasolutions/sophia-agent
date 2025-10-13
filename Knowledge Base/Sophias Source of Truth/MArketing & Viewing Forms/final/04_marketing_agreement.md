# Marketing Agreement

## TEMPLATE ID
`marketing_agreement_standard`

## CATEGORY
Marketing Agreements → Standard (Non-Exclusive)

## WHEN TO USE
- Seller wants non-exclusive marketing agreement
- Property to be promoted/advertised by agency
- Standard 30-day agreement with 5% + VAT fee
- Needs formal marketing contract with seller

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection

**IMPORTANT: These are FRIENDLY NAMES for asking questions. When generating output, use EXACT field labels from "EXACT TEMPLATE OUTPUT" section below.**

Ask for these fields if not already provided:
1. **Date** - Agreement date (e.g., 1st March 2026)
2. **Seller Name** - Full name of property owner
3. **Property Registration Number** - Property Reg. No. with location (e.g., 0/12345 Tala, Paphos)
4. **Agency Fee** - Percentage + VAT (default: 5.0% plus VAT)
5. **Initial Marketing Price** - Price in Euros (e.g., €350,000)
6. **Agent Name** - Name of the agent handling this (e.g., Danae Pirou)

**CRITICAL QUESTION - Ask First:**
"Are you using the standard agreement terms, or do you need custom terms?"

- **If STANDARD terms** → Generate with signature placeholder (Charalambos Pitros will sign)
- **If CUSTOM terms** → Generate without signature, add note to contact Marios Poliviou

**When asking questions, use friendly names. In generated output, use EXACT labels from template below.**

### STEP 2: Field Extraction
Remember:
- Default fee is 5.0% plus VAT (but always confirm with agent)
- Agreement is for 30 days
- This is NON-EXCLUSIVE agreement
- Standard clauses include direct communication protection

### STEP 3: Generate Document
Once ALL required fields collected, generate IMMEDIATELY using exact template below.

## EXACT TEMPLATE OUTPUT

**STANDARD TERMS (with signature):**
```
Marketing Agreement

This agreement made on the: [DATE]

BETWEEN: CSC Zyprus Property Group LTD
CREA Reg No. 742, CREA License Number 378/E (hereinafter referred to as the ''Agent'')

And
(name of the seller) [SELLER_NAME] (Hereinafter referred to as the 'Seller'). Whereas the Seller is the owner of Property with Reg No. [PROPERTY_REG_WITH_LOCATION] (hereinafter referred to as 'the Property') which the seller wishes to promote for sale. The Seller gives to the agent the right to market and advertise the sale of the Property based upon the following terms and conditions.
Service

    1. The Agent may advertise the Property. This is a NON-EXCLUSIVE agreement.
    2. If the Property is sold to a purchaser introduced to the Seller by the Agent, then the Agent will receive the fee as mentioned in clause 4 (four).
    3. If, at any time following the termination of this agreement, the Property, is sold to any person having been
Introduced by the Agent to the Seller prior to the termination of this agreement, then the Agent will receive the
             fee as mentioned in clause 4 (four).
    4. The Agent's fee is hereby agreed to be an amount equal to [FEE_PERCENTAGE]% plus (Value Added Tax), of the agreed sale value of the Property.
    5. The initial agreed marketing price is € [MARKETING_PRICE]
    6. In the unusual case that any registered client of the Agent gets into direct communication with the Seller, then the Seller acknowledges that is legally bound to stop such communication, inform immediately the Agent, and inform the client that any communication must be continued only via the Agent.


General

    7. It is clearly agreed that the Seller was brought into contact with the CSC Zyprus Property Group LTD
Represented by [AGENT_NAME]
This agreement shall continue for 30 days after either party receives written notice to terminate from the other.


Signed:




On behalf of company:                                                                                    Charalambos Pitros



Signed:





The Seller
Name:
```

**CUSTOM TERMS (without signature):**
```
Marketing Agreement

This agreement made on the: [DATE]

BETWEEN: CSC Zyprus Property Group LTD
CREA Reg No. 742, CREA License Number 378/E (hereinafter referred to as the ''Agent'')

And
(name of the seller) [SELLER_NAME] (Hereinafter referred to as the 'Seller'). Whereas the Seller is the owner of Property with Reg No. [PROPERTY_REG_WITH_LOCATION] (hereinafter referred to as 'the Property') which the seller wishes to promote for sale. The Seller gives to the agent the right to market and advertise the sale of the Property based upon the following terms and conditions.
Service

    1. The Agent may advertise the Property. This is a NON-EXCLUSIVE agreement.
    2. If the Property is sold to a purchaser introduced to the Seller by the Agent, then the Agent will receive the fee as mentioned in clause 4 (four).
    3. If, at any time following the termination of this agreement, the Property, is sold to any person having been
Introduced by the Agent to the Seller prior to the termination of this agreement, then the Agent will receive the
             fee as mentioned in clause 4 (four).
    4. The Agent's fee is hereby agreed to be an amount equal to [FEE_PERCENTAGE]% plus (Value Added Tax), of the agreed sale value of the Property.
    5. The initial agreed marketing price is € [MARKETING_PRICE]
    6. In the unusual case that any registered client of the Agent gets into direct communication with the Seller, then the Seller acknowledges that is legally bound to stop such communication, inform immediately the Agent, and inform the client that any communication must be continued only via the Agent.

[CUSTOM_TERMS_IF_PROVIDED]

General

    7. It is clearly agreed that the Seller was brought into contact with the CSC Zyprus Property Group LTD
Represented by [AGENT_NAME]
This agreement shall continue for 30 days after either party receives written notice to terminate from the other.


⚠️ NOTE: This agreement has custom terms. For signature and stamp, please contact Marios Poliviou:
Email: marios@zyprus.com
Phone: +357 99 92 15 60
```

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels**
- `This agreement made on the: ` ← Date
- `(name of the seller) ` ← Seller name
- `Property with Reg No. ` ← Property reg number with location
- `Agent's fee is hereby agreed to be an amount equal to ` ← Fee percentage
- `The initial agreed marketing price is € ` ← Marketing price in Euros
- `Represented by ` ← Agent name
- `On behalf of company:                                                                                    Charalambos Pitros` ← Only for standard terms

**NO Subject Line**: Marketing agreements don't have subject lines

## EXAMPLES

### Example 1: Standard Agreement
**User:** "Marketing agreement, standard terms, date 1st March 2026, seller George Papas, property Reg No. 0/12345 Tala Paphos, fee 5%, marketing price €350,000, agent Danae Pirou"

**Sophia:** *(Generates with signature placeholder)*

```
Marketing Agreement

This agreement made on the: 1st March 2026

BETWEEN: CSC Zyprus Property Group LTD
CREA Reg No. 742, CREA License Number 378/E (hereinafter referred to as the ''Agent'')

And
(name of the seller) George Papas (Hereinafter referred to as the 'Seller'). Whereas the Seller is the owner of Property with Reg No. 0/12345 Tala, Paphos (hereinafter referred to as 'the Property') which the seller wishes to promote for sale...
```

### Example 2: Custom Terms
**User:** "Marketing agreement with custom fee of 3%, date 15th April 2026, seller Maria Constantinou, property 0/6789 Limassol, price €500,000, agent Andreas Georgiou, add clause about exclusive online marketing"

**Sophia:** "I'll generate this marketing agreement with custom terms. Since this has custom terms, it will be provided without signature. The agent will need to contact Marios Poliviou for signature and stamp."

*(Generates without signature, with note)*

### Example 3: Progressive Collection
**User:** "marketing agreement"

**Sophia:** "Are you using the standard agreement terms, or do you need custom terms?"

**User:** "standard"

**Sophia:** "Please share the following so I can complete the marketing agreement:

1) *Date:* agreement date (e.g., 1st March 2026)

2) *Seller Name:* full name of property owner (e.g., George Papas)

3) *Property Registration:* Reg. No. with location (e.g., 0/12345 Tala, Paphos)

4) *Agency Fee:* percentage + VAT (e.g., 5.0% plus VAT)

5) *Marketing Price:* price in Euros (e.g., €350,000)

6) *Agent Name:* your name (e.g., Danae Pirou)

Once I have this information, I'll generate the marketing agreement for you!"

## IMPORTANT NOTES

1. **CRITICAL: Standard vs Custom Terms**
   - **Standard terms** → Include "Charalambos Pitros" signature line
   - **Custom terms** → NO signature, add Marios contact note

2. **Default Values**:
   - Fee: 5.0% plus VAT
   - Duration: 30 days

3. **NON-EXCLUSIVE**: Always state "This is a NON-EXCLUSIVE agreement" in clause 1

4. **Direct Communication Clause**: Clause 6 protects agent from client bypass

5. **Property Format**: Must include location with Reg No. (e.g., "0/12345 Tala, Paphos")

6. **NO Subject Line**: Marketing agreements are standalone documents

7. **Company Details**: Always use exact text "CSC Zyprus Property Group LTD CREA Reg No. 742, CREA License Number 378/E"

8. **Contact for Custom Agreements**:
   - Name: Marios Poliviou
   - Email: marios@zyprus.com
   - Phone: +357 99 92 15 60

9. **Spacing**: Keep exact spacing in signature area for standard agreements

10. **Format**: If agent needs PDF with signature, remind them to contact Marios Poliviou
