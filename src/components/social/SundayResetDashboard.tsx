import React from 'react';
import { RefreshCw, Heart, UserPlus, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { SocialContact, SundayOutreachTask } from '@/types/social';

interface SundayResetDashboardProps {
  outreachTasks: SundayOutreachTask[];
  contacts: SocialContact[];
  onGenerateTasks: () => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
}

const SundayResetDashboard: React.FC<SundayResetDashboardProps> = ({
  outreachTasks,
  contacts,
  onGenerateTasks,
  onToggleTask,
}) => {
  const getContactById = (id: string | null) => {
    if (!id) return null;
    return contacts.find(c => c.id === id);
  };

  const innerCircleTasks = outreachTasks.filter(t => t.outreach_type === 'Inner Circle');
  const leadsTasks = outreachTasks.filter(t => t.outreach_type === 'New Leads');
  const romanticTasks = outreachTasks.filter(t => t.outreach_type === 'Romantic');

  const completedCount = outreachTasks.filter(t => t.completed).length;
  const totalTasks = outreachTasks.length || 15;
  const progress = (completedCount / totalTasks) * 100;

  const taskGroups = [
    {
      type: 'Inner Circle',
      icon: Star,
      color: 'amber',
      tasks: innerCircleTasks,
      description: 'Maintain your closest connections',
    },
    {
      type: 'New Leads',
      icon: UserPlus,
      color: 'blue',
      tasks: leadsTasks,
      description: 'Warm up new acquaintances',
    },
    {
      type: 'Romantic',
      icon: Heart,
      color: 'pink',
      tasks: romanticTasks,
      description: 'Nurture romantic interests',
    },
  ];

  const colorClasses = {
    amber: {
      bg: 'bg-amber-900/20',
      border: 'border-amber-600/30',
      icon: 'text-amber-500',
      badge: 'bg-amber-600',
    },
    blue: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-600/30',
      icon: 'text-blue-500',
      badge: 'bg-blue-600',
    },
    pink: {
      bg: 'bg-pink-900/20',
      border: 'border-pink-600/30',
      icon: 'text-pink-500',
      badge: 'bg-pink-600',
    },
  };

  // Check if tasks need to be generated or if no contacts match
  const hasContacts = contacts.length > 0;
  const noTasksGenerated = outreachTasks.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Sunday Reset</h2>
          <p className="text-sm text-slate-500">15 outreaches to maintain your network</p>
        </div>
        <Button
          onClick={onGenerateTasks}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate This Week's Tasks
        </Button>
      </div>

      {/* Info Box */}
      {noTasksGenerated && (
        <Card className="bg-blue-900/20 border-blue-600/30 p-4">
          <p className="text-sm text-blue-300">
            <strong>How it works:</strong> Click "Generate This Week's Tasks" to create 15 outreach slots. 
            The system will automatically assign contacts from your CRM based on their status:
          </p>
          <ul className="text-sm text-blue-200 mt-2 list-disc pl-5 space-y-1">
            <li><strong>Inner Circle (5 slots):</strong> Contacts with status "Inner Circle"</li>
            <li><strong>New Leads (5 slots):</strong> Contacts with status "Lead"</li>
            <li><strong>Romantic (5 slots):</strong> Contacts in the "Romantic" circle</li>
          </ul>
          {!hasContacts && (
            <p className="text-sm text-amber-400 mt-3">
              ⚠️ You have no contacts yet. Add some in the People CRM tab first!
            </p>
          )}
        </Card>
      )}

      {/* Progress Bar */}
      <Card className="bg-slate-900 border-slate-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Weekly Outreach Progress</span>
          <span className="text-lg font-bold text-amber-500">{completedCount}/{totalTasks}</span>
        </div>
        <Progress 
          value={progress} 
          className="h-3 bg-slate-800"
        />
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
        </div>
      </Card>

      {/* Task Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {taskGroups.map(group => {
          const colors = colorClasses[group.color as keyof typeof colorClasses];
          const completedInGroup = group.tasks.filter(t => t.completed).length;
          const Icon = group.icon;

          return (
            <Card
              key={group.type}
              className={`bg-slate-900 border ${colors.border} p-4`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-black/30`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{group.type}</h3>
                  <p className="text-xs text-slate-400">{group.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs text-white ${colors.badge}`}>
                  {completedInGroup}/5
                </span>
              </div>

              <div className="space-y-2">
                {group.tasks.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    Generate tasks to see your outreach list
                  </div>
                ) : (
                  group.tasks.map((task, idx) => {
                    const contact = getContactById(task.contact_id);
                    return (
                      <label
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          task.completed 
                            ? 'bg-emerald-900/30 border border-emerald-700/50' 
                            : 'bg-slate-800/50 hover:bg-slate-800'
                        }`}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => onToggleTask(task.id, !!checked)}
                          className="border-slate-500"
                        />
                        <div className="flex-1 min-w-0">
                          {contact ? (
                            <>
                              <div className={`text-sm font-medium ${task.completed ? 'text-emerald-400 line-through' : 'text-white'}`}>
                                {contact.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {contact.instagram || contact.circle}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-slate-500 italic">
                              Empty slot - add more {group.type.toLowerCase()} contacts
                            </div>
                          )}
                        </div>
                        {task.completed && (
                          <Check className="w-4 h-4 text-emerald-500" />
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tips */}
      <Card className="bg-slate-900 border-slate-700 p-4">
        <h3 className="font-semibold text-amber-400 mb-2">💡 Outreach Tips</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• <strong className="text-slate-300">Inner Circle:</strong> Send a voice note, share something personal, or make plans</li>
          <li>• <strong className="text-slate-300">New Leads:</strong> React to their stories, comment on posts, or send a casual "thinking of you"</li>
          <li>• <strong className="text-slate-300">Romantic:</strong> Be intentional - suggest a specific day and activity</li>
        </ul>
      </Card>
    </div>
  );
};

export default SundayResetDashboard;
