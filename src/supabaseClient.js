import { createClient } from '@supabase/supabase-js';

// Read from import.meta.env or fallback to local default Supabase CLI settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_LOCAL_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
