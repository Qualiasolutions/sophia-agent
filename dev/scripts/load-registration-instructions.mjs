#!/usr/bin/env node

/**
 * Load Registration Instructions from Source of Truth into Supabase
 * This script loads the optimized registration instruction files into the template_cache table
 * Usage: node dev/scripts/load-registration-instructions.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
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

// Registration template mappings
const REGISTRATION_TEMPLATES = [
  {
    file: '01_standard_seller_registration.md',
    templateId: 'seller_registration_standard',
    name: 'Standard Seller Registration',
    category: 'registration',
    subcategory: 'seller',
    requiredFields: ['seller_name', 'buyer_names', 'property_description', 'viewing_datetime'],
    optionalFields: ['registration_number', 'property_link', 'zyprus_id']
  },
  {
    file: '02_seller_with_marketing_agreement.md',
    templateId: 'seller_registration_marketing',
    name: 'Seller Registration with Marketing Agreement',
    category: 'registration',
    subcategory: 'seller',
    requiredFields: ['seller_name', 'buyer_names', 'property_description', 'viewing_datetime', 'agency_fee_percent', 'no_direct_contact'],
    optionalFields: ['registration_number', 'property_link', 'zyprus_id']
  },
  {
    file: '03_rental_property_registration.md',
    templateId: 'rental_registration',
    name: 'Rental Property Registration',
    category: 'registration',
    subcategory: 'rental',
    requiredFields: ['landlord_name', 'tenant_names', 'property_description', 'viewing_datetime', 'no_direct_contact'],
    optionalFields: ['registration_number', 'property_link', 'zyprus_id']
  },
  {
    file: '04_advanced_seller_registration.md',
    templateId: 'seller_registration_advanced',
    name: 'Advanced Seller Registration',
    category: 'registration',
    subcategory: 'seller',
    requiredFields: ['seller_name', 'buyer_names', 'property_description', 'viewing_datetime'],
    optionalFields: ['multiple_properties', 'special_payment_terms', 'all_registration_numbers']
  },
  {
    file: '05_bank_property_registration.md',
    templateId: 'bank_registration_property',
    name: 'Bank Property Registration',
    category: 'registration',
    subcategory: 'bank',
    requiredFields: ['client_name', 'client_phone', 'property_url_or_description', 'agent_phone'],
    optionalFields: ['property_reference']
  },
  {
    file: '06_bank_land_registration.md',
    templateId: 'bank_registration_land',
    name: 'Bank Land Registration',
    category: 'registration',
    subcategory: 'bank',
    requiredFields: ['client_name', 'client_phone', 'property_url_or_description', 'agent_phone'],
    optionalFields: ['property_reference']
  },
  {
    file: '07_developer_viewing_arranged.md',
    templateId: 'developer_registration_viewing',
    name: 'Developer Registration - Viewing Arranged',
    category: 'registration',
    subcategory: 'developer',
    requiredFields: ['developer_contact', 'client_names', 'viewing_datetime', 'agency_fee_percent'],
    optionalFields: ['project_name']
  },
  {
    file: '08_developer_no_viewing.md',
    templateId: 'developer_registration_no_viewing',
    name: 'Developer Registration - No Viewing',
    category: 'registration',
    subcategory: 'developer',
    requiredFields: ['developer_contact', 'client_names', 'agency_fee_percent'],
    optionalFields: ['project_name']
  },
  {
    file: '09_multiple_sellers_clause.md',
    templateId: 'multiple_sellers_clause',
    name: 'Multiple Sellers Clause',
    category: 'registration',
    subcategory: 'addon',
    requiredFields: ['primary_seller_name', 'co_owners'],
    optionalFields: []
  }
];

async function loadRegistrationInstructions() {
  const instructionsDir = path.join(__dirname, '../../Knowledge Base/Sophias Source of Truth/Registeration Forms/reg_final');

  console.log('📂 Loading registration instructions from:', instructionsDir);
  console.log('');

  let loaded = 0;
  let skipped = 0;

  // First, clear existing registration templates
  console.log('🗑️  Clearing existing registration templates...');
  const { error: clearError } = await supabase
    .from('template_cache')
    .delete()
    .eq('category', 'registration');

  if (clearError) {
    console.error('Error clearing existing templates:', clearError.message);
  } else {
    console.log('✅ Cleared existing registration templates');
  }
  console.log('');

  for (const template of REGISTRATION_TEMPLATES) {
    console.log(`Processing: ${template.file}`);

    const filePath = path.join(instructionsDir, template.file);

    try {
      // Read the instruction file
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract subject line if present
      const subjectLineMatch = content.match(/## SUBJECT LINE FORMAT\s*\n\nSend this in a SEPARATE message:\s*\n```\s*\n(.+?)\s*\n```/s);
      const subjectLine = subjectLineMatch ? subjectLineMatch[1].trim() : null;

      // Extract the actual template/instructions content
      const instructionsMatch = content.match(/## OUTPUT FORMAT\s*\n\n```\s*\n([\s\S]+?)\s*\n```/s);
      const templateContent = instructionsMatch ? instructionsMatch[1].trim() : content;

      // Calculate estimated tokens (rough estimate: 1 token = 4 characters)
      const estimatedTokens = Math.ceil(templateContent.length / 4);

      // Insert into template_cache
      const { data, error } = await supabase
        .from('template_cache')
        .insert({
          template_id: template.templateId,
          name: template.name,
          category: template.category,
          subcategory: template.subcategory,
          content: templateContent,
          variables: [...template.requiredFields, ...template.optionalFields],
          required_fields: template.requiredFields,
          optional_fields: template.optionalFields,
          subject_line: subjectLine,
          instructions: content, // Store full instructions for reference
          estimated_tokens: estimatedTokens,
          metadata: {
            type: 'registration_instruction',
            version: '2.0.0',
            source_file: template.file,
            flow_type: 'structured_3_step'
          }
        })
        .select();

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        skipped++;
      } else {
        console.log(`  ✅ Loaded successfully (ID: ${template.templateId})`);
        console.log(`     Required fields: ${template.requiredFields.join(', ')}`);
        console.log(`     Optional fields: ${template.optionalFields.join(', ')}`);
        if (subjectLine) {
          console.log(`     Subject line: ${subjectLine}`);
        }
        loaded++;
      }

    } catch (error) {
      console.log(`  ❌ Failed to read file: ${error.message}`);
      skipped++;
    }

    console.log('');
  }

  console.log('='.repeat(50));
  console.log('📊 Summary:');
  console.log(`  Total templates: ${REGISTRATION_TEMPLATES.length}`);
  console.log(`  Loaded: ${loaded}`);
  console.log(`  Skipped: ${skipped}`);
  console.log('='.repeat(50));

  // Verify the load
  console.log('\n🔍 Verifying loaded templates...');
  const { data: templates, error: verifyError } = await supabase
    .from('template_cache')
    .select('template_id, name, category, subcategory')
    .eq('category', 'registration')
    .order('template_id');

  if (verifyError) {
    console.error('Error verifying templates:', verifyError.message);
  } else {
    console.log(`✅ Found ${templates.length} registration templates in database:`);
    templates.forEach(t => {
      console.log(`  - ${t.template_id} (${t.name})`);
    });
  }
}

// Run
loadRegistrationInstructions().catch(console.error);