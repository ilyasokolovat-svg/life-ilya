import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Target, Heart, Brain, DollarSign, Lightbulb, Star } from 'lucide-react';
import { useQuarterlyGoalsOverview } from '@/hooks/useQuarterlyGoalsOverview';
import { cn } from '@/lib/utils';

const categoryConfig: Record<string, { icon: React.ElementType; gradient: string; bgLight: string; label: string }> = {
  physical: { icon: Heart, gradient: 'from-red-500 to-pink-500', bgLight: 'bg-red-50', label: 'Physical' },
  mental: { icon: Brain, gradient: 'from-purple-500 to-indigo-500', bgLight: 'bg-purple-50', label: 'Mental' },
  financial: { icon: DollarSign, gradient: 'from-green-500 to-emerald-500', bgLight: 'bg-green-50', label: 'Financial' },
  skills: { icon: Lightbulb, gradient: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-50', label: 'Skills' }
};

// Emoji map for subcategories
const subcategoryEmoji: Record<string, string> = {
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

export function QuarterlyGoalsOverview() {
  const { groupedGoals, isLoading, currentQuarter, hasAnyGoals } = useQuarterlyGoalsOverview();
  
  // Load collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('quarterly-goals-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem('quarterly-goals-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          <h3 className="font-bold text-lg">{currentQuarter} Goals Overview</h3>
        </div>
        {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          {!hasAnyGoals ? (
            <div className="text-center py-6 text-gray-500">
              <p>No quarterly goals set yet.</p>
              <Link to="/goals-overview" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
                Set your {currentQuarter} goals →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {groupedGoals.map(({ category, subcategoryGoals }) => {
                const config = categoryConfig[category];
                const Icon = config.icon;

                return (
                  <Link
                    key={category}
                    to={`/goals/${category}`}
                    className="group block"
                  >
                    <div className={cn(
                      "rounded-lg p-3 h-full border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all",
                      config.bgLight
                    )}>
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br",
                          config.gradient
                        )}>
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">{config.label}</span>
                      </div>

                      {/* Subcategory Main Goals */}
                      {subcategoryGoals.length > 0 ? (
                        <ul className="space-y-1.5">
                          {subcategoryGoals.map((sg) => (
                            <li key={sg.subcategory} className="flex items-start gap-1.5">
                              <span className="text-xs flex-shrink-0 mt-0.5">
                                {subcategoryEmoji[sg.subcategory] || '📋'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] text-gray-400 block leading-tight">
                                  {sg.subcategory}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                                  <span className="text-xs text-gray-700 font-medium truncate" title={sg.mainGoal}>
                                    {sg.mainGoal}
                                  </span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No goals set</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
