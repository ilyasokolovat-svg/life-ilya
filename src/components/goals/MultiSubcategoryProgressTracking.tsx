import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Target, Calendar, Save, Star } from "lucide-react";
import { useGoalsData } from "@/hooks/useGoalsData";
import { toast } from "sonner";

interface MultiSubcategoryProgressTrackingProps {
  category: string;
  visibleSubcategories: string[];
}

// Helper to count words
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

const MultiSubcategoryProgressTracking: React.FC<MultiSubcategoryProgressTrackingProps> = ({
  category,
  visibleSubcategories
}) => {
  const { goalsData, saveGoal } = useGoalsData(category);
  const [localGoals, setLocalGoals] = React.useState<Record<string, Record<string, string>>>({});
  const [changedGoals, setChangedGoals] = React.useState<Set<string>>(new Set());

  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  // Get goals for a specific period and subcategory
  const getPeriodGoals = (periodKey: string, subcategory: string) => {
    const goalData = goalsData.find(g => 
      g.category === category && 
      g.subcategory === subcategory && 
      g.period_key === periodKey &&
      g.period_type === 'period_goals'
    );
    return goalData?.planned_goal || '';
  };

  // Get current local value or saved value
  const getCurrentValue = (periodKey: string, subcategory: string) => {
    return localGoals[periodKey]?.[subcategory] !== undefined 
      ? localGoals[periodKey][subcategory] 
      : getPeriodGoals(periodKey, subcategory);
  };

  // Handle goal changes
  const handleGoalChange = (periodKey: string, subcategory: string, value: string) => {
    setLocalGoals(prev => ({
      ...prev,
      [periodKey]: {
        ...prev[periodKey],
        [subcategory]: value
      }
    }));
    setChangedGoals(prev => new Set([...prev, `${periodKey}-${subcategory}`]));
  };

  // Save goal with validation for main goal word limit
  const handleSaveGoal = (periodKey: string, subcategory: string, isQuarterly: boolean) => {
    const value = localGoals[periodKey]?.[subcategory] || '';
    
    // Split into lines
    const lines = value.split('\n').filter(line => line.trim());
    
    // Check main goal (first line) word limit for quarterly goals
    if (isQuarterly && lines.length > 0) {
      const firstLine = lines[0].replace(/^[•⭐]\s*/, '').trim();
      const wordCount = countWords(firstLine);
      if (wordCount > 7) {
        toast.error(`Main goal must be 7 words or less (currently ${wordCount} words)`);
        return;
      }
    }
    
    // Format with bullet points - first line gets star for quarterly goals
    const formattedValue = lines
      .map((line, index) => {
        const trimmed = line.trim().replace(/^[•⭐]\s*/, '');
        if (isQuarterly && index === 0) {
          return `⭐ ${trimmed}`;
        }
        return trimmed.startsWith('•') ? line : `• ${trimmed}`;
      })
      .join('\n');

    saveGoal({
      category,
      subcategory,
      period_key: periodKey,
      period_type: 'period_goals',
      planned_goal: formattedValue,
      actual_result: undefined
    });

    setChangedGoals(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${periodKey}-${subcategory}`);
      return newSet;
    });
  };

  // Get subcategory emoji
  const getSubcategoryEmoji = (subcategory: string) => {
    const emojiMap: Record<string, string> = {
      'Sport': '🏃',
      'Food': '🍎',
      'Sleep': '😴',
      'Networking': '🤝',
      'Activities': '🎯',
      'Phone usage': '📱',
      'Spending commitment': '💰',
      'Trading': '📈',
      'Projects': '🚀',
      'Books': '📚',
      'People Management': '👥',
      'Arabic': '🗣️'
    };
    return emojiMap[subcategory] || '📋';
  };

  const getCategoryTheme = (category: string) => {
    const themes = {
      physical: {
        year: {
          card: 'from-physical-light to-physical-medium border-physical-medium',
          text: 'text-orange-700',
          textSecondary: 'text-orange-600',
          border: 'border-physical-medium focus:border-physical-dark',
          savedBg: 'bg-physical-medium/70 text-orange-900',
          button: 'bg-physical-dark hover:bg-orange-600',
          emoji: '⭐'
        },
        quarter: {
          card: 'from-physical-bg to-physical-light border-physical-light',
          text: 'text-orange-700',
          textSecondary: 'text-orange-600',
          border: 'border-physical-light focus:border-physical-medium',
          savedBg: 'bg-physical-light/70 text-orange-900',
          button: 'bg-physical-medium hover:bg-orange-500',
          emoji: '🎯'
        }
      },
      mental: {
        year: {
          card: 'from-mental-light to-mental-medium border-mental-medium',
          text: 'text-blue-700',
          textSecondary: 'text-blue-600',
          border: 'border-mental-medium focus:border-mental-dark',
          savedBg: 'bg-mental-medium/70 text-blue-900',
          button: 'bg-mental-dark hover:bg-blue-600',
          emoji: '⭐'
        },
        quarter: {
          card: 'from-mental-bg to-mental-light border-mental-light',
          text: 'text-blue-700',
          textSecondary: 'text-blue-600',
          border: 'border-mental-light focus:border-mental-medium',
          savedBg: 'bg-mental-light/70 text-blue-900',
          button: 'bg-mental-medium hover:bg-blue-500',
          emoji: '🎯'
        }
      },
      financial: {
        year: {
          card: 'from-financial-light to-financial-medium border-financial-medium',
          text: 'text-green-700',
          textSecondary: 'text-green-600',
          border: 'border-financial-medium focus:border-financial-dark',
          savedBg: 'bg-financial-medium/70 text-green-900',
          button: 'bg-financial-dark hover:bg-green-600',
          emoji: '⭐'
        },
        quarter: {
          card: 'from-financial-bg to-financial-light border-financial-light',
          text: 'text-green-700',
          textSecondary: 'text-green-600',
          border: 'border-financial-light focus:border-financial-medium',
          savedBg: 'bg-financial-light/70 text-green-900',
          button: 'bg-financial-medium hover:bg-green-500',
          emoji: '🎯'
        }
      },
      skills: {
        year: {
          card: 'from-skills-light to-skills-medium border-skills-medium',
          text: 'text-red-700',
          textSecondary: 'text-red-600',
          border: 'border-skills-medium focus:border-skills-dark',
          savedBg: 'bg-skills-medium/70 text-red-900',
          button: 'bg-skills-dark hover:bg-red-600',
          emoji: '⭐'
        },
        quarter: {
          card: 'from-skills-bg to-skills-light border-skills-light',
          text: 'text-red-700',
          textSecondary: 'text-red-600',
          border: 'border-skills-light focus:border-skills-medium',
          savedBg: 'bg-skills-light/70 text-red-900',
          button: 'bg-skills-medium hover:bg-red-500',
          emoji: '🎯'
        }
      }
    };
    return themes[category as keyof typeof themes] || themes.physical;
  };

  const theme = getCategoryTheme(category);

  return (
    <div className="space-y-4">
      {/* Current Year Strategic Goals */}
      <Card className={`bg-gradient-to-br ${theme.year.card} shadow-sm`}>
        <CardContent className="p-4">
          <div className={`text-sm font-semibold ${theme.year.text} mb-3 flex items-center gap-2`}>
            <Target className="w-4 h-4" />
            {currentYear} Strategic Goals
          </div>
          <div className="space-y-3">
            {visibleSubcategories.map((subcategory) => {
              const yearKey = String(currentYear);
              const goalValue = getCurrentValue(yearKey, subcategory);
              const hasChanges = changedGoals.has(`${yearKey}-${subcategory}`);
              
              return (
                <div key={subcategory} className="space-y-2 relative">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getSubcategoryEmoji(subcategory)}</span>
                    <div className={`text-xs font-medium ${theme.year.textSecondary}`}>{subcategory}</div>
                    {getPeriodGoals(yearKey, subcategory) && !hasChanges && (
                      <div className={theme.year.textSecondary}>{theme.year.emoji}</div>
                    )}
                  </div>
                  <Textarea
                    placeholder={`Enter your ${currentYear} goals for ${subcategory}...`}
                    value={goalValue}
                    onChange={(e) => handleGoalChange(yearKey, subcategory, e.target.value)}
                    className={`${theme.year.border} text-xs resize-none transition-all duration-300 ${
                      getPeriodGoals(yearKey, subcategory) && !hasChanges
                        ? `${theme.year.savedBg} font-medium shadow-inner`
                        : 'bg-white/70'
                    }`}
                    style={{ minHeight: Math.max(40, goalValue.split('\n').length * 16) + 'px' }}
                  />
                  {hasChanges && (
                    <Button 
                      onClick={() => handleSaveGoal(yearKey, subcategory, false)}
                      className={`${theme.year.button} text-white`}
                      size="sm"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Quarter Goals */}
      <Card className={`bg-gradient-to-br ${theme.quarter.card} shadow-sm`}>
        <CardContent className="p-4">
          <div className={`text-sm font-semibold ${theme.quarter.text} mb-3 flex items-center gap-2`}>
            <Calendar className="w-4 h-4" />
            Q{currentQuarter} {currentYear} Goals
          </div>
          <div className="space-y-3">
            {visibleSubcategories.map((subcategory) => {
              const currentQuarterKey = `${currentYear}-Q${currentQuarter}`;
              const goalValue = getCurrentValue(currentQuarterKey, subcategory);
              const hasChanges = changedGoals.has(`${currentQuarterKey}-${subcategory}`);
              
              return (
                <div key={subcategory} className="space-y-2 relative">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getSubcategoryEmoji(subcategory)}</span>
                    <div className={`text-xs font-medium ${theme.quarter.textSecondary}`}>{subcategory}</div>
                    {getPeriodGoals(currentQuarterKey, subcategory) && !hasChanges && (
                      <div className={theme.quarter.textSecondary}>{theme.quarter.emoji}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Textarea
                      placeholder={`Line 1 = Main goal (7 words max, shown on dashboard)
• Additional goals...`}
                      value={goalValue}
                      onChange={(e) => handleGoalChange(currentQuarterKey, subcategory, e.target.value)}
                      className={`${theme.quarter.border} text-xs resize-none transition-all duration-300 ${
                        getPeriodGoals(currentQuarterKey, subcategory) && !hasChanges
                          ? `${theme.quarter.savedBg} font-medium shadow-inner`
                          : 'bg-white/70'
                      }`}
                      style={{ minHeight: Math.max(56, goalValue.split('\n').length * 16) + 'px' }}
                    />
                    {goalValue && (
                      <div className="flex items-center gap-2 text-[10px]">
                        <Star className="w-3 h-3 text-amber-500" />
                        <span className={`${
                          countWords(goalValue.split('\n')[0]?.replace(/^[•⭐]\s*/, '') || '') > 7 
                            ? 'text-red-500 font-medium' 
                            : 'text-gray-400'
                        }`}>
                          Main goal: {countWords(goalValue.split('\n')[0]?.replace(/^[•⭐]\s*/, '') || '')}/7 words
                        </span>
                      </div>
                    )}
                  </div>
                  {hasChanges && (
                    <Button 
                      onClick={() => handleSaveGoal(currentQuarterKey, subcategory, true)}
                      className={`${theme.quarter.button} text-white`}
                      size="sm"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiSubcategoryProgressTracking;