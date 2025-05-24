
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WeeklyTimelineProps {
  subcategories: string[];
}

const WeeklyTimeline: React.FC<WeeklyTimelineProps> = ({ subcategories }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [weeklyData, setWeeklyData] = useState<Record<string, Record<string, { plan: string; fact: string }>>>({});
  const [monthlyReview, setMonthlyReview] = useState<Record<string, Record<string, string>>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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
    setWeeklyData(prev => ({
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
    setMonthlyReview(prev => ({
      ...prev,
      [subcategory]: {
        ...prev[subcategory],
        [monthKey]: value
      }
    }));
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
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
              <Button variant="outline" size="sm" onClick={scrollLeft}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={scrollRight}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Timeline Header */}
          <div className="mb-4">
            <div className="flex items-center">
              <div className="w-48 flex-shrink-0 text-sm font-medium text-gray-600 pr-4">
                Subcategory
              </div>
              <div 
                ref={scrollRef}
                className="flex overflow-x-auto scrollbar-hide space-x-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {weeks.map((week, index) => (
                  <div key={index} className="flex-shrink-0 w-32 text-center">
                    <div className="text-xs font-medium text-gray-700 mb-1">{week.label}</div>
                    <div className="text-xs text-gray-500 mb-2">{week.dateRange}</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="font-medium text-blue-600">Plan</div>
                      <div className="font-medium text-green-600">Fact</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Content */}
          <div className="space-y-4">
            {subcategoryGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={`p-4 rounded-lg border ${group.color}`}>
                <h5 className="text-sm font-bold text-gray-800 mb-3">{group.name}</h5>
                
                {group.items.map((subcategory) => (
                  <div key={subcategory} className="flex items-start mb-4 last:mb-0">
                    <div className="w-48 flex-shrink-0 pr-4">
                      <div className="text-sm font-medium text-gray-700 py-1">
                        {group.items.length > 1 ? subcategory : ""}
                      </div>
                    </div>
                    
                    <div 
                      className="flex overflow-x-auto scrollbar-hide space-x-1"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {weeks.map((week, weekIndex) => {
                        const weekKey = `${monthKey}-week-${weekIndex}`;
                        const weekData = weeklyData[subcategory]?.[weekKey] || { plan: "", fact: "" };
                        
                        return (
                          <div key={weekIndex} className="flex-shrink-0 w-32">
                            <div className="grid grid-cols-2 gap-1">
                              <Textarea
                                placeholder="Plan..."
                                value={weekData.plan}
                                onChange={(e) => updateWeeklyData(subcategory, weekIndex, 'plan', e.target.value)}
                                className="min-h-[60px] text-xs bg-white resize-none"
                              />
                              <Textarea
                                placeholder="Fact..."
                                value={weekData.fact}
                                onChange={(e) => updateWeeklyData(subcategory, weekIndex, 'fact', e.target.value)}
                                className="min-h-[60px] text-xs bg-white resize-none"
                              />
                            </div>
                          </div>
                        );
                      })}
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
                      value={monthlyReview[subcategory]?.[monthKey] || ""}
                      onChange={(e) => updateMonthlyReview(subcategory, e.target.value)}
                      className="min-h-[60px] bg-white"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyTimeline;
