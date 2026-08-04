import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://evncmctalsvquucdr30.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XpnDfNzjwDDqUty-qUWEBg_EkBA89ui';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
