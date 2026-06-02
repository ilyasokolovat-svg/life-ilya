import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Plus, Trash2, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fmtUSD } from '../utils';
import { toast } from 'sonner';

const sb = supabase as any;

type Deal = {
  id: string;
  company_name: string;
  product: string | null;
  arr_usd: number;
  expected_bonus_usd: number;
  status: string;
  notes: string | null;
  sort_order: number;
};

const STATUS_OPTIONS = [
  { value: 'lead', label: 'Lead', cls: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'In progress', cls: 'bg-blue-100 text-blue-700' },
  { value: 'closed_won', label: 'Closed-won', cls: 'bg-emerald-100 text-emerald-700' },
  { value: 'closed_lost', label: 'Closed-lost', cls: 'bg-red-100 text-red-700' },
];
const statusLabel = (v: string) => STATUS_OPTIONS.find(s => s.value === v)?.label || v;
const statusCls = (v: string) => STATUS_OPTIONS.find(s => s.value === v)?.cls || 'bg-muted text-foreground';

export const B2BrokerPipeline: React.FC = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await sb.from('b2broker_deals').select('*').eq('user_id', user.id).order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (!error) setDeals(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const active = deals.filter(d => d.status !== 'closed_lost' && d.status !== 'closed_won');
  const totalARR = active.reduce((a, d) => a + Number(d.arr_usd), 0);
  const totalBonus = active.reduce((a, d) => a + Number(d.expected_bonus_usd), 0);

  const addDeal = async () => {
    if (!user) return;
    const { data, error } = await sb.from('b2broker_deals').insert({
      user_id: user.id,
      company_name: 'New deal',
      product: '',
      arr_usd: 0,
      expected_bonus_usd: 0,
      status: 'in_progress',
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setDeals([data, ...deals]);
    setOpen(true);
  };

  const updateDeal = async (id: string, patch: Partial<Deal>) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    const { error } = await sb.from('b2broker_deals').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(error.message);
  };

  const removeDeal = async (id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    await sb.from('b2broker_deals').delete().eq('id', id);
  };

  const convertToBonus = async (deal: Deal) => {
    if (!user) return;
    const month = new Date().toISOString().slice(0, 7);
    const { error } = await sb.from('budget_extras').insert({
      user_id: user.id,
      month,
      description: `B2Broker: ${deal.company_name}${deal.product ? ' — ' + deal.product : ''}`,
      amount: Number(deal.expected_bonus_usd),
      type: 'bonus',
    });
    if (error) { toast.error(error.message); return; }
    await updateDeal(deal.id, { status: 'closed_won' });
    toast.success(`Logged ${fmtUSD(Number(deal.expected_bonus_usd))} bonus for this month`);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold">B2Broker pipeline</div>
              <div className="text-[11px] text-muted-foreground">
                {active.length} active · ARR {fmtUSD(totalARR, { compact: true })} · expected bonus <span className="text-emerald-600 font-medium">{fmtUSD(totalBonus, { compact: true })}</span>
              </div>
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
            {!loading && deals.length === 0 && (
              <div className="text-xs text-muted-foreground italic">No deals yet. Add one to start tracking.</div>
            )}
            {deals.map(d => (
              <div key={d.id} className="rounded-md border border-border p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Company</label>
                    <Input
                      defaultValue={d.company_name}
                      onBlur={e => e.target.value !== d.company_name && updateDeal(d.id, { company_name: e.target.value })}
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Product</label>
                    <Input
                      defaultValue={d.product ?? ''}
                      onBlur={e => e.target.value !== (d.product ?? '') && updateDeal(d.id, { product: e.target.value })}
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase">ARR ($)</label>
                    <Input
                      type="number"
                      defaultValue={d.arr_usd}
                      onBlur={e => Number(e.target.value) !== Number(d.arr_usd) && updateDeal(d.id, { arr_usd: Number(e.target.value) || 0 })}
                      className="h-8 text-sm mt-0.5 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Expected bonus ($)</label>
                    <Input
                      type="number"
                      defaultValue={d.expected_bonus_usd}
                      onBlur={e => Number(e.target.value) !== Number(d.expected_bonus_usd) && updateDeal(d.id, { expected_bonus_usd: Number(e.target.value) || 0 })}
                      className="h-8 text-sm mt-0.5 tabular-nums"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => updateDeal(d.id, { status: s.value })}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition ${d.status === s.value ? s.cls : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {d.status !== 'closed_won' && Number(d.expected_bonus_usd) > 0 && (
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => convertToBonus(d)}>
                        Log as bonus
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeDeal(d.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <Input
                  defaultValue={d.notes ?? ''}
                  onBlur={e => e.target.value !== (d.notes ?? '') && updateDeal(d.id, { notes: e.target.value })}
                  placeholder="Notes…"
                  className="h-8 text-xs"
                />
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addDeal} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Add deal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
