import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HabitsState } from "@/types/habit";
import { formatDateISO } from "@/utils/habitUtils";
import { Users } from "lucide-react";

interface SocialPlanningProps {
  habitsState: HabitsState;
  viewMonth: number;
  viewYear: number;
  onUpdateSocialPlan: (date: string, socialEvent: string, location: string, socialPerson?: string, highlights?: string) => void;
}

const SocialPlanning: React.FC<SocialPlanningProps> = ({
  habitsState,
  viewMonth,
  viewYear,
  onUpdateSocialPlan
}) => {
  // Get all days in the current month where social is planned
  const getPlannedSocialDays = () => {
    const plannedDays: { 
      date: Date; 
      dateISO: string; 
      socialEvent: string; 
      location: string; 
      socialPerson: string;
      highlights: string;
      completed: boolean;
    }[] = [];
    
    // Get the number of days in the current month
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateISO = formatDateISO(date);
      const dayData = habitsState.days[dateISO];
      
      // Check if social is planned for this day
      if (dayData?.social?.planned) {
        plannedDays.push({
          date,
          dateISO,
          socialEvent: dayData.social.socialEvent || '',
          location: dayData.social.location || '',
          socialPerson: dayData.social.socialPerson || '',
          highlights: dayData.social.highlights || '',
          completed: dayData.social.completed || false
        });
      }
    }
    
    return plannedDays;
  };

  const plannedDays = getPlannedSocialDays();

  const handleSocialEventChange = (dateISO: string, socialEvent: string) => {
    const dayData = habitsState.days[dateISO];
    const location = dayData?.social?.location || '';
    const socialPerson = dayData?.social?.socialPerson || '';
    const highlights = dayData?.social?.highlights || '';
    onUpdateSocialPlan(dateISO, socialEvent, location, socialPerson, highlights);
  };

  const handleLocationChange = (dateISO: string, location: string) => {
    const dayData = habitsState.days[dateISO];
    const socialEvent = dayData?.social?.socialEvent || '';
    const socialPerson = dayData?.social?.socialPerson || '';
    const highlights = dayData?.social?.highlights || '';
    onUpdateSocialPlan(dateISO, socialEvent, location, socialPerson, highlights);
  };

  const handleSocialPersonChange = (dateISO: string, socialPerson: string) => {
    const dayData = habitsState.days[dateISO];
    const socialEvent = dayData?.social?.socialEvent || '';
    const location = dayData?.social?.location || '';
    const highlights = dayData?.social?.highlights || '';
    onUpdateSocialPlan(dateISO, socialEvent, location, socialPerson, highlights);
  };

  const handleHighlightsChange = (dateISO: string, highlights: string) => {
    const dayData = habitsState.days[dateISO];
    const socialEvent = dayData?.social?.socialEvent || '';
    const location = dayData?.social?.location || '';
    const socialPerson = dayData?.social?.socialPerson || '';
    onUpdateSocialPlan(dateISO, socialEvent, location, socialPerson, highlights);
  };

  const formatDateDisplay = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    const dayNumber = date.getDate();
    return `${dayName} ${dayNumber}`;
  };

  if (plannedDays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No social activities planned for this month. Check the "Plan" checkbox in the calendar to start planning your social activities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Social Planning
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Plan your social activities for the days you've marked in the calendar
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3">
          {plannedDays.map((day) => (
            <div
              key={day.dateISO}
              className={`border rounded-lg p-2 transition-colors ${
                day.completed 
                  ? 'bg-green-100 border-green-300 hover:bg-green-150' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="text-center mb-2">
                <div className={`text-xs font-semibold ${
                  day.completed ? 'text-green-700' : 'text-pink-600'
                }`}>
                  {formatDateDisplay(day.date)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <Input
                    type="text"
                    placeholder="Social event"
                    value={day.socialEvent}
                    onChange={(e) => handleSocialEventChange(day.dateISO, e.target.value)}
                    className="text-xs h-7 placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <Input
                    type="text"
                    placeholder="Location"
                    value={day.location}
                    onChange={(e) => handleLocationChange(day.dateISO, e.target.value)}
                    className="text-xs h-7 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="Friend(s) met"
                    value={day.socialPerson}
                    onChange={(e) => handleSocialPersonChange(day.dateISO, e.target.value)}
                    className="text-xs h-7 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Textarea
                    placeholder="Highlights/memorable moments"
                    value={day.highlights}
                    onChange={(e) => handleHighlightsChange(day.dateISO, e.target.value)}
                    className="text-xs min-h-[60px] placeholder:text-gray-400 resize-none w-full bg-background border-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialPlanning;
