
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

  // Transform tasks into individual items (one per bullet point)
  const individualTasks = tasks.flatMap(task => {
    const bulletPoints = task.planned_goal.split('\n').filter(line => line.trim());
    
    if (bulletPoints.length <= 1) {
      // Single task or no bullet points
      return [{
        ...task,
        displayText: task.planned_goal.replace(/^•\s*/, '').trim(),
        bulletIndex: -1,
        taskKey: task.id
      }];
    } else {
      // Multiple bullet points - create individual tasks
      return bulletPoints.map((bullet, index) => ({
        ...task,
        displayText: bullet.replace(/^•\s*/, '').trim(),
        bulletIndex: index,
        taskKey: `${task.id}-bullet-${index}`,
        id: `${task.id}-bullet-${index}` // Unique ID for each bullet
      }));
    }
  });

  // Separate unassigned tasks from assigned tasks
  const unassignedTasks = individualTasks.filter(task => !task.assigned_day);
  const assignedTasks = individualTasks.filter(task => task.assigned_day);

  // Sort tasks by priority (high > medium > low > unclassified)
  const sortTasksByPriority = (taskList: any[]) => {
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
  const handleDragStart = (e: React.DragEvent, taskKey: string) => {
    setDraggedTask(taskKey);
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
      // Find the original task ID (remove bullet suffix if present)
      const originalTaskId = draggedTask.includes('-bullet-') 
        ? draggedTask.split('-bullet-')[0] 
        : draggedTask;
      onUpdateTaskAssignment(originalTaskId, day, null);
      setDraggedTask(null);
    }
  };

  // Handle drop back to unassigned
  const handleDropUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTask) {
      // Find the original task ID (remove bullet suffix if present)
      const originalTaskId = draggedTask.includes('-bullet-') 
        ? draggedTask.split('-bullet-')[0] 
        : draggedTask;
      onUpdateTaskAssignment(originalTaskId, null, null);
      setDraggedTask(null);
    }
  };

  // Handle priority change
  const handlePriorityChange = (taskKey: string, newPriority: string) => {
    // Find the original task ID (remove bullet suffix if present)
    const originalTaskId = taskKey.includes('-bullet-') 
      ? taskKey.split('-bullet-')[0] 
      : taskKey;
    onUpdateTaskAssignment(originalTaskId, undefined, undefined, newPriority);
  };

  // Render task card
  const renderTaskCard = (task: any, isInPool = false) => {
    return (
      <div
        key={task.taskKey}
        draggable
        onDragStart={(e) => handleDragStart(e, task.taskKey)}
        className={`
          bg-white border rounded-lg p-3 mb-2 cursor-move shadow-sm hover:shadow-md transition-all
          ${draggedTask === task.taskKey ? 'opacity-50' : ''}
          ${task.isOverdue ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}
          ${task.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}
          ${task.priority === 'low' ? 'border-l-4 border-l-green-500' : ''}
          ${task.priority === 'medium' ? 'border-l-4 border-l-yellow-500' : ''}
          ${isInPool ? 'w-full' : 'w-full max-w-none'}
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
              onValueChange={(value) => handlePriorityChange(task.taskKey, value === 'unclassified' ? '' : value)}
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
          <div className="font-medium text-gray-800 break-words">
            {task.displayText}
          </div>
        </div>

        <div className="text-xs text-gray-500 truncate">
          {task.category} • {task.subcategory}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-8 gap-4 h-[600px]">
        {/* Unassigned Tasks Pool */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Unassigned ({unassignedTasks.length})
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
    </div>
  );
};

export default WeeklyPlanner;
