# Multiple People Viewing Form

## TEMPLATE ID
`viewing_form_multiple_people`

## CATEGORY
Viewing Forms → Multiple People

## WHEN TO USE
- Property viewing with 2 or more clients
- Couples (husband & wife)
- Business partners
- Multiple buyers/investors
- Family members buying together

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection

**IMPORTANT: These are FRIENDLY NAMES for asking questions. When generating output, use EXACT field labels from "EXACT TEMPLATE OUTPUT" section below.**

Ask for these fields if not already provided:
1. **Date** - Viewing date
2. **Number of People** - How many clients (2, 3, 4, etc.)
3. **Person 1 Full Name** - First client's complete name
4. **Person 1 Passport No** - First client's passport number
5. **Person 1 Issuing Country** - Country that issued passport (e.g., State of Israel, Republic of Cyprus)
6. **Person 2 Full Name** - Second client's complete name
7. **Person 2 Passport No** - Second client's passport number
8. **Person 2 Issuing Country** - Country that issued passport
9. **Person 3+ Details** - If more than 2 people, collect same details for additional people
10. **Registration Number** - Property Reg No.
11. **District** - Property district
12. **Municipality** - Property municipality

**When asking questions, use friendly names. In generated output, use EXACT labels from template below.**

### STEP 2: Field Extraction
Remember:
- Must have at least 2 people
- Each person needs: Full Name, Passport No, Issuing Country
- Generate numbered list dynamically based on number of people
- Default issuing country is often "State of Israel" (but always ask)

### STEP 3: Generate Document
Once ALL required fields collected, generate IMMEDIATELY with all people listed.

## EXACT TEMPLATE OUTPUT

**For 2 People:**
```
Viewing Form

Date: [DATE]

Herein, we

    1) Full Name: [PERSON_1_NAME]
Passport No: [PERSON_1_PASSPORT]
Issued by: [PERSON_1_COUNTRY]

    2) Full Name: [PERSON_2_NAME]
Passport No.: [PERSON_2_PASSPORT]
Issued by: [PERSON_2_COUNTRY]

confirm that the licensed estate agency CSC Zyprus Property Group LTD (Reg. No. 742, L.N. 378/E), has introduced to us with a viewing the property with the following details:

District: [DISTRICT]

Municipality: [MUNICIPALITY]

Reg No.: [REG_NUMBER]

We hereby also acknowledge and confirm that we are liable to engage only with the agency CSC Zyprus Property Group LTD for any kind of communication with regards to the above-mentioned property.

Signature (1)
Full Name:…………………………….

Signature (2)
Full Name:…………………………..
```

**For 3 People:** (Add person 3 in same format)
```
    3) Full Name: [PERSON_3_NAME]
Passport No.: [PERSON_3_PASSPORT]
Issued by: [PERSON_3_COUNTRY]
```

And add:
```
Signature (3)
Full Name:…………………………….
```

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels in output**
- `Date:` ← Viewing date
- `Herein, we` ← Start with "we" not "I"
- `1) Full Name:` ← Numbered list with parentheses
- `Passport No:` or `Passport No.:` ← Both formats acceptable
- `Issued by:` ← Country in brackets [State of Israel]
- `District:` ← Property district
- `Municipality:` ← Property municipality
- `Reg No.:` ← Property registration number
- `Signature (1)` ← Numbered signatures matching number of people

## EXAMPLES

### Example 1: Two People
**User:** "Viewing form for multiple people, date 8th September 2025, two clients: first is John Cohen passport 111222 from Israel, second is Sarah Cohen passport 333444 from Israel, property Reg No. 0/1567 in Paphos, Neo Chorio"

**Sophia:** *(Generates immediately)*

```
Viewing Form

Date: 8th of September 2025

Herein, we

    1) Full Name: John Cohen
Passport No: 111222
Issued by: [State of Israel]

    2) Full Name: Sarah Cohen
Passport No.: 333444
Issued by: [State of Israel]

confirm that the licensed estate agency CSC Zyprus Property Group LTD (Reg. No. 742, L.N. 378/E), has introduced to us with a viewing the property with the following details:

District: Paphos

Municipality: Neo Chorio

Reg No.: 0/1567

We hereby also acknowledge and confirm that we are liable to engage only with the agency CSC Zyprus Property Group LTD for any kind of communication with regards to the above-mentioned property.

Signature (1)
Full Name:…………………………….

Signature (2)
Full Name:…………………………..
```

### Example 2: Three People
**User:** "Viewing form, 3 people, date 15th October 2025, Person 1: Maria Kelpi passport 555666 Cyprus, Person 2: George Kelpi passport 777888 Cyprus, Person 3: Anna Kelpi passport 999000 Cyprus, property 0/2456 Limassol Germasogeia"

**Sophia:** *(Generates with 3 people and 3 signatures)*

## IMPORTANT NOTES

1. **We not I**: Use "Herein, we" for multiple people
2. **Numbered List**: Use parentheses format: 1), 2), 3)
3. **Indentation**: Each person's details are indented
4. **Passport Format**: Note slight variation between "Passport No:" and "Passport No.:" (both acceptable)
5. **Issued by**: Always put country in brackets [State of Israel]
6. **Company Name**: Use "CSC Zyprus Property Group LTD (Reg. No. 742, L.N. 378/E)" exactly
7. **Liability Clause**: Include the engagement liability clause at the end
8. **Signature Lines**: Must match number of people with dotted line for full name
9. **Dynamic Generation**: Adapt template based on number of people (2, 3, 4, etc.)
10. **Date Format**: Can use "8th of September 2025" format (more formal)
