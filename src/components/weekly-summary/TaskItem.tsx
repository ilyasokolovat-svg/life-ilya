
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GripVertical, Edit, Check, X } from "lucide-react";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";
import BulletPointTask from "./BulletPointTask";

interface TaskItemProps {
  item: WeeklySummaryItem;
  index: number;
  draggedItem: string | null;
  editingTask: string | null;
  editText: string;
  onToggleCompletion: (item: WeeklySummaryItem, completed: boolean) => void;
  onStartEditing: (task: WeeklySummaryItem) => void;
  onCancelEditing: () => void;
  onSaveEdit: (item: WeeklySummaryItem) => void;
  onEditTextChange: (text: string) => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetItemId: string) => void;
  onDragEnd: () => void;
  onToggleBulletPoint?: (item: WeeklySummaryItem, bulletIndex: number, completed: boolean) => void;
}

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

const capitalizeFirst = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const TaskItem: React.FC<TaskItemProps> = ({
  item,
  index,
  draggedItem,
  editingTask,
  editText,
  onToggleCompletion,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onEditTextChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggleBulletPoint
}) => {
  // Parse bullet points from planned_goal
  const bulletPoints = item.planned_goal
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.trim());

  // Track completion state for individual bullet points
  const bulletPointCompletions = item.bullet_point_completions || [];

  const handleBulletPointToggle = (bulletIndex: number, completed: boolean) => {
    if (onToggleBulletPoint) {
      onToggleBulletPoint(item, bulletIndex, completed);
    }
  };

  // Check if task is completed
  const isTaskCompleted = bulletPoints.length > 1 
    ? bulletPoints.every((_, index) => bulletPointCompletions[index] === true)
    : item.isCompleted;

  return (
    <div 
      key={item.id} 
      className={`group flex items-start gap-3 p-3 border rounded-lg transition-all duration-200 cursor-move ${
        draggedItem === item.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
      } ${isTaskCompleted ? 'bg-green-50 border-green-200' : ''} ${
        item.isOverdue ? 'bg-red-50 border-red-200' : ''
      }`}
      draggable={editingTask !== item.id}
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, item.id)}
      onDragEnd={onDragEnd}
    >
      <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-lg font-bold ${getCategoryColorClass(item.category)}`}>
            {capitalizeFirst(item.category)}
          </span>
          <span className="text-sm text-gray-400">•</span>
          <span className={`text-sm ${getCategoryColorClass(item.category)}`}>
            {item.subcategory}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            #{index + 1}
          </span>
          {item.isOverdue && !isTaskCompleted && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
              🔥 Overdue
            </span>
          )}
          {isTaskCompleted && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              ✓ Completed
            </span>
          )}
          {item.period_key !== item.period_key && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              Week {item.period_key}
            </span>
          )}
        </div>
        
        {editingTask === item.id ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              autoFocus
              placeholder="Enter each task on a new line...&#10;• Each line will become a bullet point"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => onSaveEdit(item)}
              >
                <Check className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onCancelEditing}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {bulletPoints.length > 1 ? (
              // Multiple bullet points - show as individual checkable items
              <div className="space-y-1">
                {bulletPoints.map((bulletPoint, bulletIndex) => (
                  <BulletPointTask
                    key={bulletIndex}
                    task={bulletPoint}
                    isCompleted={bulletPointCompletions[bulletIndex] || false}
                    onToggle={(completed) => handleBulletPointToggle(bulletIndex, completed)}
                  />
                ))}
              </div>
            ) : (
              // Single item - show as regular task with checkbox
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={item.isCompleted}
                  onCheckedChange={(checked) => onToggleCompletion(item, !!checked)}
                  className="mt-0.5 flex-shrink-0"
                />
                <p className={`text-sm break-words flex-1 ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {bulletPoints[0]?.replace(/^•\s*/, '') || item.planned_goal}
                </p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStartEditing(item)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
