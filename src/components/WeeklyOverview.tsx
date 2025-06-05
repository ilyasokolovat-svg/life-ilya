
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { useGoalsData } from '@/hooks/useGoalsData';
import { useSubcategoryPreferences } from '@/hooks/useSubcategoryPreferences';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WeeklyPlanItem {
  category: string;
  subcategory: string;
  plan: string;
  weekKey: string;
  weekIndex: number;
  monthKey: string;
  isCompleted: boolean;
  id?: string;
}

const WeeklyOverview = () => {
  const { user } = useAuth();
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const initialCategories = {
    career: ["Commission/Bonus/Dividends", "Quota Achievement", "Salary/Income", "Promotion", "Sales Skills"],
    business: ["TT Website", "TT Instagram Organic", "TT Ads", "Selo Olive Oil", "Real Estate Projects"],
    investments: ["Crypto", "ETFs", "Monthly Investment"],
    skills: ["Spanish Language", "Arabic Language", "Golf", "Yachting", "Networking", "Sales Skills", "Books"]
  };

  const { categorySubcategories } = useSubcategoryPreferences(initialCategories);

  // Get current week info
  const getCurrentWeekInfo = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthKey = `${currentYear}-${currentMonth}`;
    
    // Get the first day of the month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate which week of the month we're in
    const currentDate = now.getDate();
    const weekIndex = Math.floor((currentDate + firstDayOfWeek - 1) / 7);
    
    return { monthKey, weekIndex };
  };

  const { monthKey: currentMonthKey, weekIndex: currentWeekIndex } = getCurrentWeekInfo();

  // Fetch weekly data for all categories
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

  useEffect(() => {
    if (!user) return;

    const loadWeeklyPlans = async () => {
      try {
        // Get current week's plans
        const currentWeekPlans = allWeeklyData.filter(
          item => item.month_key === currentMonthKey && 
                  item.week_index === currentWeekIndex &&
                  item.plan_text && 
                  item.plan_text.trim() !== ''
        );

        const plans: WeeklyPlanItem[] = currentWeekPlans.map(item => ({
          category: item.category,
          subcategory: item.subcategory,
          plan: item.plan_text || '',
          weekKey: `${item.month_key}-week-${item.week_index}`,
          weekIndex: item.week_index,
          monthKey: item.month_key,
          isCompleted: false, // Will be updated from database
          id: item.id
        }));

        // Load completion status from database
        const { data: completionData } = await supabase
          .from('weekly_tracking')
          .select('id, fact_text')
          .eq('user_id', user.id)
          .eq('month_key', currentMonthKey)
          .eq('week_index', currentWeekIndex);

        // Update completion status based on fact_text
        const updatedPlans = plans.map(plan => {
          const dbRecord = completionData?.find(record => 
            record.id === plan.id
          );
          return {
            ...plan,
            isCompleted: dbRecord?.fact_text === 'COMPLETED'
          };
        });

        setWeeklyPlans(updatedPlans);
      } catch (error) {
        console.error('Error loading weekly plans:', error);
        toast.error('Failed to load weekly plans');
      } finally {
        setLoading(false);
      }
    };

    if (allWeeklyData.length > 0) {
      loadWeeklyPlans();
    }
  }, [user, allWeeklyData, currentMonthKey, currentWeekIndex]);

  const toggleCompletion = async (planId: string, currentStatus: boolean) => {
    if (!user) return;

    const newStatus = !currentStatus;
    
    try {
      // Update in database - use fact_text to store completion status
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

  const movePlan = (index: number, direction: 'up' | 'down') => {
    const newPlans = [...weeklyPlans];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newPlans.length) {
      [newPlans[index], newPlans[targetIndex]] = [newPlans[targetIndex], newPlans[index]];
      setWeeklyPlans(newPlans);
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
            {weeklyPlans.map((plan, index) => (
              <div
                key={`${plan.category}-${plan.subcategory}-${plan.weekKey}`}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                  plan.isCompleted 
                    ? 'bg-gray-100 border-gray-300 opacity-60' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <Checkbox
                  checked={plan.isCompleted}
                  onCheckedChange={() => plan.id && toggleCompletion(plan.id, plan.isCompleted)}
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

                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => movePlan(index, 'up')}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => movePlan(index, 'down')}
                    disabled={index === weeklyPlans.length - 1}
                    className="h-6 w-6 p-0"
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

export default WeeklyOverview;
