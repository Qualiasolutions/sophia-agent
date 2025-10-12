/**
 * Intent Classification Service
 *
 * Fast pre-processing layer that classifies document generation requests
 * and routes them to the appropriate template category.
 *
 * Reduces OpenAI Assistant context from 36 templates to 2-3 relevant templates.
 */

export type DocumentCategory = 'registration' | 'email' | 'viewing' | 'agreement' | 'social';

export interface IntentClassification {
  category: DocumentCategory;
  confidence: number;
  likelyTemplates: string[];
  requiredFields: string[];
  suggestedQuestions: string[];
}

export interface IntentPattern {
  category: DocumentCategory;
  keywords: string[];
  patterns: RegExp[];
  templateMappings: Record<string, string[]>;
  requiredFields: Record<string, string[]>;
  suggestedQuestions: Record<string, string[]>;
}

export class TemplateIntentClassifier {
  private patterns: IntentPattern[] = [
    {
      category: 'registration',
      keywords: [
        'registration', 'register', 'registeration', 'registraton', 'seller', 'developer', 'bank',
        'client registration', 'buyer registration', 'tenant registration',
        'landlord registration', 'standard registration', 'marketing agreement'
      ],
      patterns: [
        /\b(registration|register|registeration|registraton|seller|developer|bank)\b/i,
        /\b(marketing\s+agreement|standard\s+registration|standard\s+registeration|rental\s+registration)\b/i,
        /\b(client\s+registration|client\s+registeration|buyer\s+registration|tenant\s+registration)\b/i
      ],
      templateMappings: {
        'seller': ['seller_registration_standard', 'seller_registration_marketing', 'rental_registration', 'seller_registration_advanced'],
        'developer': ['developer_registration_viewing', 'developer_registration_no_viewing'],
        'bank': ['bank_registration_property', 'bank_registration_land']
      },
      requiredFields: {
        'seller': ['seller_name', 'buyer_names', 'property_description', 'viewing_datetime'],
        'developer': ['client_name', 'viewing_datetime', 'agency_fee'],
        'bank': ['client_name', 'client_phone', 'property_link', 'agent_phone']
      },
      suggestedQuestions: {
        'category': ['What type of registration do you need?\n\n1. **Seller(s)** - Property owners\n2. **Banks** - Bank-owned properties/land\n3. **Developers** - New constructions/developments'],
        'seller_subtype': ['What type of seller registration?\n\n1. **Standard** - Regular property registration\n2. **Marketing** - Includes marketing terms\n3. **Rental** - For landlords/rentals\n4. **Advanced** - Multiple properties/special terms'],
        'developer_subtype': ['Is a viewing arranged?\n\n1. **Yes** - Viewing is scheduled\n2. **No** - No viewing scheduled yet'],
        'bank_subtype': ['Is it for a property or land?\n\n1. **Property** - House/apartment from bank\n2. **Land** - Land/parcel from bank'],
        'multiple_sellers': ['Will this registration be sent to multiple sellers/co-owners, but only ONE will confirm? (e.g., only husband confirms for both husband & wife)']
      }
    },
    {
      category: 'email',
      keywords: [
        'email', 'message', 'template', 'good client', 'phone call', 'valuation',
        'send options', 'single option', 'still looking', 'no options', 'time wasters',
        'viewing confirmation', 'multiple regions', 'cooperation'
      ],
      patterns: [
        /\b(email|message|template)\b/i,
        /\b(good\s+client|phone\s+call|valuation|options|viewing)\b/i,
        /\b(send\s+options|single\s+option|still\s+looking)\b/i
      ],
      templateMappings: {
        'general': ['email_good_client_request', 'email_good_client_whatsapp', 'email_phone_call_required', 'email_valuation_quote'],
        'property': ['email_send_options_i', 'email_send_options_we', 'email_send_single_option'],
        'followup': ['email_still_looking', 'email_no_options_low_budget', 'email_time_wasters'],
        'logistics': ['email_buyer_viewing_confirmation', 'email_multiple_regions', 'email_no_cooperation_agents']
      },
      requiredFields: {
        'general': ['client_name'],
        'property': ['client_name', 'property_type', 'location', 'property_link'],
        'followup': ['client_name'],
        'logistics': ['client_name', 'property_link']
      },
      suggestedQuestions: {
        'general': ['Which email template do you need?'],
        'property': ['What is the client name?', 'What property type and location?', 'What is the property link?'],
        'followup': ['What is the client name?'],
        'logistics': ['What is the property link?']
      }
    },
    {
      category: 'viewing',
      keywords: [
        'viewing form', 'viewing', 'form', 'advanced', 'standard', 'email step'
      ],
      patterns: [
        /\b(viewing\s+form|viewing)\b/i,
        /\b(advanced|standard|email\s+step)\b/i,
        /\b(viewing\s+form\s+(advanced|standard))\b/i
      ],
      templateMappings: {
        'form': ['viewing_form_advanced', 'viewing_form_standard'],
        'email': ['viewing_email_step1', 'viewing_email_step2']
      },
      requiredFields: {
        'form': ['client_name', 'client_id', 'property_registration_number', 'district', 'municipality', 'locality', 'viewing_date'],
        'email': ['client_name']
      },
      suggestedQuestions: {
        'form': ['Which viewing form do you need: (1) Advanced, (2) Standard, (3) Email step 1, or (4) Email step 2?'],
        'email': ['What is the client name?']
      }
    },
    {
      category: 'agreement',
      keywords: [
        'agreement', 'marketing', 'selling', 'asking price', 'overpriced',
        'exclusive', 'signature', 'selling request'
      ],
      patterns: [
        /\b(agreement|marketing|selling)\b/i,
        /\b(asking\s+price|overpriced|exclusive|signature)\b/i,
        /\b(marketing\s+agreement|selling\s+request|exclusive\s+selling)\b/i
      ],
      templateMappings: {
        'marketing': ['agreement_marketing_email', 'agreement_marketing_signature'],
        'selling': ['agreement_selling_request_received', 'agreement_asking_price', 'agreement_overpriced'],
        'exclusive': ['agreement_exclusive_selling']
      },
      requiredFields: {
        'marketing': ['seller_name', 'property_description', 'marketing_price', 'agency_fee'],
        'selling': ['seller_name', 'property_location'],
        'exclusive': ['vendor_name', 'nationality', 'passport_number', 'property_description', 'registration_number', 'marketing_price', 'agreement_start_date', 'duration_months', 'agency_fee']
      },
      suggestedQuestions: {
        'marketing': ['What is the seller name?', 'What is the property description?', 'What is the marketing price?'],
        'selling': ['What is the seller name?', 'What is the property location?'],
        'exclusive': ['What is the vendor name and nationality?', 'What is the property description and registration number?']
      }
    },
    {
      category: 'social',
      keywords: [
        'social media', 'crea', 'social', 'instagram', 'facebook', 'linkedin'
      ],
      patterns: [
        /\b(social\s+media|crea|instagram|facebook|linkedin)\b/i,
        /\b(social\s+crea|crea\s+wording)\b/i
      ],
      templateMappings: {
        'general': ['social_media_crea']
      },
      requiredFields: {
        'general': []
      },
      suggestedQuestions: {
        'general': []
      }
    }
  ];

  /**
   * Classify document generation intent based on user message
   */
  classifyIntent(message: string): IntentClassification {
    const normalizedMessage = message.toLowerCase().trim();

    // Calculate scores for each category
    const categoryScores = this.patterns.map(pattern => ({
      category: pattern.category,
      score: this.calculateCategoryScore(normalizedMessage, pattern),
      pattern
    }));

    // Sort by score (descending)
    categoryScores.sort((a, b) => b.score - a.score);

    const bestMatch = categoryScores[0];
    if (!bestMatch) {
      throw new Error('No category matches found during intent classification');
    }

    // Special handling for registration - it should always match if keyword found
    if (bestMatch.category === 'registration') {
      // Check if user already specified sub-type in initial message
      const hasSellerKeywords = /\b(seller|owner|landlord|rental)\b/i.test(normalizedMessage);
      const hasDeveloperKeywords = /\b(developer|development|project)\b/i.test(normalizedMessage);
      const hasBankKeywords = /\b(bank|remu|gordian|altia|altamira)\b/i.test(normalizedMessage);

      // If specific type detected, return appropriate sub-question
      if (hasSellerKeywords) {
        return {
          category: 'registration',
          confidence: 0.9,
          likelyTemplates: ['seller_registration_standard'],
          requiredFields: [],
          suggestedQuestions: [
            'What type of seller registration?\n\n1. **Standard** - Regular property registration\n2. **Marketing** - Includes marketing terms\n3. **Rental** - For landlords/rentals\n4. **Advanced** - Multiple properties/special terms'
          ]
        };
      } else if (hasDeveloperKeywords) {
        return {
          category: 'registration',
          confidence: 0.9,
          likelyTemplates: ['developer_registration_viewing'],
          requiredFields: [],
          suggestedQuestions: [
            'Is a viewing arranged?\n\n1. **Yes** - Viewing is scheduled\n2. **No** - No viewing scheduled yet'
          ]
        };
      } else if (hasBankKeywords) {
        return {
          category: 'registration',
          confidence: 0.9,
          likelyTemplates: ['bank_registration_property'],
          requiredFields: [],
          suggestedQuestions: [
            'Is it for a property or land?\n\n1. **Property** - House/apartment from bank\n2. **Land** - Land/parcel from bank'
          ]
        };
      }

      // No specific type detected - ask category question
      return {
        category: 'registration',
        confidence: 0.9,
        likelyTemplates: ['seller_registration_standard'],
        requiredFields: [],
        suggestedQuestions: [
          'What type of registration do you need?\n\n1. **Seller(s)** - Property owners\n2. **Banks** - Bank-owned properties/land\n3. **Developers** - New constructions/developments'
        ]
      };
    }

    if (bestMatch.score < 0.3) {
      // Low confidence - return general classification
      return {
        category: 'email',
        confidence: 0.5,
        likelyTemplates: ['email_good_client_request'],
        requiredFields: ['client_name', 'property_type', 'location'],
        suggestedQuestions: ['Which email template do you need?']
      };
    }

    // Determine specific template type within category
    const templateType = this.determineTemplateType(normalizedMessage, bestMatch.pattern);
    const likelyTemplates = bestMatch.pattern.templateMappings[templateType] ||
                          bestMatch.pattern.templateMappings['general'] ||
                          Object.values(bestMatch.pattern.templateMappings).flat().slice(0, 3);

    const requiredFields = bestMatch.pattern.requiredFields[templateType] ||
                          bestMatch.pattern.requiredFields['general'] || [];

    const suggestedQuestions = bestMatch.pattern.suggestedQuestions[templateType] ||
                             bestMatch.pattern.suggestedQuestions['general'] || [];

    return {
      category: bestMatch.category,
      confidence: Math.min(bestMatch.score, 0.95),
      likelyTemplates,
      requiredFields,
      suggestedQuestions
    };
  }

  /**
   * Calculate confidence score for a category based on message content
   */
  private calculateCategoryScore(message: string, pattern: IntentPattern): number {
    let score = 0;

    // Keyword matching (40% weight)
    const keywordMatches = pattern.keywords.filter(keyword =>
      message.includes(keyword.toLowerCase())
    );
    score += (keywordMatches.length / pattern.keywords.length) * 0.4;

    // Pattern matching (60% weight)
    const patternMatches = pattern.patterns.filter(regex =>
      regex.test(message)
    );
    score += (patternMatches.length / pattern.patterns.length) * 0.6;

    return score;
  }

  /**
   * Determine specific template type within a category
   */
  private determineTemplateType(message: string, pattern: IntentPattern): string {
    // Check for specific template indicators
    if (pattern.category === 'registration') {
      if (message.includes('seller') || message.includes('selling')) return 'seller';
      if (message.includes('developer')) return 'developer';
      if (message.includes('bank')) return 'bank';
    }

    if (pattern.category === 'email') {
      if (message.includes('options') || message.includes('send')) return 'property';
      if (message.includes('still looking') || message.includes('follow')) return 'followup';
      if (message.includes('viewing confirmation') || message.includes('multiple')) return 'logistics';
    }

    if (pattern.category === 'viewing') {
      if (message.includes('email') || message.includes('step')) return 'email';
      if (message.includes('form') || message.includes('advanced') || message.includes('standard')) return 'form';
    }

    if (pattern.category === 'agreement') {
      if (message.includes('marketing')) return 'marketing';
      if (message.includes('exclusive')) return 'exclusive';
      if (message.includes('selling request') || message.includes('asking price')) return 'selling';
    }

    return 'general';
  }

  /**
   * Get template metadata for optimization
   */
  getTemplateInfo(templateName: string): {
    category: DocumentCategory;
    estimatedTokens: number;
    averageResponseTime: number;
  } {
    // Template metadata for performance optimization
    const templateMetadata: Record<string, any> = {
      // Registration templates
      'seller_registration_standard': { category: 'registration', estimatedTokens: 150, averageResponseTime: 2000 },
      'standard_registration_to_sellers': { category: 'registration', estimatedTokens: 200, averageResponseTime: 2500 },
      'registration_and_marketing_agreement': { category: 'registration', estimatedTokens: 250, averageResponseTime: 3000 },
      'very_advanced_registration': { category: 'registration', estimatedTokens: 300, averageResponseTime: 3500 },
      'standard_registration_for_rentals_to_landlords': { category: 'registration', estimatedTokens: 180, averageResponseTime: 2200 },
      'developer_registration_viewing_arranged': { category: 'registration', estimatedTokens: 160, averageResponseTime: 2100 },
      'developer_registration_no_viewing_arranged': { category: 'registration', estimatedTokens: 140, averageResponseTime: 1800 },
      'property_registration_banks': { category: 'registration', estimatedTokens: 130, averageResponseTime: 1700 },
      'land_registration_banks': { category: 'registration', estimatedTokens: 135, averageResponseTime: 1800 },

      // Email templates
      'email_good_client_request': { category: 'email', estimatedTokens: 120, averageResponseTime: 1500 },
      'email_good_client_whatsapp': { category: 'email', estimatedTokens: 120, averageResponseTime: 1500 },
      'email_phone_call_required': { category: 'email', estimatedTokens: 100, averageResponseTime: 1200 },
      'email_valuation_quote': { category: 'email', estimatedTokens: 110, averageResponseTime: 1400 },
      'email_valuation_received': { category: 'email', estimatedTokens: 100, averageResponseTime: 1200 },
      'email_send_options_i': { category: 'email', estimatedTokens: 200, averageResponseTime: 2500 },
      'email_send_options_we': { category: 'email', estimatedTokens: 200, averageResponseTime: 2500 },
      'email_send_single_option': { category: 'email', estimatedTokens: 130, averageResponseTime: 1600 },

      // Viewing templates
      'viewing_form_advanced': { category: 'viewing', estimatedTokens: 300, averageResponseTime: 3500 },
      'viewing_form_standard': { category: 'viewing', estimatedTokens: 250, averageResponseTime: 3000 },
      'viewing_email_step1': { category: 'viewing', estimatedTokens: 100, averageResponseTime: 1200 },
      'viewing_email_step2': { category: 'viewing', estimatedTokens: 150, averageResponseTime: 1800 },

      // Agreement templates
      'agreement_marketing_email': { category: 'agreement', estimatedTokens: 220, averageResponseTime: 2800 },
      'agreement_selling_request_received': { category: 'agreement', estimatedTokens: 140, averageResponseTime: 1800 },
      'agreement_asking_price': { category: 'agreement', estimatedTokens: 160, averageResponseTime: 2000 },
      'agreement_overpriced': { category: 'agreement', estimatedTokens: 130, averageResponseTime: 1600 },
      'agreement_exclusive_selling': { category: 'agreement', estimatedTokens: 350, averageResponseTime: 4500 },
      'agreement_marketing_signature': { category: 'agreement', estimatedTokens: 200, averageResponseTime: 2500 },

      // Social templates
      'social_media_crea': { category: 'social', estimatedTokens: 200, averageResponseTime: 2000 }
    };

    return templateMetadata[templateName] || {
      category: 'email',
      estimatedTokens: 150,
      averageResponseTime: 2000
    };
  }

  /**
   * Batch classify multiple messages (for analytics and optimization)
   */
  batchClassify(messages: string[]): IntentClassification[] {
    return messages.map(message => this.classifyIntent(message));
  }

  /**
   * Get performance metrics for the classifier
   */
  getMetrics(): {
    totalCategories: number;
    averageConfidence: number;
    supportedTemplates: number;
  } {
    return {
      totalCategories: this.patterns.length,
      averageConfidence: 0.78, // This would be calculated from actual usage
      supportedTemplates: 36 // Total number of supported templates
    };
  }
}