import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, Lightbulb, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface MonthProgressData {
  goalAccomplishment: {
    career: boolean;
    investment: boolean;
    health: boolean;
    relationship: boolean;
    learning: boolean;
    selfAwareness: boolean;
  };
  topWins: string[];
  topLearnings: string[];
  completedAt?: string;
}

interface MonthCardProps {
  monthName: string;
  monthKey: string;
  data: MonthProgressData;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (field: keyof MonthProgressData, value: any) => void;
}

const CATEGORIES = [
  { key: 'career', label: 'Career', color: 'text-blue-400' },
  { key: 'investment', label: 'Investment', color: 'text-emerald-400' },
  { key: 'health', label: 'Health', color: 'text-rose-400' },
  { key: 'relationship', label: 'Relationship', color: 'text-pink-400' },
  { key: 'learning', label: 'Learning', color: 'text-amber-400' },
  { key: 'selfAwareness', label: 'Self Awareness', color: 'text-purple-400' },
] as const;

const MonthCard: React.FC<MonthCardProps> = ({
  monthName,
  monthKey,
  data,
  isOpen,
  onToggle,
  onUpdate,
}) => {
  const handleGoalToggle = (categoryKey: string) => {
    const newGoals = {
      ...data.goalAccomplishment,
      [categoryKey]: !data.goalAccomplishment[categoryKey as keyof typeof data.goalAccomplishment],
    };
    onUpdate('goalAccomplishment', newGoals);
  };

  const handleWinChange = (index: number, value: string) => {
    const newWins = [...data.topWins];
    newWins[index] = value;
    onUpdate('topWins', newWins);
  };

  const handleLearningChange = (index: number, value: string) => {
    const newLearnings = [...data.topLearnings];
    newLearnings[index] = value;
    onUpdate('topLearnings', newLearnings);
  };

  const completedGoals = Object.values(data.goalAccomplishment).filter(Boolean).length;
  const hasWins = data.topWins.some(w => w.trim());
  const hasLearnings = data.topLearnings.some(l => l.trim());
  const isComplete = completedGoals > 0 || hasWins || hasLearnings;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-white/10 rounded-none"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-white">{monthName}</span>
              {isComplete && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  {completedGoals}/6 goals
                </span>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-white/50" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/50" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-6">
            {/* Goal Accomplishment Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-medium text-white/80">
                  Did you stay on track with your goals?
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.key}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={data.goalAccomplishment[cat.key as keyof typeof data.goalAccomplishment]}
                      onCheckedChange={() => handleGoalToggle(cat.key)}
                    />
                    <span className={`text-sm ${cat.color}`}>{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Top Wins Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-medium text-white/80">Top Wins</h4>
              </div>
              <div className="space-y-2">
                {[0, 1, 2].map((index) => (
                  <Input
                    key={index}
                    placeholder={`Win #${index + 1}...`}
                    value={data.topWins[index] || ''}
                    onChange={(e) => handleWinChange(index, e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                ))}
              </div>
            </div>

            {/* Top Learnings Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-white/80">Top Learnings</h4>
              </div>
              <div className="space-y-2">
                {[0, 1, 2].map((index) => (
                  <Input
                    key={index}
                    placeholder={`Learning #${index + 1}...`}
                    value={data.topLearnings[index] || ''}
                    onChange={(e) => handleLearningChange(index, e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default MonthCard;
