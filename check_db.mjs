import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  const { data, error, count } = await supabase
    .from('inscricoes_30_anos')
    .select('*', { count: 'exact' });
  
  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Total records:', count);
    if (count > 0) {
      console.log('Sample data:', data.slice(0, 1));
    }
  }
}

checkData();
