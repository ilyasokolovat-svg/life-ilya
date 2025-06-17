import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { useWeeklySummaryHooks } from "./weekly-summary/useWeeklySummaryHooks";
import { useStandaloneTodos } from "@/hooks/useStandaloneTodos";
import TaskList from "./weekly-summary/TaskList";
import StandaloneTodos from "./weekly-summary/StandaloneTodos";

const WeeklySummaryDashboard: React.FC = () => {
  const { weeklySummary, isLoading, currentWeekKey } = useWeeklySummary();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [tasks, setTasks] = useState(weeklySummary);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  // Standalone todos hook
  const {
    todos: standaloneTodos,
    addTodo: addStandaloneTodo,
    toggleTodo: toggleStandaloneTodo,
    editTodo: editStandaloneTodo,
    deleteTodo: deleteStandaloneTodo,
    hideTodo: hideStandaloneTodo,
    isLoaded: standaloneTodosLoaded
  } = useStandaloneTodos();

  // Debug logging for standalone todos
  React.useEffect(() => {
    console.log("Standalone todos in dashboard:", standaloneTodos);
    console.log("Standalone todos loaded:", standaloneTodosLoaded);
  }, [standaloneTodos, standaloneTodosLoaded]);

  // Update tasks when weeklySummary changes, but preserve manual order
  React.useEffect(() => {
    if (tasks.length === 0) {
      // Initial load - use the order from database
      setTasks(weeklySummary);
    } else {
      // Preserve manual order but update task properties
      setTasks(currentTasks => {
        const updatedTasks = [...currentTasks];
        
        // Update existing tasks with new data
        weeklySummary.forEach(newTask => {
          const existingIndex = updatedTasks.findIndex(task => task.id === newTask.id);
          if (existingIndex !== -1) {
            // Update existing task while preserving its position
            updatedTasks[existingIndex] = {
              ...updatedTasks[existingIndex],
              ...newTask
            };
          } else {
            // Add new tasks at the end
            updatedTasks.push(newTask);
          }
        });

        // Remove tasks that no longer exist in the database
        return updatedTasks.filter(task => 
          weeklySummary.some(dbTask => dbTask.id === task.id)
        );
      });
    }
  }, [weeklySummary]);

  const { getHookForCategory } = useWeeklySummaryHooks();

  // Helper function to check if a task is fully completed
  const isTaskFullyCompleted = (item: any, completed: boolean): boolean => {
    if (completed) return true;
    
    // Check bullet point completions
    const bulletPoints = item.planned_goal.split('\n').filter((line: string) => line.trim());
    if (bulletPoints.length > 1) {
      const bulletPointCompletions = item.bullet_point_completions || [];
      return bulletPoints.every((_: string, index: number) => bulletPointCompletions[index] === true);
    }
    
    return completed;
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
        actual_result: completed ? 'completed' : null
      });

      // Check if task is now fully completed and should be removed from dashboard
      const isFullyCompleted = isTaskFullyCompleted(item, completed);
      
      if (isFullyCompleted) {
        // Remove from local state immediately
        setTasks(currentTasks => currentTasks.filter(task => task.id !== item.id));
      } else {
        // Update local state - maintain exact order, only update the specific task
        setTasks(currentTasks => {
          return currentTasks.map(task => 
            task.id === item.id 
              ? { ...task, isCompleted: completed }
              : task
          );
        });
      }
    }
  };

  const toggleBulletPointCompletion = (item: any, bulletIndex: number, completed: boolean) => {
    const hook = getHookForCategory(item.category);
    if (hook) {
      // Get current bullet point completions
      const currentCompletions = item.bullet_point_completions || [];
      const updatedCompletions = [...currentCompletions];
      updatedCompletions[bulletIndex] = completed;

      // Check if all bullet points are now completed
      const bulletPoints = item.planned_goal.split('\n').filter((line: string) => line.trim());
      const allBulletsCompleted = bulletPoints.every((_: string, index: number) => updatedCompletions[index] === true);

      // Save bullet point completions or mark as completed if all are done
      const actualResult = allBulletsCompleted ? 'completed' : JSON.stringify({
        bullet_completions: updatedCompletions
      });

      hook.saveGoal({
        category: item.category,
        subcategory: item.subcategory,
        period_key: item.period_key,
        period_type: 'week',
        planned_goal: item.planned_goal,
        actual_result: actualResult
      });

      if (allBulletsCompleted) {
        // Remove from local state immediately
        setTasks(currentTasks => currentTasks.filter(task => task.id !== item.id));
      } else {
        // Update local state - maintain exact order, only update bullet point completions
        setTasks(currentTasks => {
          return currentTasks.map(task => 
            task.id === item.id 
              ? { 
                  ...task, 
                  bullet_point_completions: updatedCompletions
                }
              : task
          );
        });
      }
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
        // Format with bullet points
        const formattedText = trimmedText
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const trimmed = line.trim();
            return trimmed.startsWith('•') ? line : `• ${trimmed}`;
          })
          .join('\n');

        hook.saveGoal({
          category: item.category,
          subcategory: item.subcategory,
          period_key: item.period_key,
          period_type: 'week',
          planned_goal: formattedText,
          actual_result: item.isCompleted ? 'completed' : null
        });

        // Update local state - maintain exact order, only update the specific task
        setTasks(currentTasks => {
          return currentTasks.map(task => 
            task.id === item.id 
              ? { ...task, planned_goal: formattedText }
              : task
          );
        });
      } else {
        // If text is empty, delete the goal
        hook.saveGoal({
          category: item.category,
          subcategory: item.subcategory,
          period_key: item.period_key,
          period_type: 'week',
          planned_goal: '',
          actual_result: null
        });

        // Remove from local state
        setTasks(currentTasks => currentTasks.filter(task => task.id !== item.id));
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

    // Manual reordering only - when user drags and drops
    setTasks(currentTasks => {
      const newTasks = [...currentTasks];
      const draggedIndex = newTasks.findIndex(task => task.id === draggedItem);
      const targetIndex = newTasks.findIndex(task => task.id === targetItemId);
      
      if (draggedIndex === -1 || targetIndex === -1) return currentTasks;
      
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

  return (
    <div className="space-y-6">
      {/* Category-based tasks */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Tasks</CardTitle>
          <p className="text-sm text-gray-600">Week of {currentWeekKey} • Drag to reorder by priority</p>
        </CardHeader>
        {tasks.length === 0 ? (
          <CardContent>
            <p className="text-gray-500 text-center py-4">
              No tasks planned for this week. Start planning in your goal categories!
            </p>
          </CardContent>
        ) : (
          <TaskList
            tasks={tasks}
            draggedItem={draggedItem}
            editingTask={editingTask}
            editText={editText}
            onToggleCompletion={toggleTaskCompletion}
            onStartEditing={startEditing}
            onCancelEditing={cancelEditing}
            onSaveEdit={saveEdit}
            onEditTextChange={setEditText}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onToggleBulletPoint={toggleBulletPointCompletion}
          />
        )}
      </Card>

      {/* Standalone todos - only show if loaded */}
      {standaloneTodosLoaded && (
        <StandaloneTodos
          todos={standaloneTodos}
          onAddTodo={addStandaloneTodo}
          onToggleTodo={toggleStandaloneTodo}
          onEditTodo={editStandaloneTodo}
          onDeleteTodo={deleteStandaloneTodo}
          onHideTodo={hideStandaloneTodo}
        />
      )}
    </div>
  );
};

export default WeeklySummaryDashboard;
