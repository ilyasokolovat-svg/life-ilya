
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Edit, Save, X, ExternalLink } from "lucide-react";
import BulletPointTask from "./BulletPointTask";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";

interface TaskItemProps {
  item: WeeklySummaryItem;
  draggedItem: string | null;
  editingTask: string | null;
  editText: string;
  onToggleCompletion: (item: any, completed: boolean) => void;
  onStartEditing: (task: any) => void;
  onCancelEditing: () => void;
  onSaveEdit: (item: any) => void;
  onEditTextChange: (text: string) => void;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetItemId: string) => void;
  onDragEnd: () => void;
  onToggleBulletPoint: (item: any, bulletIndex: number, completed: boolean) => void;
  onJumpToWeeklyPlan: (category: string, subcategory: string, periodKey: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  item,
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
  onToggleBulletPoint,
  onJumpToWeeklyPlan
}) => {
  const bulletPoints = item.planned_goal.split('\n').filter(line => line.trim());
  const hasBulletPoints = bulletPoints.length > 1;

  // Check if task is fully completed (either marked as completed or all bullet points are checked)
  const isFullyCompleted = item.isCompleted || (hasBulletPoints && 
    bulletPoints.every((_, index) => item.bullet_point_completions?.[index] === true)
  );

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-lg transition-all cursor-move ${
        draggedItem === item.id ? 'opacity-50' : ''
      } ${
        isFullyCompleted 
          ? 'border-green-300 bg-green-50' 
          : item.isOverdue 
            ? 'border-orange-300 bg-orange-50' 
            : 'border-gray-200 hover:border-gray-300'
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, item.id)}
      onDragEnd={onDragEnd}
    >
      <GripVertical className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-blue-600">
                {item.category}
              </span>
              <span className="text-xs text-gray-500">→</span>
              <span className="text-sm text-gray-700">
                {item.subcategory}
              </span>
              {item.isOverdue && (
                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                  Overdue ({item.weekDates})
                </span>
              )}
              {isFullyCompleted && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-medium">
                  Completed ✓
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onJumpToWeeklyPlan(item.category, item.subcategory, item.period_key)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Jump
            </Button>
            
            {editingTask === item.id ? (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSaveEdit(item)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelEditing}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStartEditing(item)}
                className="text-gray-600 hover:text-gray-700"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {editingTask === item.id ? (
          <Textarea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="w-full min-h-[100px] mb-2"
            placeholder="Enter your task details..."
          />
        ) : (
          <div className="mb-3">
            {hasBulletPoints ? (
              <BulletPointTask
                item={item}
                onToggleBulletPoint={onToggleBulletPoint}
              />
            ) : (
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={item.isCompleted}
                  onCheckedChange={(checked) => onToggleCompletion(item, !!checked)}
                  className="mt-1 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <p className={`leading-relaxed flex-1 ${
                  isFullyCompleted ? 'text-green-700 font-medium' : 'text-gray-700'
                }`}>
                  {item.planned_goal}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
