#!/usr/bin/env node

/**
 * Check Calculators Script
 * Queries the calculators table to see what calculators are available
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCalculators() {
  try {
    console.log('🔍 Checking calculators in database...\n');

    // Query calculators table
    const { data: calculators, error } = await supabase
      .from('calculators')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error querying calculators:', error);
      return;
    }

    if (!calculators || calculators.length === 0) {
      console.log('❌ No calculators found in database');
      console.log('📝 Calculators need to be seeded in the database');
      return;
    }

    console.log(`✅ Found ${calculators.length} calculators:\n`);

    calculators.forEach((calc, index) => {
      console.log(`${index + 1}. ${calc.name}`);
      console.log(`   ID: ${calc.id}`);
      console.log(`   Description: ${calc.description}`);
      console.log(`   Active: ${calc.is_active ? 'Yes' : 'No'}`);
      console.log(`   Input Fields: ${calc.input_fields?.length || 0}`);
      console.log(`   Created: ${calc.created_at}`);
      console.log('');
    });

    // Check calculator history
    console.log('🔍 Checking calculator usage history...\n');

    const { data: history, error: historyError } = await supabase
      .from('calculator_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (historyError) {
      console.error('❌ Error querying calculator history:', historyError);
    } else {
      console.log(`✅ Recent calculator usage (${history?.length || 0} records):\n`);

      history?.forEach((record, index) => {
        console.log(`${index + 1}. Calculator: ${record.calculator_id}`);
        console.log(`   Executed: ${record.created_at}`);
        console.log(`   Success: ${record.success ? 'Yes' : 'No'}`);
        console.log(`   Result: ${record.result?.summary || 'N/A'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCalculators();