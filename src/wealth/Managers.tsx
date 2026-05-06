import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData, AccountType, ExtraType } from './types';
import { card, inputCls, btn, btnPrimary, Label, Heading } from './ui';

const sb = supabase as any;

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
    <div className="bg-w-surface border border-w-border rounded-[14px] p-6 max-w-2xl w-full my-8" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5">
        <Heading className="text-xl">{title}</Heading>
        <button onClick={onClose} className="text-w-muted hover:text-w-text"><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ===== Accounts =====
export const AccountsManager: React.FC<{ d: WealthData; onClose: () => void; onChange: () => void }> = ({ d, onClose, onChange }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => [...d.accounts].sort((a, b) => a.sort_order - b.sort_order));
  const [busy, setBusy] = useState(false);

  const update = (id: string, patch: any) => setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));

  const add = async () => {
    if (!user) return;
    const { data } = await sb.from('accounts').insert({
      user_id: user.id, label: 'New account', type: 'cash', liquid: true,
      color: '#60a5fa', sort_order: items.length,
    }).select().single();
    if (data) setItems([...items, data]);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this account and ALL its snapshots?')) return;
    await sb.from('nw_snapshots').delete().eq('account_id', id);
    await sb.from('accounts').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  const saveAll = async () => {
    setBusy(true);
    for (const i of items) {
      await sb.from('accounts').update({
        label: i.label, type: i.type, liquid: i.liquid, color: i.color,
        is_estimated: i.is_estimated, sort_order: i.sort_order,
      }).eq('id', i.id);
    }
    setBusy(false);
    onChange(); onClose();
  };

  return (
    <ModalShell title="Manage accounts" onClose={onClose}>
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {items.map(a => (
          <div key={a.id} className="grid grid-cols-12 gap-2 items-center p-2 border border-w-border rounded-[8px]">
            <input className={`${inputCls} col-span-4`} value={a.label} onChange={e => update(a.id, { label: e.target.value })} />
            <select className={`${inputCls} col-span-2`} value={a.type} onChange={e => update(a.id, { type: e.target.value as AccountType })}>
              <option value="cash">cash</option><option value="investments">investments</option>
              <option value="retirement">retirement</option><option value="property">property</option><option value="debt">debt</option>
            </select>
            <input type="color" className="col-span-1 h-9 bg-w-surface2 rounded" value={a.color} onChange={e => update(a.id, { color: e.target.value })} />
            <label className="col-span-2 text-xs text-w-muted flex items-center gap-1"><input type="checkbox" checked={!!a.liquid} onChange={e => update(a.id, { liquid: e.target.checked })} />liquid</label>
            <label className="col-span-2 text-xs text-w-muted flex items-center gap-1"><input type="checkbox" checked={!!a.is_estimated} onChange={e => update(a.id, { is_estimated: e.target.checked })} />est.</label>
            <button onClick={() => remove(a.id)} className="col-span-1 text-w-red hover:bg-w-red/10 p-2 rounded"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <button onClick={add} className={btn}><Plus size={14} className="inline mr-1" />Add account</button>
        <button onClick={saveAll} disabled={busy} className={btnPrimary}>{busy ? 'Saving…' : 'Save all'}</button>
      </div>
    </ModalShell>
  );
};

// ===== Budget categories =====
export const CategoriesManager: React.FC<{ d: WealthData; onClose: () => void; onChange: () => void }> = ({ d, onClose, onChange }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => [...d.budgetCategories].sort((a, b) => a.sort_order - b.sort_order));
  const update = (id: string, patch: any) => setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));

  const add = async () => {
    if (!user) return;
    const { data } = await sb.from('budget_categories').insert({
      user_id: user.id, label: 'New category', budget: 0, color: '#4ade80', sort_order: items.length,
    }).select().single();
    if (data) setItems([...items, data]);
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this category and all its spending entries?')) return;
    await sb.from('budget_spending').delete().eq('category_id', id);
    await sb.from('budget_categories').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };
  const saveAll = async () => {
    for (const i of items) {
      await sb.from('budget_categories').update({
        label: i.label, budget: Number(i.budget) || 0, color: i.color, sort_order: i.sort_order,
      }).eq('id', i.id);
    }
    onChange(); onClose();
  };

  return (
    <ModalShell title="Manage budget categories" onClose={onClose}>
      <p className="text-xs text-w-muted mb-3">"Actual" spending is entered each month via <span className="text-w-text">Budget → + Log month</span>. The budget here is your monthly target.</p>
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {items.map(c => (
          <div key={c.id} className="grid grid-cols-12 gap-2 items-center p-2 border border-w-border rounded-[8px]">
            <input className={`${inputCls} col-span-6`} value={c.label} onChange={e => update(c.id, { label: e.target.value })} />
            <input className={`${inputCls} col-span-3`} value={c.budget} onChange={e => update(c.id, { budget: e.target.value })} placeholder="Monthly budget" />
            <input type="color" className="col-span-2 h-9 bg-w-surface2 rounded" value={c.color} onChange={e => update(c.id, { color: e.target.value })} />
            <button onClick={() => remove(c.id)} className="col-span-1 text-w-red hover:bg-w-red/10 p-2 rounded"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <button onClick={add} className={btn}><Plus size={14} className="inline mr-1" />Add category</button>
        <button onClick={saveAll} className={btnPrimary}>Save all</button>
      </div>
    </ModalShell>
  );
};

// ===== Investment buckets =====
export const BucketsManager: React.FC<{ d: WealthData; onClose: () => void; onChange: () => void }> = ({ d, onClose, onChange }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => [...d.investmentBuckets].sort((a, b) => a.sort_order - b.sort_order));
  const update = (id: string, patch: any) => setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));

  const add = async () => {
    if (!user) return;
    const { data } = await sb.from('investment_buckets').insert({
      user_id: user.id, label: 'New bucket', description: '', color: '#60a5fa', sort_order: items.length,
    }).select().single();
    if (data) setItems([...items, data]);
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this bucket and all its snapshots?')) return;
    await sb.from('investment_snapshots').delete().eq('bucket_id', id);
    await sb.from('investment_buckets').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };
  const saveAll = async () => {
    for (const i of items) {
      await sb.from('investment_buckets').update({
        label: i.label, description: i.description, color: i.color, sort_order: i.sort_order,
      }).eq('id', i.id);
    }
    onChange(); onClose();
  };

  return (
    <ModalShell title="Manage investment buckets" onClose={onClose}>
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {items.map(b => (
          <div key={b.id} className="grid grid-cols-12 gap-2 items-center p-2 border border-w-border rounded-[8px]">
            <input className={`${inputCls} col-span-4`} value={b.label} onChange={e => update(b.id, { label: e.target.value })} />
            <input className={`${inputCls} col-span-5`} value={b.description || ''} placeholder="Description" onChange={e => update(b.id, { description: e.target.value })} />
            <input type="color" className="col-span-2 h-9 bg-w-surface2 rounded" value={b.color} onChange={e => update(b.id, { color: e.target.value })} />
            <button onClick={() => remove(b.id)} className="col-span-1 text-w-red hover:bg-w-red/10 p-2 rounded"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <button onClick={add} className={btn}><Plus size={14} className="inline mr-1" />Add bucket</button>
        <button onClick={saveAll} className={btnPrimary}>Save all</button>
      </div>
    </ModalShell>
  );
};

// ===== Goals =====
export const GoalsManager: React.FC<{ d: WealthData; onClose: () => void; onChange: () => void }> = ({ d, onClose, onChange }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => [...d.goals].sort((a, b) => a.priority - b.priority));
  const update = (id: string, patch: any) => setItems(items.map(i => i.id === id ? { ...i, ...patch } : i));

  const add = async () => {
    if (!user) return;
    const { data } = await sb.from('goals').insert({
      user_id: user.id, name: 'New goal', target_amount: 10000,
      target_date: new Date().toISOString().slice(0, 7),
      color: '#a78bfa', priority: items.length + 1, allocation_pct: 25,
    }).select().single();
    if (data) setItems([...items, data]);
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this goal and all linked boosts?')) return;
    await sb.from('bonus_allocations').delete().eq('goal_id', id);
    await sb.from('goals').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };
  const saveAll = async () => {
    for (const i of items) {
      await sb.from('goals').update({
        name: i.name, target_amount: Number(i.target_amount) || 0,
        target_date: i.target_date, color: i.color,
        priority: Number(i.priority) || 1, allocation_pct: Number(i.allocation_pct) || 0,
        linked_account_id: i.linked_account_id || null,
      }).eq('id', i.id);
    }
    onChange(); onClose();
  };

  return (
    <ModalShell title="Manage goals" onClose={onClose}>
      <div className="space-y-3 max-h-[55vh] overflow-y-auto">
        {items.map(g => (
          <div key={g.id} className="p-3 border border-w-border rounded-[8px] space-y-2">
            <div className="grid grid-cols-12 gap-2 items-center">
              <input className={`${inputCls} col-span-6`} value={g.name} onChange={e => update(g.id, { name: e.target.value })} />
              <input type="color" className="col-span-1 h-9 bg-w-surface2 rounded" value={g.color} onChange={e => update(g.id, { color: e.target.value })} />
              <input className={`${inputCls} col-span-4`} value={g.target_amount} onChange={e => update(g.id, { target_amount: e.target.value })} placeholder="Target $" />
              <button onClick={() => remove(g.id)} className="col-span-1 text-w-red hover:bg-w-red/10 p-2 rounded"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4">
                <Label>Target month</Label>
                <input type="month" className={`${inputCls} mt-1`} value={(g.target_date || '').slice(0, 7)} onChange={e => update(g.id, { target_date: e.target.value })} />
              </div>
              <div className="col-span-3">
                <Label>Priority</Label>
                <input className={`${inputCls} mt-1`} value={g.priority} onChange={e => update(g.id, { priority: e.target.value })} />
              </div>
              <div className="col-span-3">
                <Label>Allocation %</Label>
                <input className={`${inputCls} mt-1`} value={g.allocation_pct} onChange={e => update(g.id, { allocation_pct: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Linked acct</Label>
                <select className={`${inputCls} mt-1`} value={g.linked_account_id || ''} onChange={e => update(g.id, { linked_account_id: e.target.value || null })}>
                  <option value="">none</option>
                  {d.accounts.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between">
        <button onClick={add} className={btn}><Plus size={14} className="inline mr-1" />Add goal</button>
        <button onClick={saveAll} className={btnPrimary}>Save all</button>
      </div>
    </ModalShell>
  );
};
