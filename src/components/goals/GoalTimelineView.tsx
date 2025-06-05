
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GoalTimelineViewProps {
  category: string;
  subcategory: string;
}

const GoalTimelineView: React.FC<GoalTimelineViewProps> = ({ category, subcategory }) => {
  return (
    <div className="space-y-6">
      <Card className="border-2 border-gradient-to-r from-blue-500 to-purple-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-800">
            {subcategory} - Timeline View
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-8 text-center text-gray-500">
            <p>Goal timeline functionality has been removed and will be rebuilt with improved timeline logic.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoalTimelineView;
