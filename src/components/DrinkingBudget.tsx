import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitsState, DrinkingEventType } from "@/types/habit";
import { formatDateISO } from "@/utils/habitUtils";
import { getTodayISO } from "@/utils/dateUtils";
import { Target, Wine, Sparkles, Check, AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";

interface DrinkingBudgetProps {
  habitsState: HabitsState;
  viewMonth: number;
  viewYear: number;
}

interface DrinkingEvent {
  date: Date;
  dateISO: string;
  type: DrinkingEventType;
  isPast: boolean;
  location: string;
}

const DrinkingBudget: React.FC<DrinkingBudgetProps> = ({
  habitsState,
  viewMonth,
  viewYear
}) => {
  const todayISO = getTodayISO();

  // Get all drinking events for the current month from alcohol.drinkingEventType
  const getDrinkingEvents = (): DrinkingEvent[] => {
    const events: DrinkingEvent[] = [];
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateISO = formatDateISO(date);
      const dayData = habitsState.days[dateISO];
      
      if (dayData?.alcohol?.drinkingEventType && 
          (dayData.alcohol.drinkingEventType === 'anchor' || dayData.alcohol.drinkingEventType === 'side')) {
        events.push({
          date,
          dateISO,
          type: dayData.alcohol.drinkingEventType,
          isPast: dateISO < todayISO,
          location: dayData.location || ''
        });
      }
    }
    
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Calculate sober days for the month
  const getSoberDaysCount = (): number => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    let soberCount = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateISO = formatDateISO(date);
      const dayData = habitsState.days[dateISO];
      
      if (dateISO <= todayISO) {
        if (dayData?.alcohol?.planned && dayData?.alcohol?.completed) {
          soberCount++;
        }
      }
    }
    
    return soberCount;
  };

  const drinkingEvents = getDrinkingEvents();
  const anchorEvents = drinkingEvents.filter(e => e.type === 'anchor');
  const sideEvents = drinkingEvents.filter(e => e.type === 'side');
  const soberDays = getSoberDaysCount();
  
  const anchorUsed = anchorEvents.filter(e => e.isPast).length;
  const anchorPlanned = anchorEvents.filter(e => !e.isPast).length;
  const sideUsed = sideEvents.filter(e => e.isPast).length;
  const sidePlanned = sideEvents.filter(e => !e.isPast).length;
  
  const totalAnchor = anchorUsed + anchorPlanned;
  const totalSide = sideUsed + sidePlanned;
  
  const isAnchorOver = totalAnchor > 1;
  const isSideOver = totalSide > 2;

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric'
    });
  };

  const getMonthName = () => {
    return new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });
  };

  // Render event dates for a category
  const renderEventDates = (events: DrinkingEvent[], type: 'anchor' | 'side') => {
    if (events.length === 0) return null;
    
    const pastEvents = events.filter(e => e.isPast);
    const futureEvents = events.filter(e => !e.isPast);
    
    return (
      <div className="mt-3 space-y-2">
        {/* Past events - "Used" */}
        {pastEvents.length > 0 && (
          <div className="space-y-1">
            {pastEvents.map(event => (
              <div 
                key={event.dateISO}
                className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md ${
                  type === 'anchor' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium">{formatShortDate(event.date)}</span>
                {event.location && (
                  <span className="text-xs opacity-75 truncate">• {event.location}</span>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Future events - "Planned" */}
        {futureEvents.length > 0 && (
          <div className="space-y-1">
            {futureEvents.map(event => (
              <div 
                key={event.dateISO}
                className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md border border-dashed ${
                  type === 'anchor' 
                    ? 'border-purple-300 bg-purple-50 text-purple-700' 
                    : 'border-blue-300 bg-blue-50 text-blue-600'
                }`}
              >
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium">{formatShortDate(event.date)}</span>
                {event.location && (
                  <span className="text-xs opacity-75 truncate">• {event.location}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Wine className="h-5 w-5" />
          Drinking Budget - {getMonthName()} {viewYear}
        </CardTitle>
        <p className="text-sm text-amber-700">
          1 Anchor event (go big) + 1-2 Side events (chill) = all other days sober
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Overview - Two columns for Anchor and Side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Anchor Event Card */}
          <div className={`p-3 rounded-lg border-2 ${
            isAnchorOver 
              ? 'border-red-400 bg-red-50' 
              : anchorUsed >= 1 
                ? 'border-green-400 bg-green-50'
                : totalAnchor >= 1
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-amber-300 bg-white'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">ANCHOR</span>
              </div>
              <span className="text-lg">🍷🍷</span>
            </div>
            
            <div className="text-2xl font-bold text-center mb-1">
              {anchorUsed > 0 ? (
                <span className="text-green-600">{anchorUsed}</span>
              ) : anchorPlanned > 0 ? (
                <span className="text-purple-500">0</span>
              ) : (
                <span className="text-gray-400">0</span>
              )}
              <span className="text-gray-400">/1</span>
            </div>
            
            {isAnchorOver && (
              <div className="flex items-center gap-1 text-xs text-red-600 justify-center mb-2">
                <AlertTriangle className="h-3 w-3" />
                Over budget!
              </div>
            )}
            
            {/* Anchor event dates */}
            {renderEventDates(anchorEvents, 'anchor')}
            
            {totalAnchor === 0 && (
              <div className="text-xs text-gray-500 text-center mt-2 italic">
                No anchor planned
              </div>
            )}
          </div>

          {/* Side Events Card */}
          <div className={`p-3 rounded-lg border-2 ${
            isSideOver 
              ? 'border-red-400 bg-red-50' 
              : sideUsed >= 1 
                ? 'border-green-400 bg-green-50'
                : totalSide >= 1
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-amber-300 bg-white'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold text-amber-800">SIDE</span>
              </div>
              <span className="text-lg">🍷</span>
            </div>
            
            <div className="text-2xl font-bold text-center mb-1">
              {sideUsed > 0 ? (
                <span className="text-green-600">{sideUsed}</span>
              ) : totalSide > 0 ? (
                <span className="text-blue-500">0</span>
              ) : (
                <span className="text-gray-400">0</span>
              )}
              <span className="text-gray-400">/2</span>
            </div>
            
            {isSideOver && (
              <div className="flex items-center gap-1 text-xs text-red-600 justify-center mb-2">
                <AlertTriangle className="h-3 w-3" />
                Over budget!
              </div>
            )}
            
            {/* Side event dates */}
            {renderEventDates(sideEvents, 'side')}
            
            {totalSide === 0 && (
              <div className="text-xs text-gray-500 text-center mt-2 italic">
                No sides planned
              </div>
            )}
          </div>
        </div>

        {/* Sober Days - Compact row */}
        <div className="flex items-center justify-between p-3 rounded-lg border-2 border-emerald-400 bg-emerald-50">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">Sober Days Completed</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {soberDays}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 pt-2 border-t border-amber-200">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Past (used)</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-purple-500" />
            <span>Future (planned)</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Wine className="h-3 w-3 text-gray-400" />
            <span>Use calendar icons to plan</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrinkingBudget;
