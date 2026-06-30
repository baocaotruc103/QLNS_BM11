const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envContent.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
    const [key, ...rest] = line.split('=');
    return [key.trim(), rest.join('=').trim()];
  })
);

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('ho_va_ten', '%Lâm Quang Thực%');
  
  if (error) {
    console.error('Error fetching user:', error);
  } else {
    console.log('User data from users table:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkUser();
