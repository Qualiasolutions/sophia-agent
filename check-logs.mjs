import { createClient } from '@supabase/supabase-js';

const url = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(url, key);

console.log('Checking recent conversation logs...\n');

const { data: logs, error } = await supabase
  .from('conversation_logs')
  .select('id, message_text, direction, timestamp, agent_id, delivery_status')
  .order('timestamp', { ascending: false })
  .limit(10);

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log('Recent logs:');
  console.log(JSON.stringify(logs, null, 2));

  const outbound = logs.filter(l => l.direction === 'outbound');
  console.log(`\n📊 Summary: ${logs.length} total, ${outbound.length} outbound`);
}
