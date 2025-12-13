import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListTodo, Plus, Trash2, DollarSign } from 'lucide-react';
import { PlannedActivity } from '@/types/trip';

interface ActivitiesPlanningProps {
  activities: PlannedActivity[];
  onUpdate: (activities: PlannedActivity[]) => void;
}

const ActivitiesPlanning: React.FC<ActivitiesPlanningProps> = ({
  activities,
  onUpdate,
}) => {
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCost, setNewActivityCost] = useState('');

  const addActivity = () => {
    if (!newActivityName.trim()) return;
    
    const newActivity: PlannedActivity = {
      id: crypto.randomUUID(),
      name: newActivityName.trim(),
      cost: newActivityCost.trim(),
    };
    
    onUpdate([...activities, newActivity]);
    setNewActivityName('');
    setNewActivityCost('');
  };

  const removeActivity = (id: string) => {
    onUpdate(activities.filter(a => a.id !== id));
  };

  const updateActivity = (id: string, field: keyof PlannedActivity, value: string) => {
    onUpdate(activities.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addActivity();
    }
  };

  const totalCost = activities.reduce((sum, a) => {
    const cost = parseFloat(a.cost.replace(/[^0-9.]/g, '')) || 0;
    return sum + cost;
  }, 0);

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <ListTodo className="h-5 w-5" />
          Things to Do
          {activities.length > 0 && (
            <span className="ml-auto text-sm font-normal text-purple-500">
              Total: ${totalCost.toFixed(0)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Activity List */}
        {activities.length > 0 && (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-2 bg-white/80 rounded-lg p-2 group"
              >
                <span className="text-purple-400">•</span>
                <Input
                  value={activity.name}
                  onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                  className="flex-1 border-0 bg-transparent h-8 focus-visible:ring-1 focus-visible:ring-purple-300"
                  placeholder="Activity name"
                />
                <div className="flex items-center gap-1 w-24">
                  <DollarSign className="h-3 w-3 text-gray-400" />
                  <Input
                    value={activity.cost}
                    onChange={(e) => updateActivity(activity.id, 'cost', e.target.value)}
                    className="border-0 bg-transparent h-8 text-right focus-visible:ring-1 focus-visible:ring-purple-300"
                    placeholder="0"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeActivity(activity.id)}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Activity */}
        <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2 border border-dashed border-purple-200">
          <span className="text-purple-300">•</span>
          <Input
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-0 bg-transparent h-8 focus-visible:ring-0"
            placeholder="Add an activity..."
          />
          <div className="flex items-center gap-1 w-24">
            <DollarSign className="h-3 w-3 text-gray-400" />
            <Input
              value={newActivityCost}
              onChange={(e) => setNewActivityCost(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent h-8 text-right focus-visible:ring-0"
              placeholder="0"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={addActivity}
            disabled={!newActivityName.trim()}
            className="h-8 w-8 text-purple-500 hover:text-purple-700 hover:bg-purple-100"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivitiesPlanning;
