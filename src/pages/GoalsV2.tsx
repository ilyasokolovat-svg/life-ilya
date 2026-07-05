import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, CheckSquare, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoalsStore } from "@/goals/storage";
import { Goal, Layer } from "@/goals/types";
import { checkinStreak, currentQuarterKey, currentMonthKey, monthLabel, listQuarters, listYears } from "@/goals/utils";
import { GoalCard } from "@/goals/components/GoalCard";
import { YearlyGoalCard } from "@/goals/components/YearlyGoalCard";
import { LongtermGoalCard } from "@/goals/components/LongtermGoalCard";
import { GoalFormDialog } from "@/goals/components/GoalFormDialog";
import { CategoryManager } from "@/goals/components/CategoryManager";
import { WeeklyCheckinDialog } from "@/goals/components/WeeklyCheckinDialog";

const GoalsV2 = () => {
  const { goals, categories, checkinLog, upsertGoal, deleteGoal } = useGoalsStore();
  const [tab, setTab] = useState<Layer>("quarterly");
  const [quarter, setQuarter] = useState(currentQuarterKey());
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | undefined>();
  const [checkinOpen, setCheckinOpen] = useState(false);
  const streak = checkinStreak(checkinLog);

  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setDialogOpen(true);
  };

  const grouped = useMemo(() => {
    const filtered = goals.filter((g) => {
      if (g.layer !== tab) return false;
      if (tab === "quarterly") return g.quarter === quarter;
      if (tab === "yearly") return g.year === year;
      return true;
    });
    const map = new Map<string, Goal[]>();
    filtered.forEach((g) => {
      const key = g.categoryId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    });
    return map;
  }, [goals, tab, quarter, year]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-1.5 rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <h1 className="text-lg font-semibold">Goals</h1>
            {streak > 0 && (
              <span
                className="text-xs font-medium inline-flex items-center gap-1"
                style={{ color: "hsl(var(--goal-amber))" }}
                title="Consecutive weeks with a saved weekly check-in"
              >
                <Flame className="w-3.5 h-3.5" /> {streak}-week streak
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCheckinOpen(true)}>
              <CheckSquare className="w-4 h-4 mr-1" /> Weekly check-in
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Add goal
            </Button>
          </div>
        </div>
      </header>


      <main className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-4">
        <CategoryManager />

        <Tabs value={tab} onValueChange={(v) => setTab(v as Layer)}>
          <TabsList>
            <TabsTrigger value="quarterly">This Quarter</TabsTrigger>
            <TabsTrigger value="yearly">This Year</TabsTrigger>
            <TabsTrigger value="longterm">Long-term</TabsTrigger>
          </TabsList>

          <TabsContent value="quarterly" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Quarter:</span>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {listQuarters().map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {renderGrouped("quarterly")}
          </TabsContent>

          <TabsContent value="yearly" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Year:</span>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {listYears().map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(() => {
              const mk = currentMonthKey();
              const pending = goals.filter(
                (g) => g.layer === "yearly" && g.year === year && !(g.monthlyReviews || []).some((r) => r.month === mk)
              );
              if (pending.length === 0) return null;
              return (
                <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm flex items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{monthLabel(mk)} review:</span>{" "}
                    <span className="text-muted-foreground">{pending.length} yearly goal{pending.length > 1 ? "s" : ""} to check in.</span>
                  </span>
                </div>
              );
            })()}
            {renderGrouped("yearly")}
          </TabsContent>

          <TabsContent value="longterm" className="space-y-4 mt-4">
            {renderGrouped("longterm")}
          </TabsContent>
        </Tabs>
      </main>

      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        defaultLayer={tab}
        defaultQuarter={quarter}
        defaultYear={year}
      />

      <WeeklyCheckinDialog open={checkinOpen} onOpenChange={setCheckinOpen} />
    </div>
  );

  function renderGrouped(layer: Layer) {
    if (grouped.size === 0) {
      return (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">No {layer} goals yet.</p>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Add your first goal</Button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([catId, list]) => {
          const cat = categories.find((c) => c.id === catId);
          return (
            <div key={catId} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {cat?.name || "Uncategorized"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {list.map((g) => {
                  if (layer === "quarterly") return (
                    <GoalCard
                      key={g.id}
                      goal={g}
                      category={cat}
                      onUpdate={(ng) => upsertGoal(ng)}
                      onEdit={() => openEdit(g)}
                      onDelete={() => { if (confirm(`Delete "${g.title}"?`)) deleteGoal(g.id); }}
                    />
                  );
                  if (layer === "yearly") return (
                    <YearlyGoalCard
                      key={g.id}
                      goal={g}
                      category={cat}
                      allGoals={goals}
                      onUpdate={(ng) => upsertGoal(ng)}
                      onEdit={() => openEdit(g)}
                      onDelete={() => { if (confirm(`Delete "${g.title}"?`)) deleteGoal(g.id); }}
                    />
                  );
                  return (
                    <LongtermGoalCard
                      key={g.id}
                      goal={g}
                      category={cat}
                      allGoals={goals}
                      onEdit={() => openEdit(g)}
                      onDelete={() => { if (confirm(`Delete "${g.title}"?`)) deleteGoal(g.id); }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
};

export default GoalsV2;
