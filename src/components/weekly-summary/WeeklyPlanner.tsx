
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklySummaryItem } from '@/hooks/useWeeklySummary';
import { Calendar, AlertCircle } from 'lucide-react';

interface WeeklyPlannerProps {
  tasks: WeeklySummaryItem[];
  onUpdateTaskAssignment: (taskId: string, assigned_day?: string | null, assigned_time_slot?: string | null, priority?: string) => void;
  onToggleCompletion: (item: WeeklySummaryItem, completed: boolean) => void;
  onToggleBulletPoint: (item: WeeklySummaryItem, bulletIndex: number, completed: boolean) => void;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' }
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

  // Sort tasks by priority (high > medium > low > unclassified)
  const sortTasksByPriority = (taskList: WeeklySummaryItem[]) => {
    return [...taskList].sort((a, b) => {
      const priorityOrder = { high: 4, medium: 3, low: 2, unclassified: 1 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      return priorityB - priorityA;
    });
  };

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-xs">Med</Badge>;
      default:
        return <Badge variant="outline" className="text-xs opacity-50">-</Badge>;
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

  // Handle drop on day
  const handleDrop = (e: React.DragEvent, day: DayOfWeek) => {
    e.preventDefault();
    if (draggedTask) {
      onUpdateTaskAssignment(draggedTask, day, null);
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
    const taskText = bulletPoints.length > 1 ? bulletPoints[0].replace(/^•\s*/, '') : task.planned_goal;

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
          ${task.priority === 'medium' ? 'border-l-4 border-l-yellow-500' : ''}
          ${!isInPool ? 'min-w-[180px] max-w-[200px]' : 'w-full'}
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getPriorityBadge(task.priority || 'unclassified')}
            {task.isOverdue && (
              <Badge variant="outline" className="text-xs text-orange-600 shrink-0">
                <AlertCircle className="w-3 h-3 mr-1" />
                {task.weekDates}
              </Badge>
            )}
          </div>
          {isInPool && (
            <Select
              value={task.priority || 'unclassified'}
              onValueChange={(value) => handlePriorityChange(task.id, value === 'unclassified' ? '' : value)}
            >
              <SelectTrigger className="h-6 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Med</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="unclassified">-</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="text-sm mb-2">
          <div className="font-medium text-gray-800 line-clamp-2">
            {taskText}
          </div>
          {bulletPoints.length > 1 && (
            <div className="text-xs text-gray-500 mt-1">
              +{bulletPoints.length - 1} more points
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 truncate">
          {task.category} • {task.subcategory}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-9 gap-4 h-[600px]">
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
              sortTasksByPriority(unassignedTasks).map(task => renderTaskCard(task, true))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Days of the Week */}
      {DAYS.map(day => {
        const dayTasks = assignedTasks.filter(task => task.assigned_day === day.key);
        const sortedDayTasks = sortTasksByPriority(dayTasks);
        
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
              <CardContent className="pt-0">
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-2 min-h-[450px] hover:border-blue-300 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day.key)}
                >
                  <div className="space-y-2 overflow-y-auto max-h-[430px]">
                    {sortedDayTasks.map(task => renderTaskCard(task))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyPlanner;
