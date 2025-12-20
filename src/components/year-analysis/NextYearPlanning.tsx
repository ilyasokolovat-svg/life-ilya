import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface NextYearGoal {
  name: string;
  icon: React.ElementType;
  gradient: string;
  goal: string;
}

interface NextYearPlanningProps {
  goals: NextYearGoal[];
}

const NextYearPlanning = ({ goals }: NextYearPlanningProps) => {
  const goalsWithContent = goals.filter(g => g.goal);

  const handleCopyToGoals = () => {
    // For now, just show a success toast - could integrate with Goals page
    toast.success("Goals ready! Navigate to Goals to start planning your year.");
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Next Year Goals
          </CardTitle>
          {goalsWithContent.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopyToGoals}
              className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
            >
              Start Planning
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {goalsWithContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalsWithContent.map((goal, i) => {
              const Icon = goal.icon;
              return (
                <div 
                  key={i}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${goal.gradient} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-medium">{goal.name}</span>
                  </div>
                  <p className="text-white/70 text-sm">{goal.goal}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">
              Fill out "Plan Ahead" for each category to see your goals here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NextYearPlanning;
