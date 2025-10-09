/**
 * Enhanced Template Structure Proposal
 *
 * This shows how templates could be structured for better performance and understanding
 */

export interface EnhancedTemplate {
  // Core identification
  id: string;
  name: string;
  version: string;

  // Categorization
  category: 'registration' | 'email' | 'viewing' | 'agreement' | 'social';
  subcategory: string;

  // Performance metadata
  metadata: {
    priority: number; // 1-10, higher = more commonly used
    estimatedTokens: number;
    averageResponseTime: number; // ms
    complexity: 'simple' | 'medium' | 'complex';
    confidence: number; // AI confidence in template selection
  };

  // Trigger patterns
  triggers: {
    keywords: string[];
    phrases: string[];
    patterns: string[];
    semanticExamples: string[];
  };

  // Flow definition (for multi-step templates)
  flow?: {
    steps: FlowStep[];
    decisionPoints: DecisionPoint[];
  };

  // Field definitions
  fields: {
    required: FieldDefinition[];
    optional: FieldDefinition[];
    conditional: ConditionalField[];
  };

  // Content templates
  content: {
    subject?: string; // For emails
    body: string;
    variables: VariableMapping[];
    formatting: FormattingRules;
  };

  // Instructions for AI
  instructions: {
    systemPrompt: string;
    examples: Example[];
    constraints: string[];
    outputFormat: 'exact' | 'flexible' | 'creative';
  };

  // Analytics
  analytics: {
    usageCount: number;
    successRate: number;
    lastUsed: Date;
    feedback: UserFeedback[];
  };
}

export interface FlowStep {
  id: string;
  type: 'question' | 'info' | 'generation';
  content: string;
  options?: string[];
  nextStep?: string;
  condition?: string;
}

export interface DecisionPoint {
  question: string;
  options: {
    value: string;
    nextStep: string;
    templateId?: string;
  }[];
}

export interface FieldDefinition {
  name: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'currency' | 'number' | 'select';
  label: string;
  placeholder?: string;
  validation?: ValidationRule[];
  masking?: {
    phone?: boolean;
    email?: boolean;
  };
}

export interface VariableMapping {
  template: string; // {{VARIABLE_NAME}}
  mapping: string; // Internal variable name
  transform?: string; // Transformation function
  default?: string;
}

export interface FormattingRules {
  boldLabels: boolean;
  maskPhoneNumbers: boolean;
  dateFormat: string;
  currencyFormat: string;
  lineBreaks: 'preserve' | 'normalize';
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'min' | 'max';
  value: any;
  message: string;
}

export interface ConditionalField {
  name: string;
  condition: string; // e.g., "property_type === 'land'"
  fields: FieldDefinition[];
}

export interface UserFeedback {
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  timestamp: Date;
}

// Example of enhanced registration template
export const enhancedSellerRegistration: EnhancedTemplate = {
  id: 'seller_registration_standard',
  name: 'Standard Seller Registration',
  version: '2.0.0',

  category: 'registration',
  subcategory: 'seller',

  metadata: {
    priority: 9, // Very commonly used
    estimatedTokens: 150,
    averageResponseTime: 2000,
    complexity: 'medium',
    confidence: 0.95
  },

  triggers: {
    keywords: ['registration', 'register', 'seller', 'property', 'standard'],
    phrases: [
      'i need a registration',
      'seller registration',
      'register my property',
      'standard registration'
    ],
    patterns: [
      '\\b(registration|register)\\b.*\\b(seller|property)\\b',
      '\\b(standard|regular)\\s+registration\\b'
    ],
    semanticExamples: [
      'I want to register my property for sale',
      'Need to do a seller registration',
      'Client wants to register their property'
    ]
  },

  flow: {
    steps: [
      {
        id: 'category',
        type: 'question',
        content: 'What type of registration do you need?\n1. **Seller/Owner Registration** (property owners)\n2. **Developer Registration** (new constructions/developments)\n3. **Bank Registration** (bank-owned properties/land)',
        options: ['seller', 'developer', 'bank'],
        nextStep: 'seller_type'
      },
      {
        id: 'seller_type',
        type: 'question',
        content: 'Which seller registration do you need?\n1. **Standard Registration** - Regular property registration\n2. **With Marketing Agreement** - Includes marketing terms\n3. **Rental Property** - For landlords/rentals\n4. **Advanced** - Multiple properties or special terms',
        options: ['standard', 'marketing', 'rental', 'advanced'],
        condition: 'previous_step === "seller"'
      }
    ],
    decisionPoints: [
      {
        question: 'Will this registration be sent to multiple sellers?',
        options: [
          { value: 'yes', nextStep: 'collect_coowners' },
          { value: 'no', nextStep: 'collect_fields' }
        ]
      }
    ]
  },

  fields: {
    required: [
      {
        name: 'seller_name',
        type: 'text',
        label: 'Seller Name',
        placeholder: 'Full legal name of seller',
        validation: [
          { type: 'required', value: true, message: 'Seller name is required' }
        ]
      },
      {
        name: 'buyer_names',
        type: 'text',
        label: 'Buyer Names',
        placeholder: 'Full legal names of all buyers'
      },
      {
        name: 'property_description',
        type: 'text',
        label: 'Property Description',
        placeholder: 'Address and brief description'
      },
      {
        name: 'viewing_datetime',
        type: 'datetime',
        label: 'Viewing Date and Time',
        placeholder: 'Date and time of property viewing'
      }
    ],
    optional: [
      {
        name: 'registration_number',
        type: 'text',
        label: 'Registration Number',
        placeholder: 'Property registration number (if known)'
      },
      {
        name: 'property_link',
        type: 'url',
        label: 'Property Link',
        placeholder: 'Zyprus property listing link'
      }
    ],
    conditional: [
      {
        name: 'co_owners',
        condition: 'multiple_sellers === true',
        fields: [
          {
            name: 'co_owner_names',
            type: 'text',
            label: 'Co-owner Names',
            placeholder: 'Names of all co-owners'
          }
        ]
      }
    ]
  },

  content: {
    subject: 'Property Registration - {{PROPERTY_ADDRESS}}',
    body: `Dear {{SELLER_NAME}},

This registration serves as confirmation that we, Zyprus Real Estate, are registering the below property:

**Property Details:**
*Address:* {{PROPERTY_ADDRESS}}
*Description:* {{PROPERTY_DESCRIPTION}}
*Registration Number:* {{REGISTRATION_NUMBER}}

**Buyer(s):** {{BUYER_NAMES}}

**Viewing Details:**
*Date:* {{VIEWING_DATE}}
*Time:* {{VIEWING_TIME}}

{{MULTIPLE_SELLERS_CLAUSE}}

We confirm that the property is being registered for sale exclusively through Zyprus Real Estate for a period of 6 months from the date of this registration.

Should you have any questions, please do not hesitate to contact us.

Best regards,
{{AGENT_NAME}}
Zyprus Real Estate
{{AGENT_PHONE}}
{{AGENT_LICENSE}}`,
    variables: [
      { template: '{{SELLER_NAME}}', mapping: 'seller_name' },
      { template: '{{BUYER_NAMES}}', mapping: 'buyer_names' },
      { template: '{{PROPERTY_ADDRESS}}', mapping: 'property_address' },
      { template: '{{PROPERTY_DESCRIPTION}}', mapping: 'property_description' },
      { template: '{{REGISTRATION_NUMBER}}', mapping: 'registration_number' },
      { template: '{{VIEWING_DATE}}', mapping: 'viewing_date' },
      { template: '{{VIEWING_TIME}}', mapping: 'viewing_time' },
      { template: '{{MULTIPLE_SELLERS_CLAUSE}}', mapping: 'multiple_sellers_clause',
        condition: 'multiple_sellers === true' },
      { template: '{{AGENT_NAME}}', mapping: 'agent_name', default: 'Your Agent' },
      { template: '{{AGENT_PHONE}}', mapping: 'agent_phone' },
      { template: '{{AGENT_LICENSE}}', mapping: 'agent_license' }
    ],
    formatting: {
      boldLabels: true,
      maskPhoneNumbers: true,
      dateFormat: 'DD/MM/YYYY',
      currencyFormat: '€€€,###',
      lineBreaks: 'preserve'
    }
  },

  instructions: {
    systemPrompt: `You are generating a Standard Seller Registration document for Zyprus Real Estate.

CRITICAL RULES:
- Use EXACT template wording with variable replacements
- Bold all field labels with *asterisks*
- Mask phone numbers: 99 07 67 32 → 99 XX 67 32
- Never invent information - ask for missing fields
- Output only the completed document
- Include proper spacing and line breaks`,
    examples: [
      {
        input: 'seller: John Smith, buyers: Mary & Tom Jones, property: 123 Main St, viewing: tomorrow 2pm',
        output: 'Dear John Smith,\n\nThis registration...',
        explanation: 'Basic information mapping to template'
      }
    ],
    constraints: [
      'Do not add any information not provided by user',
      'Follow exact template format',
      'Maintain professional tone',
      'Include all mandatory sections'
    ],
    outputFormat: 'exact'
  },

  analytics: {
    usageCount: 1247,
    successRate: 0.98,
    lastUsed: new Date('2025-01-09'),
    feedback: [
      { userId: 'agent1', rating: 5, comment: 'Perfect format', timestamp: new Date() }
    ]
  }
};