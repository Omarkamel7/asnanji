import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Real Project Credentials for Dr. Karim Dental Clinic
const SUPABASE_PROJECT_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nvpkcjhrwpglmyehksyd.supabase.co';

const SUPABASE_PROJECT_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_lMqaW8rmDeS2v-FE8PjbCw_wXWqleUm';

export const isSupabaseConfigured = true;

export const supabase = createClient<any>(
  SUPABASE_PROJECT_URL,
  SUPABASE_PROJECT_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
