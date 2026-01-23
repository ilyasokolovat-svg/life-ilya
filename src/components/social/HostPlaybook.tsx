import React from 'react';
import { Clock, FlaskConical, MessageCircle, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const HostPlaybook: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">The Host's Playbook</h2>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Strategic Reference</span>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* Card 1: The Outreach Timeline */}
        <AccordionItem value="timeline" className="border-0">
          <AccordionTrigger className="bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 hover:no-underline hover:bg-slate-800/80 data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-white">The Outreach Timeline</h3>
                <p className="text-[10px] text-slate-500">When to reach out for each event type</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-slate-900/60 border border-t-0 border-slate-700 rounded-b-lg px-4 pb-4 pt-2">
            <div className="space-y-3">
              <TimelineItem
                timing="Sunday / Monday"
                label="The Elevated Closer"
                examples="Saturday Dinners, House Parties"
                notice="5-6 days' notice"
                color="text-amber-400"
              />
              <TimelineItem
                timing="Tuesday / Wednesday"
                label="The Active Connector"
                examples="Padel, Golf, Gym Sessions"
                notice="2-3 days' notice"
                color="text-emerald-400"
              />
              <TimelineItem
                timing="1 Day Before"
                label="The Low-Stakes Lead"
                examples="Coffee, Walks, Sunset Sessions"
                notice="Keep it spontaneous"
                color="text-blue-400"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Card 2: The Social Alchemy Mix */}
        <AccordionItem value="alchemy" className="border-0">
          <AccordionTrigger className="bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 hover:no-underline hover:bg-slate-800/80 data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-white">The Social Alchemy Mix</h3>
                <p className="text-[10px] text-slate-500">Curate the perfect guest list</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-slate-900/60 border border-t-0 border-slate-700 rounded-b-lg px-4 pb-4 pt-2">
            <div className="space-y-4">
              {/* 4-2-2 Rule */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-violet-400 uppercase tracking-wider">The 4-2-2 Rule</h4>
                <div className="grid grid-cols-3 gap-2">
                  <RuleCard number="4" label="Core Friends" desc="Reliability" />
                  <RuleCard number="2" label="New Flavors" desc="Different circles" />
                  <RuleCard number="2" label="Wildcards" desc="High-status / Romantic" />
                </div>
              </div>

              {/* Producer Mindset */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-medium text-violet-400 uppercase tracking-wider">The Producer Mindset</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Never just <span className="text-slate-500 line-through">invite</span> people — <span className="text-amber-400 font-medium">curate</span> them.
                </p>
                <div className="bg-slate-800/60 rounded px-3 py-2 border-l-2 border-violet-500">
                  <p className="text-xs text-slate-300 italic">
                    "I'm bringing together a few people who are doing <span className="text-amber-400">[X]</span>."
                  </p>
                </div>
              </div>

              {/* Seat Swap */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-medium text-violet-400 uppercase tracking-wider">The Seat Swap</h4>
                <p className="text-xs text-slate-400">
                  During dinners, <span className="text-white font-medium">move seats before dessert</span> to keep the energy fresh and talk to everyone.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Card 3: The Sober Superpower Scripts */}
        <AccordionItem value="scripts" className="border-0">
          <AccordionTrigger className="bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 hover:no-underline hover:bg-slate-800/80 data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-white">The 'Sober Superpower' Scripts</h3>
                <p className="text-[10px] text-slate-500">Copy-paste invite templates</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-slate-900/60 border border-t-0 border-slate-700 rounded-b-lg px-4 pb-4 pt-2">
            <div className="space-y-4">
              <ScriptCard
                label="For the High-Value Acquaintance"
                script="I'm putting together a small dinner on Saturday with a few high-energy people from [YP/Cape Town]. Would love to have you in the mix."
                labelColor="text-amber-400"
              />
              <ScriptCard
                label="For the Romantic Lead"
                script="I'm heading to [Venue] with a few friends on Saturday. You should join us for a bit."
                labelColor="text-pink-400"
              />
              <ScriptCard
                label="The Detox Frame"
                script="I'm on a health kick/sober stint right now—looking forward to actually remembering our conversations for once!"
                labelColor="text-emerald-400"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

// Sub-components for clean structure

interface TimelineItemProps {
  timing: string;
  label: string;
  examples: string;
  notice: string;
  color: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ timing, label, examples, notice, color }) => (
  <div className="flex items-start gap-3">
    <div className="w-1 h-full min-h-[40px] bg-slate-700 rounded-full" />
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${color}`}>{timing}</span>
        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{notice}</span>
      </div>
      <p className="text-sm text-white font-medium">{label}</p>
      <p className="text-[11px] text-slate-500">{examples}</p>
    </div>
  </div>
);

interface RuleCardProps {
  number: string;
  label: string;
  desc: string;
}

const RuleCard: React.FC<RuleCardProps> = ({ number, label, desc }) => (
  <div className="bg-slate-800/60 rounded-lg p-2.5 text-center border border-slate-700/50">
    <div className="text-2xl font-bold text-amber-400">{number}</div>
    <div className="text-[11px] font-medium text-white">{label}</div>
    <div className="text-[9px] text-slate-500">{desc}</div>
  </div>
);

interface ScriptCardProps {
  label: string;
  script: string;
  labelColor: string;
}

const ScriptCard: React.FC<ScriptCardProps> = ({ label, script, labelColor }) => (
  <div className="space-y-1.5">
    <h4 className={`text-xs font-medium uppercase tracking-wider ${labelColor}`}>{label}</h4>
    <div className="bg-slate-800/60 rounded px-3 py-2.5 border-l-2 border-emerald-500/50">
      <p className="text-xs text-slate-300 leading-relaxed italic">"{script}"</p>
    </div>
  </div>
);

export default HostPlaybook;