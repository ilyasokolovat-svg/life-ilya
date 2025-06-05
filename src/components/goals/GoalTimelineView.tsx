
import React from "react";
import SubcategoryTimeline from "./SubcategoryTimeline";

interface GoalTimelineViewProps {
  category: string;
  subcategory: string;
}

const GoalTimelineView: React.FC<GoalTimelineViewProps> = ({ category, subcategory }) => {
  return (
    <div className="space-y-6">
      <SubcategoryTimeline category={category} subcategory={subcategory} />
    </div>
  );
};

export default GoalTimelineView;
