
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import React, { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Create a client with default options - increasing staleTime for better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  // Check Supabase connection on app load
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Simple query to check if Supabase is connected
        const { data, error } = await supabase
          .from('habit_days')
          .select('count')
          .limit(1);
        
        if (error) {
          console.error('Error connecting to Supabase:', error);
          
          // Try to create tables if they don't exist
          await supabase.rpc('create_habit_days_table');
          await supabase.rpc('create_habit_goals_table');
          
          // Check if table creation was successful
          const { error: retryError } = await supabase
            .from('habit_days')
            .select('count')
            .limit(1);
            
          if (retryError) {
            console.error('Failed to create tables:', retryError);
            toast.error('Could not connect to database. Some features may not work.');
          } else {
            console.log('Successfully created habit tracking tables');
          }
        } else {
          console.log('Successfully connected to Supabase');
        }
      } catch (err) {
        console.error('Failed to initialize Supabase connection:', err);
        toast.error('Failed to connect to database');
      }
    };
    
    checkSupabaseConnection();
  }, []);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
