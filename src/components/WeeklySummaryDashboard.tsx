import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWeeklySummary, WeeklySummaryItem } from "@/hooks/useWeeklySummary";
import { useWeeklySummaryHooks } from "./weekly-summary/useWeeklySummaryHooks";
import { useStandaloneTodos } from "@/hooks/useStandaloneTodos";
import TaskList from "./weekly-summary/TaskList";
import StandaloneTodos from "./weekly-summary/StandaloneTodos";
import WeeklyView from "./weekly-summary/WeeklyView";
import { Calendar, List } from "lucide-react";

const WeeklySummaryDashboard: React.FC = () => {
  const { weeklySummary, isLoading, currentWeekKey, updateTaskOrder, updateTaskAssignment } = useWeeklySummary();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [tasks, setTasks] = useState(weeklySummary);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'weekly'>('list');

  // Standalone todos hook - now using Supabase
  const {
    todos: standaloneTodos,
    addTodo: addStandaloneTodo,
    toggleTodo: toggleStandaloneTodo,
    editTodo: editStandaloneTodo,
    deleteTodo: deleteStandaloneTodo,
    hideTodo: hideStandaloneTodo,
    isLoading: standaloneTodosLoading
  } = useStandaloneTodos();

  // Debug logging for standalone todos
  React.useEffect(() => {
    console.log("Standalone todos in dashboard:", standaloneTodos);
    console.log("Standalone todos loading:", standaloneTodosLoading);
  }, [standaloneTodos, standaloneTodosLoading]);

  // Update tasks when weeklySummary changes, but preserve manual order
  React.useEffect(() => {
    if (tasks.length === 0) {
      // Initial load - use the order from database (already sorted by priority and order_index)
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
        const filteredTasks = updatedTasks.filter(task => 
          weeklySummary.some(dbTask => dbTask.id === task.id)
        );

        // Sort tasks: incomplete first, then completed at the bottom
        return filteredTasks.sort((a, b) => {
          // If completion status is different, put incomplete first
          if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
          }
          
          // If both have same completion status, maintain existing order
          const aIndex = updatedTasks.findIndex(task => task.id === a.id);
          const bIndex = updatedTasks.findIndex(task => task.id === b.id);
          return aIndex - bIndex;
        });
      });
    }
  }, [weeklySummary]);

  const { getHookForCategory } = useWeeklySummaryHooks();

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

      // Update local state - maintain order but update completion status
      setTasks(currentTasks => {
        const updatedTasks = currentTasks.map(task => 
          task.id === item.id 
            ? { ...task, isCompleted: completed }
            : task
        );

        // Re-sort to move completed items to bottom
        return updatedTasks.sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
          }
          return 0; // Maintain relative order for items with same completion status
        });
      });
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

      // Update local state - update bullet point completions and completion status
      setTasks(currentTasks => {
        const updatedTasks = currentTasks.map(task => 
          task.id === item.id 
            ? { 
                ...task, 
                bullet_point_completions: updatedCompletions,
                isCompleted: allBulletsCompleted
              }
            : task
        );

        // Re-sort to move completed items to bottom
        return updatedTasks.sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
          }
          return 0; // Maintain relative order for items with same completion status
        });
      });
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

  // Handle day assignment update with support for bullet points
  // Handle priority update
  const handlePriorityUpdate = (taskId: string, priority: string) => {
    console.log('handlePriorityUpdate called:', { taskId, priority });
    
    updateTaskAssignment({
      taskId,
      priority
    });
    
    // Update local state
    setTasks(currentTasks => {
      return currentTasks.map(task => 
        task.id === taskId 
          ? { ...task, priority: priority as WeeklySummaryItem['priority'] }
          : task
      );
    });
  };

  const handleDayAssignmentUpdate = (taskId: string, assigned_day?: string | null) => {
    console.log('handleDayAssignmentUpdate called:', { taskId, assigned_day });
    
    try {
      // Check if this is a bullet point task by looking for the pattern
      if (taskId.includes('-bullet-')) {
        // Split the taskId to get parent task ID and bullet index
        const parts = taskId.split('-bullet-');
        if (parts.length !== 2) {
          console.error('Invalid bullet point task ID format:', taskId);
          return;
        }
        
        const parentTaskId = parts[0];
        const bulletIndexStr = parts[1];
        const bulletIndex = parseInt(bulletIndexStr, 10);
        
        if (isNaN(bulletIndex)) {
          console.error('Invalid bullet index:', bulletIndexStr);
          return;
        }
        
        console.log('Updating bullet point:', { parentTaskId, bulletIndex, assigned_day });
        
        // Find the parent task
        const parentTask = tasks.find(task => task.id === parentTaskId);
        if (!parentTask) {
          console.error('Parent task not found:', parentTaskId);
          return;
        }
        
        // Get current bullet point day assignments
        let bulletPointDayAssignments = {};
        try {
          if (parentTask.bullet_point_day_assignments) {
            bulletPointDayAssignments = JSON.parse(parentTask.bullet_point_day_assignments);
          }
        } catch (e) {
          console.error('Error parsing bullet point day assignments:', e);
        }
        
        // Update the specific bullet point's day assignment
        if (assigned_day === null) {
          delete bulletPointDayAssignments[bulletIndex];
        } else {
          bulletPointDayAssignments[bulletIndex] = assigned_day;
        }
        
        // Update the task with the new bullet point day assignments
        updateTaskAssignment({
          taskId: parentTaskId,
          bullet_point_day_assignments: JSON.stringify(bulletPointDayAssignments)
        });
        
        // Update local state
        setTasks(currentTasks => {
          return currentTasks.map(task => 
            task.id === parentTaskId 
              ? { ...task, bullet_point_day_assignments: JSON.stringify(bulletPointDayAssignments) }
              : task
          );
        });
      } else {
        // Regular task day assignment
        console.log('Updating regular task day assignment:', { taskId, assigned_day });
        updateTaskAssignment({
          taskId,
          assigned_day
        });
        
        // Update local state with proper type casting
        setTasks(currentTasks => {
          return currentTasks.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  assigned_day: assigned_day as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | undefined
                }
              : task
          );
        });
      }
      console.log('updateTaskAssignment called successfully');
    } catch (error) {
      console.error('Error updating task assignment:', error);
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

    // Manual reordering - when user drags and drops
    setTasks(currentTasks => {
      const newTasks = [...currentTasks];
      const draggedIndex = newTasks.findIndex(task => task.id === draggedItem);
      const targetIndex = newTasks.findIndex(task => task.id === targetItemId);
      
      if (draggedIndex === -1 || targetIndex === -1) return currentTasks;
      
      // Remove the dragged item and insert it at the target position
      const [draggedTask] = newTasks.splice(draggedIndex, 1);
      newTasks.splice(targetIndex, 0, draggedTask);
      
      // Save the new order to the database
      updateTaskOrder(newTasks);
      
      return newTasks;
    });
    
    setDraggedItem(null);
  }, [draggedItem, updateTaskOrder]);

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
      {/* View Mode Toggle */}
      <div className="flex justify-center gap-2">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="flex items-center gap-2"
        >
          <List className="w-4 h-4" />
          Task List
        </Button>
        <Button
          variant={viewMode === 'weekly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('weekly')}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Weekly View
        </Button>
      </div>

      {/* Tasks Section */}
      {viewMode === 'weekly' ? (
        <WeeklyView tasks={tasks} currentWeekKey={currentWeekKey} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>This Week's Tasks</CardTitle>
            <p className="text-sm text-gray-600">
              Week of {currentWeekKey} • Drag to reorder by priority
            </p>
          </CardHeader>
          {tasks.length === 0 ? (
            <CardContent>
              <p className="text-gray-500 text-center py-4">
                No tasks planned for this week. Start planning in your goal categories!
              </p>
            </CardContent>
          ) : (
            <CardContent>
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
                onDayAssignmentUpdate={handleDayAssignmentUpdate}
                onPriorityUpdate={handlePriorityUpdate}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Standalone todos - now loads from Supabase */}
      <StandaloneTodos
        todos={standaloneTodos}
        onAddTodo={addStandaloneTodo}
        onToggleTodo={toggleStandaloneTodo}
        onEditTodo={editStandaloneTodo}
        onDeleteTodo={deleteStandaloneTodo}
        onHideTodo={hideStandaloneTodo}
      />
    </div>
  );
};

export default WeeklySummaryDashboard;
