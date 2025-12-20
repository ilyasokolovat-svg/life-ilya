import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface ProgressTrackerProps {
  totalFields: number;
  filledFields: number;
}

const ProgressTracker = ({ totalFields, filledFields }: ProgressTrackerProps) => {
  const percentage = Math.round((filledFields / totalFields) * 100);
  
  return (
    <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
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
  );
};

export default ProgressTracker;
