#!/usr/bin/env node

/**
 * Check Admin Users Table Structure
 * Checks the structure of the admin_users table to understand required fields
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Checking admin_users table structure...\n');

    // Get table info using Postgres information schema
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'admin_users')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnError) {
      console.error('❌ Error fetching table structure:', columnError);
      return;
    }

    console.log('✅ Admin users table structure:');
    columns.forEach((col) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultValue}`);
    });

    console.log('\n🔍 Checking existing admin users...\n');

    const { data: existingAdmins, error: adminError } = await supabase
      .from('admin_users')
      .select('*');

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      return;
    }

    console.log(`✅ Found ${existingAdmins.length} existing admin users:`);
    existingAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. ${admin.email}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Active: ${admin.is_active}`);
      console.log(`   Password Hash: ${admin.password_hash ? 'Set' : 'NULL'}`);
      console.log(`   Role: ${admin.role || 'NULL'}`);
    });

    // Update the existing admin user with the new auth user ID
    console.log('\n🔧 Updating existing admin user with new auth user ID...');

    const authUserId = '55f67e71-c4a5-4745-b845-8cc944909797'; // From previous script

    const { data: updatedAdmin, error: updateError } = await supabase
      .from('admin_users')
      .update({
        id: authUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('email', 'admin@zyprus.com')
      .select();

    if (updateError) {
      console.error('❌ Error updating admin user:', updateError);
    } else {
      console.log('✅ Admin user updated successfully!');
      console.log(`Old admin user (admin@zyprus.com) now has auth user ID: ${authUserId}`);
      console.log('You can now sign in with admin@sophiaai.com to access admin features.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTableStructure();