import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDubaiDate } from "@/utils/dateUtils";
import {
  useGoalsSystem,
  getCurrentQuarter,
  GoalRecord,
  GoalProgress,
  GoalSubcategory,
  computeStatus,
  calculateProgress,
  getQuarterDates,
} from "@/hooks/useGoalsSystem";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalExpandPanel } from "@/components/goals/GoalExpandPanel";
import { cn } from "@/lib/utils";

const currentYear = getDubaiDate().getFullYear();
const quarters = [
  { key: `${currentYear}-Q1`, label: "Q1", range: "Jan–Mar" },
  { key: `${currentYear}-Q2`, label: "Q2", range: "Apr–Jun" },
  { key: `${currentYear}-Q3`, label: "Q3", range: "Jul–Sep" },
  { key: `${currentYear}-Q4`, label: "Q4", range: "Oct–Dec" },
];

const statusOrder: Record<string, number> = { off_track: 0, behind: 1, on_track: 2, completed: 3 };

const GoalsOverview = () => {
  const { getQuarterGoals, getYearGoals, annualGoals, saveGoal, deleteGoal, isLoading, isSaving } = useGoalsSystem();
  const currentQ = getCurrentQuarter();

  const [tab, setTab] = useState<"quarter" | "year">("quarter");
  const [selectedQuarter, setSelectedQuarter] = useState(currentQ.key);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  // Quarter goals sorted
  const quarterGoals = useMemo(() => {
    const goals = getQuarterGoals(selectedQuarter);
    return [...goals].sort((a, b) => {
      const sa = statusOrder[computeStatus(a, selectedQuarter)] ?? 2;
      const sb = statusOrder[computeStatus(b, selectedQuarter)] ?? 2;
      return sa - sb;
    });
  }, [getQuarterGoals, selectedQuarter]);

  // Annual goals
  const yearGoals = useMemo(() => getYearGoals(String(currentYear)), [getYearGoals, currentYear]);

  // Quarter overall %
  const quarterOverallPct = useMemo(() => {
    const valid = quarterGoals
      .map((g) => calculateProgress(g.actual_result))
      .filter((p) => p !== -1);
    if (!valid.length) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }, [quarterGoals]);

  const getQuarterPctForPill = (qKey: string) => {
    const goals = getQuarterGoals(qKey);
    const valid = goals.map((g) => calculateProgress(g.actual_result)).filter((p) => p !== -1);
    if (!valid.length) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  };

  const handleSave = (data: any) => {
    saveGoal(data);
    setExpandedGoalId(null);
    setAddingNew(false);
  };

  const handleMarkComplete = (id: string) => {
    const goal = quarterGoals.find((g) => g.id === id) || yearGoals.find((g) => g.id === id);
    if (goal) {
      saveGoal({
        id: goal.id,
        category: goal.category,
        subcategory: goal.subcategory,
        period_type: goal.period_type,
        period_key: goal.period_key,
        planned_goal: goal.planned_goal,
        actual_result: { ...(goal.actual_result || {} as GoalProgress), completed: true },
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteGoal(id);
    setExpandedGoalId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
              </Link>
              <div>
                <h1 className="text-xl font-medium text-foreground">Goals</h1>
                <p className="text-xs text-muted-foreground">{currentYear}</p>
              </div>
            </div>
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                onClick={() => { setTab("quarter"); setAddingNew(false); setExpandedGoalId(null); }}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  tab === "quarter" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                This quarter
              </button>
              <button
                onClick={() => { setTab("year"); setAddingNew(false); setExpandedGoalId(null); }}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  tab === "year" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                This year
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {tab === "quarter" && (
          <>
            {/* Quarter selector */}
            <div className="flex gap-2 mb-6">
              {quarters.map((q) => {
                const isActive = selectedQuarter === q.key;
                const pct = getQuarterPctForPill(q.key);
                const isPast = q.key < currentQ.key;
                const isFuture = q.key > currentQ.key;
                return (
                  <button
                    key={q.key}
                    onClick={() => { setSelectedQuarter(q.key); setAddingNew(false); setExpandedGoalId(null); }}
                    className={cn(
                      "flex-1 rounded-xl px-3 py-2.5 text-center border transition-all",
                      isActive
                        ? "bg-card border-border shadow-sm"
                        : "border-transparent hover:bg-card/50"
                    )}
                  >
                    <div className="text-sm font-medium text-foreground">{q.label}</div>
                    <div className="text-[10px] text-muted-foreground">{q.range}</div>
                    <div className={cn("text-xs mt-1 font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                      {pct !== null ? `${pct}%` : "—"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Goal list */}
            {quarterGoals.length === 0 && !addingNew ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">No goals set for {quarters.find((q) => q.key === selectedQuarter)?.label} yet</p>
                <Button onClick={() => setAddingNew(true)} className="gap-1"><Plus className="w-4 h-4" /> Add your first goal</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {quarterGoals.map((goal) => (
                  <div key={goal.id}>
                    <GoalCard
                      goal={goal}
                      periodKey={selectedQuarter}
                      isExpanded={expandedGoalId === goal.id}
                      onToggleExpand={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                      onMarkComplete={handleMarkComplete}
                      onDelete={handleDelete}
                    />
                    {expandedGoalId === goal.id && (
                      <GoalExpandPanel
                        goal={goal}
                        periodType="quarter"
                        periodKey={selectedQuarter}
                        annualGoals={yearGoals}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onCancel={() => setExpandedGoalId(null)}
                      />
                    )}
                  </div>
                ))}

                {/* Add new goal */}
                {addingNew ? (
                  <GoalExpandPanel
                    periodType="quarter"
                    periodKey={selectedQuarter}
                    annualGoals={yearGoals}
                    onSave={handleSave}
                    onCancel={() => setAddingNew(false)}
                  />
                ) : (
                  <button
                    onClick={() => setAddingNew(true)}
                    className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                  >
                    + Add goal
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {tab === "year" && (
          <>
            {yearGoals.length === 0 && !addingNew ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-2">No annual goals set for {currentYear} yet</p>
                <p className="text-xs text-muted-foreground mb-4">Start here before creating quarterly goals</p>
                <Button onClick={() => setAddingNew(true)} className="gap-1"><Plus className="w-4 h-4" /> Add annual goal</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {yearGoals.map((goal) => {
                  // Calculate year progress from linked quarterly goals
                  const linkedQuarterly = quarters.map((q) => {
                    const qGoals = getQuarterGoals(q.key).filter(
                      (qg) => qg.actual_result?.annual_goal_id === goal.id
                    );
                    if (!qGoals.length) return { label: q.label, pct: null };
                    const valid = qGoals.map((g) => calculateProgress(g.actual_result)).filter((p) => p !== -1);
                    return { label: q.label, pct: valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null };
                  });

                  const yearPct = calculateProgress(goal.actual_result);

                  return (
                    <div key={goal.id}>
                      <div
                        className="bg-card border border-border rounded-xl px-4 py-3 cursor-pointer hover:shadow-sm transition-all"
                        onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: `hsl(var(--${goal.subcategory === "personal" ? "mental" : goal.subcategory}-dark))` }} />
                          <span className="text-sm font-medium flex-1 truncate">{goal.planned_goal}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {goal.subcategory === "personal" ? "Personal" : goal.subcategory.charAt(0).toUpperCase() + goal.subcategory.slice(1)}
                          </span>
                          <span className="text-xs font-medium">{yearPct === -1 ? `${goal.actual_result?.self_rating || 0}/10` : `${yearPct}%`}</span>
                        </div>
                        {yearPct !== -1 && (
                          <div className="mt-2">
                            <div className="h-[5px] bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${yearPct}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 mt-1.5 text-[10px] text-muted-foreground">
                          {linkedQuarterly.map((lq) => (
                            <span key={lq.label}>{lq.label}: {lq.pct !== null ? `${lq.pct}%` : "—"}</span>
                          ))}
                        </div>
                      </div>
                      {expandedGoalId === goal.id && (
                        <GoalExpandPanel
                          goal={goal}
                          periodType="year"
                          periodKey={String(currentYear)}
                          onSave={handleSave}
                          onDelete={handleDelete}
                          onCancel={() => setExpandedGoalId(null)}
                        />
                      )}
                    </div>
                  );
                })}

                {addingNew ? (
                  <GoalExpandPanel
                    periodType="year"
                    periodKey={String(currentYear)}
                    onSave={handleSave}
                    onCancel={() => setAddingNew(false)}
                  />
                ) : (
                  <button
                    onClick={() => setAddingNew(true)}
                    className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                  >
                    + Add annual goal
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default GoalsOverview;
