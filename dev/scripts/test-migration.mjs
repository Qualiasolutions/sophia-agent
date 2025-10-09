#!/usr/bin/env node

/**
 * Test Template Migration Directly
 * Tests the migration without TypeScript compilation
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '../../.env.local');
const envContent = await fs.readFile(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function testMigration() {
  console.log('🚀 Testing Template Migration\n');

  try {
    // Check if enhanced_templates table exists
    console.log('1. Checking enhanced_templates table...');
    const { data: tables, error: tableError } = await supabase
      .from('enhanced_templates')
      .select('template_id')
      .limit(1);

    if (tableError) {
      console.error('❌ Enhanced templates table not accessible:', tableError.message);
      return;
    }
    console.log('✅ Enhanced templates table is accessible\n');

    // Get original templates
    console.log('2. Fetching original templates...');
    const { data: templates, error: fetchError } = await supabase
      .from('template_cache')
      .select('*')
      .order('template_id');

    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError.message);
      return;
    }

    console.log(`✅ Found ${templates.length} templates in template_cache\n`);

    // Manual migration for one template as test
    console.log('3. Testing manual migration of first template...');
    const firstTemplate = templates.find(t => t.template_id === 'seller_registration_standard');

    if (!firstTemplate) {
      console.error('❌ seller_registration_standard template not found');
      return;
    }

    // Create enhanced version
    const enhanced = {
      template_id: firstTemplate.template_id,
      name: firstTemplate.name,
      version: '2.0.0',
      category: firstTemplate.category,
      subcategory: firstTemplate.subcategory || 'general',

      metadata: {
        priority: 9,
        estimatedTokens: firstTemplate.estimated_tokens || 150,
        averageResponseTime: 2000,
        complexity: 'medium',
        confidence: 0.95,
        tags: ['registration', 'seller', 'document', 'legal']
      },

      triggers: {
        keywords: ['registration', 'register', 'seller', 'owner', 'property', 'standard', 'regular'],
        phrases: [
          'i need a registration',
          'seller registration',
          'register my property',
          'standard registration',
          'property registration'
        ],
        patterns: [
          '\\b(registration|register)\\b.*\\b(seller|property|owner)\\b',
          '\\b(standard|regular|normal)\\s+registration\\b'
        ],
        semanticExamples: [
          'I need to register my property for sale',
          'Client wants to register their house',
          'We need to do a registration for the seller'
        ]
      },

      flow: {
        steps: [
          {
            id: 'category',
            type: 'question',
            content: 'What type of registration do you need?\n1. **Seller/Owner Registration** (property owners)\n2. **Developer Registration** (new constructions/developments)\n3. **Bank Registration** (bank-owned properties/land)',
            options: ['seller', 'developer', 'bank'],
            nextStep: 'type_selection'
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
            question: 'Will this registration be sent to multiple sellers? (e.g., husband and wife, co-owners)',
            options: [
              { value: 'yes', nextStep: 'collect_coowners' },
              { value: 'no', nextStep: 'collect_fields' }
            ]
          }
        ]
      },

      fields: {
        required: (firstTemplate.required_fields || []).map(field => ({
          name: field,
          type: field.includes('phone') ? 'phone' :
                field.includes('date') || field.includes('datetime') ? 'datetime' :
                field.includes('email') ? 'email' : 'text',
          label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          placeholder: `Enter ${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          validation: [{ type: 'required', value: true, message: `${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} is required` }]
        })),
        optional: (firstTemplate.optional_fields || []).map(field => ({
          name: field,
          type: 'text',
          label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          placeholder: `Enter ${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
        })),
        conditional: []
      },

      content: {
        subject: firstTemplate.subject_line,
        body: firstTemplate.content,
        variables: extractVariables(firstTemplate.content).map(v => ({
          template: `{{${v.toUpperCase()}}}`,
          mapping: v,
          transform: v.includes('phone') ? 'maskPhone' : undefined
        })),
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
- Use EXACT template wording with {{VARIABLE}} replacements
- Bold field labels with *asterisks* (format: *Field Name:*)
- Never invent information - ask for missing fields
- Mask phone numbers: 99 07 67 32 → 99 XX 67 32
- Output only the document content
- No confirmation step once all fields are collected

This is a STANDARD SELLER REGISTRATION.
Include property details, buyer information, and viewing details.
Emphasize exclusivity period of 6 months.`,
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
          'Include all mandatory sections',
          'Bold all field labels',
          'Mask phone numbers in middle digits'
        ],
        outputFormat: 'exact'
      },

      analytics: {
        usageCount: 0,
        successRate: 1.0,
        lastUsed: new Date(),
        feedback: []
      }
    };

    // Insert into enhanced_templates
    console.log('4. Inserting enhanced template...');
    const { error: insertError } = await supabase
      .from('enhanced_templates')
      .upsert(enhanced, { onConflict: 'template_id' });

    if (insertError) {
      console.error('❌ Error inserting enhanced template:', insertError.message);
      return;
    }

    console.log('✅ Successfully migrated seller_registration_standard\n');

    // Verify
    console.log('5. Verifying migration...');
    const { data: verify } = await supabase
      .from('enhanced_templates')
      .select('template_id, name, metadata')
      .eq('template_id', 'seller_registration_standard')
      .single();

    if (verify) {
      console.log('✅ Migration verified successfully!');
      console.log(`  Template ID: ${verify.template_id}`);
      console.log(`  Name: ${verify.name}`);
      console.log(`  Priority: ${verify.metadata.priority}`);
      console.log(`  Complexity: ${verify.metadata.complexity}`);
    }

    console.log('\n✅ Test migration completed successfully!');
    console.log('\nTo migrate all templates, update the migration service to run the full conversion.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Extract variables from content
function extractVariables(content) {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set();
  let match;

  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

// Run test
testMigration().catch(console.error);