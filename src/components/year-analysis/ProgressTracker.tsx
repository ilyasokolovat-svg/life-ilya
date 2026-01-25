import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Calendar } from "lucide-react";

interface ProgressTrackerProps {
  totalFields: number;
  filledFields: number;
  monthsReviewed?: number;
}

const ProgressTracker = ({ totalFields, filledFields, monthsReviewed = 0 }: ProgressTrackerProps) => {
  const percentage = Math.round((filledFields / totalFields) * 100);
  
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
      <div className="flex items-center gap-4 flex-1">
        <CheckCircle2 className={`w-5 h-5 ${percentage === 100 ? 'text-emerald-400' : 'text-white/40'}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/70 text-sm">Review Progress</span>
            <span className="text-white/90 text-sm font-medium">{percentage}%</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2 bg-white/10"
          />
        </div>
        <span className="text-white/50 text-xs">
          {filledFields}/{totalFields} fields
        </span>
      </div>
      
      {/* Monthly Reviews Indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
        <Calendar className={`w-4 h-4 ${monthsReviewed >= 6 ? 'text-amber-400' : 'text-white/40'}`} />
        <span className="text-white/70 text-xs">
          <span className={`font-medium ${monthsReviewed > 0 ? 'text-white' : 'text-white/50'}`}>
            {monthsReviewed}
          </span>
          /12 months
        </span>
      </div>
    </div>
  );
};

export default ProgressTracker;
