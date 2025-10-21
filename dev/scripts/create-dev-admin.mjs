#!/usr/bin/env node

/**
 * Create Development Admin User
 * Creates a development auth user and links it to the admin_users table
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDevAdmin() {
  try {
    console.log('🔧 Creating development admin user...\n');

    const devEmail = 'admin@sophiaai.com';
    const devPassword = 'admin123456';

    // Step 1: Create auth user
    console.log('Step 1: Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: devEmail,
      password: devPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Development Admin',
        role: 'admin',
      },
    });

    if (authError) {
      // User might already exist, try to get it
      console.log('⚠️  Auth user might already exist, checking...');
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(devEmail);

      if (existingUser.user) {
        console.log('✅ Found existing auth user:', existingUser.user.email);
        var userId = existingUser.user.id;
      } else {
        console.error('❌ Error creating/getting auth user:', authError);
        return;
      }
    } else {
      console.log('✅ Auth user created successfully!');
      console.log(`Email: ${devEmail}`);
      console.log(`Password: ${devPassword}`);
      console.log(`User ID: ${authData.user.id}`);
      var userId = authData.user.id;
    }

    // Step 2: Link to admin_users table or update existing
    console.log('\nStep 2: Linking to admin_users table...');

    // Check if admin user already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', devEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing admin:', checkError);
      return;
    }

    if (existingAdmin) {
      // Update existing admin user with correct ID
      const { data: updatedAdmin, error: updateError } = await supabase
        .from('admin_users')
        .update({
          id: userId,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('email', devEmail)
        .select();

      if (updateError) {
        console.error('❌ Error updating admin user:', updateError);
      } else {
        console.log('✅ Admin user updated successfully!');
        console.log(`Email: ${updatedAdmin[0].email}`);
        console.log(`ID: ${updatedAdmin[0].id}`);
        console.log(`Active: ${updatedAdmin[0].is_active}`);
      }
    } else {
      // Create new admin user
      const { data: newAdmin, error: createError } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          email: devEmail,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select();

      if (createError) {
        console.error('❌ Error creating admin user:', createError);
      } else {
        console.log('✅ Admin user created successfully!');
        console.log(`Email: ${newAdmin[0].email}`);
        console.log(`ID: ${newAdmin[0].id}`);
        console.log(`Active: ${newAdmin[0].is_active}`);
      }
    }

    // Step 3: Test login
    console.log('\nStep 3: Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword,
    });

    if (loginError) {
      console.error('❌ Login test failed:', loginError);
    } else {
      console.log('✅ Login test successful!');
      console.log(`User: ${loginData.user.email}`);
      console.log(`Session: Active`);
    }

    console.log('\n🎉 Development admin setup complete!');
    console.log(`\n📝 Login credentials:`);
    console.log(`Email: ${devEmail}`);
    console.log(`Password: ${devPassword}`);
    console.log(`\n🔗 Admin URL: https://sophia-agent.vercel.app/admin/calculators`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createDevAdmin();