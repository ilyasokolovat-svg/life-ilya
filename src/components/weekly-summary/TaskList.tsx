
import React from "react";
import { CardContent } from "@/components/ui/card";
import TaskItem from "./TaskItem";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";

interface TaskListProps {
  tasks: WeeklySummaryItem[];
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
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
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
  return (
    <CardContent className="space-y-3">
      {tasks.map((item) => (
        <TaskItem
          key={item.id}
          item={item}
          draggedItem={draggedItem}
          editingTask={editingTask}
          editText={editText}
          onToggleCompletion={onToggleCompletion}
          onStartEditing={onStartEditing}
          onCancelEditing={onCancelEditing}
          onSaveEdit={onSaveEdit}
          onEditTextChange={onEditTextChange}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          onToggleBulletPoint={onToggleBulletPoint}
        />
      ))}
    </CardContent>
  );
};

export default TaskList;
