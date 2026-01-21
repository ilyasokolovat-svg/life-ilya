import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, SkipForward, Square, Volume2, VolumeX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockGoalInput } from '@/components/focus/BlockGoalInput';
import { FocusTimerCircle } from '@/components/focus/FocusTimerCircle';
import { CompletedBlocksList } from '@/components/focus/CompletedBlocksList';
import { useFocusBlocks } from '@/hooks/useFocusBlocks';
import { toast } from 'sonner';

const DURATION_OPTIONS = [
  { label: '90 min', value: 90 * 60 },
  { label: '60 min', value: 60 * 60 },
  { label: '45 min', value: 45 * 60 },
  { label: '30 min', value: 30 * 60 },
];

const BREAK_DURATION = 10 * 60; // 10 minutes in seconds

type TimerState = 'idle' | 'working' | 'break';

export default function FocusTimer() {
  const { todayBlocks, startBlock, completeBlock, completedCount, totalFocusMinutes, isStarting } = useFocusBlocks();
  
  const [goal, setGoal] = useState('');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [workDuration, setWorkDuration] = useState(60 * 60); // Default 60 minutes
  const [timeRemaining, setTimeRemaining] = useState(workDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update timeRemaining when workDuration changes (only in idle state)
  useEffect(() => {
    if (timerState === 'idle') {
      setTimeRemaining(workDuration);
    }
  }, [workDuration, timerState]);

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Timer tick
  useEffect(() => {
    if (timerState !== 'idle' && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer finished
            if (timerState === 'working') {
              playSound();
              toast.success('Focus block complete! Time for a break.');
              if (currentBlockId) {
                completeBlock({ id: currentBlockId, completed: true });
              }
              setTimerState('break');
              return BREAK_DURATION;
            } else {
              playSound();
              toast.info('Break is over! Ready for another focus block?');
              setTimerState('idle');
              setCurrentBlockId(null);
              setGoal('');
              return workDuration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, isPaused, currentBlockId, completeBlock, playSound, workDuration]);

  // Start work block
  const handleStart = async () => {
    if (!goal.trim()) {
      toast.error('Please enter a focus goal first');
      return;
    }

    try {
      const block = await startBlock(goal.trim());
      setCurrentBlockId(block.id);
      setTimerState('working');
      setTimeRemaining(workDuration);
      setIsPaused(false);
      toast.success('Focus block started! Stay focused.');
    } catch (error) {
      toast.error('Failed to start block');
    }
  };

  // Pause/Resume
  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  // Skip break
  const handleSkipBreak = () => {
    setTimerState('idle');
    setTimeRemaining(workDuration);
    setGoal('');
    setCurrentBlockId(null);
  };

  // End early
  const handleEndEarly = () => {
    if (currentBlockId) {
      completeBlock({ id: currentBlockId, completed: false });
    }
    setTimerState('idle');
    setTimeRemaining(workDuration);
    setGoal('');
    setCurrentBlockId(null);
    toast.info('Block ended early');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Focus Mode
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-500"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-indigo-600">{completedCount}</span> blocks today
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Timer Section */}
          <div className="space-y-6">
            {/* Duration Selector - only show when idle */}
            {timerState === 'idle' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Focus Duration
                </label>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setWorkDuration(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        workDuration === option.value
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Goal Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {timerState === 'idle' ? 'What will you accomplish in this block?' : 'Current Focus'}
              </label>
              <BlockGoalInput
                value={goal}
                onChange={setGoal}
                disabled={timerState !== 'idle'}
              />
            </div>

            {/* Timer */}
            <div className="py-4">
              <FocusTimerCircle
                timeRemaining={timeRemaining}
                totalTime={timerState === 'break' ? BREAK_DURATION : workDuration}
                isBreak={timerState === 'break'}
                isPaused={isPaused}
              />
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              {timerState === 'idle' ? (
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={isStarting || !goal.trim()}
                  className="px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Focus Block
                </Button>
              ) : timerState === 'working' ? (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handlePauseResume}
                  >
                    {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleEndEarly}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    End Early
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handlePauseResume}
                  >
                    {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleSkipBreak}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Skip Break
                  </Button>
                </>
              )}
            </div>

            {/* Tips */}
            {timerState === 'idle' && (
              <div className="bg-indigo-50 rounded-lg p-4 text-sm text-indigo-700">
                <p className="font-medium mb-1">💡 Focus Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-indigo-600">
                  <li>Write a specific, achievable goal</li>
                  <li>Close unnecessary tabs and apps</li>
                  <li>Put your phone on silent</li>
                </ul>
              </div>
            )}
          </div>

          {/* Right: Completed Blocks */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Today's Progress</h2>
            <CompletedBlocksList 
              blocks={todayBlocks} 
              totalFocusMinutes={totalFocusMinutes} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
