import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Plane, ChevronRight, Pencil } from 'lucide-react';
import { fmtUSD } from '../utils';
import { useFinanceTrips, tripDays, TRIP_CATEGORIES, type FinanceTrip } from '../trips/useFinanceTrips';

const CAT_COLOR: Record<string, string> = {
  'Plane tickets': '#534AB7',
  Hotels: '#2563eb',
  Food: '#EF9F27',
  Transport: '#1D9E75',
  'General spendings': '#94a3b8',
};

const fmtRange = (a: string, b: string) => {
  const d1 = new Date(a), d2 = new Date(b);
  const o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const y = d2.getFullYear();
  return `${d1.toLocaleDateString('en-US', o)} – ${d2.toLocaleDateString('en-US', o)} ${y}`;
};

export const TripSpendTab: React.FC = () => {
  const t = useFinanceTrips();
  const [openTrip, setOpenTrip] = useState<string | null>(null);
  const [editTrip, setEditTrip] = useState<FinanceTrip | 'new' | null>(null);

  const byTrip = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of t.expenses) m.set(e.trip_id, (m.get(e.trip_id) || 0) + Number(e.amount));
    return m;
  }, [t.expenses]);

  const totalSpent = Array.from(byTrip.values()).reduce((a, b) => a + b, 0);
  const totalPlanned = t.trips.reduce((a, x) => a + Number(x.planned_budget), 0);

  if (t.loading) return <div className="text-sm text-muted-foreground p-6">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Trips logged" value={String(t.trips.length)} />
        <Stat label="Total planned" value={fmtUSD(totalPlanned, { compact: true })} />
        <Stat label="Total spent" value={fmtUSD(totalSpent, { compact: true })} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Trip timeline</h3>
        <Button size="sm" onClick={() => setEditTrip('new')}><Plus className="w-4 h-4 mr-1.5" /> Add trip</Button>
      </div>

      {!t.trips.length ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
          No trips yet. Add one to start tracking what a trip really cost you.
        </CardContent></Card>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          <div className="space-y-3">
            {t.trips.map(trip => {
              const spent = byTrip.get(trip.id) || 0;
              const planned = Number(trip.planned_budget);
              const diff = spent - planned;
              const days = tripDays(trip.start_date, trip.end_date);
              const cats = TRIP_CATEGORIES.map(c => ({
                c,
                v: t.expenses.filter(e => e.trip_id === trip.id && e.category === c).reduce((a, e) => a + Number(e.amount), 0),
              })).filter(x => x.v > 0);
              return (
                <div key={trip.id} className="relative">
                  <span className="absolute -left-[19px] top-5 w-3 h-3 rounded-full border-2 border-background" style={{ backgroundColor: '#534AB7' }} />
                  <Card className="hover:border-primary/40 transition-colors">
                    <CardContent className="p-4">
                      <button className="w-full text-left" onClick={() => setOpenTrip(trip.id)}>
                        <div className="flex items-start gap-3">
                          <Plane className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{trip.title}</span>
                              {trip.destination && <span className="text-xs text-muted-foreground truncate">· {trip.destination}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {fmtRange(trip.start_date, trip.end_date)} · {days} {days === 1 ? 'day' : 'days'}
                            </div>
                            {cats.length > 0 && (
                              <div className="mt-2 flex h-1.5 rounded-full overflow-hidden bg-muted">
                                {cats.map(x => (
                                  <div key={x.c} style={{ width: `${(x.v / spent) * 100}%`, backgroundColor: CAT_COLOR[x.c] }} />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold tabular-nums">{fmtUSD(spent)}</div>
                            <div className="text-[11px] text-muted-foreground tabular-nums">
                              planned {fmtUSD(planned)}
                            </div>
                            {planned > 0 && (
                              <div className={`text-[11px] tabular-nums ${diff > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                                {diff > 0 ? `+${fmtUSD(diff)} over` : `${fmtUSD(Math.abs(diff))} under`}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TripFormDialog
        trip={editTrip}
        onClose={() => setEditTrip(null)}
        onSave={async (v) => {
          if (editTrip === 'new') await t.addTrip(v as any);
          else if (editTrip) await t.updateTrip(editTrip.id, v);
          setEditTrip(null);
        }}
      />

      <TripDetailDialog
        trip={t.trips.find(x => x.id === openTrip) || null}
        api={t}
        onClose={() => setOpenTrip(null)}
        onEdit={(trip) => { setOpenTrip(null); setEditTrip(trip); }}
      />
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card><CardContent className="p-4">
    <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold tabular-nums mt-1">{value}</div>
  </CardContent></Card>
);

const TripFormDialog: React.FC<{
  trip: FinanceTrip | 'new' | null;
  onClose: () => void;
  onSave: (v: Omit<FinanceTrip, 'id'>) => void;
}> = ({ trip, onClose, onSave }) => {
  const isNew = trip === 'new';
  const cur = isNew || !trip ? null : trip;
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [planned, setPlanned] = useState('');

  React.useEffect(() => {
    if (!trip) return;
    setTitle(cur?.title || '');
    setDestination(cur?.destination || '');
    setStart(cur?.start_date || '');
    setEnd(cur?.end_date || '');
    setPlanned(cur ? String(cur.planned_budget) : '');
  }, [trip]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={!!trip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-base">{isNew ? 'Add trip' : 'Edit trip'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Trip name</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Japan 2026" className="mt-1.5" /></div>
          <div><Label className="text-xs">Where</Label><Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Tokyo, Kyoto" className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Start</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} className="mt-1.5" /></div>
            <div><Label className="text-xs">End</Label><Input type="date" value={end} onChange={e => setEnd(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label className="text-xs">Planned budget ($)</Label><Input type="number" value={planned} onChange={e => setPlanned(e.target.value)} placeholder="0" className="mt-1.5 tabular-nums" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!title || !start || !end}
            onClick={() => onSave({
              title, destination: destination || null, start_date: start, end_date: end,
              planned_budget: Number(planned) || 0, notes: null,
            })}
          >Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TripDetailDialog: React.FC<{
  trip: FinanceTrip | null;
  api: ReturnType<typeof useFinanceTrips>;
  onClose: () => void;
  onEdit: (t: FinanceTrip) => void;
}> = ({ trip, api, onClose, onEdit }) => {
  const [cat, setCat] = useState<string>(TRIP_CATEGORIES[0]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  const items = trip ? api.expenses.filter(e => e.trip_id === trip.id) : [];
  const spent = items.reduce((a, e) => a + Number(e.amount), 0);
  const planned = Number(trip?.planned_budget || 0);

  const add = async () => {
    if (!trip || !(Number(amount) > 0)) return;
    await api.addExpense({
      trip_id: trip.id, category: cat, description: desc || null,
      amount: Number(amount), spent_on: null,
    });
    setDesc(''); setAmount('');
  };

  return (
    <Dialog open={!!trip} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            {trip?.title}
            {trip && (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit(trip)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {trip && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-muted p-2">
                <div className="text-[10px] uppercase text-muted-foreground">Days</div>
                <div className="font-semibold tabular-nums">{tripDays(trip.start_date, trip.end_date)}</div>
              </div>
              <div className="rounded-md bg-muted p-2">
                <div className="text-[10px] uppercase text-muted-foreground">Planned</div>
                <div className="font-semibold tabular-nums">{fmtUSD(planned, { compact: true })}</div>
              </div>
              <div className="rounded-md bg-muted p-2">
                <div className="text-[10px] uppercase text-muted-foreground">Actual</div>
                <div className="font-semibold tabular-nums">{fmtUSD(spent, { compact: true })}</div>
              </div>
            </div>

            <div className="space-y-2">
              {TRIP_CATEGORIES.map(c => {
                const rows = items.filter(e => e.category === c);
                const sum = rows.reduce((a, e) => a + Number(e.amount), 0);
                return (
                  <div key={c} className="rounded-md border border-border">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLOR[c] }} />{c}
                      </span>
                      <span className="text-sm font-medium tabular-nums">{fmtUSD(sum)}</span>
                    </div>
                    {rows.length > 0 && (
                      <div className="border-t border-border divide-y divide-border">
                        {rows.map(e => (
                          <div key={e.id} className="flex items-center gap-2 px-3 py-1.5">
                            <Input
                              defaultValue={e.description || ''}
                              placeholder="Note"
                              onBlur={ev => ev.target.value !== (e.description || '') && api.updateExpense(e.id, { description: ev.target.value || null })}
                              className="h-7 text-xs border-0 px-0 shadow-none focus-visible:ring-0"
                            />
                            <Input
                              type="number"
                              defaultValue={String(e.amount)}
                              onBlur={ev => Number(ev.target.value) !== Number(e.amount) && api.updateExpense(e.id, { amount: Number(ev.target.value) || 0 })}
                              className="h-7 w-24 text-xs tabular-nums text-right"
                            />
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => api.deleteExpense(e.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Add spending</p>
              <div className="flex gap-2">
                <Select value={cat} onValueChange={setCat}>
                  <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIP_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Note" className="h-9 flex-1" />
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="$" className="h-9 w-24 tabular-nums" />
                <Button size="sm" className="h-9" onClick={add}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={async () => { await api.deleteTrip(trip.id); onClose(); }}
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete trip
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
