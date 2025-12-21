import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, Wine, Dumbbell, Star } from 'lucide-react';
import { DayData } from '@/types/habit';

interface MonthData {
  memorableThing: string;
  soberDaysOverride?: number;
  sportDaysOverride?: number;
}

interface YearCalendarProps {
  year: string;
  monthlyData: Record<string, MonthData>;
  habitDays: Record<string, DayData>;
  onUpdateMonth: (monthKey: string, field: keyof MonthData, value: string | number) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

const YearCalendar: React.FC<YearCalendarProps> = ({
  year,
  monthlyData,
  habitDays,
  onUpdateMonth
}) => {
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'sober' | 'sport' | null>(null);

  // Calculate stats from habits data for each month
  const monthStats = useMemo(() => {
    const stats: Record<string, { soberDays: number; sportDays: number }> = {};
    
    MONTHS.forEach((_, index) => {
      const monthNum = index + 1;
      const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
      
      let soberDays = 0;
      let sportDays = 0;
      
      // Count days in this month from habit data
      Object.entries(habitDays).forEach(([dateStr, dayData]) => {
        if (dateStr.startsWith(monthKey)) {
          // Sober day = alcohol not completed (didn't drink)
          if (dayData.alcohol && !dayData.alcohol.completed) {
            soberDays++;
          }
          // Sport day = gym completed
          if (dayData.gym && dayData.gym.completed) {
            sportDays++;
          }
        }
      });
      
      stats[monthKey] = { soberDays, sportDays };
    });
    
    return stats;
  }, [habitDays, year]);

  const handleEditToggle = (monthKey: string, field: 'sober' | 'sport') => {
    if (editingMonth === monthKey && editingField === field) {
      setEditingMonth(null);
      setEditingField(null);
    } else {
      setEditingMonth(monthKey);
      setEditingField(field);
    }
  };

  const getSoberDays = (monthKey: string) => {
    const data = monthlyData[monthKey];
    if (data?.soberDaysOverride !== undefined) {
      return data.soberDaysOverride;
    }
    return monthStats[monthKey]?.soberDays || 0;
  };

  const getSportDays = (monthKey: string) => {
    const data = monthlyData[monthKey];
    if (data?.sportDaysOverride !== undefined) {
      return data.sportDaysOverride;
    }
    return monthStats[monthKey]?.sportDays || 0;
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Star className="w-6 h-6 text-amber-400" />
        Monthly Highlights
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MONTHS.map((monthName, index) => {
          const monthNum = index + 1;
          const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
          const data = monthlyData[monthKey] || { memorableThing: '' };
          const soberDays = getSoberDays(monthKey);
          const sportDays = getSportDays(monthKey);
          const isEditingSober = editingMonth === monthKey && editingField === 'sober';
          const isEditingSport = editingMonth === monthKey && editingField === 'sport';
          
          return (
            <Card 
              key={monthKey} 
              className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all"
            >
              <CardContent className="p-4">
                {/* Month Header */}
                <div className="text-center mb-3">
                  <h3 className="text-lg font-semibold text-white">{monthName}</h3>
                  <p className="text-xs text-white/50">{year}</p>
                </div>
                
                {/* Stats Row */}
                <div className="flex justify-center gap-4 mb-3">
                  {/* Sober Days */}
                  <div className="flex items-center gap-1.5">
                    <Wine className="w-4 h-4 text-purple-400" />
                    {isEditingSober ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={31}
                          value={soberDays}
                          onChange={(e) => onUpdateMonth(monthKey, 'soberDaysOverride', parseInt(e.target.value) || 0)}
                          className="w-12 h-6 px-1 text-xs bg-white/10 border-white/30 text-white text-center"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-emerald-400 hover:bg-emerald-500/20"
                          onClick={() => handleEditToggle(monthKey, 'sober')}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-white">{soberDays}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-white/50 hover:text-white hover:bg-white/10"
                          onClick={() => handleEditToggle(monthKey, 'sober')}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Sport Days */}
                  <div className="flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    {isEditingSport ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={31}
                          value={sportDays}
                          onChange={(e) => onUpdateMonth(monthKey, 'sportDaysOverride', parseInt(e.target.value) || 0)}
                          className="w-12 h-6 px-1 text-xs bg-white/10 border-white/30 text-white text-center"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-emerald-400 hover:bg-emerald-500/20"
                          onClick={() => handleEditToggle(monthKey, 'sport')}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-white">{sportDays}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-white/50 hover:text-white hover:bg-white/10"
                          onClick={() => handleEditToggle(monthKey, 'sport')}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Memorable Thing */}
                <div>
                  <Input
                    placeholder="Top memorable thing..."
                    value={data.memorableThing || ''}
                    onChange={(e) => onUpdateMonth(monthKey, 'memorableThing', e.target.value)}
                    className="text-xs bg-white/5 border-white/20 text-white placeholder:text-white/40 h-8"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default YearCalendar;
