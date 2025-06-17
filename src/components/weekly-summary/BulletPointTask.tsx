
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";

interface BulletPointTaskProps {
  item: WeeklySummaryItem;
  onToggleBulletPoint: (item: any, bulletIndex: number, completed: boolean) => void;
}

const BulletPointTask: React.FC<BulletPointTaskProps> = ({
  item,
  onToggleBulletPoint
}) => {
  const bulletPoints = item.planned_goal.split('\n').filter(line => line.trim());
  
  return (
    <div className="space-y-2">
      {bulletPoints.map((bulletPoint, index) => {
        const isCompleted = item.bullet_point_completions?.[index] || false;
        
        return (
          <div key={index} className="flex items-start gap-2 py-1">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => onToggleBulletPoint(item, index, !!checked)}
              className="mt-0.5 flex-shrink-0 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
            <span className={`text-sm break-words flex-1 ${
              isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
            }`}>
              {bulletPoint.replace(/^•\s*/, '')} {/* Remove bullet point prefix */}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BulletPointTask;
