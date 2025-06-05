
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Calendar, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WeeklyPlan {
  id: string;
  category: string;
  subcategory: string;
  plan_text: string;
  is_completed: boolean;
  month_key: string;
  week_index: number;
  priority_order?: number;
}

const WeeklyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate current week properly (matching WeeklyTimeline logic)
  const getCurrentWeek = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    // Calculate which week of the month today falls into
    const dayOfMonth = today.getDate();
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
    
    // Calculate week index (0-based)
    const weekIndex = Math.floor((dayOfMonth + firstDayWeekday - 1) / 7);
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return {
      monthKey: monthNames[currentMonth],
      weekIndex,
      year: currentYear,
      month: currentMonth
    };
  };

  const fetchWeeklyPlans = async () => {
    if (!user) return;
    
    const currentWeek = getCurrentWeek();
    
    try {
      const { data, error } = await supabase
        .from('weekly_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_key', currentWeek.monthKey)
        .eq('week_index', currentWeek.weekIndex);

      if (error) {
        console.error('Error fetching weekly plans:', error);
        return;
      }

      // Filter out empty plans and format data
      const formattedPlans: WeeklyPlan[] = (data || [])
        .filter(item => item.plan_text && item.plan_text.trim() !== '')
        .map((item, index) => ({
          id: item.id,
          category: item.category,
          subcategory: item.subcategory,
          plan_text: item.plan_text,
          is_completed: item.fact_text === 'COMPLETED',
          month_key: item.month_key,
          week_index: item.week_index,
          priority_order: index
        }))
        .sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));

      setWeeklyPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching weekly plans:', error);
      toast.error('Failed to load weekly plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyPlans();
  }, [user]);

  const toggleCompletion = async (planId: string) => {
    if (!user) return;

    const plan = weeklyPlans.find(p => p.id === planId);
    if (!plan) return;

    const newCompletionStatus = !plan.is_completed;

    try {
      const { error } = await supabase
        .from('weekly_tracking')
        .update({
          fact_text: newCompletionStatus ? 'COMPLETED' : '',
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) {
        console.error('Error updating completion status:', error);
        toast.error('Failed to update completion status');
        return;
      }

      // Update local state
      setWeeklyPlans(prev => prev.map(p => 
        p.id === planId 
          ? { ...p, is_completed: newCompletionStatus }
          : p
      ));

      toast.success(newCompletionStatus ? 'Plan marked as completed!' : 'Plan marked as incomplete');
    } catch (error) {
      console.error('Error updating completion:', error);
      toast.error('Failed to update completion status');
    }
  };

  const movePlan = (planId: string, direction: 'up' | 'down') => {
    const currentIndex = weeklyPlans.findIndex(p => p.id === planId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= weeklyPlans.length) return;

    const newPlans = [...weeklyPlans];
    [newPlans[currentIndex], newPlans[newIndex]] = [newPlans[newIndex], newPlans[currentIndex]];
    
    // Update priority orders
    newPlans.forEach((plan, index) => {
      plan.priority_order = index;
    });

    setWeeklyPlans(newPlans);
  };

  const getCurrentWeekInfo = () => {
    const currentWeek = getCurrentWeek();
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
    
    return {
      ...currentWeek,
      dateRange: `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`
    };
  };

  if (loading) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            This Week's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading your weekly plans...</div>
        </CardContent>
      </Card>
    );
  }

  const weekInfo = getCurrentWeekInfo();
  const completedCount = weeklyPlans.filter(p => p.is_completed).length;
  const totalCount = weeklyPlans.length;

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            This Week's Focus
          </div>
          <div className="text-sm font-normal text-gray-600 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {weekInfo.dateRange} • {completedCount}/{totalCount} completed
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {weeklyPlans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No plans set for this week</p>
            <p className="text-sm">Visit the Goals section to add weekly plans</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weeklyPlans.map((plan, index) => (
              <div
                key={plan.id}
                className={`flex items-start space-x-3 p-4 border rounded-lg transition-all ${
                  plan.is_completed 
                    ? 'bg-gray-50 border-gray-200 opacity-60' 
                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                }`}
              >
                {/* Completion Checkbox */}
                <Checkbox
                  checked={plan.is_completed}
                  onCheckedChange={() => toggleCompletion(plan.id)}
                  className="mt-1"
                />

                {/* Plan Content */}
                <div className={`flex-1 ${plan.is_completed ? 'line-through text-gray-500' : ''}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                      {plan.category}
                    </span>
                    <span className="text-sm font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded">
                      {plan.subcategory}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {plan.plan_text}
                  </p>
                </div>

                {/* Priority Controls */}
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => movePlan(plan.id, 'up')}
                    disabled={index === 0}
                    className="p-1 h-6 w-6"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => movePlan(plan.id, 'down')}
                    disabled={index === weeklyPlans.length - 1}
                    className="p-1 h-6 w-6"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyDashboard;
