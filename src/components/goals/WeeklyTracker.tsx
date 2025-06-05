
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklyTrackerProps {
  subcategories: string[];
}

const WeeklyTracker: React.FC<WeeklyTrackerProps> = ({ subcategories }) => {
  return (
    <div className="space-y-8">
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-base text-gray-800">
            Weekly Tracking - Coming Soon
          </CardTitle>
          <p className="text-sm text-gray-600">Weekly tracking functionality will be rebuilt here</p>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500">
            <p>Weekly tracking functionality has been removed and will be rebuilt with improved timeline logic.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyTracker;
