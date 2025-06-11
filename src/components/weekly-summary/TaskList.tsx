
import React from "react";
import { CardContent } from "@/components/ui/card";
import TaskItem from "./TaskItem";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";

interface TaskListProps {
  tasks: WeeklySummaryItem[];
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
  onDragEnd
}) => {
  return (
    <CardContent className="space-y-2">
      {tasks.map((item, index) => (
        <TaskItem
          key={item.id}
          item={item}
          index={index}
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
        />
      ))}
    </CardContent>
  );
};

export default TaskList;
