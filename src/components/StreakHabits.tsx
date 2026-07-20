import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStreakHabits } from '@/hooks/useStreakHabits';
import { Checkbox } from '@/components/ui/checkbox';

const StreakHabits: React.FC = () => {
  const { streakHabits, addStreakHabit, toggleDay, deleteStreakHabit } = useStreakHabits();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDuration, setNewHabitDuration] = useState('');

  const handleAddHabit = () => {
    const duration = parseInt(newHabitDuration);
    if (newHabitName.trim() && duration > 0 && duration <= 30) {
      addStreakHabit(newHabitName.trim(), duration);
      setNewHabitName('');
      setNewHabitDuration('');
      setShowAddForm(false);
    }
  };

  const getBackgroundColor = (completedDays: ('pending' | 'completed' | 'missed')[]) => {
    const completedCount = completedDays.filter(day => day === 'completed').length;
    const percentage = (completedCount / completedDays.length) * 100;
    
    if (percentage >= 75) return 'hsl(142 76% 85%)'; // dark green
    if (percentage >= 50) return 'hsl(142 71% 90%)'; // medium green
    if (percentage >= 25) return 'hsl(142 66% 95%)'; // light green
    return 'hsl(0 0% 100%)'; // white
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl">Priority Streak Habits</CardTitle>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Habit Name</label>
              <Input
                placeholder="e.g., No Sugar"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Duration (days, max 30)</label>
              <Input
                type="number"
                placeholder="e.g., 30"
                min="1"
                max="30"
                value={newHabitDuration}
                onChange={(e) => setNewHabitDuration(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddHabit} size="sm" className="flex-1">
                Create Habit
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewHabitName('');
                  setNewHabitDuration('');
                }}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {streakHabits.length === 0 && !showAddForm && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No streak habits yet. Click "Add New" to create one!
          </p>
        )}

        {streakHabits.map((habit) => {
          const completedCount = habit.completedDays.filter(d => d === 'completed').length;
          // Compute current streak (consecutive completed from the last completed day backwards)
          let currentStreak = 0;
          for (let i = habit.completedDays.length - 1; i >= 0; i--) {
            if (habit.completedDays[i] === 'completed') currentStreak++;
            else if (habit.completedDays[i] === 'missed') break;
            else if (currentStreak > 0) break;
          }
          const pct = Math.round((completedCount / habit.goalDuration) * 100);
          return (
            <div
              key={habit.id}
              className="border rounded-lg p-4 transition-all duration-300"
              style={{ backgroundColor: getBackgroundColor(habit.completedDays) }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm md:text-base">{habit.name}</h3>
                    {currentStreak > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-700 font-semibold">
                        🔥 {currentStreak}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completedCount} / {habit.goalDuration} days · {pct}%
                  </p>
                </div>
                <Button
                  onClick={() => deleteStreakHabit(habit.id)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted mb-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {habit.completedDays.map((status, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => toggleDay(habit.id, index)}
                    title="Click to cycle: pending → done → not done → pending"
                  >
                    {status === 'missed' ? (
                      <div className="h-5 w-5 rounded border-2 border-destructive bg-destructive/20 flex items-center justify-center transition-all group-hover:scale-110">
                        <X className="h-3 w-3 text-destructive" />
                      </div>
                    ) : status === 'completed' ? (
                      <div className="h-5 w-5 rounded border-2 border-primary bg-primary flex items-center justify-center transition-all group-hover:scale-110">
                        <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor"><path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"/></svg>
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded border-2 border-muted-foreground/40 bg-background transition-all group-hover:scale-110 group-hover:border-primary/60" />
                    )}
                    <span className="text-[10px] text-muted-foreground mt-0.5">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StreakHabits;
