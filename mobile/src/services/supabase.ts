// ============================================================================
// BUS STOP — SUPABASE CLIENT FOR MOBILE (SECURE WITH ASYNCSTORAGE)
// Preserves existing Supabase database, auth triggers, and RLS policies.
// Does NOT expose service-role key or secrets.
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://tmacsdrjzkgykfkkrhgm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RrT7Aaxv91wXrG5BZhXIYA_k9kdp6r0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
