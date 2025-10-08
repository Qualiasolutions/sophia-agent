#!/usr/bin/env node

/**
 * Load document templates from Knowledge Base into Supabase
 * Usage: node scripts/load-templates.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Template categorization based on filename
const TEMPLATE_CATEGORIES = {
  viewing: ['viewing', 'email_for_viewing'],
  exclusive: ['exclusive', 'agreement'],
  legal: ['title', 'deed', 'legal'],
  marketing: ['marketing', 'note'],
  property: ['plot', 'land', 'bungalow', 'katoikia'],
};

function categorizeTemplate(filename) {
  const lower = filename.toLowerCase();

  for (const [category, keywords] of Object.entries(TEMPLATE_CATEGORIES)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category;
    }
  }

  return 'general';
}

function extractVariablesFromText(text) {
  // Find {{variable}} patterns
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set();
  let match;

  while ((match = regex.exec(text)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

function generateVariableSchema(variables) {
  return variables.map(varName => {
    // Infer type from variable name
    let type = 'string';

    if (varName.toLowerCase().includes('date')) {
      type = 'date';
    } else if (varName.toLowerCase().includes('price') || varName.toLowerCase().includes('amount')) {
      type = 'currency';
    } else if (varName.toLowerCase().includes('email')) {
      type = 'email';
    } else if (varName.toLowerCase().includes('phone')) {
      type = 'phone';
    }

    return {
      name: varName,
      type,
      required: true,
      label: varName.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
    };
  });
}

async function readTemplateContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    // For PDFs, create a placeholder template
    return `# ${path.basename(filePath, ext)}\n\nThis template was imported from a PDF file.\n\nPlease update the content with proper variable placeholders like {{variable_name}}.`;
  }

  // For text files, read content
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error.message);
    return null;
  }
}

async function loadTemplates() {
  const templatesDir = path.join(__dirname, '../Knowledge Base/Templates');

  console.log('📂 Reading templates from:', templatesDir);

  const files = await fs.readdir(templatesDir);
  const templateFiles = files.filter(f =>
    f.endsWith('.docx') || f.endsWith('.pdf') || f.endsWith('.txt')
  );

  console.log(`Found ${templateFiles.length} template files\n`);

  let loaded = 0;
  let skipped = 0;

  for (const file of templateFiles) {
    const filePath = path.join(templatesDir, file);
    const name = path.basename(file, path.extname(file));
    const category = categorizeTemplate(file);

    console.log(`Processing: ${file}`);
    console.log(`  Category: ${category}`);

    // For DOCX files, create placeholder content
    let content;
    if (file.endsWith('.docx')) {
      content = `# ${name}\n\n[This template needs to be extracted from the DOCX file]\n\nPlease add your template content here with variables in {{variable_name}} format.`;
    } else {
      content = await readTemplateContent(filePath);
      if (!content) {
        console.log(`  ⏭️  Skipped (failed to read)\n`);
        skipped++;
        continue;
      }
    }

    const variables = extractVariablesFromText(content);
    const variableSchema = generateVariableSchema(variables);

    console.log(`  Variables: ${variables.length} found`);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('document_templates')
      .insert({
        name,
        description: `Imported from ${file}`,
        category,
        content,
        variables,
        variable_schema: variableSchema,
        tags: [category, 'imported'],
        status: 'active',
      })
      .select();

    if (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
      skipped++;
    } else {
      console.log(`  ✅ Loaded successfully (ID: ${data[0].id})\n`);
      loaded++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`  Total files: ${templateFiles.length}`);
  console.log(`  Loaded: ${loaded}`);
  console.log(`  Skipped: ${skipped}`);
  console.log('='.repeat(50));
}

// Run
loadTemplates().catch(console.error);
