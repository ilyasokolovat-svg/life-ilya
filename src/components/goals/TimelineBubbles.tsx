
import React from "react";
import { Button } from "@/components/ui/button";

interface TimelinePeriod {
  id: string;
  label: string;
  type: 'quarter' | 'year';
  year: number;
  quarter?: number;
  isPast: boolean;
}

interface TimelineBubblesProps {
  periods: TimelinePeriod[];
  selectedPeriod: TimelinePeriod | null;
  onPeriodSelect: (period: TimelinePeriod) => void;
}

const TimelineBubbles: React.FC<TimelineBubblesProps> = ({
  periods,
  selectedPeriod,
  onPeriodSelect
}) => {
  return (
    <div className="flex flex-wrap gap-3">
      {periods.map((period) => (
        <Button
          key={period.id}
          variant={selectedPeriod?.id === period.id ? "default" : "outline"}
          className={`rounded-full px-6 py-2 transition-all duration-300 ${
            period.isPast ? 'opacity-60' : ''
          } ${
            selectedPeriod?.id === period.id 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg scale-105' 
              : 'hover:shadow-md hover:scale-102'
          }`}
          onClick={() => onPeriodSelect(period)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};

export default TimelineBubbles;
