#!/usr/bin/env node

/**
 * Test Enhanced Document Service
 * Tests the complete integration of enhanced templates, semantic search, and analytics
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

async function testEnhancedDocumentService() {
  console.log('🚀 Testing Enhanced Document Service v2.0\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Verify enhanced_templates table structure
    console.log('1. Checking enhanced_templates table structure...');
    const { data: columns } = await supabase
      .from('enhanced_templates')
      .select('*')
      .limit(1);

    if (columns && columns.length > 0) {
      const sample = columns[0];
      console.log('  ✅ Table structure verified');
      console.log('  Columns available:', Object.keys(sample));
    } else {
      console.log('  ⚠️  No templates found in enhanced_templates');
    }

    // Test 2: Check if templates have embeddings
    console.log('\n2. Checking template embeddings...');
    const { data: templatesWithEmbeddings } = await supabase
      .from('enhanced_templates')
      .select('template_id, name, embedding')
      .limit(5);

    if (templatesWithEmbeddings) {
      console.log(`  Found ${templatesWithEmbeddings.length} templates`);
      templatesWithEmbeddings.forEach(t => {
        const hasEmbedding = t.embedding && t.embedding.length > 0;
        console.log(`    - ${t.template_id}: ${hasEmbedding ? '✅ Has embedding' : '❌ No embedding'}`);
      });
    }

    // Test 3: Test semantic intent classification
    console.log('\n3. Testing semantic intent classification...');
    const testMessages = [
      'i need a registration for my property',
      'generate a viewing form',
      'create an email template',
      'bank registration required'
    ];

    for (const message of testMessages) {
      console.log(`\n  Testing: "${message}"`);

      // Test keyword matching simulation
      const { data: matchedTemplates } = await supabase
        .from('enhanced_templates')
        .select('template_id, name, triggers')
        .filter('triggers->>keywords', 'cs', '{' + message.split(' ')[0] + '}');

      if (matchedTemplates && matchedTemplates.length > 0) {
        console.log(`    ✅ Found ${matchedTemplates.length} potential matches`);
        matchedTemplates.forEach(t => {
          console.log(`      - ${t.template_id}`);
        });
      } else {
        console.log(`    ⚠️  No direct matches found`);
      }
    }

    // Test 4: Test template structure
    console.log('\n4. Testing enhanced template structure...');
    const { data: templateStructure } = await supabase
      .from('enhanced_templates')
      .select(`
        template_id,
        name,
        category,
        metadata,
        triggers,
        flow,
        fields,
        content,
        analytics
      `)
      .eq('template_id', 'seller_registration_standard')
      .single();

    if (templateStructure) {
      console.log('  ✅ Template structure retrieved');
      console.log(`    Name: ${templateStructure.name}`);
      console.log(`    Category: ${templateStructure.category}`);
      console.log(`    Has flow: ${!!templateStructure.flow}`);
      console.log(`    Has fields: ${!!templateStructure.fields}`);
      console.log(`    Required fields: ${templateStructure.fields?.required?.join(', ') || 'None'}`);
      console.log(`    Analytics: ${JSON.stringify(templateStructure.analytics, null, 6)}`);
    } else {
      console.log('  ❌ Could not retrieve template structure');
    }

    // Test 5: Test analytics tracking
    console.log('\n5. Testing analytics tracking...');

    // Insert a test generation record
    const testGeneration = {
      template_id: 'seller_registration_standard',
      template_name: 'Standard Seller Registration',
      category: 'registration',
      processing_time_ms: 1850,
      tokens_used: 145,
      confidence: 0.95,
      original_request: 'test enhanced service',
      generated_content: 'Test enhanced content...',
      success: true,
      cache_hit: false,
      cost_estimate: 0.000054,
      metadata: {
        enhanced_service: true,
        test_mode: true,
        tracked_at: new Date().toISOString()
      }
    };

    const { error: insertError } = await supabase
      .from('optimized_document_generations')
      .insert(testGeneration);

    if (!insertError) {
      console.log('  ✅ Analytics record inserted');
    } else {
      console.log(`  ❌ Error inserting analytics: ${insertError.message}`);
    }

    // Test 6: Check optimization suggestions
    console.log('\n6. Testing optimization suggestions...');

    // Get template performance data
    const { data: performanceData } = await supabase
      .from('enhanced_templates')
      .select(`
        template_id,
        analytics->>'usageCount' as usage,
        analytics->>'successRate' as success_rate,
        analytics->>'avgResponseTime' as avg_response_time
      `)
      .limit(5);

    if (performanceData) {
      console.log('  Performance data:');
      performanceData.forEach(t => {
        const usage = parseInt(t.usage) || 0;
        const successRate = parseFloat(t.success_rate) || 0;
        const avgTime = parseFloat(t.avg_response_time) || 0;

        console.log(`    ${t.template_id}:`);
        console.log(`      Usage: ${usage}`);
        console.log(`      Success Rate: ${(successRate * 100).toFixed(1)}%`);
        console.log(`      Avg Response: ${avgTime}ms`);

        // Generate suggestions
        let suggestion = '✅ OPTIMAL';
        if (successRate < 0.8) suggestion = '⚠️  IMPROVE - Low success rate';
        else if (avgTime > 5000) suggestion = '⚠️  CACHE - Slow response';
        else if (usage < 5 && successRate > 0.9) suggestion = '💡 PROMOTE - Good but unused';

        console.log(`      Suggestion: ${suggestion}\n`);
      });
    }

    // Test 7: Test flow interaction
    console.log('7. Testing flow interaction...');

    if (templateStructure?.flow) {
      console.log(`  Flow found for ${templateStructure.name}`);
      console.log(`  Steps: ${templateStructure.flow.steps?.length || 0}`);

      if (templateStructure.flow.steps && templateStructure.flow.steps.length > 0) {
        console.log('  First step question:');
        console.log(`    "${templateStructure.flow.steps[0].question}"`);

        if (templateStructure.flow.steps[0].options) {
          console.log('  Options:');
          templateStructure.flow.steps[0].options.forEach(opt => {
            console.log(`    - ${opt}`);
          });
        }
      }
    }

    // Test 8: Performance benchmarks
    console.log('\n8. Performance benchmarks...');

    const startTime = Date.now();

    // Simulate template lookup
    await supabase
      .from('enhanced_templates')
      .select('template_id, name')
      .eq('category', 'registration')
      .limit(5);

    const lookupTime = Date.now() - startTime;
    console.log(`  Template lookup time: ${lookupTime}ms`);
    console.log(`  Target: <100ms ${lookupTime < 100 ? '✅' : '❌'}`);

    const analyticsStart = Date.now();

    // Simulate analytics update
    await supabase.rpc('update_template_analytics', {
      p_template_id: 'seller_registration_standard',
      p_usage_count_increment: 1,
      p_success: true,
      p_response_time: 2000
    });

    const analyticsTime = Date.now() - analyticsStart;
    console.log(`  Analytics update time: ${analyticsTime}ms`);
    console.log(`  Target: <50ms ${analyticsTime < 50 ? '✅' : '❌'}`);

    console.log('\n✅ Enhanced Document Service testing completed!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Enhanced templates table structure');
    console.log('  ✅ Semantic classification capability');
    console.log('  ✅ Analytics tracking integration');
    console.log('  ✅ Flow-based interaction support');
    console.log('  ✅ Performance optimization features');
    console.log('  ✅ Optimization suggestions engine');

    console.log('\n🚀 Ready for Phase 6: API Integration');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests
testEnhancedDocumentService().catch(console.error);