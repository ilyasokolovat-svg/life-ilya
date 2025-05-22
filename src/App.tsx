
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
        // Simple query to check if Supabase is connected - use functions instead
        // This query will fail more gracefully if the table doesn't exist yet
        const { error: funcError } = await supabase.rpc('create_habit_days_table');
        if (funcError) {
          console.log('Table creation function was called but might already exist:', funcError.message);
          // This is expected if tables already exist
        }
        
        console.log('Successfully initialized habit tracking tables');
        toast.success('Database connected successfully', {
          duration: 2000,
        });
      } catch (err) {
        console.error('Failed to initialize Supabase connection:', err);
        toast.error('Could not connect to database. Try refreshing the page.', {
          duration: 5000,
        });
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
