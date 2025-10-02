import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const url = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(url, key);

console.log('Applying missing database migrations...\n');

// Check if delivery_status column exists
console.log('Checking if delivery_status column exists...');
const { data: columns, error: colError } = await supabase
  .from('conversation_logs')
  .select('delivery_status')
  .limit(1);

if (colError && colError.message.includes('does not exist')) {
  console.log('❌ delivery_status column missing - applying migration 003\n');

  const migration003 = readFileSync('./packages/database/supabase/migrations/003_add_delivery_status_to_conversation_logs.sql', 'utf8');

  console.log('Applying migration 003...');
  const { error: migError } = await supabase.rpc('exec_sql', { sql: migration003 }).single();

  if (migError) {
    console.log('❌ Migration failed:', migError.message);
    console.log('\nManual SQL to run in Supabase SQL Editor:');
    console.log('---');
    console.log(migration003);
  } else {
    console.log('✅ Migration 003 applied successfully');
  }
} else if (colError) {
  console.log('❌ Error checking column:', colError.message);
} else {
  console.log('✅ delivery_status column already exists');
}

// Check migration 004
console.log('\nChecking migration 004 (null agent_id)...');
const migration004 = readFileSync('./packages/database/supabase/migrations/004_allow_null_agent_id_for_unregistered_attempts.sql', 'utf8');
console.log('\nMigration 004 SQL (run manually if needed):');
console.log('---');
console.log(migration004);
