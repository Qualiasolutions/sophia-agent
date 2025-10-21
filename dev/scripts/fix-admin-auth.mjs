#!/usr/bin/env node

/**
 * Fix Admin Authentication
 * Updates the existing admin user to use the new auth user ID
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminAuth() {
  try {
    console.log('🔧 Fixing admin authentication...\n');

    const authUserId = '55f67e71-c4a5-4745-b845-8cc944909797'; // From previous script

    // Update the existing admin user with the new auth user ID
    console.log('Step 1: Updating existing admin user with new auth user ID...');
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
      return;
    }

    console.log('✅ Admin user updated successfully!');
    console.log(`Email: admin@zyprus.com`);
    console.log(`New ID (auth user): ${authUserId}`);
    console.log(`Active: ${updatedAdmin[0].is_active}`);

    // Verify the update
    console.log('\nStep 2: Verifying admin user update...');
    const { data: verifyAdmin, error: verifyError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying admin user:', verifyError);
    } else {
      console.log('✅ Verification successful!');
      console.log(`Admin User ID: ${verifyAdmin.id}`);
      console.log(`Email: ${verifyAdmin.email}`);
      console.log(`Active: ${verifyAdmin.is_active}`);
    }

    // Test the auth flow
    console.log('\nStep 3: Testing authentication flow...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@sophiaai.com',
      password: 'admin123456',
    });

    if (loginError) {
      console.error('❌ Login test failed:', loginError);
      return;
    }

    console.log('✅ Login test successful!');
    console.log(`Logged in as: ${loginData.user.email}`);
    console.log(`User ID: ${loginData.user.id}`);

    // Check if the logged-in user ID matches admin_users ID
    if (loginData.user.id === authUserId) {
      console.log('✅ User ID matches admin_users table - authentication should work!');
    } else {
      console.log('❌ User ID mismatch - authentication will fail');
      console.log(`Auth user ID: ${loginData.user.id}`);
      console.log(`Admin user ID: ${authUserId}`);
    }

    console.log('\n🎉 Admin authentication fix complete!');
    console.log(`\n📝 You can now sign in at:`);
    console.log(`Email: admin@sophiaai.com`);
    console.log(`Password: admin123456`);
    console.log(`\n🔗 Admin Calculators: https://sophia-agent.vercel.app/admin/calculators`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixAdminAuth();