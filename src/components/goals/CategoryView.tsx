import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CategoryThesis from "./CategoryThesis";
import MultiSubcategoryProgressTracking from "./MultiSubcategoryProgressTracking";
import MultiSubcategoryWeeklyPlanning from "./MultiSubcategoryWeeklyPlanning";
import TimelineControls from "./TimelineControls";
import TimelineBubbles from "./TimelineBubbles";
import { useLastUpdateDate } from "@/hooks/useLastUpdateDate";

interface CategoryViewProps {
  category: string;
  categoryTitle: string;
  visibleSubcategories: string[];
}

interface TimelinePeriod {
  id: string;
  label: string;
  type: 'quarter' | 'year';
  year: number;
  quarter?: number;
  isPast: boolean;
}

const CategoryView: React.FC<CategoryViewProps> = ({ 
  category, 
  categoryTitle, 
  visibleSubcategories 
}) => {
  const [hidePastPeriods, setHidePastPeriods] = useState(true);
  const [hidePastWeeks, setHidePastWeeks] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimelinePeriod | null>(null);
  
  const { formattedDate } = useLastUpdateDate(category, 'overview');

  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const currentQuarter = Math.floor(currentMonth / 3) + 1; // 1-4

  // Generate timeline periods
  const generateTimeline = (): TimelinePeriod[] => {
    const periods: TimelinePeriod[] = [];
    
    // Current year quarters
    for (let q = 1; q <= 4; q++) {
      const isPast = q < currentQuarter;
      periods.push({
        id: `${currentYear}-Q${q}`,
        label: `Q${q}`,
        type: 'quarter',
        year: currentYear,
        quarter: q,
        isPast
      });
    }
    
    // Future years
    const futureYears = [currentYear + 1, currentYear + 2, currentYear + 5]; // 2026, 2027, 2030
    futureYears.forEach(year => {
      periods.push({
        id: `${year}`,
        label: `${year}`,
        type: 'year',
        year,
        isPast: false
      });
    });
    
    return periods;
  };

  const timeline = generateTimeline();
  const visiblePeriods = hidePastPeriods ? timeline.filter(p => !p.isPast) : timeline;

  // Generate the period title
  const getPeriodTitle = (period: TimelinePeriod) => {
    if (period.type === 'quarter') {
      return `${period.label} ${period.year} - Weekly Planning`;
    } else {
      return `${period.label} - Goals Planning`;
    }
  };

  // Get category theme class
  const getCategoryBgClass = (category: string) => {
    const themes = {
      physical: 'bg-physical-bg',
      mental: 'bg-mental-bg', 
      financial: 'bg-financial-bg',
      skills: 'bg-skills-bg'
    };
    return themes[category as keyof typeof themes] || 'bg-background';
  };

  return (
    <div className={`min-h-screen ${getCategoryBgClass(category)} transition-colors duration-300`}>
      <div className="space-y-6 p-6">
      {/* Category Thesis */}
      <CategoryThesis category={category} />

      {/* Timeline Controls */}
      <TimelineControls
        subcategory={categoryTitle}
        hidePastPeriods={hidePastPeriods}
        onToggleHidePast={() => setHidePastPeriods(!hidePastPeriods)}
        lastUpdateDate={formattedDate}
      />

      {/* Multi-Subcategory Progress Tracking */}
      <MultiSubcategoryProgressTracking
        category={category}
        visibleSubcategories={visibleSubcategories}
      />

      {/* Timeline Bubbles */}
      <TimelineBubbles
        periods={visiblePeriods}
        selectedPeriod={selectedPeriod}
        onPeriodSelect={setSelectedPeriod}
      />

      {/* Period Content */}
      {selectedPeriod && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {getPeriodTitle(selectedPeriod)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Weekly Planning - Only for quarters */}
            {selectedPeriod.type === 'quarter' && (
              <div className="space-y-4">
                {/* Toggle for past weeks */}
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-700">Weekly Planning by Subcategory</h4>
                  <button
                    onClick={() => setHidePastWeeks(!hidePastWeeks)}
                    className="text-sm px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    {hidePastWeeks ? 'Show past weeks' : 'Hide past weeks'}
                  </button>
                </div>
                <MultiSubcategoryWeeklyPlanning
                  category={category}
                  visibleSubcategories={visibleSubcategories}
                  year={selectedPeriod.year}
                  quarter={selectedPeriod.quarter!}
                  hidePastWeeks={hidePastWeeks}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default CategoryView;