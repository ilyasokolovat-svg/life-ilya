
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from 'lucide-react';
import { useGoalsData } from '@/hooks/useGoalsData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WeeklyPlanItem {
  id: string;
  category: string;
  subcategory: string;
  plan: string;
  isCompleted: boolean;
}

const WeeklyOverview = () => {
  const { user } = useAuth();
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get all weekly data from all categories
  const careerData = useGoalsData('career');
  const businessData = useGoalsData('business');
  const investmentsData = useGoalsData('investments');
  const skillsData = useGoalsData('skills');

  const allWeeklyData = [
    ...careerData.weeklyData.map(item => ({ ...item, category: 'career' })),
    ...businessData.weeklyData.map(item => ({ ...item, category: 'business' })),
    ...investmentsData.weeklyData.map(item => ({ ...item, category: 'investments' })),
    ...skillsData.weeklyData.map(item => ({ ...item, category: 'skills' }))
  ];

  // Calculate current week exactly like WeeklyTimeline does
  const getCurrentWeek = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based (0 = January, 5 = June)
    
    // Month names array to match the data format
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const monthKey = monthNames[currentMonth];
    
    // Get the first day of the current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startOfFirstWeek = new Date(firstDayOfMonth);
    startOfFirstWeek.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
    
    // Current date
    const today = now.getDate();
    
    // Calculate which week we're in
    let weekIndex = 0;
    let weekStart = new Date(startOfFirstWeek);
    
    while (weekIndex < 6) { // Maximum 6 weeks in a month view
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Check if today falls within this week
      const weekStartDate = Math.max(1, weekStart.getDate());
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const weekEndDate = Math.min(lastDayOfMonth, weekEnd.getDate());
      
      // If today is within this week's range AND the week overlaps with current month
      if (today >= weekStartDate && today <= weekEndDate && 
          weekStart.getMonth() <= currentMonth && weekEnd.getMonth() >= currentMonth) {
        break;
      }
      
      weekIndex++;
      weekStart.setDate(weekStart.getDate() + 7);
    }
    
    console.log('WeeklyOverview - Current week calculation:', {
      today: now.toDateString(),
      monthKey,
      weekIndex,
      currentMonth,
      firstDayOfMonth: firstDayOfMonth.toDateString(),
      startOfFirstWeek: startOfFirstWeek.toDateString()
    });
    
    return { monthKey, weekIndex };
  };

  useEffect(() => {
    if (!user || allWeeklyData.length === 0) {
      setLoading(false);
      return;
    }

    const loadCurrentWeekPlans = async () => {
      try {
        const { monthKey, weekIndex } = getCurrentWeek();
        
        console.log('WeeklyOverview - Looking for plans:', { monthKey, weekIndex });
        console.log('WeeklyOverview - Available data:', allWeeklyData);
        
        // Filter data for current week with non-empty plans
        const currentWeekPlans = allWeeklyData.filter(item => {
          const monthMatch = item.month_key === monthKey;
          const weekMatch = item.week_index === weekIndex;
          const hasPlan = item.plan_text && item.plan_text.trim() !== '';
          
          console.log('WeeklyOverview - Checking item:', {
            subcategory: item.subcategory,
            itemMonth: item.month_key,
            itemWeek: item.week_index,
            planText: item.plan_text,
            monthMatch,
            weekMatch,
            hasPlan
          });
          
          return monthMatch && weekMatch && hasPlan;
        });

        console.log('WeeklyOverview - Filtered plans:', currentWeekPlans);

        // Transform to our component format
        const plans: WeeklyPlanItem[] = currentWeekPlans.map(item => ({
          id: item.id!,
          category: item.category,
          subcategory: item.subcategory,
          plan: item.plan_text!,
          isCompleted: item.fact_text === 'COMPLETED'
        }));

        setWeeklyPlans(plans);
      } catch (error) {
        console.error('Error loading weekly plans:', error);
        toast.error('Failed to load weekly plans');
      } finally {
        setLoading(false);
      }
    };

    loadCurrentWeekPlans();
  }, [user, allWeeklyData]);

  const toggleCompletion = async (planId: string, currentStatus: boolean) => {
    if (!user) return;

    const newStatus = !currentStatus;
    
    try {
      const { error } = await supabase
        .from('weekly_tracking')
        .update({
          fact_text: newStatus ? 'COMPLETED' : '',
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setWeeklyPlans(prev => 
        prev.map(plan => 
          plan.id === planId ? { ...plan, isCompleted: newStatus } : plan
        )
      );

      toast.success(newStatus ? 'Plan marked as completed!' : 'Plan marked as incomplete');
    } catch (error) {
      console.error('Error updating completion status:', error);
      toast.error('Failed to update completion status');
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          This Week's Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {weeklyPlans.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No plans set for this week. Visit your goals to add weekly plans.
          </p>
        ) : (
          <div className="space-y-3">
            {weeklyPlans.map((plan) => (
              <div
                key={plan.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                  plan.isCompleted 
                    ? 'bg-gray-100 border-gray-300 opacity-60' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <Checkbox
                  checked={plan.isCompleted}
                  onCheckedChange={() => toggleCompletion(plan.id, plan.isCompleted)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-blue-700 capitalize">
                      {plan.category}
                    </span>
                    <span className="text-sm text-gray-500">→</span>
                    <span className="text-sm font-medium text-gray-700">
                      {plan.subcategory}
                    </span>
                  </div>
                  <p className={`text-sm ${plan.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                    {plan.plan}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyOverview;
