
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface TimelineControlsProps {
  subcategory: string;
  hidePastPeriods: boolean;
  onToggleHidePast: () => void;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  subcategory,
  hidePastPeriods,
  onToggleHidePast
}) => {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">{subcategory} Timeline</h3>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleHidePast}
        className="flex items-center gap-2"
      >
        {hidePastPeriods ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        {hidePastPeriods ? 'Show Past' : 'Hide Past'}
      </Button>
    </div>
  );
};

export default TimelineControls;
