
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";

interface WeeklyViewProps {
  tasks: WeeklySummaryItem[];
  currentWeekKey: string;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const WeeklyView: React.FC<WeeklyViewProps> = ({ tasks, currentWeekKey }) => {
  // Group tasks by assigned day
  const tasksByDay = tasks.reduce((acc, task) => {
    const day = task.assigned_day || 'unassigned';
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(task);
    return acc;
  }, {} as Record<string, WeeklySummaryItem[]>);

  const renderDayCard = (day: { key: string; label: string }) => {
    const dayTasks = tasksByDay[day.key] || [];
    
    return (
      <Card key={day.key} className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{day.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {dayTasks.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No tasks assigned</p>
          ) : (
            <div className="space-y-2">
              {dayTasks.map((task) => (
                <div key={task.id} className="text-sm">
                  <div className="flex items-start gap-1">
                    <span className="text-gray-400 mt-1">•</span>
                    <div className="flex-1">
                      <span className="text-gray-600 text-xs">
                        ({task.category}/{task.subcategory})
                      </span>
                      <p className={`${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {task.planned_goal.split('\n')[0].replace('• ', '')}
                      </p>
                      {task.isOverdue && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Weekly View</h2>
        <p className="text-sm text-gray-600">
          Week of {currentWeekKey} • Tasks organized by assigned days
        </p>
      </div>

      {/* First Row: Monday - Thursday */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DAYS.slice(0, 4).map(day => renderDayCard(day))}
      </div>

      {/* Second Row: Friday - Sunday */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.slice(4, 7).map(day => renderDayCard(day))}
      </div>

      {/* Unassigned Tasks */}
      {tasksByDay.unassigned && tasksByDay.unassigned.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-600">Unassigned Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasksByDay.unassigned.map((task) => (
                <div key={task.id} className="text-sm">
                  <div className="flex items-start gap-1">
                    <span className="text-gray-400 mt-1">•</span>
                    <div className="flex-1">
                      <span className="text-gray-600 text-xs">
                        ({task.category}/{task.subcategory})
                      </span>
                      <p className={`${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {task.planned_goal.split('\n')[0].replace('• ', '')}
                      </p>
                      {task.isOverdue && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeeklyView;
