
import React from "react";
import { Button } from "@/components/ui/button";
import { EyeOff, Eye } from "lucide-react";

interface TimelineControlsProps {
  subcategory: string;
  hidePastPeriods: boolean;
  onToggleHidePast: () => void;
  lastUpdateDate?: string | null;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  subcategory,
  hidePastPeriods,
  onToggleHidePast,
  lastUpdateDate
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          {subcategory} Timeline
        </h2>
        {lastUpdateDate && (
          <p className="text-sm text-gray-500 italic">
            List updated {lastUpdateDate}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleHidePast}
        className="flex items-center gap-2"
      >
        {hidePastPeriods ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        {hidePastPeriods ? "Show Past" : "Hide Past"}
      </Button>
    </div>
  );
};

export default TimelineControls;
