import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Lock } from 'lucide-react';

interface BlockGoalInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function BlockGoalInput({ value, onChange, disabled, placeholder }: BlockGoalInputProps) {
  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || "What's your ONE focus for this block?"}
        className={`
          text-lg p-4 min-h-[100px] resize-none
          border-2 transition-all duration-300
          ${disabled 
            ? 'bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed' 
            : 'bg-white border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
          }
        `}
        maxLength={150}
      />
      {disabled && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-gray-400 text-xs">
          <Lock className="w-3 h-3" />
          <span>Locked</span>
        </div>
      )}
      <div className="absolute bottom-2 right-3 text-xs text-gray-400">
        {value.length}/150
      </div>
    </div>
  );
}
