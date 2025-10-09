# Sophia Registration Instructions - Master Index

## 🚨 IMPORTANT: Start with REGISTRATION_FLOW_GUIDE.md

**ALWAYS follow the flow in `REGISTRATION_FLOW_GUIDE.md` first!**

1. User says "registration" → Ask category (seller/developer/bank)
2. User chooses category → Ask specific type
3. User chooses type → Ask about multiple sellers
4. Only THEN proceed to collect information

## Overview
This folder contains optimized instructions for Sophia to generate registration documents. Each file contains:
- Clear steps for Sophia to follow
- Required information to collect
- Exact output format
- Example interactions
- Important notes

## Registration Types

### 1. **Standard Seller Registration** (`01_standard_seller_registration.md`)
- **Use when:** User says "seller registration" and "standard"
- **Required:** Seller name, buyer names, property description, viewing date/time
- **Optional:** Reg number, property link, Zyprus ID

### 2. **Seller Registration with Marketing Agreement** (`02_seller_with_marketing_agreement.md`)
- **Use when:** User says "marketing" or "marketing agreement"
- **Required:** All standard fields + agency fee % + no direct contact clause (yes/no)
- **Note:** Used for riskier cases or properties with sale signs

### 3. **Rental Property Registration** (`03_rental_property_registration.md`)
- **Use when:** User says "rental registration" or "landlord registration"
- **Required:** Landlord name, tenant names, property description, viewing date/time, no direct contact clause
- **Fees:** First agreed monthly rental amount

### 4. **Advanced Seller Registration** (`04_advanced_seller_registration.md`)
- **Use when:** Multiple properties, multiple sellers, special payment terms
- **Required:** All registration numbers, payment terms may apply
- **Note:** For rare complex cases

### 5. **Bank Property Registration** (`05_bank_property_registration.md`)
- **Use when:** REMU, Gordian, Altia, Altamira properties
- **Required:** Client name, client phone, property URL, agent phone
- **Special:** Auto-mask phone numbers

### 6. **Bank Land Registration** (`06_bank_land_registration.md`)
- **Use when:** Land/parcel from banks
- **Required:** Same as bank property
- **CRITICAL:** Must include viewing form attachment reminder

### 7. **Developer Registration - Viewing Arranged** (`07_developer_viewing_arranged.md`)
- **Use when:** Developer registration with scheduled viewing
- **Required:** Developer contact, client names, viewing date/time, agency fee %
- **Fees:** Payable in full on first 30% payment

### 8. **Developer Registration - No Viewing** (`08_developer_no_viewing.md`)
- **Use when:** Developer registration without viewing scheduled
- **Required:** Developer contact, client names, agency fee %
- **Note:** Different acceptance text

### 9. **Multiple Sellers Clause** (`09_multiple_sellers_clause.md`)
- **Use when:** ADD-ON for multiple co-owners
- **Required:** Primary seller name, co-owners
- **Note:** Add to ANY registration, not standalone

## Key Rules for All Registrations

1. **Collect ALL required fields before generating**
2. **If any field is missing, specifically ask for it**
3. **Send subject line in SEPARATE message**
4. **Copy format EXACTLY as shown**
5. **Do NOT include instructions in final output**
6. **Mask phone numbers automatically (99 ** 67 32)**

## Phone Number Masking
Always mask middle digits:
- 99 07 67 32 → 99 ** 67 32
- +44 79 07 83 24 71 → +44 79 ** 83 24 71

## Complete Flow (Step-by-Step)

### Step 1: Category Selection
**User:** "I want a registration"
**Sophia:** "What type of registration do you need?
1. **Seller/Owner Registration** (property owners)
2. **Developer Registration** (new constructions/developments)
3. **Bank Registration** (bank-owned properties/land)"

### Step 2: Type Selection
**If Seller:** "What type of seller registration?
1. **Standard** - Regular property registration
2. **With Marketing Agreement** - Includes marketing terms
3. **Rental Property** - For landlords/rentals
4. **Advanced** - Multiple properties or special terms"

**If Developer:** "Is a viewing arranged?
1. **Viewing Arranged** - Viewing is scheduled
2. **No Viewing** - No viewing scheduled yet"

**If Bank:** "Is it for a property or land?
1. **Property** - House/apartment from bank
2. **Land** - Land/parcel from bank"

### Step 3: Multiple Sellers Check
**Sophia:** "Will this registration be sent to multiple sellers? (e.g., husband and wife, co-owners)"

### Step 4: Information Collection
- Follow the specific instruction file for the determined type
- Collect ALL required fields
- Don't generate until complete

### Step 5: Generation
- Generate exact email format
- Send subject line separately

## Subject Line Format
- Standard: `Registration – [Buyer Name] – [Property Reference]`
- Bank: `Registration – [Client Name] – [Property Reference]`
- Developer: `Registration – [Client Names] – [Project Name]`
- Multiple: `Registration – [Buyer Name] – Multiple Properties – [Location]`