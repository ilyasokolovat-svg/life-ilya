
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Goals from "./pages/Goals";
import GoalsOverview from "./pages/GoalsOverview";
import GoalsV2 from "./pages/GoalsV2";
import LifeEvents from "./pages/LifeEvents";
import TripPlanning from "./pages/TripPlanning";
import YearAnalysis from "./pages/YearAnalysis";
import YearAnalysisIndex from "./pages/YearAnalysisIndex";
import FocusTimer from "./pages/FocusTimer";
import SocialCRM from "./pages/SocialCRM";
import Finance from "./pages/Finance";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import React, { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckinTrigger } from "@/components/checkin/CheckinTrigger";

// Create a client with default options - increasing staleTime for better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-light/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-dark mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// App Routes component that has access to auth context
const AppRoutes = () => {
  const { user, loading } = useAuth();
  
  // Log connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('habit_days').select('count');
        if (error) {
          console.log('Supabase connection issue:', error.message);
        } else {
          console.log('Supabase connection successful');
        }
      } catch (err) {
        console.error('Error checking Supabase connection:', err);
      }
    };
    
    checkConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-light/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-dark mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CheckinTrigger />
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/life-events" element={<ProtectedRoute><LifeEvents /></ProtectedRoute>} />
        <Route path="/goals/:category" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/goals-overview" element={<ProtectedRoute><GoalsV2 /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><GoalsV2 /></ProtectedRoute>} />
        <Route path="/trip-planning" element={<ProtectedRoute><TripPlanning /></ProtectedRoute>} />
        <Route path="/year-analysis" element={<ProtectedRoute><YearAnalysisIndex /></ProtectedRoute>} />
        <Route path="/year-analysis/:year" element={<ProtectedRoute><YearAnalysis /></ProtectedRoute>} />
        <Route path="/focus" element={<ProtectedRoute><FocusTimer /></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute><SocialCRM /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
