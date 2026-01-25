import React, { useState, useMemo } from 'react';
import { Lock, Check, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import MonthCard, { MonthProgressData } from './MonthCard';

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

interface MonthlyProgressProps {
  year: string;
  monthlyProgressData: Record<string, MonthProgressData>;
  onUpdateMonth: (monthKey: string, field: keyof MonthProgressData, value: any) => void;
}

const getDefaultMonthData = (): MonthProgressData => ({
  goalAccomplishment: {
    career: false,
    investment: false,
    health: false,
    relationship: false,
    learning: false,
    selfAwareness: false,
  },
  topWins: ['', '', ''],
  topLearnings: ['', '', ''],
});

const isMonthUnlocked = (monthIndex: number, year: number): boolean => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();
  
  // Past years: all months unlocked
  if (year < currentYear) return true;
  
  // Future years: no months unlocked
  if (year > currentYear) return false;
  
  // Current year:
  // - Past months: unlocked
  // - Current month: unlocked if day >= 29 (or 27 for Feb)
  // - Future months: locked
  
  if (monthIndex < currentMonth) return true;
  if (monthIndex > currentMonth) return false;
  
  // Current month - unlock 1-2 days before end
  const unlockDay = monthIndex === 1 ? 27 : 29; // Feb = 27, others = 29
  return currentDay >= unlockDay;
};

const getMonthStatus = (data: MonthProgressData | undefined): 'empty' | 'partial' | 'complete' => {
  if (!data) return 'empty';
  
  const goalsChecked = Object.values(data.goalAccomplishment).filter(Boolean).length;
  const hasWins = data.topWins.some(w => w.trim());
  const hasLearnings = data.topLearnings.some(l => l.trim());
  
  if (goalsChecked === 0 && !hasWins && !hasLearnings) return 'empty';
  if (goalsChecked >= 3 && hasWins && hasLearnings) return 'complete';
  return 'partial';
};

const MonthlyProgress: React.FC<MonthlyProgressProps> = ({
  year,
  monthlyProgressData,
  onUpdateMonth,
}) => {
  const yearNum = parseInt(year);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  
  // Find the current/latest unlocked month to auto-select
  const currentUnlockedMonth = useMemo(() => {
    for (let i = 11; i >= 0; i--) {
      if (isMonthUnlocked(i, yearNum)) {
        return `${year}-${String(i + 1).padStart(2, '0')}`;
      }
    }
    return null;
  }, [year, yearNum]);

  const handleToggleMonth = (monthKey: string) => {
    setOpenMonth(openMonth === monthKey ? null : monthKey);
  };

  const handleUpdateMonth = (monthKey: string, field: keyof MonthProgressData, value: any) => {
    onUpdateMonth(monthKey, field, value);
  };

  // Count completed months for progress indicator
  const completedMonths = useMemo(() => {
    return MONTHS.filter((_, index) => {
      const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
      return getMonthStatus(monthlyProgressData[monthKey]) !== 'empty';
    }).length;
  }, [monthlyProgressData, year]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Monthly Progress</h3>
        <span className="text-sm text-white/60">
          {completedMonths}/12 months reviewed
        </span>
      </div>

      {/* Month Pills Navigation */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {MONTHS.map((monthName, index) => {
            const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
            const isUnlocked = isMonthUnlocked(index, yearNum);
            const status = getMonthStatus(monthlyProgressData[monthKey]);
            const isSelected = openMonth === monthKey;
            const isCurrent = monthKey === currentUnlockedMonth;
            
            return (
              <Button
                key={monthKey}
                variant="ghost"
                size="sm"
                disabled={!isUnlocked}
                onClick={() => isUnlocked && handleToggleMonth(monthKey)}
                className={`
                  flex-shrink-0 px-3 py-2 rounded-full border transition-all
                  ${isSelected 
                    ? 'bg-white/20 border-white/40 text-white' 
                    : isUnlocked
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                      : 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                  }
                  ${isCurrent && !isSelected ? 'ring-2 ring-amber-400/50' : ''}
                `}
              >
                <span className="mr-1.5">{monthName.slice(0, 3)}</span>
                {!isUnlocked && <Lock className="w-3 h-3" />}
                {isUnlocked && status === 'complete' && (
                  <Check className="w-3 h-3 text-emerald-400" />
                )}
                {isUnlocked && status === 'partial' && (
                  <Circle className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                )}
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Expanded Month Cards */}
      <div className="space-y-3">
        {MONTHS.map((monthName, index) => {
          const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
          const isUnlocked = isMonthUnlocked(index, yearNum);
          
          if (!isUnlocked) return null;
          
          const data = monthlyProgressData[monthKey] || getDefaultMonthData();
          
          return (
            <MonthCard
              key={monthKey}
              monthName={monthName}
              monthKey={monthKey}
              data={data}
              isOpen={openMonth === monthKey}
              onToggle={() => handleToggleMonth(monthKey)}
              onUpdate={(field, value) => handleUpdateMonth(monthKey, field, value)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyProgress;
