import { createClient } from '@supabase/supabase-js';

// These will be set via environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '');
};

// Create Supabase client only if credentials are provided
// Otherwise, create a mock client that won't cause errors
let supabaseClient = null;

if (isSupabaseConfigured()) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  } else {
    console.warn('Supabase credentials not found. Using localStorage fallback mode.');
    // Create a mock client that won't cause errors
    supabaseClient = {
      auth: {
        getSession: async () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => Promise.reject(new Error('Supabase not configured')),
        signInWithPassword: async () => Promise.reject(new Error('Supabase not configured')),
        signOut: async () => Promise.resolve({ error: null }),
        resetPasswordForEmail: async () => Promise.reject(new Error('Supabase not configured')),
        user: null,
      },
      from: () => ({
        select: () => ({
          neq: () => ({ data: [], error: null }),
          eq: () => ({ data: [], error: null }),
          order: () => ({ data: [], error: null }),
        }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    };
  }

export const supabase = supabaseClient;

