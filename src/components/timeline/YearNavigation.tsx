import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plane, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface YearStats {
  year: number;
  daysCount: number;
  countriesCount: number;
  hasMilestones: boolean;
}

interface YearNavigationProps {
  years: YearStats[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
  currentYear: number;
}

export const YearNavigation: React.FC<YearNavigationProps> = ({
  years,
  selectedYear,
  onSelectYear,
  currentYear
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [years]);

  // Auto-scroll to selected year on mount
  useEffect(() => {
    if (scrollRef.current) {
      const selectedElement = scrollRef.current.querySelector(`[data-year="${selectedYear}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedYear]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getDaysPercentage = (days: number) => {
    return Math.round((days / 365) * 100);
  };

  return (
    <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
      {/* Left scroll button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('left')}
        className={cn(
          "shrink-0 h-10 w-10 rounded-full bg-amber-100/80 hover:bg-amber-200 border border-amber-300",
          !canScrollLeft && "opacity-30 cursor-not-allowed"
        )}
        disabled={!canScrollLeft}
      >
        <ChevronLeft className="h-5 w-5 text-amber-700" />
      </Button>

      {/* Scrollable year chips */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {years.map((yearData) => {
          const isSelected = yearData.year === selectedYear;
          const isCurrent = yearData.year === currentYear;
          const hasData = yearData.daysCount > 0 || yearData.hasMilestones;
          const percentage = getDaysPercentage(yearData.daysCount);

          return (
            <button
              key={yearData.year}
              data-year={yearData.year}
              onClick={() => onSelectYear(yearData.year)}
              className={cn(
                "shrink-0 flex flex-col items-center px-4 py-3 rounded-xl transition-all duration-300 min-w-[100px]",
                "border-2 shadow-sm hover:shadow-md",
                isSelected
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-500 text-white shadow-lg scale-105"
                  : hasData
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400"
                    : "bg-white/60 border-gray-200 hover:border-amber-300",
                isCurrent && !isSelected && "ring-2 ring-amber-400 ring-offset-1"
              )}
            >
              {/* Year */}
              <span className={cn(
                "text-lg font-bold",
                isSelected ? "text-white" : "text-amber-800"
              )}>
                {yearData.year}
              </span>
              
              {/* Stats row */}
              <div className="flex items-center gap-2 mt-1">
                {/* Days traveled */}
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  isSelected ? "text-white/90" : "text-amber-600"
                )}>
                  <Plane className="h-3 w-3" />
                  <span>{yearData.daysCount}d</span>
                  {yearData.daysCount > 0 && (
                    <span className={cn(
                      "text-[10px]",
                      isSelected ? "text-white/70" : "text-amber-500"
                    )}>
                      ({percentage}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Countries count */}
              <div className={cn(
                "flex items-center gap-1 text-xs mt-0.5",
                isSelected ? "text-white/90" : "text-teal-600"
              )}>
                <Globe className="h-3 w-3" />
                <span>{yearData.countriesCount} {yearData.countriesCount === 1 ? 'country' : 'countries'}</span>
              </div>

              {/* Current year indicator */}
              {isCurrent && (
                <span className={cn(
                  "text-[10px] font-medium mt-1 px-2 py-0.5 rounded-full",
                  isSelected ? "bg-white/20 text-white" : "bg-amber-200 text-amber-700"
                )}>
                  Now
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right scroll button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('right')}
        className={cn(
          "shrink-0 h-10 w-10 rounded-full bg-amber-100/80 hover:bg-amber-200 border border-amber-300",
          !canScrollRight && "opacity-30 cursor-not-allowed"
        )}
        disabled={!canScrollRight}
      >
        <ChevronRight className="h-5 w-5 text-amber-700" />
      </Button>
    </div>
  );
};
