
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical } from "lucide-react";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { useGoalsData } from "@/hooks/useGoalsData";

const WeeklySummaryDashboard: React.FC = () => {
  const { weeklySummary, isLoading, currentWeekKey } = useWeeklySummary();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [tasks, setTasks] = useState(weeklySummary);

  // Update tasks when weeklySummary changes
  React.useEffect(() => {
    setTasks(weeklySummary);
  }, [weeklySummary]);

  // Get unique categories to handle updates
  const categories = [...new Set(weeklySummary.map(item => item.category))];
  
  // Create hooks for each category
  const careerHook = useGoalsData('career');
  const businessHook = useGoalsData('business');
  const investmentsHook = useGoalsData('investments');
  const skillsHook = useGoalsData('skills');

  const getHookForCategory = (category: string) => {
    switch (category) {
      case 'career': return careerHook;
      case 'business': return businessHook;
      case 'investments': return investmentsHook;
      case 'skills': return skillsHook;
      default: return null;
    }
  };

  const toggleTaskCompletion = (item: any, completed: boolean) => {
    const hook = getHookForCategory(item.category);
    if (hook) {
      hook.saveGoal({
        category: item.category,
        subcategory: item.subcategory,
        period_key: item.period_key,
        period_type: 'week',
        planned_goal: item.planned_goal,
        actual_result: completed ? 'completed' : undefined
      });
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetItemId) {
      setDraggedItem(null);
      return;
    }

    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      const draggedIndex = newTasks.findIndex(task => task.id === draggedItem);
      const targetIndex = newTasks.findIndex(task => task.id === targetItemId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prevTasks;
      
      // Remove the dragged item and insert it at the target position
      const [draggedTask] = newTasks.splice(draggedIndex, 1);
      newTasks.splice(targetIndex, 0, draggedTask);
      
      return newTasks;
    });
    
    setDraggedItem(null);
  }, [draggedItem]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week's Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week's Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            No tasks planned for this week. Start planning in your goal categories!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Week's Tasks</CardTitle>
        <p className="text-sm text-gray-600">Week of {currentWeekKey} • Drag to reorder by priority</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((item, index) => (
          <div 
            key={item.id} 
            className={`flex items-start gap-3 p-3 border rounded-lg transition-all duration-200 cursor-move ${
              draggedItem === item.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
          >
            <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
            <Checkbox
              checked={item.isCompleted}
              onCheckedChange={(checked) => toggleTaskCompletion(item, !!checked)}
              className="mt-1 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium text-blue-600">{item.category}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-700">{item.subcategory}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  #{index + 1}
                </span>
              </div>
              <p className={`text-sm break-words ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {item.planned_goal}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WeeklySummaryDashboard;
