# Very Advanced Seller Registration

## TEMPLATE ID
`seller_registration_advanced`

## CATEGORY
Seller/Owner Registration → Advanced

## WHEN TO USE
- Multiple properties (multiple Reg Nos.)
- Complex ownership structures (companies, co-shareholders)
- Special payment terms (fees paid before full transaction)
- Long transaction timelines
- Multiple owner entities requiring legal representation
- RARE cases requiring advanced legal protection

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection
Ask for these fields if not already provided:
1. **Seller Contact Name** - Who agent communicates with
2. **Buyer Name** - Include "and any directly related company" clause
3. **Property Reg Numbers** - Multiple Reg Nos. separated by commas
4. **Property Location/Description** - City, area, building name if applicable
5. **Agency Fee** - Percentage + VAT
6. **Fee Payment Terms** - When fee becomes payable (e.g., "upon 50% initial payment")
7. **Owner Entities** - All legal entities seller represents
8. **Viewing Arranged?** - If yes, collect date/time; if no, use acceptance clause

### STEP 2: Complex Field Extraction
- Multiple Reg Nos: "0/29346, 0/29348, 0/29350" format
- Client can include company clause: "Dmitry Buyanovsky and any directly related company in which he is a sole shareholder or co-shareholder"
- Fee payment timing: Pay attention to special payment terms

### STEP 3: Generate Document
This is a complex template. Ask for confirmation if unsure about any field.

## EXACT TEMPLATE OUTPUT

**Subject Line (send separately):**
```
Registration – [BUYER_NAME] – Reg. Nos. [ALL_REG_NUMBERS] [LOCATION] – [PROPERTY_NAME]
```

**Email Body (WITH viewing):**
```
Dear [SELLER_CONTACT_NAME],

This email is to provide you with the full registration of our below client, under our Estate Agency: CSC Zyprus Property Group LTD.

Client Information: [BUYER_NAME] and any directly related company in which he is a sole shareholder or co-shareholder.

Property Introduced: Your property in [LOCATION], with the following Registration Numbers: [ALL_REG_NUMBERS] ([PROPERTY_NAME])

Our Agency Fees:
[AGENCY_FEE] based on the final agreed sold price. If sold to the above-mentioned purchaser introduced to you by CSC Zyprus Property Group LTD

Our fee becomes payable in full upon your receipt of the initial [PAYMENT_PERCENTAGE]% payment of the agreed purchase price. This ensures that, in cases where the remaining balance may be delayed due to the issuance of title deeds, licenses, or any other special agreement reached with the buyer/client, our agency is not required to wait indefinitely for settlement. This method of payment is consistent with standard market practice in similar transactions.

Viewing arranged for: [VIEWING_DATETIME]

By confirming this email you also confirm that you legally represent the following owner entities: [ALL_OWNER_ENTITIES]

Please confirm registration.

For the confirmation, please reply ''Yes I confirm''

Looking forward to your prompt reply.
```

**Email Body (WITHOUT viewing - use acceptance clause instead):**
```
Dear [SELLER_CONTACT_NAME],

This email is to provide you with the full registration of our below client, under our Estate Agency: CSC Zyprus Property Group LTD.

Client Information: [BUYER_NAME] and any directly related company in which he is a sole shareholder or co-shareholder.

Property Introduced: Your property in [LOCATION], with the following Registration Numbers: [ALL_REG_NUMBERS] ([PROPERTY_NAME])

Our Agency Fees:
[AGENCY_FEE] based on the final agreed sold price. If sold to the above-mentioned purchaser introduced to you by CSC Zyprus Property Group LTD

Our fee becomes payable in full upon your receipt of the initial [PAYMENT_PERCENTAGE]% payment of the agreed purchase price. This ensures that, in cases where the remaining balance may be delayed due to the issuance of title deeds, licenses, or any other special agreement reached with the buyer/client, our agency is not required to wait indefinitely for settlement. This method of payment is consistent with standard market practice in similar transactions.

Acceptance of registration implies a full registration under our agency regardless of viewing arrangement(s) by our firm, since your property details will be fully provided for enhanced and transparent review by our client. Acceptance of registration also implies acceptance of the above fees and terms.

By confirming this email you also confirm that you legally represent the following owner entities: [ALL_OWNER_ENTITIES]

Please confirm registration.

For the confirmation, please reply ''Yes I confirm''

Looking forward to your prompt reply.
```

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels**
- `Client Information:` ← Buyer name + company clause
- `Property Introduced:` ← Location + Reg Nos + property name
- `Our Agency Fees:` ← Fee percentage (note "Our" not just "Fees:")
- `Viewing arranged for:` ← Date/time OR acceptance clause

## EXAMPLES

### Example 1: Multiple Properties
**User:** "Advanced registration, seller Louis Agathaggelou, buyer Dmitry Buyanovsky, properties Reg Nos. 0/29346, 0/29348, 0/29350, 0/30149, 0/30847 Agios Theodoros Paphos, Dominate Shopping Centre, fee 4% + VAT, payable on 50% initial payment, owner entities are CHRISTAKES L.AGATHANGELOU LIMITED, Agathaggelou Christoforos, Dimitriou Georgia and Agathaggelou Elena"

**Sophia:** "Is a viewing arranged for this registration?"

**User:** "No viewing yet"

**Sophia:** *(Generates with acceptance clause)*

**Subject:** Registration – Dmitry Buyanovsky – Reg. Nos. 0/29346, 0/29348, 0/29350, 0/30149, 0/30847 Agios Theodoros, Paphos – Dominate Shopping Centre, Paphos

Dear Louis Agathaggelou,

This email is to provide you with the full registration of our below client, under our Estate Agency: CSC Zyprus Property Group LTD.

Client Information: Dmitry Buyanovsky and any directly related company in which he is a sole shareholder or co-shareholder.

Property Introduced: Your property in Agios Theodoros, Paphos, with the following Registration Numbers: 0/29346, 0/29348, 0/29350, 0/30149, 0/30847 (Dominate Shopping Centre, Paphos)

Our Agency Fees:
4% + VAT based on the final agreed sold price. If sold to the above-mentioned purchaser introduced to you by CSC Zyprus Property Group LTD

Our fee becomes payable in full upon your receipt of the initial 50% payment of the agreed purchase price. This ensures that, in cases where the remaining balance may be delayed due to the issuance of title deeds, licenses, or any other special agreement reached with the buyer/client, our agency is not required to wait indefinitely for settlement. This method of payment is consistent with standard market practice in similar transactions.

Acceptance of registration implies a full registration under our agency regardless of viewing arrangement(s) by our firm, since your property details will be fully provided for enhanced and transparent review by our client. Acceptance of registration also implies acceptance of the above fees and terms.

By confirming this email you also confirm that you legally represent the following owner entities: CHRISTAKES L.AGATHANGELOU LIMITED, Agathaggelou Christoforos, Dimitriou Georgia and Agathaggelou Elena

Please confirm registration.

For the confirmation, please reply ''Yes I confirm''

Looking forward to your prompt reply.

## IMPORTANT NOTES

1. **RARE USE CASE**: Only use for complex transactions
2. **Company Clause**: Always add "and any directly related company in which he is a sole shareholder or co-shareholder"
3. **Payment Terms**: Very rare clause about fee payable on initial payment percentage
4. **Viewing vs Acceptance**: If no viewing, use acceptance clause; if viewing arranged, use viewing line
5. **Owner Entities**: Must list all entities seller legally represents
6. **Multiple Reg Nos**: Separate with commas, include all in parentheses after location
7. **Fee Payment Clause**: Use exact wording for payment terms (very important legally)
