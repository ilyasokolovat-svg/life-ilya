import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HabitsState, DrinkingEventType } from "@/types/habit";
import { formatDateISO } from "@/utils/habitUtils";
import { Target, Wine, Sparkles, Check, AlertTriangle } from "lucide-react";

interface DrinkingBudgetProps {
  habitsState: HabitsState;
  viewMonth: number;
  viewYear: number;
}

interface DrinkingEvent {
  date: Date;
  dateISO: string;
  type: DrinkingEventType;
  socialEvent: string;
  location: string;
}

const DrinkingBudget: React.FC<DrinkingBudgetProps> = ({
  habitsState,
  viewMonth,
  viewYear
}) => {
  // Get all drinking events for the current month
  const getDrinkingEvents = (): DrinkingEvent[] => {
    const events: DrinkingEvent[] = [];
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateISO = formatDateISO(date);
      const dayData = habitsState.days[dateISO];
      
      // Check if this is a drinking event (social event with drinkingEventType set to anchor or side)
      if (dayData?.social?.drinkingEventType && 
          (dayData.social.drinkingEventType === 'anchor' || dayData.social.drinkingEventType === 'side')) {
        events.push({
          date,
          dateISO,
          type: dayData.social.drinkingEventType,
          socialEvent: dayData.social.socialEvent || '',
          location: dayData.social.location || ''
        });
      }
    }
    
    return events;
  };

  // Calculate sober days for the month
  const getSoberDaysCount = (): number => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const today = new Date();
    let soberCount = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateISO = formatDateISO(date);
      const dayData = habitsState.days[dateISO];
      
      // Only count days up to today
      if (date <= today) {
        // A sober day is when alcohol is planned (sober day intended) and completed (stayed sober)
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
  
  const anchorUsed = anchorEvents.length;
  const sideUsed = sideEvents.length;
  
  const isAnchorOver = anchorUsed > 1;
  const isSideOver = sideUsed > 2;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    });
  };

  const getMonthName = () => {
    return new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });
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
        {/* Budget Overview */}
        <div className="grid grid-cols-3 gap-3">
          {/* Anchor Event Slot */}
          <div className={`p-3 rounded-lg border-2 ${
            isAnchorOver 
              ? 'border-red-400 bg-red-50' 
              : anchorUsed === 1 
                ? 'border-green-400 bg-green-50'
                : 'border-amber-300 bg-white'
          }`}>
            <div className="flex items-center gap-1 mb-2">
              <Target className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-800">ANCHOR</span>
            </div>
            <div className="text-2xl font-bold text-center">
              <span className={anchorUsed > 0 ? 'text-green-600' : 'text-gray-400'}>
                {anchorUsed}
              </span>
              <span className="text-gray-400">/1</span>
            </div>
            {isAnchorOver && (
              <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <AlertTriangle className="h-3 w-3" />
                Over budget!
              </div>
            )}
          </div>

          {/* Side Event Slots */}
          <div className={`p-3 rounded-lg border-2 ${
            isSideOver 
              ? 'border-red-400 bg-red-50' 
              : sideUsed >= 1 
                ? 'border-green-400 bg-green-50'
                : 'border-amber-300 bg-white'
          }`}>
            <div className="flex items-center gap-1 mb-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-amber-800">SIDE</span>
            </div>
            <div className="text-2xl font-bold text-center">
              <span className={sideUsed > 0 ? 'text-green-600' : 'text-gray-400'}>
                {sideUsed}
              </span>
              <span className="text-gray-400">/2</span>
            </div>
            {isSideOver && (
              <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <AlertTriangle className="h-3 w-3" />
                Over budget!
              </div>
            )}
          </div>

          {/* Sober Days */}
          <div className="p-3 rounded-lg border-2 border-emerald-400 bg-emerald-50">
            <div className="flex items-center gap-1 mb-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-800">SOBER DAYS</span>
            </div>
            <div className="text-2xl font-bold text-center text-emerald-600">
              {soberDays}
            </div>
          </div>
        </div>

        {/* Event Details */}
        {drinkingEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-amber-800">Drinking Events This Month:</h4>
            <div className="flex flex-wrap gap-2">
              {drinkingEvents.map((event) => (
                <Badge 
                  key={event.dateISO}
                  variant="outline"
                  className={`${
                    event.type === 'anchor' 
                      ? 'border-amber-500 bg-amber-100 text-amber-800' 
                      : 'border-blue-400 bg-blue-50 text-blue-700'
                  }`}
                >
                  {event.type === 'anchor' ? '🎯' : '🍺'} {formatDate(event.date)}
                  {event.socialEvent && ` - ${event.socialEvent}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-amber-700 bg-amber-100 p-2 rounded">
          💡 Mark your drinking events in the Social Planning section below
        </div>
      </CardContent>
    </Card>
  );
};

export default DrinkingBudget;
