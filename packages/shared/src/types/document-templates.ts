/**
 * Document Template Taxonomy
 *
 * Comprehensive catalog of all 35+ document templates available in Sophia
 * Defines required/optional fields, validation rules, and conditional logic
 */

export enum DocumentCategory {
  EMAIL_TEMPLATE = 'email_template',
  REGISTRATION_FORM = 'registration_form',
  VIEWING_FORM = 'viewing_form',
  AGREEMENT = 'agreement',
}

export enum EmailTemplateType {
  // Client Request Templates
  GOOD_CLIENT_REQUEST_EMAIL = 'good_client_request_email',
  GOOD_CLIENT_REQUEST_WHATSAPP = 'good_client_request_whatsapp',
  PHONE_CALL_REQUIRED_NOTICE = 'phone_call_required_notice',

  // Valuation Templates
  VALUATION_QUOTE_FEE = 'valuation_quote_fee',
  VALUATION_REQUEST_RECEIVED = 'valuation_request_received',

  // Client Follow-up Templates
  NO_PHONE_NUMBER_PROVIDED = 'no_phone_number_provided',
  SEND_OPTIONS_UNSATISFIED_I = 'send_options_unsatisfied_i',
  SEND_OPTIONS_UNSATISFIED_WE = 'send_options_unsatisfied_we',
  SEND_SINGLE_OPTION_I = 'send_single_option_i',

  // Buyer Templates
  BUYER_VIEWING_CONFIRMATION = 'buyer_viewing_confirmation',

  // Adjustment/Rejection Templates
  NO_OPTIONS_LOW_BUDGET = 'no_options_low_budget',
  MULTIPLE_REGIONS_ADJUSTMENT = 'multiple_regions_adjustment',
  TIME_WASTER_POLITE_REJECTION = 'time_waster_polite_rejection',
  STILL_LOOKING_FOLLOWUP = 'still_looking_followup',
  NO_COOPERATION_WITH_AGENTS = 'no_cooperation_with_agents',
}

export enum RegistrationFormType {
  BANKS_PROPERTY = 'banks_property',
  BANKS_LAND = 'banks_land',
  DEVELOPERS_VIEWING_ARRANGED = 'developers_viewing_arranged',
  DEVELOPERS_NO_VIEWING = 'developers_no_viewing',
  OWNERS_STANDARD = 'owners_standard',
  OWNERS_WITH_MARKETING_AGREEMENT = 'owners_with_marketing_agreement',
  OWNERS_RENTAL = 'owners_rental',
  OWNERS_ADVANCED = 'owners_advanced',
  MULTIPLE_SELLERS = 'multiple_sellers',
}

export enum ViewingFormType {
  ADVANCED_WITH_TERMS = 'advanced_with_terms',
  STANDARD_SIMPLE = 'standard_simple',
  EMAIL_PROCESS_STEP_1 = 'email_process_step_1',
  EMAIL_PROCESS_STEP_2 = 'email_process_step_2',
}

export enum AgreementType {
  EXCLUSIVE_SELLING = 'exclusive_selling',
  MARKETING_VIA_EMAIL = 'marketing_via_email',
  MARKETING_FOR_SIGNATURE = 'marketing_for_signature',
  SELLING_REQUEST_RECEIVED = 'selling_request_received',
  OVERPRICED_PROPERTY = 'overpriced_property',
}

/**
 * Field definition for document templates
 */
export interface DocumentField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'url' | 'date' | 'number' | 'multiline' | 'select';
  required: boolean;
  description: string;
  validation?: FieldValidation;
  conditional?: ConditionalLogic;
  options?: string[]; // For select fields
  placeholder?: string;
}

export interface FieldValidation {
  pattern?: string; // Regex pattern
  minLength?: number;
  maxLength?: number;
  customValidator?: string; // Reference to custom validation function
}

export interface ConditionalLogic {
  dependsOn: string; // Field name
  condition: 'equals' | 'notEquals' | 'contains' | 'exists';
  value?: any;
  showWhen: boolean;
}

/**
 * Document template definition
 */
export interface DocumentTemplate {
  id: string;
  category: DocumentCategory;
  type: string; // Specific template type from enums above
  name: string;
  description: string;
  templateFilename: string; // Filename in Knowledge Base
  fields: DocumentField[];
  exampleUsage?: string;
  specialInstructions?: string[];
}

/**
 * Document request session for tracking multi-turn conversations
 */
export interface DocumentRequestSession {
  id: string;
  agent_id: string;
  document_template_id: string;
  collected_fields: Record<string, any>;
  missing_fields: string[];
  status: 'collecting' | 'validating' | 'complete' | 'generating' | 'sent';
  created_at: string;
  updated_at: string;
  last_prompt?: string;
}

/**
 * Complete document taxonomy catalog
 */
export const DOCUMENT_CATALOG: Record<string, DocumentTemplate> = {
  // ========================================
  // REGISTRATION FORMS
  // ========================================

  reg_banks_property: {
    id: 'reg_banks_property',
    category: DocumentCategory.REGISTRATION_FORM,
    type: RegistrationFormType.BANKS_PROPERTY,
    name: 'Bank/REMU Property Registration',
    description: 'Registration form for properties from banks (REMU, Gordian, Altia, Altamira, etc.)',
    templateFilename: 'Reg_Banks.docx',
    fields: [
      {
        name: 'bank_name',
        label: 'Bank/Team Name',
        type: 'text',
        required: false, // Can be inferred from property_link
        description: 'Bank name (e.g., "Remu Team", "Gordian Team", "Altia Team"). Can be inferred from property URL.',
        placeholder: 'Remu Team',
      },
      {
        name: 'client_name',
        label: 'Client Full Name',
        type: 'text',
        required: true,
        description: 'Full name of the potential buyer',
        placeholder: 'Natasha Stainthorpe',
      },
      {
        name: 'client_phone',
        label: 'Client Phone Number',
        type: 'phone',
        required: true,
        description: 'Client phone number (will be masked automatically)',
        validation: {
          customValidator: 'maskPhoneNumber',
        },
        placeholder: '+44 79 07 83 24 71',
      },
      {
        name: 'property_link',
        label: 'Property URL',
        type: 'url',
        required: true,
        description: 'Full URL from bank website (e.g., https://www.remuproperties.com/Cyprus/listing-29190)',
        validation: {
          pattern: '^https?://.+',
        },
        placeholder: 'https://www.remuproperties.com/Cyprus/listing-29190',
      },
      {
        name: 'agent_phone',
        label: 'Your Phone Number',
        type: 'phone',
        required: true,
        description: 'Agent phone number (will be masked automatically)',
        validation: {
          customValidator: 'maskPhoneNumber',
        },
        placeholder: '99 07 67 32',
      },
      {
        name: 'property_description',
        label: 'Property Description',
        type: 'text',
        required: false,
        description: 'Alternative property description if link not available (e.g., "Reg No. 0/1678 Tala, Paphos" or "Limas Building, Unit No. 103 Tala, Paphos")',
        conditional: {
          dependsOn: 'property_link',
          condition: 'notEquals',
          value: '',
          showWhen: false,
        },
      },
    ],
    specialInstructions: [
      'Phone masking: 99 07 67 32 → 99 ** 67 32 (hide middle 2 digits)',
      'Bank name can be inferred from property URL if visible',
      'If property_link is missing, require property_description (Reg No. or building description)',
    ],
  },

  reg_banks_land: {
    id: 'reg_banks_land',
    category: DocumentCategory.REGISTRATION_FORM,
    type: RegistrationFormType.BANKS_LAND,
    name: 'Bank/REMU Land Registration',
    description: 'Registration form for land parcels from banks (requires viewing form attachment)',
    templateFilename: 'Reg_Banks.docx',
    fields: [
      {
        name: 'bank_name',
        label: 'Bank/Team Name',
        type: 'text',
        required: false,
        description: 'Bank name (can be inferred from property URL)',
        placeholder: 'Remu Team',
      },
      {
        name: 'client_name',
        label: 'Client Full Name',
        type: 'text',
        required: true,
        description: 'Full name of the potential buyer',
        placeholder: 'Natasha Stainthorpe',
      },
      {
        name: 'client_phone',
        label: 'Client Phone Number',
        type: 'phone',
        required: true,
        description: 'Client phone number (will be masked automatically)',
        validation: {
          customValidator: 'maskPhoneNumber',
        },
        placeholder: '+44 79 07 83 24 71',
      },
      {
        name: 'property_link',
        label: 'Land Parcel URL',
        type: 'url',
        required: true,
        description: 'Full URL from bank website for land parcel',
        validation: {
          pattern: '^https?://.+',
        },
        placeholder: 'https://www.remuproperties.com/Cyprus/listing-29190',
      },
      {
        name: 'agent_phone',
        label: 'Your Phone Number',
        type: 'phone',
        required: true,
        description: 'Agent phone number (will be masked automatically)',
        validation: {
          customValidator: 'maskPhoneNumber',
        },
        placeholder: '99 07 67 32',
      },
    ],
    specialInstructions: [
      'Phone masking: 99 07 67 32 → 99 ** 67 32',
      'IMPORTANT: Remind agent to attach viewing form to the email',
      'Banks require viewing form for land because sales persons don\'t attend viewings',
    ],
  },

  reg_developers_viewing_arranged: {
    id: 'reg_developers_viewing_arranged',
    category: DocumentCategory.REGISTRATION_FORM,
    type: RegistrationFormType.DEVELOPERS_VIEWING_ARRANGED,
    name: 'Developer Registration (Viewing Arranged)',
    description: 'Registration to developers when viewing has been scheduled',
    templateFilename: 'Reg_Developers_.docx',
    fields: [
      {
        name: 'developer_contact_name',
        label: 'Developer Contact Name',
        type: 'text',
        required: true,
        description: 'Name of person/staff at developer company (e.g., "Fotis", "Aris")',
        placeholder: 'Fotis',
      },
      {
        name: 'client_names',
        label: 'Client Name(s)',
        type: 'text',
        required: true,
        description: 'Full names of buyer(s) (e.g., "Thomais Leonidou and Doros Antoniou")',
        placeholder: 'Thomais Leonidou and Doros Antoniou',
      },
      {
        name: 'project_name',
        label: 'Project Name',
        type: 'text',
        required: false,
        description: 'Name of development project (optional)',
        placeholder: 'Limas Project',
      },
      {
        name: 'project_location',
        label: 'Project Location',
        type: 'text',
        required: false,
        description: 'Location of project (optional)',
        placeholder: 'Tala, Paphos',
      },
      {
        name: 'viewing_datetime',
        label: 'Viewing Date & Time',
        type: 'text',
        required: true,
        description: 'Full viewing date and time',
        placeholder: 'Wednesday 21st October 2025 at 16:00pm',
      },
      {
        name: 'agency_fee_percentage',
        label: 'Agency Fee Percentage',
        type: 'number',
        required: true,
        description: 'Commission percentage (typically 5% or 8%)',
        placeholder: '8',
      },
    ],
    specialInstructions: [
      'Always ask agent for fee percentage (5%, 8%, or custom)',
      'Fees payable in full on first 30% payment',
      'Include acceptance clause: "Acceptance of registration implies acceptance of fees and terms"',
    ],
  },

  reg_developers_no_viewing: {
    id: 'reg_developers_no_viewing',
    category: DocumentCategory.REGISTRATION_FORM,
    type: RegistrationFormType.DEVELOPERS_NO_VIEWING,
    name: 'Developer Registration (No Viewing Arranged)',
    description: 'Registration to developers when viewing has NOT been scheduled yet',
    templateFilename: 'Reg_Developers_.docx',
    fields: [
      {
        name: 'developer_contact_name',
        label: 'Developer Contact Name',
        type: 'text',
        required: true,
        description: 'Name of person at developer company',
        placeholder: 'Aris',
      },
      {
        name: 'client_names',
        label: 'Client Name(s)',
        type: 'text',
        required: true,
        description: 'Full names of buyer(s)',
        placeholder: 'Neville Bester',
      },
      {
        name: 'agency_fee_percentage',
        label: 'Agency Fee Percentage',
        type: 'number',
        required: true,
        description: 'Commission percentage',
        placeholder: '8',
      },
    ],
    specialInstructions: [
      'Use different acceptance text: "Acceptance implies full registration regardless of viewing arrangement"',
      'This is for cases where agent will provide full project details for client review',
    ],
  },

  reg_owners_standard: {
    id: 'reg_owners_standard',
    category: DocumentCategory.REGISTRATION_FORM,
    type: RegistrationFormType.OWNERS_STANDARD,
    name: 'Standard Owner Registration',
    description: 'Standard registration form to property owners/sellers',
    templateFilename: 'Reg_ to Owners.docx',
    fields: [
      {
        name: 'seller_name',
        label: 'Seller Name',
        type: 'text',
        required: true,
        description: 'Name of property owner/seller',
        placeholder: 'Maria Kelpi',
      },
      {
        name: 'buyer_names',
        label: 'Buyer Name(s)',
        type: 'text',
        required: true,
        description: 'Full names of potential buyer(s)',
        placeholder: 'Katerina Anastasiou & Giorgos Ioannou',
      },
      {
        name: 'property_reg_number',
        label: 'Property Registration Number',
        type: 'text',
        required: false,
        description: 'Property Reg No. (e.g., "0/2456"). Optional if description provided.',
        placeholder: '0/2456',
      },
      {
        name: 'property_description',
        label: 'Property Description',
        type: 'text',
        required: true,
        description: 'Property description (e.g., "Limas Building Flat No. 103, Agios Athanasios, Limassol")',
        placeholder: 'Your property in Tala, Paphos',
      },
      {
        name: 'property_location',
        label: 'Property Location',
        type: 'text',
        required: true,
        description: 'Area/city of property',
        placeholder: 'Tala, Paphos',
      },
      {
        name: 'property_link',
        label: 'Zyprus Property Link',
        type: 'url',
        required: false,
        description: 'Optional Zyprus listing URL',
        placeholder: 'https://www.zyprus.com/property/40469/3-bedrooms-house-detached-house-in-tala-paphos',
      },
      {
        name: 'zyprus_id',
        label: 'Zyprus ID',
        type: 'text',
        required: false,
        description: 'Zyprus property ID if known',
        placeholder: '19248',
      },
      {
        name: 'viewing_datetime',
        label: 'Viewing Date & Time',
        type: 'text',
        required: true,
        description: 'Scheduled viewing date and time',
        placeholder: 'Saturday 26th September 2025 at 14:30pm',
      },
    ],
    specialInstructions: [
      'Subject line format: "Registration – [Buyer Name] – Reg No. [Number] – [Property Description]"',
      'Request confirmation: "Could you please reply \'Yes I confirm\'"',
      'Combine Reg No. and/or description as available',
    ],
  },

  reg_owners_with_marketing_agreement: {
    id: 'reg_owners_with_marketing_agreement',
    category: DocumentCategory.REGISTRATION_FORM,
    type: RegistrationFormType.OWNERS_WITH_MARKETING_AGREEMENT,
    name: 'Owner Registration + Marketing Agreement',
    description: 'Registration with marketing agreement terms (for riskier cases or properties with sale signs)',
    templateFilename: 'Reg_ to Owners.docx',
    fields: [
      {
        name: 'seller_name',
        label: 'Seller Name',
        type: 'text',
        required: true,
        description: 'Property owner name',
        placeholder: 'Hillyar Michael',
      },
      {
        name: 'buyer_names',
        label: 'Buyer Name(s)',
        type: 'text',
        required: true,
        description: 'Potential buyer names',
        placeholder: 'Costas Mylonas & Anna Mylonas',
      },
      {
        name: 'property_reg_number',
        label: 'Property Registration Number',
        type: 'text',
        required: false,
        description: 'Reg No. if available',
        placeholder: '0/5763',
      },
      {
        name: 'property_description',
        label: 'Property Description',
        type: 'text',
        required: true,
        description: 'Property description',
        placeholder: 'Townhouse - Erimi, Limassol',
      },
      {
        name: 'property_location',
        label: 'Property Location',
        type: 'text',
        required: true,
        description: 'Location',
        placeholder: 'Erimi, Limassol',
      },
      {
        name: 'viewing_datetime',
        label: 'Viewing Date & Time',
        type: 'text',
        required: true,
        description: 'Viewing date/time',
        placeholder: 'Sunday 20th of June 2026 at 10:30am',
      },
      {
        name: 'agency_fee_percentage',
        label: 'Agency Fee',
        type: 'number',
        required: true,
        description: 'Commission percentage',
        placeholder: '5',
      },
      {
        name: 'include_no_direct_contact_clause',
        label: 'Include No Direct Contact Clause?',
        type: 'select',
        required: true,
        description: 'Include clause preventing direct seller-buyer contact (can be removed if agent requests)',
        options: ['yes', 'no'],
        placeholder: 'yes',
      },
    ],
    specialInstructions: [
      'Includes marketing agreement terms with fees',
      'No direct contact clause: "In the unusual event that client communicates directly..."',
      'Agent can request to remove no-direct-contact clause',
      'Optional: Remind agent to attach title deed copy',
    ],
  },

  reg_owners_rental: {
    id: 'reg_owners_rental',
    category: DocumentCategory.REGISTRATION_FORM,
    type: RegistrationFormType.OWNERS_RENTAL,
    name: 'Rental Property Registration',
    description: 'Registration form for rental properties to landlords',
    templateFilename: 'Reg_ to Owners.docx',
    fields: [
      {
        name: 'landlord_name',
        label: 'Landlord Name',
        type: 'text',
        required: true,
        description: 'Property owner/landlord name',
        placeholder: 'Maria Kelpi',
      },
      {
        name: 'tenant_names',
        label: 'Potential Tenant Name(s)',
        type: 'text',
        required: true,
        description: 'Names of potential tenant(s)',
        placeholder: 'Katerina Anastasiou',
      },
      {
        name: 'property_description',
        label: 'Property Description',
        type: 'text',
        required: true,
        description: 'Full property description with building/unit info',
        placeholder: 'Limas Building, Flat No. 103 Tala, Paphos',
      },
      {
        name: 'property_link',
        label: 'Property Link',
        type: 'url',
        required: false,
        description: 'Optional Zyprus listing link',
      },
      {
        name: 'viewing_datetime',
        label: 'Viewing Date & Time',
        type: 'text',
        required: true,
        description: 'Viewing date/time',
        placeholder: 'Saturday 26th September 2025 at 14:30pm',
      },
      {
        name: 'include_no_direct_contact_clause',
        label: 'Include No Direct Contact Clause?',
        type: 'select',
        required: true,
        description: 'Include clause preventing direct contact',
        options: ['yes', 'no'],
      },
    ],
    specialInstructions: [
      'Fees for rentals: "The first agreed monthly rental amount"',
      'Payable if property rented to introduced client',
      'Can use "message" instead of "email" if agent requests',
    ],
  },

  reg_owners_advanced: {
    id: 'reg_owners_advanced',
    category: DocumentCategory.REGISTRATION_FORM,
    type: RegistrationFormType.OWNERS_ADVANCED,
    name: 'Advanced Owner Registration (Multiple Properties/Complex)',
    description: 'For complex cases: multiple sellers, multiple properties, payment before completion',
    templateFilename: 'Reg_ to Owners.docx',
    fields: [
      {
        name: 'seller_name',
        label: 'Seller Name',
        type: 'text',
        required: true,
        description: 'Main seller/representative name',
        placeholder: 'Louis Agathaggelou',
      },
      {
        name: 'buyer_names',
        label: 'Buyer Name(s)',
        type: 'text',
        required: true,
        description: 'Buyer name and any related companies',
        placeholder: 'Dmitry Buyanovsky and any directly related company',
      },
      {
        name: 'property_reg_numbers',
        label: 'Property Registration Numbers',
        type: 'text',
        required: true,
        description: 'All Reg Numbers (comma or space separated)',
        placeholder: '0/29346, 0/29348, 0/29350, 0/30149, 0/30847',
      },
      {
        name: 'property_description',
        label: 'Property Description',
        type: 'text',
        required: true,
        description: 'Property location and description',
        placeholder: 'Agios Theodoros, Paphos - Dominate Shopping Centre',
      },
      {
        name: 'agency_fee_percentage',
        label: 'Agency Fee',
        type: 'number',
        required: true,
        description: 'Commission percentage',
        placeholder: '4',
      },
      {
        name: 'payment_terms',
        label: 'Payment Terms',
        type: 'multiline',
        required: false,
        description: 'Special payment terms (e.g., "payable on first 50% payment")',
        placeholder: 'Fee payable in full upon receipt of initial 50% payment',
      },
      {
        name: 'owner_entities',
        label: 'Owner Legal Entities',
        type: 'text',
        required: false,
        description: 'List of owner entities if seller represents multiple parties',
        placeholder: 'CHRISTAKES L.AGATHANGELOU LIMITED, Agathaggelou Christoforos, etc.',
      },
      {
        name: 'viewing_datetime',
        label: 'Viewing Date & Time',
        type: 'text',
        required: false,
        description: 'Viewing date/time (optional if not arranged)',
      },
    ],
    specialInstructions: [
      'For rare complex cases with multiple properties/sellers',
      'Can include custom payment terms',
      'Acceptance clause about full registration regardless of viewing',
      'Legal entity confirmation if seller represents multiple owners',
    ],
  },

  reg_multiple_sellers: {
    id: 'reg_multiple_sellers',
    category: DocumentCategory.REGISTRATION_FORM,
    type: RegistrationFormType.MULTIPLE_SELLERS,
    name: 'Multiple Sellers Registration Note',
    description: 'Additional clause when only one seller will confirm registration for co-owners',
    templateFilename: 'Registrations multiple sellers .docx',
    fields: [
      {
        name: 'primary_seller_name',
        label: 'Primary Seller Name',
        type: 'text',
        required: true,
        description: 'The seller who will confirm on behalf of others (e.g., husband)',
        placeholder: 'Andreas Ioannou',
      },
      {
        name: 'co_owners',
        label: 'Co-owners',
        type: 'text',
        required: true,
        description: 'Other co-owners of property',
        placeholder: 'Maria Ioannou',
      },
    ],
    specialInstructions: [
      'Add to any registration when only one seller will reply',
      'Additional clause: "By confirming this email, you confirm you are legally authorized to represent co-owner(s)"',
      'Use when agent specifies sending registration only to one person (e.g., husband)',
    ],
  },

  // ========================================
  // EMAIL TEMPLATES
  // ========================================

  email_good_client_request: {
    id: 'email_good_client_request',
    category: DocumentCategory.EMAIL_TEMPLATE,
    type: EmailTemplateType.GOOD_CLIENT_REQUEST_EMAIL,
    name: 'Good Client Request Email',
    description: 'Email to arrange phone call with promising client who requested property',
    templateFilename: 'AI_Templates_Zyprus_Main.docx',
    fields: [
      {
        name: 'client_name',
        label: 'Client Name',
        type: 'text',
        required: true,
        description: 'Client full name',
        placeholder: 'Andreas Andreou',
      },
      {
        name: 'property_type',
        label: 'Property Type',
        type: 'text',
        required: true,
        description: 'One word property type (House, Apartment, Villa, etc.)',
        placeholder: 'House',
      },
      {
        name: 'property_location',
        label: 'Property Location',
        type: 'text',
        required: true,
        description: 'City/area of property',
        placeholder: 'Limassol',
      },
      {
        name: 'property_link',
        label: 'Property Link',
        type: 'url',
        required: true,
        description: 'Zyprus property URL',
        placeholder: 'https://www.zyprus.com/property/12345/',
      },
    ],
    exampleUsage: 'When a good quality client requests a property via website, send this to arrange phone discussion',
    specialInstructions: [
      'Subject: "Request - [Client Name] – [Property Type] – [Location]"',
      'If too many links, use just "Property" in subject',
      'Request 2 time/date options for phone call',
    ],
  },

  email_valuation_quote: {
    id: 'email_valuation_quote',
    category: DocumentCategory.EMAIL_TEMPLATE,
    type: EmailTemplateType.VALUATION_QUOTE_FEE,
    name: 'Valuation Quote with Fee',
    description: 'Email providing valuation quote and fee to property owner',
    templateFilename: 'AI_Templates_Zyprus_Main.docx',
    fields: [
      {
        name: 'client_name',
        label: 'Client Name',
        type: 'text',
        required: true,
        description: 'Property owner name',
        placeholder: 'Andreas Andreou',
      },
      {
        name: 'valuation_fee',
        label: 'Valuation Fee',
        type: 'text',
        required: true,
        description: 'Fee amount with currency',
        placeholder: '€500 Plus VAT',
      },
    ],
    specialInstructions: [
      'Subject: "Valuation Quote – [Client Name]"',
      'Include RICS/ETEK accreditation',
      'Include link to sample report: https://www.zyprus.com/sites/all/themes/zyprus/files/Property_Valuation_Sample_Cyprus_RICS_ETEK.pdf',
      'Mention two experienced valuers for quality control',
    ],
  },

  email_send_options_unsatisfied: {
    id: 'email_send_options_unsatisfied',
    category: DocumentCategory.EMAIL_TEMPLATE,
    type: EmailTemplateType.SEND_OPTIONS_UNSATISFIED_I,
    name: 'Send Property Options to Unsatisfied Client (I voice)',
    description: 'Follow-up email with property options for client we couldn\'t help previously',
    templateFilename: 'AI_Templates_Zyprus_Main.docx',
    fields: [
      {
        name: 'client_name',
        label: 'Client Name',
        type: 'text',
        required: true,
        description: 'Client name',
        placeholder: 'Andreas Andreou',
      },
      {
        name: 'property_location',
        label: 'Search Location',
        type: 'text',
        required: true,
        description: 'Area client is searching in',
        placeholder: 'Limassol',
      },
      {
        name: 'property_links',
        label: 'Property Links',
        type: 'multiline',
        required: true,
        description: 'Property links (one per line or comma-separated)',
        placeholder: 'https://www.zyprus.com/property/12345\nhttps://www.zyprus.com/property/67890',
      },
      {
        name: 'voice',
        label: 'Voice (I or WE)',
        type: 'select',
        required: true,
        description: 'Use "I" or "WE" voice (default is I unless agent specifies WE)',
        options: ['I', 'WE'],
      },
    ],
    specialInstructions: [
      'Default voice: "I" (unless agent specifically says WE)',
      'For clients we spoke with but couldn\'t help at the time',
      'Include option to update preferences or confirm no longer looking',
      'Format links as Property 1: [LINK], Property 2: [LINK], etc.',
    ],
  },

  email_no_options_low_budget: {
    id: 'email_no_options_low_budget',
    category: DocumentCategory.EMAIL_TEMPLATE,
    type: EmailTemplateType.NO_OPTIONS_LOW_BUDGET,
    name: 'No Options Available - Low Budget',
    description: 'Email explaining no suitable options within client budget, requesting adjustments',
    templateFilename: 'AI_Templates_Zyprus_Main.docx',
    fields: [
      {
        name: 'client_name',
        label: 'Client Name',
        type: 'text',
        required: true,
        description: 'Client name',
        placeholder: 'Andreas Andreou',
      },
    ],
    specialInstructions: [
      'Subject: "Adjustments required – [Client Name]"',
      'Politely explain no options available within budget/preferences',
      'Invite them to adjust budget, preferences, or areas of interest',
      'Leave door open for future opportunities',
    ],
  },

  email_still_looking: {
    id: 'email_still_looking',
    category: DocumentCategory.EMAIL_TEMPLATE,
    type: EmailTemplateType.STILL_LOOKING_FOLLOWUP,
    name: 'Are You Still Looking? Follow-up',
    description: 'Follow-up email asking if client still searching for property',
    templateFilename: 'AI_Templates_Zyprus_Main.docx',
    fields: [
      {
        name: 'client_name',
        label: 'Client Name',
        type: 'text',
        required: true,
        description: 'Client name',
        placeholder: 'Andreas Andreou',
      },
    ],
    specialInstructions: [
      'Subject: "Following up on your Property Search – [Client Name]"',
      'Can be used for both email and WhatsApp (agent specifies)',
      'Ask if still looking or already found property',
      'Request preference updates if still searching',
      'Ask to update records if no longer looking',
    ],
  },

  // ========================================
  // VIEWING FORMS
  // ========================================

  viewing_form_advanced: {
    id: 'viewing_form_advanced',
    category: DocumentCategory.VIEWING_FORM,
    type: ViewingFormType.ADVANCED_WITH_TERMS,
    name: 'Viewing Form - Advanced with Terms',
    description: 'Comprehensive viewing form with detailed legal terms and conditions',
    templateFilename: 'Zyprus_Viewing _form_Official_Advanced.docx',
    fields: [
      {
        name: 'client_name',
        label: 'Client Full Name',
        type: 'text',
        required: true,
        description: 'Buyer full name',
      },
      {
        name: 'client_id',
        label: 'ID/Passport Number',
        type: 'text',
        required: true,
        description: 'Client ID or passport number',
      },
      {
        name: 'property_reg_number',
        label: 'Property Registration Number',
        type: 'text',
        required: true,
        description: 'Property Reg No.',
        placeholder: '0/2456',
      },
      {
        name: 'district',
        label: 'District',
        type: 'text',
        required: true,
        description: 'Property district',
        placeholder: 'Paphos',
      },
      {
        name: 'municipality',
        label: 'Municipality',
        type: 'text',
        required: true,
        description: 'Municipality',
        placeholder: 'Tala',
      },
      {
        name: 'locality',
        label: 'Locality',
        type: 'text',
        required: true,
        description: 'Specific locality',
        placeholder: 'Tala',
      },
      {
        name: 'viewing_date',
        label: 'Viewing Date',
        type: 'date',
        required: true,
        description: 'Date of viewing',
      },
    ],
    specialInstructions: [
      'Includes detailed terms about exclusive representation',
      'Covers physical viewing and/or digital introduction',
      'Includes commission protection clauses',
      'Mentions liability for bypassing agency',
    ],
  },

  viewing_form_standard: {
    id: 'viewing_form_standard',
    category: DocumentCategory.VIEWING_FORM,
    type: ViewingFormType.STANDARD_SIMPLE,
    name: 'Viewing Form - Standard Simple',
    description: 'Simple viewing confirmation form without extensive legal terms',
    templateFilename: 'Zyprus_Viewing _form_standard_Official.docx',
    fields: [
      {
        name: 'client_name',
        label: 'Client Full Name',
        type: 'text',
        required: true,
        description: 'Client name',
      },
      {
        name: 'client_id',
        label: 'ID Number',
        type: 'text',
        required: true,
        description: 'ID/Passport',
      },
      {
        name: 'property_reg_number',
        label: 'Registration Number',
        type: 'text',
        required: true,
        description: 'Property Reg No.',
      },
      {
        name: 'district',
        label: 'District',
        type: 'text',
        required: true,
        description: 'District',
      },
      {
        name: 'municipality',
        label: 'Municipality',
        type: 'text',
        required: true,
        description: 'Municipality',
      },
      {
        name: 'locality',
        label: 'Locality',
        type: 'text',
        required: true,
        description: 'Locality',
      },
      {
        name: 'viewing_date',
        label: 'Date',
        type: 'date',
        required: true,
        description: 'Viewing date',
      },
    ],
    specialInstructions: [
      'Simpler version without extensive legal terms',
      'Basic confirmation of viewing introduction',
    ],
  },

  email_viewing_form_step1: {
    id: 'email_viewing_form_step1',
    category: DocumentCategory.VIEWING_FORM,
    type: ViewingFormType.EMAIL_PROCESS_STEP_1,
    name: 'Email for Viewing Form - Step 1 (Request Signature)',
    description: 'Email requesting client to sign and return viewing form (for plots/land without agent presence)',
    templateFilename: 'Email_For_Viewing_Form.docx',
    fields: [
      {
        name: 'client_name',
        label: 'Client Name',
        type: 'text',
        required: true,
        description: 'Client first name or full name',
        placeholder: 'Maria',
      },
    ],
    specialInstructions: [
      'Used mostly for plots and land parcels',
      'Also used for bank properties (plots/lands) when showing without agent',
      'Request client to sign attached viewing form',
      'Explain that location details will be provided after signed form returned',
    ],
  },

  email_viewing_form_step2: {
    id: 'email_viewing_form_step2',
    category: DocumentCategory.VIEWING_FORM,
    type: ViewingFormType.EMAIL_PROCESS_STEP_2,
    name: 'Email for Viewing Form - Step 2 (Send Property Details)',
    description: 'Email providing property location and details after viewing form signed',
    templateFilename: 'Email_For_Viewing_Form.docx',
    fields: [
      {
        name: 'client_name',
        label: 'Client Name',
        type: 'text',
        required: true,
        description: 'Client name',
        placeholder: 'Maria',
      },
      {
        name: 'property_link',
        label: 'Property Link',
        type: 'url',
        required: true,
        description: 'Zyprus property URL',
        placeholder: 'https://www.zyprus.com/land/22730/residential-land-in-vergina-larnaca',
      },
      {
        name: 'google_maps_link',
        label: 'Google Maps Location',
        type: 'url',
        required: true,
        description: 'Google Maps coordinates link',
        placeholder: 'https://www.google.com/maps/place/...',
      },
      {
        name: 'registration_details',
        label: 'Registration Details',
        type: 'text',
        required: true,
        description: 'DLS information or property registration details',
        placeholder: 'DLS Information Attached',
      },
    ],
    specialInstructions: [
      'Subject: "Viewing Form Confirmation – Zyprus ID: [ID]"',
      'Only send AFTER agent confirms they registered the client',
      'Sophia should ask: "Did you register the client already?"',
      'Include property link, Google Maps, and registration details',
    ],
  },

  // ========================================
  // AGREEMENTS
  // ========================================

  agreement_marketing_email: {
    id: 'agreement_marketing_email',
    category: DocumentCategory.AGREEMENT,
    type: AgreementType.MARKETING_VIA_EMAIL,
    name: 'Marketing Agreement via Email',
    description: 'Non-exclusive marketing agreement sent via email for seller consent',
    templateFilename: '_Selling their property with Zyprus.docx',
    fields: [
      {
        name: 'seller_name',
        label: 'Property Owner Name',
        type: 'text',
        required: true,
        description: 'Seller full name',
        placeholder: 'Marios Charalambous',
      },
      {
        name: 'property_reg_number',
        label: 'Property Reg Number',
        type: 'text',
        required: false,
        description: 'Reg No. if title deed available',
        placeholder: '0/1246',
      },
      {
        name: 'property_description',
        label: 'Property Description',
        type: 'text',
        required: true,
        description: 'Property description (if no title deed: building/complex info)',
        placeholder: 'Pyrgos, Limassol OR Limas Complex House No.5 Pyrgos, Limassol',
      },
      {
        name: 'marketing_price',
        label: 'Marketing Price',
        type: 'text',
        required: true,
        description: 'Listing price in EUR',
        placeholder: '155,000EUR',
      },
      {
        name: 'agency_fee_percentage',
        label: 'Agency Fee',
        type: 'number',
        required: true,
        description: 'Commission percentage',
        placeholder: '5',
      },
      {
        name: 'include_no_direct_contact_clause',
        label: 'Include No Direct Contact Clause?',
        type: 'select',
        required: true,
        description: 'Include clause preventing direct contact',
        options: ['yes', 'no'],
      },
    ],
    specialInstructions: [
      'Subject: "Consent for Marketing – [Seller Name] – Reg No. [Number] [Location] - Terms and Conditions"',
      'Request confirmation: "Yes I confirm"',
      'Remind agent to attach title deed',
      'Agent can request to remove no-direct-contact clause',
    ],
  },

  agreement_exclusive_selling: {
    id: 'agreement_exclusive_selling',
    category: DocumentCategory.AGREEMENT,
    type: AgreementType.EXCLUSIVE_SELLING,
    name: 'Exclusive Selling Agreement',
    description: 'Exclusive agreement for instructions to sell immovable property',
    templateFilename: 'EXCLUSIVE AGREEMENT NEW_via_email.docx',
    fields: [
      {
        name: 'seller_name',
        label: 'Vendor Name',
        type: 'text',
        required: true,
        description: 'Full legal name of vendor',
        placeholder: 'Mr. Doniyorbek Karimov',
      },
      {
        name: 'seller_nationality',
        label: 'Nationality/Country',
        type: 'text',
        required: true,
        description: 'Vendor nationality',
        placeholder: 'Uzbekistan',
      },
      {
        name: 'seller_passport',
        label: 'Passport Number',
        type: 'text',
        required: true,
        description: 'Passport/ID number',
        placeholder: 'FA0494484',
      },
      {
        name: 'property_address',
        label: 'Property Full Address',
        type: 'text',
        required: true,
        description: 'Complete property address',
        placeholder: 'Apartment 302, Ianou Str. Nr. 11, Nema Ekali Building, Limassol 3110, Cyprus',
      },
      {
        name: 'property_reg_number',
        label: 'Registration Number',
        type: 'text',
        required: true,
        description: 'Property Reg No.',
        placeholder: '0/26942',
      },
      {
        name: 'marketing_price',
        label: 'Marketing Price',
        type: 'text',
        required: true,
        description: 'Agreed marketing price with words',
        placeholder: '€640,000 (Six hundred and forty thousand Euros)',
      },
      {
        name: 'agreement_start_date',
        label: 'Agreement Start Date',
        type: 'date',
        required: true,
        description: 'Agreement start date',
        placeholder: '01/08/2023',
      },
      {
        name: 'agreement_duration_months',
        label: 'Duration (months)',
        type: 'number',
        required: true,
        description: 'Agreement duration in months',
        placeholder: '3',
      },
      {
        name: 'agency_fee_percentage',
        label: 'Agency Fee',
        type: 'number',
        required: true,
        description: 'Commission percentage',
        placeholder: '3',
      },
    ],
    specialInstructions: [
      'Exclusive agreement - vendor cannot negotiate directly',
      'Includes "For Sale" sign permission',
      'Agency fees payable even if sold directly by vendor during agreement',
      'Fees remain valid after expiry if sold to introduced buyer',
      'Marketing expenses borne by Estate Agent',
    ],
  },

  agreement_selling_request_received: {
    id: 'agreement_selling_request_received',
    category: DocumentCategory.AGREEMENT,
    type: AgreementType.SELLING_REQUEST_RECEIVED,
    name: 'Selling Request Received - Arrange Call',
    description: 'Email confirming receipt of selling request and arranging phone call',
    templateFilename: '_Selling their property with Zyprus.docx',
    fields: [
      {
        name: 'seller_name',
        label: 'Potential Seller Name',
        type: 'text',
        required: true,
        description: 'Property owner name',
        placeholder: 'Marios Charalambous',
      },
      {
        name: 'property_location',
        label: 'Property Region',
        type: 'text',
        required: true,
        description: 'General area/city of property',
        placeholder: 'Limassol',
      },
      {
        name: 'request_title_deed',
        label: 'Request Title Deed?',
        type: 'select',
        required: true,
        description: 'Ask for title deed copy in email?',
        options: ['yes', 'no'],
      },
    ],
    specialInstructions: [
      'Subject: "Selling Request – [Seller Name] – [Location]"',
      'Request phone call with 2 time/date options',
      'Title deed request can be removed if agent already has it',
      'Assure confidentiality and GDPR compliance',
    ],
  },

  agreement_overpriced: {
    id: 'agreement_overpriced',
    category: DocumentCategory.AGREEMENT,
    type: AgreementType.OVERPRICED_PROPERTY,
    name: 'Overpriced Property Notice',
    description: 'Email explaining asking price is above market value',
    templateFilename: '_Selling their property with Zyprus.docx',
    fields: [
      {
        name: 'seller_name',
        label: 'Seller Name',
        type: 'text',
        required: true,
        description: 'Property owner name',
        placeholder: 'Marios Charalambous',
      },
      {
        name: 'property_location',
        label: 'Property Location',
        type: 'text',
        required: true,
        description: 'Property area',
        placeholder: 'Limassol',
      },
      {
        name: 'listing_type',
        label: 'Listing Type',
        type: 'select',
        required: true,
        description: 'Sale or rent?',
        options: ['sale', 'rent'],
      },
    ],
    specialInstructions: [
      'Subject: "Selling Request – [Seller Name] – [Location]"',
      'Politely explain price significantly above market value',
      'Offer to help determine realistic asking price',
      'Invite to discuss options for adjusting price',
      'Use "sale" or "rent" in context',
    ],
  },
};

/**
 * Helper function to get document template by ID
 */
export function getDocumentTemplate(templateId: string): DocumentTemplate | undefined {
  return DOCUMENT_CATALOG[templateId];
}

/**
 * Helper function to get all templates by category
 */
export function getTemplatesByCategory(category: DocumentCategory): DocumentTemplate[] {
  return Object.values(DOCUMENT_CATALOG).filter(
    (template) => template.category === category
  );
}

/**
 * Helper function to get required fields for a template
 */
export function getRequiredFields(templateId: string): DocumentField[] {
  const template = getDocumentTemplate(templateId);
  if (!template) return [];
  return template.fields.filter((field) => field.required);
}

/**
 * Helper function to get missing required fields
 */
export function getMissingFields(
  templateId: string,
  collectedFields: Record<string, any>
): string[] {
  const requiredFields = getRequiredFields(templateId);
  return requiredFields
    .filter((field) => !collectedFields[field.name] || collectedFields[field.name] === '')
    .map((field) => field.name);
}
