import { createClient } from '@supabase/supabase-js';

const supabaseUrl = localStorage.getItem('noxus_supabase_url') || import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = localStorage.getItem('noxus_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co';

if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('Supabase URL or Anon Key is missing. Check seu arquivo .env.local ou as variáveis de ambiente na Vercel.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'noxus-auth-token',
    },
    db: {
        schema: 'noxus'
    }
});
