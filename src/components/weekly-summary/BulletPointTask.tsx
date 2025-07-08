
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";

interface BulletPointTaskProps {
  item: WeeklySummaryItem;
  onToggleBulletPoint: (item: any, bulletIndex: number, completed: boolean) => void;
  onDayAssignmentUpdate: (taskId: string, assigned_day?: string | null) => void;
  DayDropdown: React.ComponentType<{ taskId: string, assignedDay?: string | null }>;
}

const BulletPointTask: React.FC<BulletPointTaskProps> = ({
  item,
  onToggleBulletPoint,
  onDayAssignmentUpdate,
  DayDropdown
}) => {
  const bulletPoints = item.planned_goal.split('\n').filter(line => line.trim());
  const bulletPointCompletions = item.bullet_point_completions || [];
  
  // Parse bullet point day assignments from a JSON field or default to parent's day
  const getBulletPointDayAssignments = () => {
    try {
      // Check if we have bullet point day assignments stored
      if (item.bullet_point_day_assignments) {
        return JSON.parse(item.bullet_point_day_assignments);
      }
    } catch (e) {
      // Fall back to empty object if parsing fails
    }
    return {};
  };
  
  const bulletPointDayAssignments = getBulletPointDayAssignments();

  const handleBulletPointDayChange = (bulletIndex: number, assignedDay: string | null) => {
    console.log('BulletPointTask day change:', { bulletIndex, assignedDay, taskId: item.id });
    
    // Create a unique identifier for this bullet point
    const bulletTaskId = `${item.id}-bullet-${bulletIndex}`;
    
    // Update the specific bullet point's day assignment
    onDayAssignmentUpdate(bulletTaskId, assignedDay);
  };

  return (
    <div className="space-y-2">
      {bulletPoints.map((bulletPoint, index) => {
        const isCompleted = bulletPointCompletions[index] === true;
        const cleanBulletPoint = bulletPoint.replace(/^•\s*/, '').trim();
        const bulletPointAssignedDay = bulletPointDayAssignments[index] || null;
        
        return (
          <div key={index} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => onToggleBulletPoint(item, index, !!checked)}
              />
              <span className={`text-sm ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                • {cleanBulletPoint}
              </span>
            </div>
            <DayDropdown 
              taskId={`${item.id}-bullet-${index}`}
              assignedDay={bulletPointAssignedDay} 
            />
          </div>
        );
      })}
    </div>
  );
};

export default BulletPointTask;
