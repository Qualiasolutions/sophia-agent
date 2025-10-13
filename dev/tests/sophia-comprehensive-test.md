# Sophia AI Comprehensive Test Suite

**Purpose:** Verify all document generation flows work correctly with text recognition and immediate generation.

**Date:** 2025-10-13

## Test Environment
- **Channel:** WhatsApp (preferred) or test script
- **Model:** gpt-4o-mini (can switch to gpt-4o for higher quality)
- **System Prompt:** Single prompt handles all flows

---

## 1. REGISTRATION FORMS TESTS

### 1.1 Standard Seller Registration (Text Recognition)
**Test:** Text input instead of numbers

**Input 1:** "registration"
**Expected:** "What type of registration do you need? 1. *Seller(s)* 2. *Banks* 3. *Developers*"

**Input 2:** "seller" (not "1")
**Expected:** "What type of seller registration? 1. *Standard* 2. *Marketing* 3. *Rental* 4. *Advanced*"

**Input 3:** "standard" (not "1")
**Expected:** Numbered field list with 4 fields

**Input 4:** "Buyer: John Smith, Property: Reg No. 0/1234 Tala Paphos, Link: https://zyprus.com/property/1234, Viewing: Saturday 14 October at 3pm"
**Expected:** Document generated IMMEDIATELY (no confirmation)

**Validation:**
- ✅ Email body sent first (no subject)
- ✅ Subject sent in separate message
- ✅ Uses "Dear XXXXXXXX," not actual name
- ✅ Field labels match template exactly

---

### 1.2 Bank Registration (Number Recognition)
**Test:** Number input instead of text

**Input 1:** "registration"
**Input 2:** "2" (banks)
**Expected:** "Is it for a property or land? 1. *Property* 2. *Land*"

**Input 3:** "1" (property)
**Expected:** Field list for bank property (5 fields including agent mobile)

**Input 4:** "Client: remuproperties.com, Property: Reg No. 0/5678 Limassol, Link: https://zyprus.com/property/5678, Viewing: Monday 16 October at 10am, Mobile: 99076732"
**Expected:** Document with "Dear Remu Team," and masked phone "99 ** 67 32"

---

### 1.3 Developer Registration
**Test:** Full flow with viewing arranged

**Input 1:** "developer registration"
**Input 2:** "yes viewing"
**Expected:** Field list for developer with viewing (5 fields, 8% + VAT default)

**Input 3:** Provide all fields
**Expected:** Document with 8% + VAT agency fee

---

## 2. VIEWING FORMS TESTS

### 2.1 Standard Viewing Form
**Test:** Simple single person viewing

**Input 1:** "viewing"
**Expected:** "What type of viewing form do you need? 1. *Standard* 2. *Advanced* 3. *Multiple Persons*"

**Input 2:** "standard"
**Expected:** Field list with 7 fields (Date, Client Name, Client ID, Reg No, District, Municipality, Locality)

**Input 3:** "Date: 28/09/2024, Name: John Smith, ID: PA123456, Reg: 0/1567, District: Paphos, Municipality: Tala, Locality: Konia"
**Expected:**
```
Viewing Form
Date: 28/09/2024

Herein, I John Smith with ID PA123456 confirm that CSC Zyprus Property Group LTD (Reg. No. 742, Lic. No. 378/E), has introduced to me with a viewing the property with the following Registry details

Registration No. 0/1567
District: Paphos
Municipality: Tala
Locality: Konia

Signature:
```

**Validation:**
- ✅ NO subject line sent
- ✅ Title is "Viewing Form" not "Viewing/Introduction Form"
- ✅ Company details use "Lic. No." not "L.N."

---

### 2.2 Advanced Viewing Form
**Test:** With legal protection clause

**Input 1:** "viewing"
**Input 2:** "advanced"
**Expected:** Same 7 fields as standard

**Input 3:** Provide all fields
**Expected:**
- Title: "Viewing/Introduction Form"
- Includes full legal protection paragraph
- Company details still use "Lic. No."

---

### 2.3 Multiple Persons Viewing Form
**Test:** Couple viewing together

**Input 1:** "viewing"
**Input 2:** "couple" or "2 people" or "multiple"
**Expected:** Field list with 10+ fields (Date + Person 1 details + Person 2 details + property)

**Input 3:** "Date: 8th September 2025, Person 1: David Cohen IL123456 Israel, Person 2: Rachel Cohen IL789012 Israel, District: Paphos, Municipality: Neo Chorio, Reg: 0/1567"
**Expected:**
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

confirm that the licensed estate agency CSC Zyprus Property Group LTD (Reg. No. 742, L.N. 378/E), has introduced to us with a viewing the property...
```

**Validation:**
- ✅ Uses "we" not "I"
- ✅ Company uses "L.N." not "Lic. No."
- ✅ Each person numbered with separate signature space
- ✅ Includes exclusive engagement clause

---

## 3. MARKETING AGREEMENTS TESTS

### 3.1 Standard Terms Marketing Agreement
**Test:** With signature placeholder

**Input 1:** "marketing"
**Expected:** "Are you using the standard agreement terms, or do you need custom terms?"

**Input 2:** "standard"
**Expected:** Field list with 6 fields (Date, Seller Name, Property Reg, Agency Fee, Marketing Price, Agent Name)

**Input 3:** "Date: 1st March 2026, Seller: George Papas, Property: 0/12345 Tala Paphos, Fee: 5%, Price: €350,000, Agent: Danae Pirou"
**Expected:**
```
Marketing Agreement

This agreement made on the: 1st March 2026

BETWEEN: CSC Zyprus Property Group LTD
CREA Reg No. 742, CREA License Number 378/E (hereinafter referred to as the ''Agent'')

And
(name of the seller) George Papas (Hereinafter referred to as the 'Seller'). Whereas the Seller is the owner of Property with Reg No. 0/12345 Tala, Paphos...

...

Signed:



On behalf of company:                                                                                    Charalambos Pitros


Signed:



The Seller
Name:
```

**Validation:**
- ✅ NO subject line sent
- ✅ Includes "Charalambos Pitros" signature placeholder
- ✅ 30-day term, NON-EXCLUSIVE
- ✅ 5.0% + VAT fee

---

### 3.2 Custom Terms Marketing Agreement
**Test:** Without signature

**Input 1:** "marketing"
**Input 2:** "custom"
**Expected:** Same 6 fields

**Input 3:** Provide all fields with custom fee (e.g., 3%)
**Expected:**
- Same agreement text
- NO signature section
- Includes note: "⚠️ NOTE: This agreement has custom terms. For signature and stamp, please contact Marios Poliviou: Email: marios@zyprus.com Phone: +357 99 92 15 60"

---

## 4. CALCULATOR TESTS

### 4.1 Transfer Fees Calculator
**Input:** "calculate transfer fees for €300,000"
**Expected:** Formatted output with progressive rates

### 4.2 Capital Gains Tax Calculator
**Input:** "capital gains tax for property bought at €250k in 2015, selling at €400k in 2025"
**Expected:** Calculation with allowances

### 4.3 VAT Calculator
**Input:** "calculate VAT for €350k apartment, first home"
**Expected:** 5% reduced rate for first 200m²

---

## 5. EDGE CASES & ERROR HANDLING

### 5.1 Mixed Input
**Test:** Some fields in first message, some later
**Input 1:** "standard seller registration for John Smith"
**Expected:** Extract name, ask for remaining fields

### 5.2 Typos and Variations
**Test:** "viwing" or "marketting"
**Expected:** Should still detect intent

### 5.3 Incomplete Information
**Test:** Missing required fields
**Expected:** Ask for missing fields specifically

### 5.4 Greeting
**Input:** "hello"
**Expected:** "Hi! I'm Sophia, your zyprus.com AI assistant. I can help with documents, listings, calculations, and emails. What can I assist you with today?"

---

## 6. PERFORMANCE TESTS

### 6.1 Response Time
- Simple queries: < 2 seconds
- Document generation: < 5 seconds
- Calculator: < 3 seconds

### 6.2 Token Usage
- Registration: ~400-600 tokens
- Viewing forms: ~300-500 tokens
- Marketing agreements: ~400-600 tokens

---

## 7. SPECIAL VALIDATIONS

### ✅ Checklist for ALL Documents:
- [ ] Text recognition works (numbers AND text accepted)
- [ ] No confirmation step (generates immediately)
- [ ] Field labels match template exactly
- [ ] Examples included in field collection
- [ ] Company details are exact (Reg. No. 742)
- [ ] NO subject lines for viewing/marketing
- [ ] Subject lines SEPARATE for registrations

### ✅ Checklist for Registrations:
- [ ] "Dear XXXXXXXX," placeholder used
- [ ] Email body sent first (no subject)
- [ ] Subject sent in separate message
- [ ] Bank phones masked (99 ** 67 32)

### ✅ Checklist for Viewing Forms:
- [ ] Standard uses "Lic. No."
- [ ] Multiple persons uses "L.N."
- [ ] Advanced includes full legal clause
- [ ] NO subject lines

### ✅ Checklist for Marketing:
- [ ] Standard terms have Charalambos Pitros
- [ ] Custom terms have Marios contact note
- [ ] NON-EXCLUSIVE stated
- [ ] 30-day duration
- [ ] NO subject lines

---

## 8. REGRESSION TESTS

Run these after ANY system prompt changes:

1. "registration" → "seller" → "standard" → provide fields → verify output
2. "viewing" → "standard" → provide fields → verify output
3. "marketing" → "standard" → provide fields → verify output
4. "calculate transfer fees for €300k" → verify output
5. "hello" → verify greeting

---

## Test Results Log

| Test Case | Date | Status | Notes |
|-----------|------|--------|-------|
| Standard Seller Registration | | ⏳ | |
| Bank Registration | | ⏳ | |
| Developer Registration | | ⏳ | |
| Standard Viewing Form | | ⏳ | |
| Advanced Viewing Form | | ⏳ | |
| Multiple Persons Viewing | | ⏳ | |
| Standard Marketing Agreement | | ⏳ | |
| Custom Marketing Agreement | | ⏳ | |
| Transfer Fees Calculator | | ⏳ | |
| Capital Gains Tax Calculator | | ⏳ | |
| VAT Calculator | | ⏳ | |
| Text Recognition | | ⏳ | |
| Immediate Generation | | ⏳ | |
| Subject Line Separation | | ⏳ | |

---

## Quick Test Commands (WhatsApp)

```
# Test 1: Registration with text
"registration"
"seller"
"standard"
"John Smith, Reg 0/1234 Tala, https://zyprus.com/1234, Saturday 3pm"

# Test 2: Viewing with text
"viewing"
"standard"
"28/09/2024, John Smith, PA123456, 0/1567, Paphos, Tala, Konia"

# Test 3: Marketing with text
"marketing"
"standard"
"1st March 2026, George Papas, 0/12345 Tala Paphos, 5%, €350000, Danae"

# Test 4: Calculator
"calculate transfer fees for €300,000"
```
