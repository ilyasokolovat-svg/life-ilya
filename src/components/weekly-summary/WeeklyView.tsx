
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklySummaryItem } from "@/hooks/useWeeklySummary";

interface WeeklyViewProps {
  tasks: WeeklySummaryItem[];
  currentWeekKey: string;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

interface TaskForDay {
  id: string;
  taskId: string;
  category: string;
  subcategory: string;
  text: string;
  isCompleted: boolean;
  isOverdue?: boolean;
  isBulletPoint?: boolean;
  bulletIndex?: number;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ tasks, currentWeekKey }) => {
  // Process tasks to create individual items for each day assignment
  const processTasksForWeekly = () => {
    const tasksByDay: Record<string, TaskForDay[]> = {};
    
    tasks.forEach(task => {
      const bulletPoints = task.planned_goal.split('\n').filter(line => line.trim());
      const isBulletPointTask = bulletPoints.length > 1;
      
      if (isBulletPointTask) {
        // Handle bullet point tasks with individual day assignments
        let bulletPointDayAssignments = {};
        try {
          if (task.bullet_point_day_assignments) {
            bulletPointDayAssignments = JSON.parse(task.bullet_point_day_assignments);
          }
        } catch (e) {
          console.error('Error parsing bullet point day assignments:', e);
        }
        
        // Add each bullet point that has a day assignment
        bulletPoints.forEach((bulletPoint, index) => {
          const assignedDay = bulletPointDayAssignments[index];
          if (assignedDay) {
            const day = assignedDay as string;
            if (!tasksByDay[day]) {
              tasksByDay[day] = [];
            }
            
            const cleanBulletPoint = bulletPoint.replace(/^•\s*/, '').trim();
            tasksByDay[day].push({
              id: `${task.id}-bullet-${index}`,
              taskId: task.id,
              category: task.category,
              subcategory: task.subcategory,
              text: cleanBulletPoint,
              isCompleted: task.bullet_point_completions?.[index] === true,
              isOverdue: task.isOverdue,
              isBulletPoint: true,
              bulletIndex: index
            });
          }
        });
      } else {
        // Handle regular single tasks
        const day = task.assigned_day || 'unassigned';
        if (!tasksByDay[day]) {
          tasksByDay[day] = [];
        }
        
        const taskText = task.planned_goal.split('\n')[0].replace('• ', '');
        tasksByDay[day].push({
          id: task.id,
          taskId: task.id,
          category: task.category,
          subcategory: task.subcategory,
          text: taskText,
          isCompleted: task.isCompleted,
          isOverdue: task.isOverdue,
          isBulletPoint: false
        });
      }
    });
    
    return tasksByDay;
  };

  const tasksByDay = processTasksForWeekly();

  const renderDayCard = (day: { key: string; label: string }) => {
    const dayTasks = tasksByDay[day.key] || [];
    
    return (
      <Card key={day.key} className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{day.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {dayTasks.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No tasks assigned</p>
          ) : (
            <div className="space-y-2">
              {dayTasks.map((taskItem) => (
                <div key={taskItem.id} className="text-sm">
                  <div className="flex items-start gap-1">
                    <span className="text-gray-400 mt-1">•</span>
                    <div className="flex-1">
                      <span className="text-gray-600 text-xs">
                        ({taskItem.category}/{taskItem.subcategory})
                        {taskItem.isBulletPoint && ` - Item ${(taskItem.bulletIndex || 0) + 1}`}
                      </span>
                      <p className={`${taskItem.isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {taskItem.text}
                      </p>
                      {taskItem.isOverdue && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Weekly View</h2>
        <p className="text-sm text-gray-600">
          Week of {currentWeekKey} • Tasks organized by assigned days
        </p>
      </div>

      {/* First Row: Monday - Thursday */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DAYS.slice(0, 4).map(day => renderDayCard(day))}
      </div>

      {/* Second Row: Friday - Sunday */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.slice(4, 7).map(day => renderDayCard(day))}
      </div>

      {/* Unassigned Tasks */}
      {tasksByDay.unassigned && tasksByDay.unassigned.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-600">Unassigned Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasksByDay.unassigned.map((taskItem) => (
                <div key={taskItem.id} className="text-sm">
                  <div className="flex items-start gap-1">
                    <span className="text-gray-400 mt-1">•</span>
                    <div className="flex-1">
                      <span className="text-gray-600 text-xs">
                        ({taskItem.category}/{taskItem.subcategory})
                        {taskItem.isBulletPoint && ` - Item ${(taskItem.bulletIndex || 0) + 1}`}
                      </span>
                      <p className={`${taskItem.isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {taskItem.text}
                      </p>
                      {taskItem.isOverdue && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeeklyView;
