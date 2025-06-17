
import { useSupabaseStandaloneTodos } from "./useSupabaseStandaloneTodos";

// Re-export the Supabase hook with the original name for backward compatibility
export const useStandaloneTodos = useSupabaseStandaloneTodos;

// Re-export the interface
export type { StandaloneTodo } from "./useSupabaseStandaloneTodos";
