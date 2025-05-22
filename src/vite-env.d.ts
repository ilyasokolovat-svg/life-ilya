
/// <reference types="vite/client" />

interface Window {
  env?: {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  }
}
