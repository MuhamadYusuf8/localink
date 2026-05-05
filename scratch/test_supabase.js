const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imrchmvxeiurbvjkdvbg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcmNobXZ4ZWl1cmJ2amtkdmJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1MTg2NiwiZXhwIjoyMDkzMjI3ODY2fQ.rZfMysCyzHrRQzD0w6YSMWUDqeTiFJfEgA2-zOC9BF0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: users } = await supabase.from('users').select('id, name').limit(5);
  console.log('Users IDs:', users.map(u => u.id + ' (' + u.name + ')'));
  const { data: profiles } = await supabase.from('buyer_profiles').select('id, user_id').limit(5);
  console.log('Buyer Profiles (ID, UserID):', profiles.map(p => p.id + ', ' + p.user_id));
}

test();
