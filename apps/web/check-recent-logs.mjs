import { createClient } from '@supabase/supabase-js';

const url = 'https://zmwgoagpxefdruyhkfoh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd2dvYWdweGVmZHJ1eWhrZm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODUzNiwiZXhwIjoyMDc0ODA0NTM2fQ.SKnWv_TFaBnjTPrWvtgVJwAM6cUO7gspSWVsgE9VjPk';

const supabase = createClient(url, key);

console.log('Checking last 5 messages...\n');

const { data, error } = await supabase
  .from('conversation_logs')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(5);

if (error) {
  console.log('❌ Error:', error.message);
} else {
  data.forEach((log, i) => {
    console.log(`\n${i + 1}. ${log.direction.toUpperCase()} - ${new Date(log.timestamp).toLocaleString()}`);
    console.log(`   Message: "${log.message_text}"`);
    console.log(`   Agent ID: ${log.agent_id || 'NULL'}`);
    console.log(`   Status: ${log.delivery_status || 'N/A'}`);
  });

  const inbound = data.filter(l => l.direction === 'inbound').length;
  const outbound = data.filter(l => l.direction === 'outbound').length;
  console.log(`\n📊 Last 5: ${inbound} inbound, ${outbound} outbound`);
}
