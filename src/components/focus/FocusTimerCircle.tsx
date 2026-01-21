import React from 'react';
import { cn } from '@/lib/utils';

interface FocusTimerCircleProps {
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
  isBreak: boolean;
  isPaused: boolean;
}

export function FocusTimerCircle({ timeRemaining, totalTime, isBreak, isPaused }: FocusTimerCircleProps) {
  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference * (1 - progress);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Background circle */}
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="144"
          cy="144"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx="144"
          cy="144"
          r="120"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {isBreak ? (
              <>
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#14B8A6" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </>
            )}
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          "text-5xl font-mono font-bold",
          isPaused && "opacity-50"
        )}>
          {timeDisplay}
        </span>
        <span className={cn(
          "text-sm font-medium mt-2 px-3 py-1 rounded-full",
          isBreak 
            ? "bg-emerald-100 text-emerald-700" 
            : "bg-indigo-100 text-indigo-700"
        )}>
          {isBreak ? 'Break Time' : 'Focus Time'}
        </span>
        {isPaused && (
          <span className="text-xs text-gray-400 mt-2">Paused</span>
        )}
      </div>
    </div>
  );
}
