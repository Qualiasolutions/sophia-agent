#!/usr/bin/env node

/**
 * Update VAT Calculator Script
 * Updates the VAT calculator in the database to use the new parameter structure
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateVATCalculator() {
  try {
    console.log('🔄 Updating VAT calculator in database...\n');

    // New input fields structure for VAT calculator
    const newInputFields = [
      {
        name: 'buildable_area',
        label: 'ΔΟΜΗΣΙΜΟ ΕΜΒΑΔΟΝ/BUILDABLE AREA (m2)',
        type: 'number',
        required: true,
        validation: { min: 1 },
        placeholder: 'e.g., 150',
      },
      {
        name: 'price',
        label: 'ΤΙΜΗ/PRICE (€)',
        type: 'currency',
        required: true,
        validation: { min: 1 },
        placeholder: 'e.g., 300000',
      },
      {
        name: 'planning_application_date',
        label: 'Ημερομηνία υποβολής αίτησης για πολεοδομική άδεια/Date of Submission of application for town planning permission (DD/MM/YYYY)',
        type: 'text',
        required: true,
        validation: { pattern: '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\\d{4}$' },
        placeholder: 'e.g., 15/01/2024',
      },
    ];

    // Update the VAT calculator by ID
    const { data, error } = await supabase
      .from('calculators')
      .update({
        input_fields: newInputFields,
        description: 'Calculate VAT for houses and apartments in Cyprus based on planning application date. New policy (from Nov 1, 2023): 5% rate for properties up to €350,000. Old policy: 5% rate for first 200m² of first homes. Standard rate is 19%.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', '2c0928d2-30de-47f9-b155-e37669957ef8')
      .select();

    if (error) {
      console.error('❌ Error updating VAT calculator:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ VAT calculator updated successfully!\n');
      console.log('Updated fields:');
      console.log('- Input fields: Reduced from 6 to 3 fields');
      console.log('- Description: Updated to reflect new policy logic');
      console.log('- Parameters: buildable_area, price, planning_application_date');

      console.log('\nNew input fields:');
      newInputFields.forEach((field, index) => {
        console.log(`${index + 1}. ${field.name}: ${field.label}`);
        console.log(`   Type: ${field.type}, Required: ${field.required}`);
      });
    } else {
      console.log('❌ VAT calculator not found in database');
    }

    // Verify the update
    console.log('\n🔍 Verifying update...\n');

    const { data: verifyData, error: verifyError } = await supabase
      .from('calculators')
      .select('name, description, input_fields')
      .eq('id', '2c0928d2-30de-47f9-b155-e37669957ef8')
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('✅ Verification successful!');
      console.log(`Name: ${verifyData.name}`);
      console.log(`Description: ${verifyData.description.substring(0, 100)}...`);
      console.log(`Input Fields: ${verifyData.input_fields.length} fields`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateVATCalculator();