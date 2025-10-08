import { createClient } from '@supabase/supabase-js';

const url = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(url, key);

console.log('Checking for agent +35799111668...\n');

// Check agents table
const { data: agents, error: agentError } = await supabase
  .from('agents')
  .select('id, phone_number, name, email, is_active')
  .eq('phone_number', '+35799111668');

if (agentError) {
  console.log('❌ Error querying agents:', agentError.message);
} else {
  console.log('✅ Agents query result:');
  console.log(JSON.stringify(agents, null, 2));
  if (agents.length === 0) {
    console.log('\n⚠️  Agent +35799111668 NOT FOUND in database');
  } else {
    console.log('\n✅ Agent found and active:', agents[0].is_active);
  }
}

// Check conversation_logs
console.log('\n\nChecking conversation_logs for +35799111668...\n');
const { data: logs, error: logError } = await supabase
  .from('conversation_logs')
  .select('id, message_text, direction, timestamp, delivery_status')
  .order('timestamp', { ascending: false })
  .limit(10);

if (logError) {
  console.log('❌ Error querying logs:', logError.message);
} else {
  console.log('✅ Recent conversation logs:');
  console.log(JSON.stringify(logs, null, 2));
}

// List all agents
console.log('\n\nListing all agents in database...\n');
const { data: allAgents, error: allError } = await supabase
  .from('agents')
  .select('id, phone_number, name, is_active')
  .order('created_at', { ascending: false });

if (allError) {
  console.log('❌ Error listing agents:', allError.message);
} else {
  console.log('✅ All agents:');
  console.log(JSON.stringify(allAgents, null, 2));
}
