const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('webapp/.env', 'utf8');
const supabaseUrlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch[1].trim();
const supabaseKey = supabaseKeyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSucKhoe() {
  const { data, error } = await supabase.from('suc_khoe').select('*').limit(1);
  if (error) {
    console.error('Error fetching suc_khoe:', error);
  } else {
    console.log('Successfully fetched suc_khoe. Data:', data);
  }
}

checkSucKhoe();
