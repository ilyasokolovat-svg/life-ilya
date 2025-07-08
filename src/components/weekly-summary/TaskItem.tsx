
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Edit, Save, X, Calendar } from "lucide-react";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";
import BulletPointTask from "./BulletPointTask";

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
  onDayAssignmentUpdate: (taskId: string, assigned_day?: string | null) => void;
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
  onDayAssignmentUpdate
}) => {
  const isEditing = editingTask === item.id;
  const isDragging = draggedItem === item.id;
  
  // Check if this is a bullet point task
  const bulletPoints = item.planned_goal.split('\n').filter(line => line.trim());
  const isBulletPointTask = bulletPoints.length > 1;

  const handleDayChange = (day: string) => {
    const assignedDay = day === 'unassigned' ? null : day;
    onDayAssignmentUpdate(item.id, assignedDay);
  };

  const getDayDisplayValue = () => {
    if (!item.assigned_day) return 'unassigned';
    return item.assigned_day;
  };

  const getDayLabel = (day: string) => {
    switch (day) {
      case 'monday': return 'Mon';
      case 'tuesday': return 'Tue';
      case 'wednesday': return 'Wed';
      case 'thursday': return 'Thu';
      case 'friday': return 'Fri';
      case 'saturday': return 'Sat';
      case 'sunday': return 'Sun';
      default: return 'Day';
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${item.isOverdue ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, item.id)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
          {!isBulletPointTask && (
            <Checkbox
              checked={item.isCompleted}
              onCheckedChange={(checked) => onToggleCompletion(item, !!checked)}
              disabled={isEditing}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {item.subcategory}
            </Badge>
            {item.isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue ({item.weekDates})
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                className="min-h-[100px] text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onSaveEdit(item)}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelEditing}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {isBulletPointTask ? (
                <BulletPointTask
                  item={item}
                  onToggleBulletPoint={onToggleBulletPoint}
                />
              ) : (
                <p className={`text-sm ${item.isCompleted ? 'line-through text-gray-500' : ''}`}>
                  {item.planned_goal}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Day Assignment Dropdown */}
          <Select
            value={getDayDisplayValue()}
            onValueChange={handleDayChange}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue>
                {item.assigned_day ? getDayLabel(item.assigned_day) : 'Day'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">No day</SelectItem>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="tuesday">Tuesday</SelectItem>
              <SelectItem value="wednesday">Wednesday</SelectItem>
              <SelectItem value="thursday">Thursday</SelectItem>
              <SelectItem value="friday">Friday</SelectItem>
              <SelectItem value="saturday">Saturday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>

          {!isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStartEditing(item)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
