
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklySummaryItem } from '@/hooks/useWeeklySummary';
import { Calendar, AlertCircle, Plus } from 'lucide-react';

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
        taskKey: task.id,
        // Set priority to unclassified if it's not already set
        priority: task.priority || 'unclassified'
      }];
    } else {
      // Multiple bullet points - create individual tasks
      return bulletPoints.map((bullet, index) => ({
        ...task,
        displayText: bullet.replace(/^•\s*/, '').trim(),
        bulletIndex: index,
        taskKey: `${task.id}-bullet-${index}`,
        id: `${task.id}-bullet-${index}`, // Unique ID for each bullet
        // Set priority to unclassified if it's not already set
        priority: task.priority || 'unclassified'
      }));
    }
  });

  // Separate unassigned tasks from assigned tasks
  const unassignedTasks = individualTasks.filter(task => !task.assigned_day);
  const assignedTasks = individualTasks.filter(task => task.assigned_day);

  // Sort tasks by priority (high > medium > low > unclassified) and then alphabetically within each priority
  const sortTasksByPriority = (taskList: any[]) => {
    return [...taskList].sort((a, b) => {
      const priorityOrder = { high: 4, medium: 3, low: 2, unclassified: 1 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      
      // First sort by priority
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      // Then sort alphabetically within the same priority
      return a.displayText.localeCompare(b.displayText);
    });
  };

  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-xs">Med</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs">Low</Badge>;
      default:
        return <Badge variant="outline" className="text-xs opacity-50">No priority</Badge>;
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
              onValueChange={(value) => handlePriorityChange(task.taskKey, value)}
            >
              <SelectTrigger className="h-6 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Med</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="unclassified">No priority</SelectItem>
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

  // Render placeholder slots for each day
  const renderDayPlaceholders = (day: DayOfWeek, dayTasks: any[]) => {
    const sortedDayTasks = sortTasksByPriority(dayTasks);
    const minSlots = 3;
    const totalSlots = Math.max(minSlots, sortedDayTasks.length + 1);
    
    const slots = [];
    
    // Add existing tasks
    sortedDayTasks.forEach((task, index) => {
      slots.push(
        <div key={task.taskKey} className="mb-2">
          {renderTaskCard(task)}
        </div>
      );
    });
    
    // Add empty placeholder slots
    for (let i = sortedDayTasks.length; i < totalSlots; i++) {
      slots.push(
        <div
          key={`placeholder-${i}`}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-2 hover:border-blue-400 transition-colors flex items-center justify-center min-h-[60px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, day)}
        >
          <Plus className="w-6 h-6 text-gray-400" />
        </div>
      );
    }
    
    return slots;
  };

  // Render day column
  const renderDayColumn = (day: { key: DayOfWeek; label: string; short: string }) => {
    const dayTasks = assignedTasks.filter(task => task.assigned_day === day.key);
    
    return (
      <div key={day.key} className="flex-1 min-w-0">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-center">
              {day.short}
              {dayTasks.length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {dayTasks.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 min-h-[300px]">
              {renderDayPlaceholders(day.key, dayTasks)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex gap-6">
        {/* Unassigned Tasks Pool - Left Side */}
        <div className="w-80 shrink-0">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Unassigned ({unassignedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent
              className="pt-0"
              onDragOver={handleDragOver}
              onDrop={handleDropUnassigned}
            >
              {unassignedTasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  All tasks are assigned! 🎉
                </p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {sortTasksByPriority(unassignedTasks).map(task => renderTaskCard(task, true))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Days of the Week - Right Side taking up remaining space */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* First Row: Monday - Thursday */}
          <div className="grid grid-cols-4 gap-4">
            {DAYS.slice(0, 4).map(day => renderDayColumn(day))}
          </div>

          {/* Second Row: Friday - Sunday */}
          <div className="grid grid-cols-3 gap-4">
            {DAYS.slice(4, 7).map(day => renderDayColumn(day))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyPlanner;
