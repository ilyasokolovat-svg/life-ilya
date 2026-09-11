import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, PencilLine, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useFinance } from '@/finance/hooks';
import { OverviewTab } from '@/finance/tabs/OverviewTab';
import { PlanTab } from '@/finance/tabs/PlanTab';
import { DetailsTab } from '@/finance/tabs/DetailsTab';
import { TripSpendTab } from '@/finance/tabs/TripSpendTab';
import { QuickUpdateDialog } from '@/finance/dialogs/QuickUpdateDialog';
import { ImportDialog } from '@/finance/import/ImportDialog';
import { latestInvestmentDate } from '@/finance/calc';
import { fmtDate } from '@/finance/utils';

const CAR_LS = 'finance_car_market_value';

export default function Finance() {
  const { data, loading, seeding, historicalSeeding, refresh } = useFinance();
  const [tab, setTab] = useState<'overview' | 'plan' | 'trips' | 'details'>('overview');
  const [quickOpen, setQuickOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [carMarketValue, setCarMarketValueState] = useState<number | null>(() => {
    const raw = localStorage.getItem(CAR_LS);
    return raw ? Number(raw) || null : null;
  });
  const setCarMarketValue = (v: number | null) => {
    setCarMarketValueState(v);
    if (v == null) localStorage.removeItem(CAR_LS);
    else localStorage.setItem(CAR_LS, String(v));
  };

  if (loading || seeding || historicalSeeding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          {seeding ? 'Setting up your finance workspace…' : historicalSeeding ? 'Importing historical portfolio data…' : 'Loading…'}
        </div>
      </div>
    );
  }

  const lastEntry = latestInvestmentDate(data);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button>
          </Link>
          <h1 className="text-lg font-semibold ml-1">Finance</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Card className="mb-6 border-primary/30">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Keep everything up to date</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {lastEntry ? `Last numbers recorded ${fmtDate(lastEntry)}.` : 'No numbers recorded yet.'} Two steps, then every tab is current.
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => setQuickOpen(true)}>
                <PencilLine className="w-4 h-4 mr-1.5" /> Record manual update
              </Button>
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-1.5" /> Upload spending file
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="trips">Trip spendings</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab d={data} onChange={refresh} carMarketValue={carMarketValue} setCarMarketValue={setCarMarketValue} />
          </TabsContent>
          <TabsContent value="plan"><PlanTab d={data} /></TabsContent>
          <TabsContent value="trips"><TripSpendTab /></TabsContent>
          <TabsContent value="details"><DetailsTab d={data} onChange={refresh} /></TabsContent>
        </Tabs>
      </main>

      <QuickUpdateDialog d={data} open={quickOpen} onOpenChange={setQuickOpen} onSaved={refresh} />
      <ImportDialog
        d={data}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={async () => { await refresh(); toast.success('Spending updated across Details'); setTab('details'); }}
      />
    </div>
  );
}
