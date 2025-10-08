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
    // Registration Templates
    this.createRegistrationInstructions();

    // Email Templates
    this.createEmailInstructions();

    // Viewing Templates
    this.createViewingInstructions();

    // Agreement Templates
    this.createAgreementInstructions();

    // Social Media Templates
    this.createSocialInstructions();
  }

  /**
   * Create registration template instructions
   */
  private createRegistrationInstructions(): void {
    // Seller Registration Standard
    this.microInstructionsCache.set('seller_registration_standard', {
      templateId: 'seller_registration_standard',
      category: 'registration',
      instructions: `You are generating a standard seller registration document.

Collect these required fields:
1. Client Information (buyer name(s))
2. Property Introduced (reg no. or description)
3. Property Link (use "Not provided" if blank)
4. Viewing Arranged For (date & time)

Optional: Ask about immediate-relatives security clause.

Output format:
- Use greeting with seller name or "XXXXX" fallback
- Use exact template wording with {{VARIABLE}} replacements
- Bold field labels with *asterisks*
- Mask phone numbers with XX (99 07 67 32 → 99 XX 67 32)
- Include subject line
- No confirmation step - output document immediately after collecting fields`,

      requiredFields: ['CLIENT_INFORMATION', 'PROPERTY_INTRODUCED', 'VIEWING_DATETIME'],
      optionalFields: ['PROPERTY_LINK', 'SELLER_NAME'],
      validationRules: [
        { field: 'VIEWING_DATETIME', rule: 'Must include date and time' },
        { field: 'CLIENT_INFORMATION', rule: 'Must include buyer name(s)' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: true,
        includeSubjectLine: true,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 25,
      contextExamples: [
        {
          input: 'Standard registration. Client: Nikos Georgiou. Property: 0/1789 Tala. Viewing: Saturday 14:00',
          output: 'Ask for property link and security clause preference, then generate document',
          explanation: 'Collect missing optional fields before generating'
        }
      ]
    });

    // Seller Registration Marketing
    this.microInstructionsCache.set('seller_registration_marketing', {
      templateId: 'seller_registration_marketing',
      category: 'registration',
      instructions: `You are generating a seller registration with marketing agreement.

Collect these required fields:
1. Client Information (buyer name(s))
2. Property Introduced (reg no. or description)
3. Property Link (use "Not provided" if blank)
4. Viewing Arranged For (date & time)
5. Agency Fee % (default to 2% if not provided)

Optional clauses to ask about:
- No-direct-contact clause
- Immediate-relatives security clause

Output format:
- Use greeting with seller name
- Include all optional clauses if agent agrees
- Always append title deed reminder from template
- Bold field labels with *asterisks*
- Mask phone numbers with XX
- Include subject line
- No confirmation step`,

      requiredFields: ['CLIENT_INFORMATION', 'PROPERTY_INTRODUCED', 'VIEWING_DATETIME', 'AGENCY_FEE_PERCENT'],
      optionalFields: ['PROPERTY_LINK', 'SELLER_NAME', 'NO_DIRECT_CONTACT_CLAUSE', 'IMMEDIATE_RELATIVES_CLAUSE'],
      validationRules: [
        { field: 'AGENCY_FEE_PERCENT', rule: 'Must be a percentage or "Not provided"' },
        { field: 'VIEWING_DATETIME', rule: 'Must include date and time' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: true,
        includeSubjectLine: true,
        appendReminders: true,
        noConfirmation: true
      },
      estimatedTokens: 30,
      contextExamples: [
        {
          input: 'Marketing registration. Agency fee 2%. Include both clauses.',
          output: 'Collect client info, property details, viewing time, then generate with clauses',
          explanation: 'Include both optional clauses when requested'
        }
      ]
    });

    // Bank Registration Property
    this.microInstructionsCache.set('bank_registration_property', {
      templateId: 'bank_registration_property',
      category: 'registration',
      instructions: `You are generating a bank property registration.

Collect these required fields:
1. Client full name
2. Client phone number (mask middle digits)
3. Property link OR property registration/description
4. Agent phone number (mask middle digits)

Auto-detect bank team from URL:
- remuproperties → Remu Team
- gordian → Gordian Team
- altia → Altia Team
- altamira → Altamira Team
- No match → "Dear Team"

Output format:
- Use detected team greeting
- Use exact template wording
- Mask all phone numbers
- Include subject line
- No confirmation step`,

      requiredFields: ['CLIENT_FULL_NAME', 'CLIENT_PHONE', 'PROPERTY_LINK_OR_DESCRIPTION', 'AGENT_PHONE'],
      optionalFields: ['BANK_TEAM'],
      validationRules: [
        { field: 'CLIENT_PHONE', rule: 'Must be valid phone number' },
        { field: 'AGENT_PHONE', rule: 'Must be valid phone number' }
      ],
      outputFormat: {
        boldLabels: true,
        maskPhoneNumbers: true,
        includeSubjectLine: true,
        appendReminders: false,
        noConfirmation: true
      },
      estimatedTokens: 20,
      contextExamples: [
        {
          input: 'Bank registration for remuproperties',
          output: 'Greet "Dear Remu Team", collect client details, generate document',
          explanation: 'Auto-detect bank team from URL'
        }
      ]
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

First ask: "Which type of registration do you need: (1) Seller(s), (2) Developer, or (3) Bank?"

For sellers: Always ask "Do you want standard registration or marketing agreement together?"

Use exact template wording, bold labels with *asterisks*, mask phone numbers with XX.`,
        requiredFields: ['REGISTRATION_TYPE'],
        optionalFields: ['INCLUDE_MARKETING'],
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