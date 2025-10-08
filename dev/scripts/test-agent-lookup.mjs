import { createClient } from '@supabase/supabase-js';

const url = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

console.log('Testing agent lookup with service_role key...\n');

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test the exact query the webhook uses
const phoneNumber = '+35799111668';

const { data: agent, error: agentError } = await supabase
  .from('agents')
  .select('id')
  .eq('phone_number', phoneNumber)
  .single();

if (agentError) {
  console.log('❌ Agent lookup FAILED');
  console.log('Error code:', agentError.code);
  console.log('Error message:', agentError.message);
  console.log('Error details:', JSON.stringify(agentError, null, 2));
} else if (!agent) {
  console.log('❌ Agent not found (null result)');
} else {
  console.log('✅ Agent lookup SUCCESS');
  console.log('Agent ID:', agent.id);
}

// Check RLS policies on agents table
console.log('\n\nChecking RLS policies on agents table...\n');
const { data: policies, error: policyError } = await supabase
  .rpc('exec_sql', {
    sql: `SELECT schemaname, tablename, policyname, roles, cmd
          FROM pg_policies
          WHERE tablename = 'agents';`
  });

if (policyError) {
  console.log('Could not check policies:', policyError.message);
} else {
  console.log('RLS Policies:', JSON.stringify(policies, null, 2));
}
