const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://imrchmvxeiurbvjkdvbg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcmNobXZ4ZWl1cmJ2amtkdmJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1MTg2NiwiZXhwIjoyMDkzMjI3ODY2fQ.rZfMysCyzHrRQzD0w6YSMWUDqeTiFJfEgA2-zOC9BF0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('buyer_profiles').select('*').limit(1);
  if (error) console.error(error);
  else console.log('Buyer Profile columns:', Object.keys(data[0] || {}));
}

test();
