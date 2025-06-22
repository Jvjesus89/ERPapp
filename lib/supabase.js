import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://luopyujrqvaeywyifbcq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1b3B5dWpycXZhZXl3eWlmYmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NjYzOTgsImV4cCI6MjA2NjA0MjM5OH0.9dWehB7YJUiYtWDqhGomJjMsVb5uqHSd9-7O7eGFTfU';

// Cliente com anon key (para operações normais)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Para contornar RLS, você pode usar a Service Role Key:
// const supabaseServiceKey = 'sua_service_role_key_aqui';
// export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); 