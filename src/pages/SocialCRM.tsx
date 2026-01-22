import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocialCRM } from '@/hooks/useSocialCRM';
import PeopleCRM from '@/components/social/PeopleCRM';
import ExperienceRepository from '@/components/social/ExperienceRepository';
import WeeklyPlanner from '@/components/social/WeeklyPlanner';
import SundayResetDashboard from '@/components/social/SundayResetDashboard';

const SocialCRM = () => {
  const [activeTab, setActiveTab] = useState('people');
  const crm = useSocialCRM();

  if (crm.loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading Social Architect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] border-b border-amber-500/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-amber-500 hover:bg-amber-500/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                  Social Architect
                </h1>
                <p className="text-sm text-slate-500">Dubai Personal Life Management</p>
              </div>
            </div>

            {/* Stats bar */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{crm.contacts.length}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Network</div>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">
                  {crm.contacts.filter(c => c.status === 'Inner Circle').length}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Inner Circle</div>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {crm.outreachTasks.filter(t => t.completed).length}/15
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Outreach</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#1a1a1a] border border-slate-800 p-1">
            <TabsTrigger 
              value="people" 
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500 text-slate-400"
            >
              <Users className="w-4 h-4 mr-2" />
              People CRM
            </TabsTrigger>
            <TabsTrigger 
              value="experiences" 
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500 text-slate-400"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Experiences
            </TabsTrigger>
            <TabsTrigger 
              value="weekly" 
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500 text-slate-400"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Weekly Planner
            </TabsTrigger>
            <TabsTrigger 
              value="sunday" 
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500 text-slate-400"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sunday Reset
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-4">
            <PeopleCRM 
              contacts={crm.contacts}
              onAdd={crm.addContact}
              onUpdate={crm.updateContact}
              onDelete={crm.deleteContact}
            />
          </TabsContent>

          <TabsContent value="experiences" className="space-y-4">
            <ExperienceRepository
              experiences={crm.experiences}
              weeklyPlans={crm.weeklyPlans}
              onAdd={crm.addExperience}
              onUpdate={crm.updateExperience}
              onDelete={crm.deleteExperience}
              onSelectForWeek={crm.addOrUpdateWeeklyPlan}
            />
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <WeeklyPlanner
              weeklyPlans={crm.weeklyPlans}
              experiences={crm.experiences}
              contacts={crm.contacts}
              onUpdatePlan={crm.addOrUpdateWeeklyPlan}
              onRemovePlan={crm.removeWeeklyPlan}
            />
          </TabsContent>

          <TabsContent value="sunday" className="space-y-4">
            <SundayResetDashboard
              outreachTasks={crm.outreachTasks}
              contacts={crm.contacts}
              onGenerateTasks={crm.generateOutreachTasks}
              onToggleTask={crm.toggleOutreachTask}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SocialCRM;
