#!/usr/bin/env node

/**
 * Migrate Templates to Enhanced Format
 * This script migrates all existing templates to the new enhanced format
 */

import { createClient } from '@supabase/supabase-js';
import { TemplateEnhancementService } from '../../packages/services/src/template-enhancement.service.js';
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

// Initialize Supabase client
const supabase = createClient(
  envVars.SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize enhancement service
const enhancementService = new TemplateEnhancementService(envVars.OPENAI_API_KEY);

async function runMigration() {
  console.log('🚀 Template Enhancement Migration\n');
  console.log('='.repeat(60));

  try {
    // Check if enhanced_templates table exists
    console.log('🔍 Checking prerequisites...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'enhanced_templates');

    if (tableError || !tables || tables.length === 0) {
      console.error('❌ Enhanced templates table not found. Please run database migration first.');
      process.exit(1);
    }

    console.log('✅ Enhanced templates table exists\n');

    // Check existing templates
    const { data: existingTemplates, error: fetchError } = await supabase
      .from('enhanced_templates')
      .select('template_id');

    if (fetchError) {
      console.error('Error checking existing templates:', fetchError);
    }

    if (existingTemplates && existingTemplates.length > 0) {
      console.log(`⚠️  Found ${existingTemplates.length} existing enhanced templates`);
      console.log('   Templates will be updated with new embeddings and metadata\n');
    }

    // Run migration
    await enhancementService.migrateAllTemplates();

    // Verify migration
    await enhancementService.verifyMigration();

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update the document service to use enhanced templates');
    console.log('2. Test the new semantic search functionality');
    console.log('3. Monitor performance improvements');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease check:');
    console.log('1. Supabase connection is working');
    console.log('2. OPENAI_API_KEY is set and valid');
    console.log('3. Database schema is properly migrated');
    process.exit(1);
  }
}

// Run migration
runMigration().catch(console.error);