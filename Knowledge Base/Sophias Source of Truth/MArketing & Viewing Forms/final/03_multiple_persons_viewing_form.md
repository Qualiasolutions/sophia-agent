# Multiple Persons Viewing Form

## TEMPLATE ID
`viewing_form_multiple`

## CATEGORY
Viewing Forms → Multiple Persons (2+ People)

## WHEN TO USE
- Couples viewing together (husband & wife)
- Business partners
- Family members viewing jointly
- 2 or more people who need to sign the form
- Each person needs separate signature space

## SOPHIA'S INSTRUCTIONS

### STEP 1: Information Collection

**IMPORTANT: These are FRIENDLY NAMES for asking questions. When generating output, use EXACT field labels from "EXACT TEMPLATE OUTPUT" section below.**

Ask for these fields if not already provided:
1. **Date** - Date of viewing (e.g., 8th of September 2025)
2. **Person 1 Name** - Full name of first person
3. **Person 1 Passport** - Passport number for person 1
4. **Person 1 Country** - Passport issued by (e.g., State of Israel, United Kingdom)
5. **Person 2 Name** - Full name of second person
6. **Person 2 Passport** - Passport number for person 2
7. **Person 2 Country** - Passport issued by
8. **District** - Property district (e.g., Paphos)
9. **Municipality** - Property municipality (e.g., Neo Chorio)
10. **Registration Number** - Property Reg. No. (e.g., 0/1567)

**NOTE**: If more than 2 people, add Person 3, Person 4, etc. with same fields

**When asking questions, use friendly names. In generated output, use EXACT labels from template below.**

### STEP 2: Field Extraction
Remember:
- Use plural "we" instead of "I"
- Each person gets numbered entry with full name, passport, and country
- Each person gets separate signature space
- Company reference is "licensed estate agency CSC Zyprus Property Group LTD"

### STEP 3: Generate Document
Once ALL required fields collected, generate IMMEDIATELY using exact template below.

## EXACT TEMPLATE OUTPUT

**For 2 Persons:**
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
Full Name: [PERSON_1_NAME]

Signature (2)
Full Name: [PERSON_2_NAME]
```

**For 3+ Persons**: Add more numbered entries following the same pattern

## FIELD MAPPINGS

**CRITICAL: Use these EXACT labels**
- `Herein, we` ← Use "we" not "I"
- `Full Name:` ← Person's full name
- `Passport No:` or `Passport No.:` ← Passport number
- `Issued by:` ← Country that issued passport
- `licensed estate agency CSC Zyprus Property Group LTD (Reg. No. 742, L.N. 378/E)` ← Company details
- `District:` ← District
- `Municipality:` ← Municipality
- `Reg No.:` ← Registration number
- `Signature (1)` ← First person's signature space
- `Signature (2)` ← Second person's signature space

**NO Subject Line**: Viewing forms don't have subject lines

## EXAMPLES

### Example 1: Couple Viewing
**User:** "Multiple persons viewing form, date 8th of September 2025, David Cohen passport IL123456 Israel, Rachel Cohen passport IL789012 Israel, property Reg No. 0/1567 in Paphos Neo Chorio"

**Sophia:** *(Generates immediately)*

```
Viewing Form
Date: 8th of September 2025

Herein, we
    1) Full Name: David Cohen
Passport No: IL123456
Issued by: State of Israel

    2) Full Name: Rachel Cohen
Passport No.: IL789012
Issued by: State of Israel

confirm that the licensed estate agency CSC Zyprus Property Group LTD (Reg. No. 742, L.N. 378/E), has introduced to us with a viewing the property with the following details:
District: Paphos
Municipality: Neo Chorio
Reg No.: 0/1567
We hereby also acknowledge and confirm that we are liable to engage only with the agency CSC Zyprus Property Group LTD for any kind of communication with regards to the above-mentioned property.

Signature (1)
Full Name: David Cohen

Signature (2)
Full Name: Rachel Cohen
```

### Example 2: Three Business Partners
**User:** "viewing form for 3 people, date 15th March 2025, John Smith UK passport PA111222 United Kingdom, Mary Johnson UK passport PA333444 United Kingdom, Peter Williams UK passport PA555666 United Kingdom, property 0/2345 Limassol Germasogeia"

**Sophia:** *(Generates with 3 persons)*

```
Viewing Form
Date: 15th March 2025

Herein, we
    1) Full Name: John Smith
Passport No: PA111222
Issued by: United Kingdom

    2) Full Name: Mary Johnson
Passport No.: PA333444
Issued by: United Kingdom

    3) Full Name: Peter Williams
Passport No.: PA555666
Issued by: United Kingdom

confirm that the licensed estate agency CSC Zyprus Property Group LTD (Reg. No. 742, L.N. 378/E), has introduced to us with a viewing the property with the following details:
District: Limassol
Municipality: Germasogeia
Reg No.: 0/2345
We hereby also acknowledge and confirm that we are liable to engage only with the agency CSC Zyprus Property Group LTD for any kind of communication with regards to the above-mentioned property.

Signature (1)
Full Name: John Smith

Signature (2)
Full Name: Mary Johnson

Signature (3)
Full Name: Peter Williams
```

### Example 3: Progressive Collection
**User:** "multiple viewing"

**Sophia:** "Please share the following so I can complete the multiple persons viewing form:

1) *Date:* date of viewing (e.g., 8th of September 2025)

2) *Person 1 Name:* full name of first person (e.g., David Cohen)

3) *Person 1 Passport:* passport number (e.g., IL123456)

4) *Person 1 Country:* passport issued by (e.g., State of Israel)

5) *Person 2 Name:* full name of second person (e.g., Rachel Cohen)

6) *Person 2 Passport:* passport number (e.g., IL789012)

7) *Person 2 Country:* passport issued by (e.g., State of Israel)

8) *District:* property district (e.g., Paphos)

9) *Municipality:* property municipality (e.g., Neo Chorio)

10) *Registration No.:* property registration number (e.g., 0/1567)

Once I have this information, I'll generate the viewing form for you!"

## IMPORTANT NOTES

1. **Use "we" not "I"**: Document is for multiple people
2. **Numbered Entries**: Each person gets numbered entry (1), (2), (3), etc.
3. **Passport Details**: Each person needs full name, passport number, and issuing country
4. **Separate Signatures**: Each person gets their own signature space
5. **Company Wording**: Use "licensed estate agency CSC Zyprus Property Group LTD (Reg. No. 742, L.N. 378/E)" (note "L.N." not "Lic. No.")
6. **Exclusive Engagement**: Includes clause about engaging only with CSC Zyprus Property Group LTD
7. **NO Subject Line**: Viewing forms are standalone documents without subject lines
8. **Flexible**: Can be used for 2, 3, 4, or more people - just add more numbered entries
