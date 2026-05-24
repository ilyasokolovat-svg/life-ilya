import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData } from '@/wealth/types';

const sb = supabase as any;

export const BucketsDialog: React.FC<{ d: WealthData; open: boolean; onClose: () => void; onSaved: () => void }> = ({ d, open, onClose, onSaved }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setItems([...d.investmentBuckets].sort((a, b) => a.sort_order - b.sort_order));
  }, [open, d.investmentBuckets]);

  const add = async () => {
    if (!user) return;
    const { data } = await sb.from('investment_buckets').insert({
      user_id: user.id, label: 'New bucket', description: '', color: '#534AB7', sort_order: items.length,
    }).select().single();
    if (data) setItems([...items, data]);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this bucket and all its snapshots?')) return;
    await sb.from('investment_snapshots').delete().eq('bucket_id', id);
    await sb.from('investment_buckets').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  const update = (id: string, patch: any) =>
    setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));

  const save = async () => {
    setSaving(true);
    for (const i of items) {
      await sb.from('investment_buckets').update({
        label: i.label, description: i.description, color: i.color, sort_order: i.sort_order,
      }).eq('id', i.id);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>Edit investment buckets</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-[55vh] overflow-y-auto py-2">
          {items.map(b => (
            <div key={b.id} className="grid grid-cols-12 gap-2 items-center p-2 border border-border rounded-lg">
              <Input className="col-span-4" value={b.label} onChange={e => update(b.id, { label: e.target.value })} />
              <Input className="col-span-5" value={b.description || ''} placeholder="Description" onChange={e => update(b.id, { description: e.target.value })} />
              <input type="color" className="col-span-2 h-9 w-full rounded border border-border bg-background" value={b.color} onChange={e => update(b.id, { color: e.target.value })} />
              <Button variant="ghost" size="icon" className="col-span-1 text-destructive" onClick={() => remove(b.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={add} className="mr-auto">
            <Plus className="w-4 h-4 mr-1" /> Add bucket
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Manage all goals (list + edit individually).
export const GoalsManageDialog: React.FC<{
  d: WealthData; open: boolean; onClose: () => void;
  onSelectGoal: (g: any | null) => void;
}> = ({ d, open, onClose, onSelectGoal }) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Manage goals</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2 max-h-[55vh] overflow-y-auto">
          {d.goals.length === 0 && <div className="text-sm text-muted-foreground py-4 text-center">No goals yet.</div>}
          {d.goals.map(g => (
            <button
              key={g.id}
              onClick={() => { onSelectGoal(g); onClose(); }}
              className="w-full flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-sm font-medium">{g.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{g.target_date}</span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { onSelectGoal(null); onClose(); }}>
            <Plus className="w-4 h-4 mr-1" /> New goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
