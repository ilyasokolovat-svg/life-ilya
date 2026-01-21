import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Target, Heart, Brain, DollarSign, Lightbulb } from 'lucide-react';
import { useQuarterlyGoalsOverview } from '@/hooks/useQuarterlyGoalsOverview';
import { cn } from '@/lib/utils';

const categoryConfig: Record<string, { icon: React.ElementType; gradient: string; label: string }> = {
  physical: { icon: Heart, gradient: 'from-red-500 to-pink-500', label: 'Physical' },
  mental: { icon: Brain, gradient: 'from-purple-500 to-indigo-500', label: 'Mental' },
  financial: { icon: DollarSign, gradient: 'from-green-500 to-emerald-500', label: 'Financial' },
  skills: { icon: Lightbulb, gradient: 'from-amber-500 to-orange-500', label: 'Skills' }
};

export function QuarterlyGoalsOverview() {
  const { groupedGoals, isLoading, currentQuarter } = useQuarterlyGoalsOverview();
  
  // Load collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('quarterly-goals-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem('quarterly-goals-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const hasAnyGoals = groupedGoals.some(cg => cg.goals.length > 0);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {groupedGoals.map(({ category, goals }) => {
                const config = categoryConfig[category];
                const Icon = config.icon;

                return (
                  <Link
                    key={category}
                    to={`/goals/${category}`}
                    className="group block"
                  >
                    <div className="bg-gray-50 rounded-lg p-3 h-full border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br",
                          config.gradient
                        )}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">{config.label}</span>
                      </div>

                      {/* Goals List */}
                      {goals.length > 0 ? (
                        <ul className="space-y-1">
                          {goals.slice(0, 4).map((g, idx) => (
                            <li key={idx} className="text-xs text-gray-600 truncate flex items-start gap-1">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span className="truncate" title={g.goal}>{g.goal}</span>
                            </li>
                          ))}
                          {goals.length > 4 && (
                            <li className="text-xs text-gray-400 italic">
                              +{goals.length - 4} more
                            </li>
                          )}
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
