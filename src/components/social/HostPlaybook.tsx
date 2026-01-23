import React, { useState } from 'react';
import { Clock, FlaskConical, MessageCircle, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlaybookTips, PlaybookTip, PlaybookSection } from '@/hooks/usePlaybookTips';

const SECTION_CONFIG = {
  timeline: {
    icon: Clock,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    title: 'The Outreach Timeline',
    subtitle: 'When to reach out for each event type'
  },
  alchemy: {
    icon: FlaskConical,
    iconColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    title: 'The Social Alchemy Mix',
    subtitle: 'Curate the perfect guest list'
  },
  scripts: {
    icon: MessageCircle,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    title: "The 'Sober Superpower' Scripts",
    subtitle: 'Copy-paste invite templates'
  }
};

const COLOR_OPTIONS = ['amber', 'emerald', 'blue', 'pink', 'violet', 'red'];

const HostPlaybook: React.FC = () => {
  const { tips, loading, addTip, updateTip, deleteTip, getTipsBySection } = usePlaybookTips();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<PlaybookTip | null>(null);
  const [addingToSection, setAddingToSection] = useState<PlaybookSection | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState('amber');
  const [formTiming, setFormTiming] = useState('');
  const [formExamples, setFormExamples] = useState('');
  const [formNotice, setFormNotice] = useState('');

  const openAddDialog = (section: PlaybookSection) => {
    setEditingTip(null);
    setAddingToSection(section);
    resetForm();
    setEditDialogOpen(true);
  };

  const openEditDialog = (tip: PlaybookTip) => {
    setEditingTip(tip);
    setAddingToSection(null);
    setFormTitle(tip.title);
    setFormColor(tip.content.color || 'amber');
    
    if (tip.section === 'timeline') {
      setFormTiming(tip.content.timing || '');
      setFormExamples(tip.content.examples || '');
      setFormNotice(tip.content.notice || '');
    } else if (tip.section === 'scripts') {
      setFormContent(tip.content.script || '');
    } else {
      setFormContent(tip.content.text || tip.content.quote || '');
    }
    
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormColor('amber');
    setFormTiming('');
    setFormExamples('');
    setFormNotice('');
  };

  const handleSave = async () => {
    const section = editingTip?.section || addingToSection;
    if (!section || !formTitle.trim()) return;

    let content: Record<string, any> = { color: formColor };

    if (section === 'timeline') {
      content = { timing: formTiming, examples: formExamples, notice: formNotice, color: formColor };
    } else if (section === 'scripts') {
      content = { script: formContent, color: formColor };
    } else {
      content = { type: 'tip', text: formContent, color: formColor };
    }

    if (editingTip) {
      await updateTip(editingTip.id, { title: formTitle, content });
    } else {
      const sectionTips = getTipsBySection(section);
      await addTip({
        section,
        title: formTitle,
        content,
        order_index: sectionTips.length
      });
    }

    setEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (tipId: string) => {
    await deleteTip(tipId);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">The Host's Playbook</h2>
        </div>
        <div className="text-slate-500 text-sm">Loading playbook...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">The Host's Playbook</h2>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Strategic Reference</span>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {(Object.keys(SECTION_CONFIG) as PlaybookSection[]).map(section => {
          const config = SECTION_CONFIG[section];
          const Icon = config.icon;
          const sectionTips = getTipsBySection(section);

          return (
            <AccordionItem key={section} value={section} className="border-0">
              <AccordionTrigger className="bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 hover:no-underline hover:bg-slate-800/80 data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.iconColor}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-white">{config.title}</h3>
                    <p className="text-[10px] text-slate-500">{config.subtitle}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-slate-900/60 border border-t-0 border-slate-700 rounded-b-lg px-4 pb-4 pt-2">
                <div className="space-y-3">
                  {sectionTips.map(tip => (
                    <TipCard
                      key={tip.id}
                      tip={tip}
                      onEdit={() => openEditDialog(tip)}
                      onDelete={() => handleDelete(tip.id)}
                    />
                  ))}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAddDialog(section)}
                    className="w-full border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-slate-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tip
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTip ? 'Edit Tip' : `Add ${addingToSection ? SECTION_CONFIG[addingToSection].title.split(' ')[1] : ''} Tip`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Title</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Tip title..."
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {(editingTip?.section === 'timeline' || addingToSection === 'timeline') && (
              <>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Timing</label>
                  <Input
                    value={formTiming}
                    onChange={(e) => setFormTiming(e.target.value)}
                    placeholder="e.g., Sunday / Monday"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Examples</label>
                  <Input
                    value={formExamples}
                    onChange={(e) => setFormExamples(e.target.value)}
                    placeholder="e.g., Saturday Dinners, House Parties"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Notice Period</label>
                  <Input
                    value={formNotice}
                    onChange={(e) => setFormNotice(e.target.value)}
                    placeholder="e.g., 5-6 days' notice"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </>
            )}

            {(editingTip?.section === 'scripts' || addingToSection === 'scripts') && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Script</label>
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Your invite script..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                />
              </div>
            )}

            {(editingTip?.section === 'alchemy' || addingToSection === 'alchemy') && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Content</label>
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Your tip content..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Color Accent</label>
              <Select value={formColor} onValueChange={setFormColor}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {COLOR_OPTIONS.map(color => (
                    <SelectItem key={color} value={color} className="text-white">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full bg-${color}-500`} />
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
                {editingTip ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Tip Card Component
interface TipCardProps {
  tip: PlaybookTip;
  onEdit: () => void;
  onDelete: () => void;
}

const TipCard: React.FC<TipCardProps> = ({ tip, onEdit, onDelete }) => {
  const colorClass = `text-${tip.content.color || 'amber'}-400`;
  const borderColorClass = `border-${tip.content.color || 'amber'}-500/50`;

  if (tip.section === 'timeline') {
    return (
      <div className="flex items-start gap-3 group">
        <div className="w-1 h-full min-h-[40px] bg-slate-700 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${colorClass}`}>{tip.content.timing}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{tip.content.notice}</span>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <button onClick={onEdit} className="p-1 text-slate-500 hover:text-amber-400"><Edit2 className="w-3 h-3" /></button>
                <button onClick={onDelete} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
          <p className="text-sm text-white font-medium">{tip.title}</p>
          <p className="text-[11px] text-slate-500">{tip.content.examples}</p>
        </div>
      </div>
    );
  }

  if (tip.section === 'scripts') {
    return (
      <div className="space-y-1.5 group">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-medium uppercase tracking-wider ${colorClass}`}>{tip.title}</h4>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1 text-slate-500 hover:text-amber-400"><Edit2 className="w-3 h-3" /></button>
            <button onClick={onDelete} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
          </div>
        </div>
        <div className={`bg-slate-800/60 rounded px-3 py-2.5 border-l-2 ${borderColorClass}`}>
          <p className="text-xs text-slate-300 leading-relaxed italic">"{tip.content.script}"</p>
        </div>
      </div>
    );
  }

  // Alchemy section
  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between">
        <h4 className={`text-xs font-medium ${colorClass} uppercase tracking-wider`}>{tip.title}</h4>
        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 text-slate-500 hover:text-amber-400"><Edit2 className="w-3 h-3" /></button>
          <button onClick={onDelete} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
      {tip.content.quote ? (
        <div className={`bg-slate-800/60 rounded px-3 py-2 border-l-2 border-violet-500`}>
          <p className="text-xs text-slate-300 italic">"{tip.content.quote}"</p>
        </div>
      ) : (
        <p className="text-xs text-slate-400">{tip.content.text}</p>
      )}
    </div>
  );
};

export default HostPlaybook;