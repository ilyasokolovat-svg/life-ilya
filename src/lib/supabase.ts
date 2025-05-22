
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";

// Get environment variables from window (injected by Lovable)
const supabaseUrl = window.env?.SUPABASE_URL;
const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials - make sure you have connected your Supabase project in Lovable');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Helper function to show error toast
export const handleError = (error: any, message = 'An error occurred') => {
  console.error(error);
  toast.error(`${message}: ${error.message || 'Unknown error'}`);
};

