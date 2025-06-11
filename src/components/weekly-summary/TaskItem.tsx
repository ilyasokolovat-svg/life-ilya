
import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GripVertical, Edit, Check, X } from "lucide-react";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";

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
  onDragEnd
}) => {
  return (
    <div 
      key={item.id} 
      className={`group flex items-start gap-3 p-3 border rounded-lg transition-all duration-200 cursor-move ${
        draggedItem === item.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
      }`}
      draggable={editingTask !== item.id}
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, item.id)}
      onDragEnd={onDragEnd}
    >
      <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
      <Checkbox
        checked={item.isCompleted}
        onCheckedChange={(checked) => onToggleCompletion(item, !!checked)}
        className="mt-1 flex-shrink-0"
      />
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
        </div>
        
        {editingTask === item.id ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              autoFocus
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
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm break-words flex-1 ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {item.planned_goal}
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStartEditing(item)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
            >
              <Edit className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
