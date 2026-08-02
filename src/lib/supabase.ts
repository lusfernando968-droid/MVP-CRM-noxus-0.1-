import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('Supabase URL or Anon Key is missing. Check seu arquivo .env.local ou as variáveis de ambiente na Vercel.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'noxus-auth-token',
    }
});
