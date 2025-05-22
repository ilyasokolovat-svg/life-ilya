
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";

// Get Supabase client from the integrated client
import { supabase as integratedSupabase } from '@/integrations/supabase/client';

// Export the client directly
export const supabase = integratedSupabase;

// Helper function to show error toast
export const handleError = (error: any, message = 'An error occurred') => {
  console.error(error);
  toast.error(`${message}: ${error.message || 'Unknown error'}`);
};
