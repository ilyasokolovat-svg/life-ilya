import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Calendar, Save } from "lucide-react";
import { useParams } from "react-router-dom";
import { useGoalsData } from "@/hooks/useGoalsData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WeeklyTimelineProps {
  subcategories: string[];
}

const WeeklyTimeline: React.FC<WeeklyTimelineProps> = ({ subcategories }) => {
  const { user } = useAuth();
  const { category } = useParams<{ category: string }>();
  const { weeklyData, monthlyReviews, saveWeeklyData, saveMonthlyReview, isSaving } = useGoalsData(category || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [localWeeklyData, setLocalWeeklyData] = useState<Record<string, Record<string, { plan: string; fact: string }>>>({});
  const [localMonthlyReview, setLocalMonthlyReview] = useState<Record<string, Record<string, string>>>({});
  const [weekCompletionStatus, setWeekCompletionStatus] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRefs = useRef<HTMLDivElement[]>([]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Load data from database into local state
  useEffect(() => {
    const monthKey = `${selectedYear}-${selectedMonth}`;
    const loadedWeeklyData: Record<string, Record<string, { plan: string; fact: string }>> = {};
    const loadedMonthlyData: Record<string, Record<string, string>> = {};
    const loadedCompletionStatus: Record<string, boolean> = {};
    
    subcategories.forEach(subcategory => {
      loadedWeeklyData[subcategory] = {};
      loadedMonthlyData[subcategory] = {};
      
      // Load weekly data and completion status
      weeklyData.forEach(week => {
        if (week.subcategory === subcategory && week.month_key === monthKey) {
          const weekKey = `${monthKey}-week-${week.week_index}`;
          loadedWeeklyData[subcategory][weekKey] = {
            plan: week.plan_text || '',
            fact: week.fact_text || ''
          };
          
          // Check if this week is marked as completed
          const completionKey = `${subcategory}-${weekKey}`;
          loadedCompletionStatus[completionKey] = week.fact_text === 'COMPLETED';
        }
      });
      
      // Load monthly reviews
      monthlyReviews.forEach(review => {
        if (review.subcategory === subcategory && review.month_key === monthKey) {
          loadedMonthlyData[subcategory][monthKey] = review.review_text || '';
        }
      });
    });
    
    setLocalWeeklyData(loadedWeeklyData);
    setLocalMonthlyReview(loadedMonthlyData);
    setWeekCompletionStatus(loadedCompletionStatus);
  }, [weeklyData, monthlyReviews, subcategories, selectedMonth, selectedYear]);

  const getWeeksInMonth = (month: number, year: number) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeekStart = new Date(firstDay);
    currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay());

    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: weekEnd,
        label: `W${weeks.length + 1}`,
        dateRange: `${currentWeekStart.getDate()}/${currentWeekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`
      });
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const monthKey = `${selectedYear}-${selectedMonth}`;
  const weeks = getWeeksInMonth(selectedMonth, selectedYear);

  const updateWeeklyData = (subcategory: string, weekIndex: number, type: 'plan' | 'fact', value: string) => {
    const weekKey = `${monthKey}-week-${weekIndex}`;
    setLocalWeeklyData(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [weekKey]: {
          ...prev[subcategory]?.[weekKey],
          [type]: value
        }
      }
    }));
  };

  const updateMonthlyReview = (subcategory: string, value: string) => {
    setLocalMonthlyReview(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [monthKey]: value
      }
    }));
  };

  const toggleWeekCompletion = async (subcategory: string, weekIndex: number) => {
    if (!category || !user) return;

    const weekKey = `${monthKey}-week-${weekIndex}`;
    const completionKey = `${subcategory}-${weekKey}`;
    const currentStatus = weekCompletionStatus[completionKey] || false;
    const newStatus = !currentStatus;

    try {
      // Update in database using the fact_text field to store completion status
      const weekData = localWeeklyData[subcategory]?.[weekKey];
      const planText = weekData?.plan || '';
      
      await new Promise<void>((resolve, reject) => {
        saveWeeklyData({
          category,
          subcategory,
          month_key: monthKey,
          week_index: weekIndex,
          plan_text: planText,
          fact_text: newStatus ? 'COMPLETED' : (weekData?.fact || ''), // Use 'COMPLETED' to mark as done
        }, {
          onSuccess: () => resolve(),
          onError: reject
        });
      });

      // Update local state
      setWeekCompletionStatus(prev => ({
        ...prev,
        [completionKey]: newStatus
      }));

      toast.success(newStatus ? 'Week marked as completed!' : 'Week marked as incomplete');
    } catch (error) {
      console.error('Error updating completion status:', error);
      toast.error('Failed to update completion status');
    }
  };

  const handleSaveProgress = async () => {
    if (!category) return;
    
    const savePromises: Promise<void>[] = [];
    
    // Save weekly data
    Object.entries(localWeeklyData).forEach(([subcategory, weeks]) => {
      Object.entries(weeks).forEach(([weekKey, data]) => {
        const weekIndex = parseInt(weekKey.split('-week-')[1]);
        const completionKey = `${subcategory}-${weekKey}`;
        const isCompleted = weekCompletionStatus[completionKey];
        
        if (data.plan || data.fact || isCompleted) {
          savePromises.push(
            new Promise<void>((resolve, reject) => {
              saveWeeklyData({
                category,
                subcategory,
                month_key: monthKey,
                week_index: weekIndex,
                plan_text: data.plan,
                fact_text: isCompleted ? 'COMPLETED' : data.fact,
              }, {
                onSuccess: () => resolve(),
                onError: reject
              });
            })
          );
        }
      });
    });
    
    // Save monthly reviews
    Object.entries(localMonthlyReview).forEach(([subcategory, reviews]) => {
      Object.entries(reviews).forEach(([reviewMonthKey, reviewText]) => {
        if (reviewText && reviewText.trim()) {
          savePromises.push(
            new Promise<void>((resolve, reject) => {
              saveMonthlyReview({
                category,
                subcategory,
                month_key: reviewMonthKey,
                review_text: reviewText,
              }, {
                onSuccess: () => resolve(),
                onError: reject
              });
            })
          );
        }
      });
    });
    
    try {
      await Promise.all(savePromises);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleScroll = (scrollLeft: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft;
    }
    contentScrollRefs.current.forEach(ref => {
      if (ref) {
        ref.scrollLeft = scrollLeft;
      }
    });
  };

  const scrollLeftAction = () => {
    const currentScrollLeft = scrollRef.current?.scrollLeft || 0;
    handleScroll(currentScrollLeft - 200);
  };

  const scrollRightAction = () => {
    const currentScrollLeft = scrollRef.current?.scrollLeft || 0;
    handleScroll(currentScrollLeft + 200);
  };

  // Group subcategories for better visual separation
  const groupSubcategories = (subcategories: string[]) => {
    const groups: { name: string; items: string[]; color: string }[] = [];
    
    const ttItems = subcategories.filter(sub => sub.startsWith("TT"));
    const otherItems = subcategories.filter(sub => !sub.startsWith("TT"));
    
    if (ttItems.length > 0) {
      groups.push({ name: "TT Projects", items: ttItems, color: "bg-blue-25" });
    }
    
    otherItems.forEach(item => {
      groups.push({ name: item, items: [item], color: "bg-gray-25" });
    });
    
    return groups;
  };

  const subcategoryGroups = groupSubcategories(subcategories);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800 border-b pb-2">Weekly Details - Timeline View</h4>
        <div className="flex items-center space-x-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm bg-white shadow-sm"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm bg-white shadow-sm"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {months[selectedMonth]} {selectedYear} - Weekly Timeline
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={scrollLeftAction}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={scrollRightAction}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Timeline Header */}
          <div className="mb-4 border-b pb-4">
            <div className="flex items-center">
              <div className="w-48 flex-shrink-0 text-sm font-medium text-gray-600 pr-4">
                Subcategory
              </div>
              <div 
                ref={scrollRef}
                className="flex overflow-x-auto scrollbar-hide space-x-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onScroll={(e) => {
                  const scrollLeft = e.currentTarget.scrollLeft;
                  contentScrollRefs.current.forEach(ref => {
                    if (ref && ref !== e.currentTarget) {
                      ref.scrollLeft = scrollLeft;
                    }
                  });
                }}
              >
                {weeks.map((week, index) => {
                  const weekKey = `${monthKey}-week-${index}`;
                  const hasCompletedTasks = subcategories.some(subcategory => {
                    const completionKey = `${subcategory}-${weekKey}`;
                    return weekCompletionStatus[completionKey];
                  });
                  
                  return (
                    <div key={index} className={`flex-shrink-0 w-80 text-center border rounded-lg p-2 ${hasCompletedTasks ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                      <div className="text-sm font-bold text-gray-800 mb-1 flex items-center justify-center">
                        {week.label}
                        {hasCompletedTasks && (
                          <div className="ml-2 w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mb-3">{week.dateRange}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium text-blue-700 bg-blue-50 py-1 rounded">Plan</div>
                        <div className="font-medium text-green-700 bg-green-50 py-1 rounded">Fact</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timeline Content */}
          <div className="space-y-6">
            {subcategoryGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={`p-4 rounded-lg border-2 ${group.color}`}>
                <h5 className="text-base font-bold text-gray-800 mb-4 border-b pb-2">{group.name}</h5>
                
                {group.items.map((subcategory, itemIndex) => (
                  <div key={subcategory} className="mb-6 last:mb-0">
                    <div className="flex items-start">
                      <div className="w-48 flex-shrink-0 pr-4">
                        <div className="text-sm font-semibold text-gray-700 py-2 bg-white rounded px-3 border">
                          {group.items.length > 1 ? subcategory : group.name}
                        </div>
                      </div>
                      
                      <div 
                        ref={(el) => {
                          if (el) contentScrollRefs.current[groupIndex * 10 + itemIndex] = el;
                        }}
                        className="flex overflow-x-auto scrollbar-hide space-x-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        onScroll={(e) => {
                          const scrollLeft = e.currentTarget.scrollLeft;
                          if (scrollRef.current) {
                            scrollRef.current.scrollLeft = scrollLeft;
                          }
                          contentScrollRefs.current.forEach(ref => {
                            if (ref && ref !== e.currentTarget) {
                              ref.scrollLeft = scrollLeft;
                            }
                          });
                        }}
                      >
                        {weeks.map((week, weekIndex) => {
                          const weekKey = `${monthKey}-week-${weekIndex}`;
                          const weekData = localWeeklyData[subcategory]?.[weekKey] || { plan: "", fact: "" };
                          const completionKey = `${subcategory}-${weekKey}`;
                          const isCompleted = weekCompletionStatus[completionKey] || false;
                          
                          return (
                            <div key={weekIndex} className="flex-shrink-0 w-80">
                              {/* Week completion checkbox */}
                              <div className="flex items-center justify-center mb-2">
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => toggleWeekCompletion(subcategory, weekIndex)}
                                  className="mr-2"
                                />
                                <span className="text-xs text-gray-600">Mark week as done</span>
                              </div>
                              
                              <div className={`grid grid-cols-2 gap-2 ${isCompleted ? 'opacity-60' : ''}`}>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                  <Textarea
                                    placeholder="Plan..."
                                    value={weekData.plan}
                                    onChange={(e) => updateWeeklyData(subcategory, weekIndex, 'plan', e.target.value)}
                                    className={`min-h-[100px] text-sm bg-white border-blue-300 focus:border-blue-500 ${isCompleted ? 'line-through' : ''}`}
                                    disabled={isCompleted}
                                  />
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                  <Textarea
                                    placeholder="Fact..."
                                    value={weekData.fact === 'COMPLETED' ? '' : weekData.fact}
                                    onChange={(e) => updateWeeklyData(subcategory, weekIndex, 'fact', e.target.value)}
                                    className={`min-h-[100px] text-sm bg-white border-green-300 focus:border-green-500 ${isCompleted ? 'line-through' : ''}`}
                                    disabled={isCompleted}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Monthly Review */}
          <div className="mt-8 space-y-4 border-t pt-6">
            <h5 className="font-semibold text-gray-800">Monthly Review - {months[selectedMonth]} {selectedYear}</h5>
            {subcategoryGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={`p-4 rounded-lg border ${group.color}`}>
                <h6 className="text-sm font-bold text-gray-800 mb-3">{group.name}</h6>
                {group.items.map((subcategory) => (
                  <div key={subcategory} className="space-y-2 mb-3 last:mb-0">
                    {group.items.length > 1 && (
                      <label className="text-sm font-medium text-gray-700">{subcategory} - Key Insights</label>
                    )}
                    <Textarea
                      placeholder={`Monthly reflection for ${group.items.length === 1 ? group.name : subcategory}...`}
                      value={localMonthlyReview[subcategory]?.[monthKey] || ""}
                      onChange={(e) => updateMonthlyReview(subcategory, e.target.value)}
                      className="min-h-[80px] bg-white"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Progress'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyTimeline;
