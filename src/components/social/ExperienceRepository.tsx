import React, { useState } from 'react';
import { Plus, MapPin, Users, DollarSign, Calendar, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SocialExperience, WeeklySocialPlan, TIERS } from '@/types/social';

interface ExperienceRepositoryProps {
  experiences: SocialExperience[];
  weeklyPlans: WeeklySocialPlan[];
  onAdd: (experience: Omit<SocialExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<SocialExperience>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelectForWeek: (dayOfWeek: number, experienceId: string, guestIds: string[]) => Promise<void>;
}

const ExperienceRepository: React.FC<ExperienceRepositoryProps> = ({
  experiences,
  weeklyPlans,
  onAdd,
  onUpdate,
  onDelete,
  onSelectForWeek,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<SocialExperience | null>(null);
  const [selectingDay, setSelectingDay] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    tier: 'Low' as SocialExperience['tier'],
    estimated_cost: 0,
    ideal_group_size: '',
    description: '',
    location: '',
    is_default: false,
  });

  const groupedByTier = {
    Low: experiences.filter(e => e.tier === 'Low'),
    Mid: experiences.filter(e => e.tier === 'Mid'),
    High: experiences.filter(e => e.tier === 'High'),
  };

  const tierColors = {
    Low: { bg: 'bg-slate-900', border: 'border-slate-700', badge: 'bg-slate-600', text: 'text-slate-200' },
    Mid: { bg: 'bg-slate-900', border: 'border-blue-700/50', badge: 'bg-blue-700', text: 'text-slate-200' },
    High: { bg: 'bg-slate-900', border: 'border-amber-700/50', badge: 'bg-amber-700', text: 'text-slate-200' },
  };

  const tierLabels = {
    Low: 'Low Cost / High Frequency',
    Mid: 'Mid-Range / Active',
    High: 'Elevated / Producer Level',
  };

  const dayOptions = [
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
    { value: '7', label: 'Sunday' },
  ];

  const resetForm = () => {
    setFormData({
      title: '',
      tier: 'Low',
      estimated_cost: 0,
      ideal_group_size: '',
      description: '',
      location: '',
      is_default: false,
    });
  };

  const handleAdd = async () => {
    await onAdd({
      ...formData,
      ideal_group_size: formData.ideal_group_size || null,
      description: formData.description || null,
      location: formData.location || null,
    });
    resetForm();
    setIsAddOpen(false);
  };

  const handleEdit = (exp: SocialExperience) => {
    setEditingExp(exp);
    setFormData({
      title: exp.title,
      tier: exp.tier,
      estimated_cost: exp.estimated_cost,
      ideal_group_size: exp.ideal_group_size || '',
      description: exp.description || '',
      location: exp.location || '',
      is_default: exp.is_default,
    });
  };

  const handleUpdate = async () => {
    if (!editingExp) return;
    await onUpdate(editingExp.id, {
      ...formData,
      ideal_group_size: formData.ideal_group_size || null,
      description: formData.description || null,
      location: formData.location || null,
    });
    setEditingExp(null);
    resetForm();
  };

  const handleSelectForWeek = async (experienceId: string, day: string) => {
    await onSelectForWeek(parseInt(day), experienceId, []);
    setSelectingDay(null);
  };

  const ExperienceForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="bg-[#1a1a1a] border-slate-700 text-white"
          placeholder="Beach Sunset Walk"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Tier</label>
          <Select value={formData.tier} onValueChange={(v) => setFormData(prev => ({ ...prev, tier: v as SocialExperience['tier'] }))}>
            <SelectTrigger className="bg-[#1a1a1a] border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-slate-700">
              {TIERS.map(t => (
                <SelectItem key={t} value={t} className="text-white hover:bg-slate-800">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Estimated Cost (AED)</label>
          <Input
            type="number"
            value={formData.estimated_cost}
            onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: parseInt(e.target.value) || 0 }))}
            className="bg-[#1a1a1a] border-slate-700 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Location</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="bg-[#1a1a1a] border-slate-700 text-white"
            placeholder="Kite Beach"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Ideal Group Size</label>
          <Input
            value={formData.ideal_group_size}
            onChange={(e) => setFormData(prev => ({ ...prev, ideal_group_size: e.target.value }))}
            className="bg-[#1a1a1a] border-slate-700 text-white"
            placeholder="2-4"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="bg-[#1a1a1a] border-slate-700 text-white"
          placeholder="Great for first meets..."
        />
      </div>

      <Button 
        onClick={isEdit ? handleUpdate : handleAdd} 
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        disabled={!formData.title}
      >
        {isEdit ? 'Update Experience' : 'Add Experience'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Experience Repository</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f0f0f] border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-amber-500">Add New Experience</DialogTitle>
            </DialogHeader>
            <ExperienceForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tiers */}
      {(Object.keys(groupedByTier) as Array<keyof typeof groupedByTier>).map(tier => (
        <div key={tier}>
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-2 py-0.5 rounded text-xs text-white ${tierColors[tier].badge}`}>
              {tier}
            </span>
            <h3 className="text-sm text-slate-400 uppercase tracking-wider">
              {tierLabels[tier]}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedByTier[tier].map(exp => (
              <Card
                key={exp.id}
                className={`${tierColors[tier].bg} border ${tierColors[tier].border} p-4 hover:border-amber-500/50 transition-colors`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white">{exp.title}</h4>
                  <div className="flex gap-1">
                    <Dialog open={editingExp?.id === exp.id} onOpenChange={(open) => !open && setEditingExp(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-amber-500"
                          onClick={() => handleEdit(exp)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0f0f0f] border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-amber-500">Edit Experience</DialogTitle>
                        </DialogHeader>
                        <ExperienceForm isEdit />
                      </DialogContent>
                    </Dialog>
                    {!exp.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-500"
                        onClick={() => onDelete(exp.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {exp.description && (
                  <p className="text-sm text-slate-400 mb-3">{exp.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    AED {exp.estimated_cost}
                  </span>
                  {exp.ideal_group_size && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {exp.ideal_group_size}
                    </span>
                  )}
                  {exp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {exp.location}
                    </span>
                  )}
                </div>

                <Dialog open={selectingDay === exp.id} onOpenChange={(open) => !open && setSelectingDay(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-amber-600 text-amber-400 hover:bg-amber-600/20 hover:text-amber-300"
                      onClick={() => setSelectingDay(exp.id)}
                    >
                      <Calendar className="w-3 h-3 mr-2" />
                      Select for This Week
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0a0a0a] border-slate-600 text-white max-w-xs">
                    <DialogHeader>
                      <DialogTitle className="text-amber-400">Choose Day</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-2">
                      {dayOptions.map(day => (
                        <Button
                          key={day.value}
                          className="bg-slate-800 border border-slate-600 text-white hover:bg-amber-700 hover:border-amber-600"
                          onClick={() => handleSelectForWeek(exp.id, day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExperienceRepository;
