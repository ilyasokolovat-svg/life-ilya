import React, { useState } from 'react';
import { Plus, Instagram, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuickAddBarProps {
  onAdd: (data: {
    name: string;
    instagram: string;
    interesting_note: string;
  }) => Promise<void>;
}

const QuickAddBar: React.FC<QuickAddBarProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [note, setNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsAdding(true);
    try {
      await onAdd({
        name: name.trim(),
        instagram: instagram.trim(),
        interesting_note: note.trim(),
      });
      setName('');
      setInstagram('');
      setNote('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className="w-4 h-4 text-slate-500 shrink-0" />
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-none text-white placeholder:text-slate-600 h-8 px-0 focus-visible:ring-0"
          />
        </div>
        
        <div className="w-px h-6 bg-slate-700" />
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Instagram className="w-4 h-4 text-slate-500 shrink-0" />
          <Input
            placeholder="@instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="bg-transparent border-none text-white placeholder:text-slate-600 h-8 px-0 focus-visible:ring-0"
          />
        </div>
        
        <div className="w-px h-6 bg-slate-700" />
        
        <div className="flex items-center gap-2 flex-[2] min-w-0">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
          <Input
            placeholder="Where we met / Something interesting..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-transparent border-none text-white placeholder:text-slate-600 h-8 px-0 focus-visible:ring-0"
          />
        </div>
        
        <Button
          type="submit"
          disabled={!name.trim() || isAdding}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
    </form>
  );
};

export default QuickAddBar;
