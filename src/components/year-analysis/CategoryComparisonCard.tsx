import { Card, CardContent } from "@/components/ui/card";
import { Star, Target, Trophy } from "lucide-react";

interface CategoryComparisonCardProps {
  name: string;
  icon: React.ElementType;
  gradient: string;
  yearStartGoal: string;
  achievements: string;
  rating: number;
}

const CategoryComparisonCard = ({ 
  name, 
  icon: Icon, 
  gradient, 
  yearStartGoal, 
  achievements, 
  rating 
}: CategoryComparisonCardProps) => {
  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{name}</h3>
            <div className="flex items-center gap-1">
              {[...Array(10)].map((_, i) => (
                <Star 
                  key={i}
                  className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} 
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Target className="w-3 h-3" />
              <span>Original Goal</span>
            </div>
            <p className="text-white/80 text-sm line-clamp-3">
              {yearStartGoal || <span className="text-white/40 italic">Not set</span>}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>What You Achieved</span>
            </div>
            <p className="text-white/80 text-sm line-clamp-3">
              {achievements || <span className="text-white/40 italic">Not recorded</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryComparisonCard;
