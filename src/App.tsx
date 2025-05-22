
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import React, { useEffect, useState } from "react";
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
          .limit(1) as any;
        
        // If we get an error about relation not existing, create the tables
        if (error && (error.message.includes('does not exist') || error.code === 'PGRST116')) {
          // First try to create habit_days table
          const { error: createDaysError } = await supabase.rpc('create_habit_days_table') as any;
          if (createDaysError && !createDaysError.message.includes('already exists')) {
            console.error('Error creating habit_days table:', createDaysError);
            toast.error('Failed to set up habit tracking tables');
          }
          
          // Then try to create habit_goals table
          const { error: createGoalsError } = await supabase.rpc('create_habit_goals_table') as any;
          if (createGoalsError && !createGoalsError.message.includes('already exists')) {
            console.error('Error creating habit_goals table:', createGoalsError);
            toast.error('Failed to set up goal tracking tables');
          }
          
          if (!createDaysError && !createGoalsError) {
            toast.success('Habit tracking is ready to use!');
          }
        } else if (error) {
          console.error('Error connecting to Supabase:', error);
          toast.error('Could not connect to database. Some features may not work.');
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
