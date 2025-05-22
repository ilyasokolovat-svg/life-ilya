
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";

// Get environment variables from window (injected by Lovable)
const supabaseUrl = window.env?.SUPABASE_URL || '';
const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY || '';

// Check if we have valid credentials
const hasValidCredentials = supabaseUrl !== '' && supabaseAnonKey !== '';

// Show warning if credentials are missing
if (!hasValidCredentials) {
  console.error('Missing Supabase credentials - make sure you have connected your Supabase project in Lovable');
  // Only show toast when in browser environment (not during SSR)
  if (typeof window !== 'undefined') {
    toast.error('Supabase connection failed. Please connect your Supabase project in Lovable.');
  }
}

// Create client with mock URL if real one not available to prevent runtime errors
// The application will show appropriate errors to the user when they try to use Supabase features
export const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(
      'https://placeholder-project.supabase.co',  // Placeholder URL
      'placeholder-key'                           // Placeholder key
    );

// Helper function to show error toast
export const handleError = (error: any, message = 'An error occurred') => {
  console.error(error);
  toast.error(`${message}: ${error.message || 'Unknown error'}`);
};
