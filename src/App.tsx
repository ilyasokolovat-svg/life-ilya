
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
    const initializeApp = async () => {
      try {
        // Simple query to check if Supabase is connected
        const { data, error } = await supabase
          .from('habit_days')
          .select('count')
          .limit(1);
        
        if (error) {
          console.error('Error connecting to Supabase:', error);
          toast.error('Could not connect to database. Some features may not work.');
          
          try {
            // Attempt to create tables if they don't exist
            await supabase.rpc('create_habit_days_table');
            await supabase.rpc('create_habit_goals_table');
            console.log('Successfully initialized habit tracking tables');
            toast.success('Database connected successfully');
          } catch (tableError) {
            console.error('Failed to initialize tables:', tableError);
          }
        } else {
          console.log('Successfully connected to Supabase');
        }
      } catch (err) {
        console.error('Failed to initialize Supabase connection:', err);
      }
    };
    
    initializeApp();
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
