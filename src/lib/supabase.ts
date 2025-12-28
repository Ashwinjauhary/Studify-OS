import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // We don't throw here to avoid crashing the app during build/test without envs, 
    // but in prod this should be handled.
    console.warn('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
