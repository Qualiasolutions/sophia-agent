#!/usr/bin/env node

/**
 * Check Admin Users Script
 * Checks if there are admin users in the database for authentication
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking admin users in database...\n');

    // Check admin_users table
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('❌ No admin users found in database');
      console.log('📝 Admin users need to be seeded in the database');

      // Create a default admin user
      console.log('🔧 Creating default admin user...');
      const { data: newUser, error: createError } = await supabase
        .from('admin_users')
        .insert({
          id: 'default-admin-user',
          email: 'admin@sophiaai.com',
          is_active: true,
          created_at: new Date().toISOString(),
        })
        .select();

      if (createError) {
        console.error('❌ Error creating default admin user:', createError);
      } else {
        console.log('✅ Default admin user created successfully!');
        console.log('Email: admin@sophiaai.com');
      }
    } else {
      console.log(`✅ Found ${adminUsers.length} admin users:\n`);

      adminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Active: ${admin.is_active ? 'Yes' : 'No'}`);
        console.log(`   Created: ${admin.created_at}`);
        console.log('');
      });
    }

    // Check auth.users table
    console.log('🔍 Checking auth users...\n');

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`✅ Found ${authUsers.users.length} auth users:\n`);

    authUsers.users.slice(0, 5).forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log('');
    });

    if (authUsers.users.length > 5) {
      console.log(`... and ${authUsers.users.length - 5} more users`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAdminUsers();