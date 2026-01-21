import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { FocusBlock } from '@/hooks/useFocusBlocks';

interface CompletedBlocksListProps {
  blocks: FocusBlock[];
  totalFocusMinutes: number;
}

export function CompletedBlocksList({ blocks, totalFocusMinutes }: CompletedBlocksListProps) {
  const completedBlocks = blocks.filter(b => b.ended_at);

  if (completedBlocks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No completed blocks yet today</p>
        <p className="text-sm">Start your first focus block!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <span className="text-sm text-gray-600">Today's Focus Time</span>
        <span className="font-bold text-indigo-600">
          {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
        </span>
      </div>

      {/* Blocks list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {completedBlocks.map((block, index) => (
          <div
            key={block.id}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100"
          >
            {block.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 line-clamp-2">{block.goal}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span>{format(new Date(block.started_at), 'HH:mm')}</span>
                <span>•</span>
                <span>{block.duration_minutes || 0} min</span>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
