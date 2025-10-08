/**
 * Template Instruction Service
 *
 * Provides focused micro-instructions for specific templates
 * instead of loading the entire 216-line instruction set.
 */

import { DocumentCategory, IntentClassification } from './template-intent.service';

export interface MicroInstructions {
  templateId: string;
  category: DocumentCategory;
  instructions: string;
  requiredFields: string[];
  optionalFields: string[];
  validationRules: ValidationRule[];
  outputFormat: OutputFormat;
  estimatedTokens: number;
  contextExamples: ContextExample[];
}

export interface ValidationRule {
  field: string;
  rule: string;
  errorMessage?: string;
}

export interface OutputFormat {
  boldLabels: boolean;
  maskPhoneNumbers: boolean;
  includeSubjectLine: boolean;
  appendReminders: boolean;
  noConfirmation: boolean;
}

export interface ContextExample {
  input: string;
  output: string;
  explanation: string;
}

export class TemplateInstructionService {
  private microInstructionsCache = new Map<string, MicroInstructions>();

  constructor() {
    this.initializeMicroInstructions();
  }

  /**
   * Get focused instructions for specific template(s)
   */
  getMicroInstructions(
    templateIds: string[],
    category: DocumentCategory
  ): MicroInstructions[] {
    const instructions: MicroInstructions[] = [];

    for (const templateId of templateIds) {
      const cached = this.microInstructionsCache.get(templateId);
      if (cached && cached.category === category) {
        instructions.push(cached);
      }
    }

    // If no specific instructions found, return category-level instructions
    if (instructions.length === 0) {
      instructions.push(this.getCategoryInstructions(category));
    }

    return instructions;
  }

  /**
   * Get optimized instructions based on intent classification
   */
  getOptimizedInstructions(classification: IntentClassification): {
    instructions: string;
    templateCount: number;
    estimatedTokens: number;
    focusAreas: string[];
  } {
    const templateInstructions = this.getMicroInstructions(
      classification.likelyTemplates,
      classification.category
    );

    // Combine instructions from multiple templates if needed
    if (templateInstructions.length === 1) {
      const instruction = templateInstructions[0];
      if (!instruction) {
        throw new Error('Template instruction not found');
      }
      return {
        instructions: instruction.instructions,
        templateCount: 1,
        estimatedTokens: instruction.estimatedTokens,
        focusAreas: instruction.requiredFields
      };
    }

    // Merge multiple template instructions
    const mergedInstructions = this.mergeInstructions(templateInstructions);
    const totalTokens = templateInstructions.reduce((sum, inst) => sum + inst.estimatedTokens, 0);
    const allRequiredFields = [...new Set(
      templateInstructions.flatMap(inst => inst.requiredFields)
    )];

    return {
      instructions: mergedInstructions,
      templateCount: templateInstructions.length,
      estimatedTokens: totalTokens,
      focusAreas: allRequiredFields
    };
  }

  /**
   * Initialize micro-instructions for all templates
   */
  private initializeMicroInstructions(): void {
    // Registration Templates (11 new documents)
    this.createRegistrationInstructions();

    // Email Templates (keep existing)
    this.createEmailInstructions();

    // Viewing Templates (keep existing)
    this.createViewingInstructions();

    // Agreement Templates (keep existing)
    this.createAgreementInstructions();

    // Social Media Templates (keep existing)
    this.createSocialInstructions();
  }

  /**
   * Create registration template instructions (11 new templates)
   */
  private createRegistrationInstructions(): void {
    // 1. Standard Registration to Sellers
    this.microInstructionsCache.set('standard_registration_to_sellers', {
      templateId: 'standard_registration_to_sellers',
      category: 'registration',
      instructions: `You are generating a STANDARD REGISTRATION TO SELLERS.

CRITICAL RULES:
- DO NOT generate document until ALL required fields are collected
- Ask for missing information BEFORE generating
- Use **bold formatting** for field labels: **Field Name:**
- Copy-paste exact template structure, only replace variables
- No confirmation step - generate immediately after collecting all fields

Required fields to collect:
1. **Client Information:** Buyer name(s) - ask if single or multiple buyers
2. **Property Introduced:** Reg number or description
3. **Property Link:** Optional but ask if available
4. **Viewing Arranged for:** Date and time

Formatting rules:
- Phone masking: 99 07 67 32 → 99 ** 67 32
- Use exact template wording from the source document
- Maintain original formatting and structure
- Add examples if user needs clarification

If user doesn't mention viewing time, ask: "What date and time should I schedule the viewing?"`,

      requiredFields: ['client_name', 'property_introduced', 'viewing_datetime'],
      optionalFields: ['property_link', 'seller_name'],
      validationRules: [
        { field: 'client_name', rule: 'Must include buyer name(s)' },
        { field: 'viewing_datetime', rule: 'Must include date and time' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: true,
        includeSubjectLine: true,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 25,
      contextExamples: []
    });

    // 2. Registration and Marketing Agreement
    this.microInstructionsCache.set('registration_and_marketing_agreement', {
      templateId: 'registration_and_marketing_agreement',
      category: 'registration',
      instructions: `You are generating a REGISTRATION AND MARKETING AGREEMENT.

CRITICAL RULES:
- DO NOT generate document until ALL required fields are collected
- Ask for missing information BEFORE generating
- Use **bold formatting** for field labels: **Field Name:**
- Copy-paste exact template structure, only replace variables
- No confirmation step - generate immediately after collecting all fields

Required fields to collect:
1. **Client Information:** Buyer name(s)
2. **Property Introduced:** Reg number or description
3. **Viewing arranged for:** Date and time
4. **Fees:** Agency fee percentage (default 5% + VAT if not specified)

Optional clauses to ask about:
- No-direct-contact clause (red note - can be removed if requested)
- Multiple sellers authorization clause if only one confirms

Formatting rules:
- Phone masking: 99 07 67 32 → 99 ** 67 32
- Include red notes about optional clauses
- Add title deed reminder note
- Use exact template wording

If user doesn't specify agency fee, ask: "What agency fee percentage should I include?"`,

      requiredFields: ['client_name', 'property_introduced', 'viewing_datetime', 'agency_fee'],
      optionalFields: ['property_link', 'no_direct_contact_clause', 'multiple_sellers_clause'],
      validationRules: [
        { field: 'agency_fee', rule: 'Must specify percentage' },
        { field: 'client_name', rule: 'Must include buyer name(s)' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: true,
        includeSubjectLine: true,
        appendReminders: true,
        noConfirmation: true
      },
      estimatedTokens: 30,
      contextExamples: []
    });

    // 3. Very Advanced Registration
    this.microInstructionsCache.set('very_advanced_registration', {
      templateId: 'very_advanced_registration',
      category: 'registration',
      instructions: `You are generating a VERY ADVANCED REGISTRATION.

CRITICAL RULES:
- DO NOT generate document until ALL required fields are collected
- Ask for missing information BEFORE generating
- Use **bold formatting** for field labels: **Field Name:**
- Copy-paste exact template structure, only replace variables
- No confirmation step - generate immediately after collecting all fields

Required fields to collect:
1. **Client Information:** Buyer name and related companies
2. **Property Introduced:** Multiple registration numbers if applicable
3. **Our Agency Fees:** Percentage (default 4% + VAT)
4. **Payment Terms:** Usually 50% upfront (confirm if different)
5. **Owner Entities:** All legal owners being represented

Important notes to include:
- This is for rare cases with multiple sellers or complex payment arrangements
- Include notes about payment timing
- Ask about viewing arrangements (may not be needed for full registration)

If user doesn't specify payment terms, ask: "What are the payment terms - should I specify 50% upfront?"`,

      requiredFields: ['client_name', 'property_introduced', 'agency_fee', 'payment_terms', 'owner_entities'],
      optionalFields: ['viewing_arrangement', 'complex_payment_notes'],
      validationRules: [
        { field: 'client_name', rule: 'Must include buyer name(s)' },
        { field: 'agency_fee', rule: 'Must specify percentage' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: true,
        includeSubjectLine: true,
        appendReminders: true,
        noConfirmation: true
      },
      estimatedTokens: 35,
      contextExamples: []
    });

    // 4. Standard Registration for Rentals
    this.microInstructionsCache.set('standard_registration_for_rentals_to_landlords', {
      templateId: 'standard_registration_for_rentals_to_landlords',
      category: 'registration',
      instructions: `You are generating a STANDARD REGISTRATION FOR RENTALS.

CRITICAL RULES:
- DO NOT generate document until ALL required fields are collected
- Ask for missing information BEFORE generating
- Use **bold formatting** for field labels: **Field Name:**
- Copy-paste exact template structure, only replace variables
- No confirmation step - generate immediately after collecting all fields

Required fields to collect:
1. **Client Information:** Potential tenant name(s)
2. **Property Introduced:** Property description
3. **Viewing Arranged for:** Date and time
4. **Fees:** First month's rental amount

Special notes:
- Use "landlord" instead of "seller"
- Use "tenant" instead of "buyer"
- Include optional clause about multiple sellers if needed
- Add red notes about optional clauses

If user doesn't specify rental amount, ask: "What is the monthly rental amount for the property?"`,

      requiredFields: ['tenant_name', 'property_introduced', 'viewing_datetime', 'rental_fee'],
      optionalFields: ['property_link', 'multiple_sellers_clause'],
      validationRules: [
        { field: 'tenant_name', rule: 'Must include tenant name(s)' },
        { field: 'rental_fee', rule: 'Must specify rental amount' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: true,
        includeSubjectLine: true,
        appendReminders: true,
        noConfirmation: true
      },
      estimatedTokens: 25,
      contextExamples: []
    });

    // 5. Property Registration Banks
    this.microInstructionsCache.set('property_registration_banks', {
      templateId: 'property_registration_banks',
      category: 'registration',
      instructions: `You are generating a PROPERTY REGISTRATION FOR BANKS.

CRITICAL RULES:
- DO NOT generate document until ALL required fields are collected
- Ask for missing information BEFORE generating
- Use **bold formatting** for field labels: **Field Name:**
- Copy-paste exact template structure, only replace variables
- No confirmation step - generate immediately after collecting all fields

Required fields to collect:
1. **Bank Team:** Auto-detect from URL or ask (Remu Team, Gordian Team, Altia Team, etc.)
2. **Agent Mobile:** Phone number (will be masked)
3. **Registration Details:** Client name + phone (masked)
4. **Property Link:** Must be from bank

Phone masking rules:
- Agent: 99 07 67 32 → 99 ** 67 32
- Client: +44 79 83 24 71 → +44 79 ** 83 24 71

Auto-detection:
- remuproperties.com → "Dear Remu Team"
- If bank not clear from URL, ask: "Which bank team should I address this to?"`,

      requiredFields: ['bank_team', 'agent_mobile', 'client_name_phone', 'property_link'],
      optionalFields: [],
      validationRules: [
        { field: 'property_link', rule: 'Must be bank property link' },
        { field: 'client_name_phone', rule: 'Must include client name and phone' }
      ],
      outputFormat: {
        boldLabels: false,
        maskPhoneNumbers: true,
        includeSubjectLine: false,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 20,
      contextExamples: []
    });

    // 6. Land Registration Banks
    this.microInstructionsCache.set('land_registration_banks', {
      templateId: 'land_registration_banks',
      category: 'registration',
      instructions: `You are generating a LAND REGISTRATION FOR BANKS.

CRITICAL RULES:
- DO NOT generate document until ALL required fields are collected
- Ask for missing information BEFORE generating
- Use **bold formatting** for field labels: **Field Name:**
- Copy-paste exact template structure, only replace variables
- No confirmation step - generate immediately after collecting all fields

Required fields to collect:
1. **Bank Team:** Auto-detect from URL or ask
2. **Agent Mobile:** Phone number (will be masked)
3. **Registration Details:** Client name + phone (masked)
4. **Property Link:** Must be from bank
5. **Viewing Form:** Must be attached (remind user)

Important notes:
- Remind user: "Don't forget to attach the viewing form when sending"
- Banks require viewing forms because sales staff don't attend viewings
- Phone masking applies to all numbers

If user doesn't mention viewing form, remind: "Please remember to attach the viewing form for land registrations."`,

      requiredFields: ['bank_team', 'agent_mobile', 'client_name_phone', 'property_link'],
      optionalFields: ['viewing_form_reminder'],
      validationRules: [
        { field: 'property_link', rule: 'Must be bank property link' },
        { field: 'client_name_phone', rule: 'Must include client name and phone' }
      ],
      outputFormat: {
        boldLabels: false,
        maskPhoneNumbers: true,
        includeSubjectLine: false,
        appendReminders: true,
        noConfirmation: true
      },
      estimatedTokens: 22,
      contextExamples: []
    });

    // 7. Developer Registration Viewing Arranged
    this.microInstructionsCache.set('developer_registration_viewing_arranged', {
      templateId: 'developer_registration_viewing_arranged',
      category: 'registration',
      instructions: `You are generating a DEVELOPER REGISTRATION (VIEWING ARRANGED).

CRITICAL RULES:
- DO NOT generate document until ALL required fields are collected
- Ask for missing information BEFORE generating
- Use **bold formatting** for field labels: **Field Name:**
- Copy-paste exact template structure, only replace variables
- No confirmation step - generate immediately after collecting all fields

Required fields to collect:
1. **Developer Contact:** Person name at developer company
2. **Registration Details:** Client name(s)
3. **Viewing Arranged for:** Date and time
4. **Fees:** Agency fee percentage (default 8% + VAT)
5. **Payment Terms:** "Payable in full on the first 30% payment"

Important notes:
- Ask about project name and location if provided
- Confirm agency fee percentage
- Include acceptance clause at the end

If user doesn't specify agency fee, ask: "What agency fee percentage should I include (default is 8% + VAT)?"`,

      requiredFields: ['developer_contact', 'client_name', 'viewing_datetime', 'agency_fee'],
      optionalFields: ['project_name', 'location'],
      validationRules: [
        { field: 'agency_fee', rule: 'Must specify percentage' },
        { field: 'viewing_datetime', rule: 'Must include date and time' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: false,
        includeSubjectLine: true,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 25,
      contextExamples: []
    });

    // 8. Developer Registration No Viewing Arranged
    this.microInstructionsCache.set('developer_registration_no_viewing_arranged', {
      templateId: 'developer_registration_no_viewing_arranged',
      category: 'registration',
      instructions: `You are generating a DEVELOPER REGISTRATION (NO VIEWING ARRANGED).

CRITICAL RULES:
- DO NOT generate document until ALL required fields are collected
- Ask for missing information BEFORE generating
- Use **bold formatting** for field labels: **Field Name:**
- Copy-paste exact template structure, only replace variables
- No confirmation step - generate immediately after collecting all fields

Required fields to collect:
1. **Developer Contact:** Person name at developer company
2. **Registration Details:** Client name(s)
3. **Fees:** Agency fee percentage (default 8% + VAT)
4. **Payment Terms:** "Payable in full on the first 30% payment"

Important notes:
- Include full registration clause regardless of viewing
- Add enhanced transparency note
- Include acceptance of fees and terms

If user doesn't specify agency fee, ask: "What agency fee percentage should I include (default is 8% + VAT)?"`,

      requiredFields: ['developer_contact', 'client_name', 'agency_fee'],
      optionalFields: [],
      validationRules: [
        { field: 'agency_fee', rule: 'Must specify percentage' },
        { field: 'client_name', rule: 'Must include client name(s)' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: false,
        includeSubjectLine: true,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 22,
      contextExamples: []
    });

    // 9. Developer Registration Notes
    this.microInstructionsCache.set('developer_registration_notes', {
      templateId: 'developer_registration_notes',
      category: 'registration',
      instructions: `You are generating DEVELOPER REGISTRATION NOTES.

This is an informational template about agency fees.

Required fields to collect:
- Ask user what agency fee to add: 5%, 8%, or something else

This is a simple response - no complex document generation needed.`,

      requiredFields: ['agency_fee_preference'],
      optionalFields: [],
      validationRules: [],
      outputFormat: {
        boldLabels: false,
        maskPhoneNumbers: false,
        includeSubjectLine: false,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 10,
      contextExamples: []
    });

    // 10. Banks Registration Instructions
    this.microInstructionsCache.set('banks_registration_instructions', {
      templateId: 'banks_registration_instructions',
      category: 'registration',
      instructions: `You are generating BANKS REGISTRATION INSTRUCTIONS.

This contains clarifications for bank registrations:

Key points to explain:
1. **Phone masking:** 99 07 67 32 → 99 ** 67 32
2. **Property identification:** If no link available, ask for Reg No. or description
3. **Bank team detection:** Auto-detect from URL or ask if unclear
4. **Viewing forms:** Required for land registrations - sales staff don't attend viewings

This is an informational template for agent guidance.`,

      requiredFields: [],
      optionalFields: ['specific_question'],
      validationRules: [],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: false,
        includeSubjectLine: false,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 15,
      contextExamples: []
    });

    // 11. Multiple Sellers Registration Clause
    this.microInstructionsCache.set('multiple_sellers_registration_clause', {
      templateId: 'multiple_sellers_registration_clause',
      category: 'registration',
      instructions: `You are generating a MULTIPLE SELLERS REGISTRATION CLAUSE.

This clause is added when:
- Multiple sellers exist but only one will confirm registration
- Need legal authorization confirmation

Required fields to collect:
- Confirm if only one seller will respond
- Add the authorization clause to the registration

Clause text:
"By confirming this email, you also confirm that you are legally authorized to represent and act on behalf of the other co-owner(s) of the subject property."

This is typically added to other registration templates when needed.`,

      requiredFields: ['single_seller_confirmation'],
      optionalFields: [],
      validationRules: [],
      outputFormat: {
        boldLabels: false,
        maskPhoneNumbers: false,
        includeSubjectLine: false,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 12,
      contextExamples: []
    });
  }

  /**
   * Create email template instructions
   */
  private createEmailInstructions(): void {
    // Good Client Request Email
    this.microInstructionsCache.set('email_good_client_request', {
      templateId: 'email_good_client_request',
      category: 'email',
      instructions: `You are generating a good client request email.

Collect these required fields:
1. Client name
2. Property type (one word)
3. Location
4. Property link

Output format:
- Use exact template wording with {{VARIABLE}} replacements
- Include subject line with client name, property type, location
- No confirmation step - output immediately after collecting fields`,

      requiredFields: ['CLIENT_NAME', 'PROPERTY_TYPE', 'PROPERTY_LOCATION', 'PROPERTY_LINK'],
      optionalFields: [],
      validationRules: [
        { field: 'PROPERTY_TYPE', rule: 'Must be single word (apartment, house, etc.)' }
      ],
      outputFormat: {
        boldLabels: false,
        maskPhoneNumbers: false,
        includeSubjectLine: true,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 18,
      contextExamples: [
        {
          input: 'Good client request. Nikos. Apartment. Tala. https://zyprus.com/123',
          output: 'Generate email with all fields populated',
          explanation: 'Direct generation when all fields provided'
        }
      ]
    });

    // Phone Call Required
    this.microInstructionsCache.set('email_phone_call_required', {
      templateId: 'email_phone_call_required',
      category: 'email',
      instructions: `You are generating a "phone call required" notice email.

No fields required - this is a template-only response.

Output format:
- Use exact template wording
- Include subject line
- Output immediately - no confirmation needed`,

      requiredFields: [],
      optionalFields: [],
      validationRules: [],
      outputFormat: {
        boldLabels: false,
        maskPhoneNumbers: false,
        includeSubjectLine: true,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 12,
      contextExamples: [
        {
          input: 'Phone call required email',
          output: 'Generate template immediately',
          explanation: 'No fields needed for this template'
        }
      ]
    });
  }

  /**
   * Create viewing template instructions
   */
  private createViewingInstructions(): void {
    // Viewing Form Advanced
    this.microInstructionsCache.set('viewing_form_advanced', {
      templateId: 'viewing_form_advanced',
      category: 'viewing',
      instructions: `You are generating an advanced viewing form.

Collect these required fields for each client:
1. Full name(s)
2. ID/Passport number(s)
3. Property registration number
4. District
5. Municipality
6. Locality
7. Viewing date

For multiple clients:
- Duplicate name/ID/signature section for each client
- Use numbering: Client 1, Client 2, etc.

Output format:
- Use exact template wording
- Bold field labels with *asterisks*
- No confirmation step
- No subject line`,

      requiredFields: ['CLIENT_NAME', 'CLIENT_ID', 'PROPERTY_REGISTRATION_NUMBER', 'DISTRICT', 'MUNICIPALITY', 'LOCALITY', 'VIEWING_DATE'],
      optionalFields: [],
      validationRules: [
        { field: 'CLIENT_ID', rule: 'Must include ID or passport number' },
        { field: 'PROPERTY_REGISTRATION_NUMBER', rule: 'Must include property registration number' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: false,
        includeSubjectLine: false,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 22,
      contextExamples: [
        {
          input: 'Advanced viewing form for 2 clients',
          output: 'Collect details for both clients, generate form with duplicated sections',
          explanation: 'Handle multiple clients with separate sections'
        }
      ]
    });
  }

  /**
   * Create agreement template instructions
   */
  private createAgreementInstructions(): void {
    // Marketing Agreement Email
    this.microInstructionsCache.set('agreement_marketing_email', {
      templateId: 'agreement_marketing_email',
      category: 'agreement',
      instructions: `You are generating a marketing agreement via email.

Collect these required fields:
1. Seller name
2. Property description
3. Marketing price (numbers and words)
4. Agency fee % (default to 2% if not provided)

Optional clauses to ask about:
- No-direct-contact clause
- Immediate-relatives security clause

Output format:
- Use exact template wording
- Include optional clauses if agent agrees
- Bold field labels with *asterisks*
- Include subject line
- No confirmation step`,

      requiredFields: ['SELLER_NAME', 'PROPERTY_DESCRIPTION', 'MARKETING_PRICE', 'AGENCY_FEE_PERCENT'],
      optionalFields: ['NO_DIRECT_CONTACT_CLAUSE', 'IMMEDIATE_RELATIVES_CLAUSE'],
      validationRules: [
        { field: 'MARKETING_PRICE', rule: 'Must include both numbers and words' },
        { field: 'AGENCY_FEE_PERCENT', rule: 'Must be percentage value' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: false,
        includeSubjectLine: true,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 28,
      contextExamples: [
        {
          input: 'Marketing agreement. Price €350,000 (Three hundred fifty thousand euros)',
          output: 'Collect seller name, property details, agency fee, then generate',
          explanation: 'Price must be in both numbers and words format'
        }
      ]
    });
  }

  /**
   * Create social media template instructions
   */
  private createSocialInstructions(): void {
    // Social Media CREA
    this.microInstructionsCache.set('social_media_crea', {
      templateId: 'social_media_crea',
      category: 'social',
      instructions: `You are generating social media CREA wording.

No fields required - output template content immediately.

If agent insists on adding mobile number:
- Explain preference for Zyprus landline tied to their mobile
- Include landline number instead

Output format:
- Use exact template wording
- No subject line
- Output immediately`,

      requiredFields: [],
      optionalFields: ['MOBILE_NUMBER'],
      validationRules: [],
      outputFormat: {
        boldLabels: false,
        maskPhoneNumbers: false,
        includeSubjectLine: false,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 15,
      contextExamples: [
        {
          input: 'Social media CREA template',
          output: 'Generate template content immediately',
          explanation: 'Template-only response'
        }
      ]
    });
  }

  /**
   * Get category-level instructions when no specific template found
   */
  private getCategoryInstructions(category: DocumentCategory): MicroInstructions {
    const categoryInstructions = {
      registration: {
        templateId: 'registration_general',
        category: 'registration',
        instructions: `You are generating a registration document.

IMPORTANT: Follow TWO-STEP clarification process:

Step 1: Ask "Which type of registration do you need: (1) Seller(s), (2) Developer, or (3) Bank?"

Step 2: If they say "Seller(s)", ask "Which seller registration do you need: (1) Standard Registration, (2) Registration and Marketing Agreement, (3) Very Advanced Registration, or (4) Rental Registration?"

ONLY AFTER both steps are complete, start collecting required fields for the specific template.

Use exact template wording, bold labels with **asterisks**, mask phone numbers with XX.`,
        requiredFields: ['REGISTRATION_TYPE', 'SELLER_SUBTYPE'],
        optionalFields: [],
        validationRules: [],
        outputFormat: {
          boldLabels: true,
          maskPhoneNumbers: true,
          includeSubjectLine: true,
          appendReminders: false,
          noConfirmation: true
        },
        estimatedTokens: 25,
        contextExamples: []
      },

      email: {
        templateId: 'email_general',
        category: 'email',
        instructions: `You are generating an email template.

Ask: "Which email template do you need? Please choose 1-15:"
List options: Good Client Request, Phone Call Required, Valuation Quote, Send Options, etc.

Use exact template wording with variable replacements.`,
        requiredFields: ['EMAIL_TEMPLATE_TYPE'],
        optionalFields: [],
        validationRules: [],
        outputFormat: {
          boldLabels: false,
          maskPhoneNumbers: false,
          includeSubjectLine: true,
          appendReminders: false,
          noConfirmation: true
        },
        estimatedTokens: 20,
        contextExamples: []
      },

      viewing: {
        templateId: 'viewing_general',
        category: 'viewing',
        instructions: `You are generating a viewing form or email.

Ask: "Which viewing form do you need: (1) Advanced, (2) Standard, (3) Email step 1, or (4) Email step 2?"

Use exact template wording, bold labels with *asterisks*.`,
        requiredFields: ['VIEWING_FORM_TYPE'],
        optionalFields: [],
        validationRules: [],
        outputFormat: {
          boldLabels: true,
          maskPhoneNumbers: false,
          includeSubjectLine: false,
          appendReminders: false,
          noConfirmation: true
        },
        estimatedTokens: 18,
        contextExamples: []
      },

      agreement: {
        templateId: 'agreement_general',
        category: 'agreement',
        instructions: `You are generating an agreement document.

Ask: "Which agreement do you need: (1) Marketing via email, (2) Selling request received, (3) Recommended asking price, (4) Overpriced notice, (5) Exclusive selling agreement, or (6) Marketing agreement for signature?"

Use exact template wording, bold labels with *asterisks*.`,
        requiredFields: ['AGREEMENT_TYPE'],
        optionalFields: [],
        validationRules: [],
        outputFormat: {
          boldLabels: true,
          maskPhoneNumbers: false,
          includeSubjectLine: true,
          appendReminders: false,
          noConfirmation: true
        },
        estimatedTokens: 22,
        contextExamples: []
      },

      social: {
        templateId: 'social_general',
        category: 'social',
        instructions: `You are generating social media content.

Output CREA wording template immediately.

If agent requests mobile number: Explain preference for Zyprus landline.`,
        requiredFields: [],
        optionalFields: [],
        validationRules: [],
        outputFormat: {
          boldLabels: false,
          maskPhoneNumbers: false,
          includeSubjectLine: false,
          appendReminders: false,
          noConfirmation: true
        },
        estimatedTokens: 15,
        contextExamples: []
      }
    };

    return categoryInstructions[category] as MicroInstructions;
  }

  /**
   * Merge multiple template instructions
   */
  private mergeInstructions(instructions: MicroInstructions[]): string {
    if (instructions.length === 1) {
      const instruction = instructions[0];
      if (!instruction) {
        throw new Error('Template instruction not found for merging');
      }
      return instruction.instructions;
    }

    const mainInstruction = instructions[0];
    if (!mainInstruction) {
      throw new Error('Main template instruction not found for merging');
    }
    const additionalTemplates = instructions.slice(1);

    let merged = mainInstruction.instructions;

    if (additionalTemplates.length > 0) {
      merged += `\n\nAlternative templates available:\n`;
      additionalTemplates.forEach((inst, index) => {
        merged += `${index + 1}. ${inst.templateId}\n`;
      });
    }

    return merged;
  }

  /**
   * Get instruction performance metrics
   */
  getMetrics(): {
    totalInstructions: number;
    averageTokens: number;
    categoryBreakdown: Record<string, number>;
  } {
    const instructions = Array.from(this.microInstructionsCache.values());
    const categoryBreakdown: Record<string, number> = {};

    instructions.forEach(inst => {
      categoryBreakdown[inst.category] = (categoryBreakdown[inst.category] || 0) + 1;
    });

    const totalTokens = instructions.reduce((sum, inst) => sum + inst.estimatedTokens, 0);
    const averageTokens = totalTokens / instructions.length;

    return {
      totalInstructions: instructions.length,
      averageTokens: Math.round(averageTokens),
      categoryBreakdown
    };
  }

  /**
   * Update instruction based on performance feedback
   */
  updateInstruction(templateId: string, updates: Partial<MicroInstructions>): void {
    const existing = this.microInstructionsCache.get(templateId);
    if (existing) {
      this.microInstructionsCache.set(templateId, { ...existing, ...updates });
    }
  }
}