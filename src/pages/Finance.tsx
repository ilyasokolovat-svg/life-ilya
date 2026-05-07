import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useWealthData } from '@/wealth/useWealthData';
import { Toast, btn } from '@/wealth/ui';
import { NetWorthTab } from '@/wealth/tabs/NetWorthTab';
import { BudgetTab } from '@/wealth/tabs/BudgetTab';
import { InvestmentsTab } from '@/wealth/tabs/InvestmentsTab';
import { GoalsTab } from '@/wealth/tabs/GoalsTab';
import { AnalyticsTab } from '@/wealth/tabs/AnalyticsTab';
import { Settings as SettingsIcon, LogOut, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setDisplayCurrency, getDisplayCurrency, onCurrencyChange } from '@/wealth/format';

type Tab = 'networth' | 'budget' | 'investments' | 'goals' | 'analytics';

const sb = supabase as any;

export default function Finance() {
  const { user, signOut } = useAuth();
  const { data, loading, seeding, firstTime, setFirstTime, refresh, wipeAndReseed } = useWealthData();
  const [tab, setTab] = useState<Tab>('networth');
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => localStorage.getItem('wealth_welcome_dismissed') === '1');
  const [, forceTick] = useState(0);

  useEffect(() => {
    const off = onCurrencyChange(() => forceTick(t => t + 1));
    return () => { off; };
  }, []);

  useEffect(() => {
    if (data.settings?.display_currency) {
      setDisplayCurrency((data.settings.display_currency as 'USD' | 'AED') || 'USD');
    }
  }, [data.settings?.display_currency]);

  useEffect(() => {
    if (firstTime) {
      localStorage.removeItem('wealth_welcome_dismissed');
      setWelcomeDismissed(false);
      setFirstTime(false);
    }
  }, [firstTime, setFirstTime]);

  const dismissWelcome = () => {
    localStorage.setItem('wealth_welcome_dismissed', '1');
    setWelcomeDismissed(true);
  };

  if (loading || seeding) {
    return (
      <div className="min-h-screen bg-w-bg text-w-text font-sans-w flex items-center justify-center">
        <div className="text-w-muted text-sm">{seeding ? 'Importing your historical data…' : 'Loading…'}</div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const name = data.settings?.display_name || 'Ilya';

  return (
    <div className="min-h-screen bg-w-bg text-w-text font-sans-w">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-w-bg/95 backdrop-blur border-b border-w-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif-w text-2xl text-w-text">wealth</span>
            <span className="w-1.5 h-1.5 rounded-full bg-w-green" />
          </div>
          <nav className="hidden md:flex gap-1">
            {([
              ['networth', 'Net worth'],
              ['budget', 'Budget'],
              ['investments', 'Investments'],
              ['goals', 'Goals'],
              ['analytics', 'Analytics'],
            ] as [Tab, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-1.5 text-sm rounded-[8px] transition-colors ${tab === id ? 'bg-w-surface2 text-w-text border border-w-border' : 'text-w-muted hover:text-w-text border border-transparent'}`}
              >{label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-w-muted hover:text-w-text flex items-center gap-1"><ArrowLeft size={14} /> Dashboard</Link>
            <CurrencyToggle settings={data.settings} onChanged={refresh} />
            <span className="text-xs text-w-muted font-mono-w hidden sm:inline">{today}</span>
            <button onClick={() => setSettingsOpen(true)} className="text-w-muted hover:text-w-text"><SettingsIcon size={18} /></button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex gap-1 px-4 pb-3 overflow-x-auto">
          {([
            ['networth', 'Net worth'], ['budget', 'Budget'], ['investments', 'Investments'],
            ['goals', 'Goals'], ['analytics', 'Analytics'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-3 py-1.5 text-xs whitespace-nowrap rounded-[8px] ${tab === id ? 'bg-w-surface2 text-w-text border border-w-border' : 'text-w-muted border border-transparent'}`}>{label}</button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!welcomeDismissed && (
          <div className="mb-6 p-4 border border-w-green/40 bg-w-green/5 rounded-[14px] flex items-center justify-between cursor-pointer" onClick={dismissWelcome}>
            <div>
              <div className="text-sm text-w-text">Welcome back, {name}.</div>
              <div className="text-xs text-w-muted mt-1">Your historical data has been imported — 4+ years of portfolio history from January 2021. Start by logging this month's numbers in each tab.</div>
            </div>
            <button className="text-w-muted hover:text-w-text"><X size={16} /></button>
          </div>
        )}

        {tab === 'networth' && <NetWorthTab d={data} onChange={refresh} onToast={setToast} />}
        {tab === 'budget' && <BudgetTab d={data} onChange={refresh} onToast={setToast} />}
        {tab === 'investments' && <InvestmentsTab d={data} onChange={refresh} onToast={setToast} />}
        {tab === 'goals' && <GoalsTab d={data} onChange={refresh} onToast={setToast} />}
        {tab === 'analytics' && <AnalyticsTab d={data} />}
      </main>

      {settingsOpen && (
        <SettingsModal
          settings={data.settings}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => { refresh(); setToast('Settings saved'); setSettingsOpen(false); }}
          onSignOut={async () => { await signOut(); }}
          onReset={async () => {
            if (!confirm('Wipe all finance data and re-import seed? This cannot be undone.')) return;
            setSettingsOpen(false);
            await wipeAndReseed();
            setToast('Data reset and reseeded');
          }}
        />
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

const SettingsModal: React.FC<{ settings: any; onClose: () => void; onSaved: () => void; onSignOut: () => void; onReset: () => void }> = ({ settings, onClose, onSaved, onSignOut, onReset }) => {
  const [displayName, setDisplayName] = useState(settings?.display_name || 'Ilya');
  const [currency, setCurrency] = useState(settings?.currency || '$');
  const [srTarget, setSrTarget] = useState(String(settings?.savings_rate_target ?? 30));
  const [fiMult, setFiMult] = useState(String(settings?.fi_multiplier ?? 25));
  const [growth, setGrowth] = useState(String(settings?.annual_growth_rate ?? 8));

  const save = async () => {
    if (!settings) return;
    await sb.from('settings').update({
      display_name: displayName, currency,
      savings_rate_target: parseFloat(srTarget), fi_multiplier: parseFloat(fiMult), annual_growth_rate: parseFloat(growth),
    }).eq('id', settings.id);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-w-surface border border-w-border rounded-[14px] p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif-w text-xl text-w-text">Settings</h2>
          <button onClick={onClose} className="text-w-muted hover:text-w-text"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          {[
            ['Display name', displayName, setDisplayName],
            ['Currency', currency, setCurrency],
            ['Savings rate target %', srTarget, setSrTarget],
            ['FI multiplier', fiMult, setFiMult],
            ['Annual growth rate %', growth, setGrowth],
          ].map(([label, val, setter]: any) => (
            <div key={label}>
              <div className="text-[11px] uppercase tracking-[0.12em] text-w-muted mb-1">{label}</div>
              <input className="bg-w-surface2 border border-w-border rounded-[8px] px-3 py-2 text-w-text font-mono-w text-sm w-full" value={val} onChange={e => setter(e.target.value)} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 justify-between">
          <button onClick={onSignOut} className={`${btn} flex items-center gap-2 text-w-red border-w-red/40 hover:bg-w-red/10`}><LogOut size={14} /> Sign out</button>
          <div className="flex gap-2">
            <button onClick={onReset} className={`${btn} text-w-amber border-w-amber/40 hover:bg-w-amber/10`}>Reset all data</button>
            <button onClick={save} className={`${btn} text-w-green border-w-green/40 hover:bg-w-green/10`}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CurrencyToggle: React.FC<{ settings: any; onChanged: () => void }> = ({ settings, onChanged }) => {
  const cur = (settings?.display_currency as 'USD' | 'AED') || getDisplayCurrency();
  const toggle = async (next: 'USD' | 'AED') => {
    setDisplayCurrency(next);
    if (settings) {
      await sb.from('settings').update({ display_currency: next }).eq('id', settings.id);
      onChanged();
    }
  };
  return (
    <div className="flex items-center gap-1 border border-w-border rounded-[8px] p-0.5">
      {(['USD','AED'] as const).map(c => (
        <button key={c} onClick={() => toggle(c)} className={`px-2 py-0.5 text-[10px] font-mono-w rounded ${cur === c ? 'bg-w-surface2 text-w-text' : 'text-w-muted hover:text-w-text'}`}>{c}</button>
      ))}
    </div>
  );
};
