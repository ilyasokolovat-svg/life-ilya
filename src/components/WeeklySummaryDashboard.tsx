
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GripVertical, Edit, Check, X } from "lucide-react";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { useGoalsData } from "@/hooks/useGoalsData";

const WeeklySummaryDashboard: React.FC = () => {
  const { weeklySummary, isLoading, currentWeekKey } = useWeeklySummary();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [tasks, setTasks] = useState(weeklySummary);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

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

  // Get category color classes
  const getCategoryColorClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'career':
        return 'text-blue-600';
      case 'business':
        return 'text-green-600';
      case 'investments':
        return 'text-purple-600';
      case 'skills':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
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
        actual_result: completed ? 'completed' : null // Use null instead of undefined for unchecked
      });

      // Update local state immediately for better UX
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === item.id 
            ? { ...task, isCompleted: completed }
            : task
        )
      );
    }
  };

  const startEditing = (task: any) => {
    setEditingTask(task.id);
    setEditText(task.planned_goal);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditText('');
  };

  const saveEdit = (item: any) => {
    const hook = getHookForCategory(item.category);
    if (hook) {
      const trimmedText = editText.trim();
      
      if (trimmedText) {
        // If there's text, update the goal
        hook.saveGoal({
          category: item.category,
          subcategory: item.subcategory,
          period_key: item.period_key,
          period_type: 'week',
          planned_goal: trimmedText,
          actual_result: item.isCompleted ? 'completed' : null
        });

        // Update local state immediately for better UX
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === item.id 
              ? { ...task, planned_goal: trimmedText }
              : task
          )
        );
      } else {
        // If text is empty, delete the goal by setting planned_goal to empty string
        hook.saveGoal({
          category: item.category,
          subcategory: item.subcategory,
          period_key: item.period_key,
          period_type: 'week',
          planned_goal: '',
          actual_result: null
        });

        // Remove from local state immediately
        setTasks(prevTasks => 
          prevTasks.filter(task => task.id !== item.id)
        );
      }
    }
    setEditingTask(null);
    setEditText('');
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
            className={`group flex items-start gap-3 p-3 border rounded-lg transition-all duration-200 cursor-move ${
              draggedItem === item.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
            }`}
            draggable={editingTask !== item.id}
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
                <span className={`text-base font-bold ${getCategoryColorClass(item.category)}`}>
                  {item.category}
                </span>
                <span className="text-sm text-gray-400">•</span>
                <span className={`text-sm ${getCategoryColorClass(item.category)}`}>
                  {item.subcategory}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  #{index + 1}
                </span>
              </div>
              
              {editingTask === item.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => saveEdit(item)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={cancelEditing}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm break-words flex-1 ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {item.planned_goal}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(item)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WeeklySummaryDashboard;
