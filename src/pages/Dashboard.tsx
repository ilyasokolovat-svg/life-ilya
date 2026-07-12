
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Shield, Check, Edit3, User, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

import TestDataLoader from "@/components/TestDataLoader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { HabitStreakSummary } from "@/components/dashboard/HabitStreakSummary";
import { TodayStreaksCard } from "@/components/dashboard/TodayStreaksCard";
import { HeaderStreakStrip } from "@/components/dashboard/HeaderStreakStrip";
import { DailyCheckinModal } from "@/daily-checkin/DailyCheckinModal";
import { QuarterlyDashboardStrip } from "@/goals/components/QuarterlyDashboardStrip";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [checkinOpen, setCheckinOpen] = useState(false);
  
  // Monthly commitment state
  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const [commitment, setCommitment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Load commitment from Supabase
  useEffect(() => {
    if (!user) return;
    const loadCommitment = async () => {
      const { data } = await supabase
        .from('goals_data')
        .select('planned_goal')
        .eq('user_id', user.id)
        .eq('category', 'monthly_commitment')
        .eq('subcategory', 'non_negotiable')
        .eq('period_type', 'month')
        .eq('period_key', currentMonthKey)
        .maybeSingle();
      if (data?.planned_goal) setCommitment(data.planned_goal);
    };
    loadCommitment();
  }, [user, currentMonthKey]);

  const saveCommitment = async () => {
    if (!user) return;
    const { data: existing } = await supabase
      .from('goals_data')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', 'monthly_commitment')
      .eq('subcategory', 'non_negotiable')
      .eq('period_type', 'month')
      .eq('period_key', currentMonthKey)
      .maybeSingle();

    if (existing) {
      await supabase.from('goals_data').update({ planned_goal: editValue, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('goals_data').insert({ user_id: user.id, category: 'monthly_commitment', subcategory: 'non_negotiable', period_type: 'month', period_key: currentMonthKey, planned_goal: editValue });
    }
    setCommitment(editValue);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <TestDataLoader />
      
      {/* Sidebar */}
      {sidebarOpen && <DashboardSidebar />}
      
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <Menu className="w-4 h-4 text-muted-foreground" />
              </button>
              <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            </div>
            <HeaderStreakStrip />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
            </div>
          </div>
        </header>

        <DailyCheckinModal open={checkinOpen} onOpenChange={setCheckinOpen} />

        <main className="px-6 py-6 max-w-4xl mx-auto space-y-6">
          {/* Non-negotiable Commitment */}
          <div className="bg-gradient-to-r from-primary/90 to-accent/90 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary-foreground" />
              <h3 className="text-sm font-semibold text-primary-foreground">
                Non-Negotiable · {format(new Date(), 'MMMM yyyy')}
              </h3>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Your one commitment..."
                  className="bg-white/20 border-white/30 text-primary-foreground placeholder:text-primary-foreground/60 flex-1 h-9 text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveCommitment(); if (e.key === 'Escape') setIsEditing(false); }}
                />
                <Button size="sm" onClick={saveCommitment} className="bg-white/20 hover:bg-white/30 text-primary-foreground h-9">
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between cursor-pointer group" onClick={() => { setEditValue(commitment); setIsEditing(true); }}>
                <p className="text-primary-foreground/90 text-sm font-medium">
                  {commitment || 'Click to set your commitment...'}
                </p>
                <Edit3 className="w-3.5 h-3.5 text-primary-foreground/60 group-hover:text-primary-foreground transition-colors" />
              </div>
            )}
          </div>

          {/* Today's streaks + habits */}
          <TodayStreaksCard onOpenCheckin={() => setCheckinOpen(true)} />

          {/* Quarterly goals weekly snapshot */}
          <QuarterlyDashboardStrip />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
