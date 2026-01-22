import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormData {
  name: string;
  instagram: string;
  circle: string;
  vibe_score: number;
  status: string;
  last_contacted: string;
  next_action: string;
  notes: string;
}

interface ContactFormFieldsProps {
  circles: string[];
  statuses: string[];
  onSubmit: (data: FormData) => Promise<void>;
  submitLabel: string;
  initialData?: FormData;
}

const ContactFormFields: React.FC<ContactFormFieldsProps> = ({
  circles,
  statuses,
  onSubmit,
  submitLabel,
  initialData,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    instagram: '',
    circle: circles[0] || 'Other',
    vibe_score: 3,
    status: statuses[0] || 'Lead',
    last_contacted: '',
    next_action: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      if (!initialData) {
        // Reset form only for new contacts
        setFormData({
          name: '',
          instagram: '',
          circle: circles[0] || 'Other',
          vibe_score: 3,
          status: statuses[0] || 'Lead',
          last_contacted: '',
          next_action: '',
          notes: '',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="bg-slate-900 border-slate-600 text-white"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Instagram</label>
          <Input
            value={formData.instagram}
            onChange={(e) => updateField('instagram', e.target.value)}
            className="bg-slate-900 border-slate-600 text-white"
            placeholder="@username"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Circle</label>
          <Select value={formData.circle} onValueChange={(v) => updateField('circle', v)}>
            <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600 z-50">
              {circles.map(c => (
                <SelectItem key={c} value={c} className="text-white hover:bg-slate-700 focus:bg-slate-700">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Status</label>
          <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
            <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600 z-50">
              {statuses.map(s => (
                <SelectItem key={s} value={s} className="text-white hover:bg-slate-700 focus:bg-slate-700">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-2 block">Vibe Score</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              type="button"
              onClick={() => updateField('vibe_score', score)}
              className="focus:outline-none"
            >
              <Star 
                className={`w-6 h-6 ${score <= formData.vibe_score ? 'fill-amber-500 text-amber-500' : 'text-slate-600'}`} 
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Last Contacted</label>
        <Input
          type="date"
          value={formData.last_contacted}
          onChange={(e) => updateField('last_contacted', e.target.value)}
          className="bg-slate-900 border-slate-600 text-white"
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Next Action</label>
        <Input
          value={formData.next_action}
          onChange={(e) => updateField('next_action', e.target.value)}
          className="bg-slate-900 border-slate-600 text-white"
          placeholder="Invite to Wednesday Walk"
        />
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        disabled={!formData.name || isSubmitting}
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </div>
  );
};

export default ContactFormFields;