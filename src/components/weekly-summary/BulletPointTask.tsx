
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface BulletPointTaskProps {
  task: string;
  isCompleted: boolean;
  onToggle: (completed: boolean) => void;
}

const BulletPointTask: React.FC<BulletPointTaskProps> = ({
  task,
  isCompleted,
  onToggle
}) => {
  return (
    <div className="flex items-start gap-2 py-1">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={(checked) => onToggle(!!checked)}
        className="mt-0.5 flex-shrink-0"
      />
      <span className={`text-sm break-words flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
        {task.replace(/^•\s*/, '')} {/* Remove bullet point prefix */}
      </span>
    </div>
  );
};

export default BulletPointTask;
