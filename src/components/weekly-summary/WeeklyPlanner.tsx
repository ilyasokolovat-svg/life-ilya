
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WeeklySummaryItem } from '@/hooks/useWeeklySummary';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface WeeklyPlannerProps {
  tasks: WeeklySummaryItem[];
  onUpdateTaskAssignment: (taskId: string, assigned_day?: string | null, assigned_time_slot?: string | null, priority?: string) => void;
  onToggleCompletion: (item: WeeklySummaryItem, completed: boolean) => void;
  onToggleBulletPoint: (item: WeeklySummaryItem, bulletIndex: number, completed: boolean) => void;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type TimeSlot = 'morning' | 'afternoon' | 'evening';

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' }
];

const TIME_SLOTS: { key: TimeSlot; label: string; icon: string }[] = [
  { key: 'morning', label: 'Morning', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { key: 'evening', label: 'Evening', icon: '🌙' }
];

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  tasks,
  onUpdateTaskAssignment,
  onToggleCompletion,
  onToggleBulletPoint
}) => {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Separate unassigned tasks from assigned tasks
  const unassignedTasks = tasks.filter(task => !task.assigned_day);
  const assignedTasks = tasks.filter(task => task.assigned_day);

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">🔴 High</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">🟢 Low</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">🟡 Med</Badge>;
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop on day/time slot
  const handleDrop = (e: React.DragEvent, day: DayOfWeek, timeSlot?: TimeSlot) => {
    e.preventDefault();
    if (draggedTask) {
      onUpdateTaskAssignment(draggedTask, day, timeSlot);
      setDraggedTask(null);
    }
  };

  // Handle drop back to unassigned
  const handleDropUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTask) {
      onUpdateTaskAssignment(draggedTask, null, null);
      setDraggedTask(null);
    }
  };

  // Handle priority change
  const handlePriorityChange = (taskId: string, newPriority: string) => {
    onUpdateTaskAssignment(taskId, undefined, undefined, newPriority);
  };

  // Render task card
  const renderTaskCard = (task: WeeklySummaryItem, isInPool = false) => {
    const bulletPoints = task.planned_goal.split('\n').filter(line => line.trim());
    const hasBulletPoints = bulletPoints.length > 1;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        className={`
          bg-white border rounded-lg p-3 mb-2 cursor-move shadow-sm hover:shadow-md transition-all
          ${draggedTask === task.id ? 'opacity-50' : ''}
          ${task.isOverdue ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}
          ${task.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}
          ${task.priority === 'low' ? 'border-l-4 border-l-green-500' : ''}
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            {getPriorityBadge(task.priority || 'medium')}
            {task.isOverdue && (
              <Badge variant="outline" className="text-xs text-orange-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                {task.weekDates}
              </Badge>
            )}
          </div>
          {isInPool && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => handlePriorityChange(task.id, task.priority === 'high' ? 'medium' : 'high')}
              >
                {task.priority === 'high' ? '🔴→🟡' : '🟡→🔴'}
              </Button>
            </div>
          )}
        </div>

        <div className="text-sm">
          {hasBulletPoints ? (
            <div className="space-y-1">
              {bulletPoints.map((point, index) => {
                const isCompleted = task.bullet_point_completions?.[index] || false;
                return (
                  <div key={index} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => onToggleBulletPoint(task, index, e.target.checked)}
                      className="mt-0.5 h-3 w-3"
                    />
                    <span className={`text-xs ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                      {point.replace(/^•\s*/, '')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={(e) => onToggleCompletion(task, e.target.checked)}
                className="h-3 w-3"
              />
              <span className={`text-xs ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                {task.planned_goal}
              </span>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-2">
          {task.category} • {task.subcategory}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-8 gap-4 h-[600px]">
      {/* Unassigned Tasks Pool */}
      <div className="col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Unassigned Tasks ({unassignedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent
            className="pt-0 overflow-y-auto max-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={handleDropUnassigned}
          >
            {unassignedTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                All tasks are assigned! 🎉
              </p>
            ) : (
              unassignedTasks.map(task => renderTaskCard(task, true))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Days of the Week */}
      {DAYS.map(day => {
        const dayTasks = assignedTasks.filter(task => task.assigned_day === day.key);
        
        return (
          <div key={day.key} className="col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">
                  {day.short}
                  {dayTasks.length > 0 && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      {dayTasks.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {TIME_SLOTS.map(timeSlot => {
                  const timeSlotTasks = dayTasks.filter(task => task.assigned_time_slot === timeSlot.key);
                  
                  return (
                    <div
                      key={timeSlot.key}
                      className="border-2 border-dashed border-gray-200 rounded-lg p-2 min-h-[120px] hover:border-blue-300 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day.key, timeSlot.key)}
                    >
                      <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <span>{timeSlot.icon}</span>
                        {timeSlot.label}
                        {timeSlotTasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            {timeSlotTasks.length}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 max-h-[80px] overflow-y-auto">
                        {timeSlotTasks.map(task => renderTaskCard(task))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyPlanner;
