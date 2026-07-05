import React, { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Goal, Layer, ColorKey, COLOR_KEYS, colorHsl, Metric, Category, ProgressWeighting } from "../types";
import { uid, listQuarters, listYears, quarterInfo, currentQuarterKey, syncRecurringWeeks } from "../utils";
import { useGoalsStore } from "../storage";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<Goal>;
  defaultLayer?: Layer;
  defaultQuarter?: string;
  defaultYear?: number;
}

export function GoalFormDialog({ open, onOpenChange, initial, defaultLayer, defaultQuarter, defaultYear }: Props) {
  const { goals, categories, upsertGoal, addCategory } = useGoalsStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [layer, setLayer] = useState<Layer>("quarterly");
  const [categoryId, setCategoryId] = useState<string>("");
  const [color, setColor] = useState<ColorKey>("coral");
  const [quarter, setQuarter] = useState<string>(currentQuarterKey());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [linkedYearlyGoalId, setLinkedYearlyGoalId] = useState<string | undefined>();
  const [linkedLongtermGoalId, setLinkedLongtermGoalId] = useState<string | undefined>();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<Goal["weeklyTasks"]>([]);
  const [recurringTasks, setRecurringTasks] = useState<string[]>([]);
  const [progressWeighting, setProgressWeighting] = useState<ProgressWeighting>("blend");
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (!open) return;
    const g = initial;
    setTitle(g?.title || "");
    setDescription(g?.description || "");
    setLayer(g?.layer || defaultLayer || "quarterly");
    setCategoryId(g?.categoryId || categories[0]?.id || "");
    setColor(g?.color || "coral");
    setQuarter(g?.quarter || defaultQuarter || currentQuarterKey());
    setYear(g?.year || defaultYear || new Date().getFullYear());
    setLinkedYearlyGoalId(g?.linkedYearlyGoalId);
    setLinkedLongtermGoalId(g?.linkedLongtermGoalId);
    setMetrics(g?.metrics || []);
    setWeeklyTasks(g?.weeklyTasks || []);
  }, [open, initial, defaultLayer, defaultQuarter, defaultYear, categories]);

  // Sync week count to quarter
  useEffect(() => {
    if (layer !== "quarterly") return;
    const tw = quarterInfo(quarter).totalWeeks;
    setWeeklyTasks((prev) => {
      const map = new Map(prev.map((b) => [b.weekNumber, b]));
      return Array.from({ length: tw }, (_, i) => map.get(i + 1) || { weekNumber: i + 1, tasks: [] });
    });
  }, [quarter, layer]);

  const save = () => {
    if (!title.trim() || !categoryId) return;
    const g: Goal = {
      id: initial?.id || uid(),
      title: title.trim(),
      description: description.trim() || undefined,
      layer,
      categoryId,
      color,
      quarter: layer === "quarterly" ? quarter : undefined,
      year: layer === "yearly" ? year : undefined,
      linkedYearlyGoalId: layer === "quarterly" ? linkedYearlyGoalId : undefined,
      linkedLongtermGoalId: layer === "yearly" ? linkedLongtermGoalId : undefined,
      metrics: layer === "longterm" ? [] : metrics,
      weeklyTasks: layer === "quarterly" ? weeklyTasks : [],
      createdAt: initial?.createdAt || Date.now(),
    };
    upsertGoal(g);
    onOpenChange(false);
  };

  const yearlyGoals = goals.filter((g) => g.layer === "yearly");
  const longtermGoals = goals.filter((g) => g.layer === "longterm");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit goal" : "New goal"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you want to achieve?" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional context..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Layer</Label>
              <Select value={layer} onValueChange={(v) => setLayer(v as Layer)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="longterm">Long-term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1 mt-1">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category..."
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      const c = addCategory(newCategoryName.trim());
                      setCategoryId(c.id);
                      setNewCategoryName("");
                    }
                  }}
                >Add</Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Color</Label>
            <div className="flex gap-2 mt-1">
              {COLOR_KEYS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: colorHsl(c),
                    borderColor: c === color ? "hsl(var(--foreground))" : "transparent",
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {layer === "quarterly" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Quarter</Label>
                  <Select value={quarter} onValueChange={setQuarter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {listQuarters().map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Link to yearly goal</Label>
                  <Select value={linkedYearlyGoalId || "none"} onValueChange={(v) => setLinkedYearlyGoalId(v === "none" ? undefined : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {yearlyGoals.map((g) => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {layer === "yearly" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Year</Label>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {listYears().map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Link to long-term goal</Label>
                <Select value={linkedLongtermGoalId || "none"} onValueChange={(v) => setLinkedLongtermGoalId(v === "none" ? undefined : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {longtermGoals.map((g) => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {layer !== "longterm" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Metrics</Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setMetrics([...metrics, { id: uid(), label: "", kind: "number", current: 0, target: 1 }])}
                >
                  <Plus className="w-3 h-3 mr-1" /> Metric
                </Button>
              </div>
              <div className="space-y-2">
                {metrics.map((m) => (
                  <div key={m.id} className="flex gap-2 items-center bg-secondary/30 rounded-lg p-2">
                    <Input
                      value={m.label}
                      onChange={(e) => setMetrics(metrics.map((x) => x.id === m.id ? { ...x, label: e.target.value } : x))}
                      placeholder="Label"
                      className="h-7 text-xs flex-1"
                    />
                    <Select value={m.kind} onValueChange={(v) => setMetrics(metrics.map((x) => x.id === m.id ? { ...x, kind: v as any, target: v === "checkbox" ? 1 : x.target } : x))}>
                      <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                    {m.kind === "number" && (
                      <>
                        <Input
                          type="number"
                          value={m.target}
                          onChange={(e) => setMetrics(metrics.map((x) => x.id === m.id ? { ...x, target: Number(e.target.value) || 0 } : x))}
                          placeholder="Target"
                          className="h-7 text-xs w-20"
                        />
                        <Input
                          value={m.unit || ""}
                          onChange={(e) => setMetrics(metrics.map((x) => x.id === m.id ? { ...x, unit: e.target.value } : x))}
                          placeholder="Unit"
                          className="h-7 text-xs w-16"
                        />
                      </>
                    )}
                    <button onClick={() => setMetrics(metrics.filter((x) => x.id !== m.id))} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {layer === "quarterly" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Weekly tasks</Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    const next = weeklyTasks.length ? Math.max(...weeklyTasks.map((b) => b.weekNumber)) + 1 : 1;
                    setWeeklyTasks([...weeklyTasks, { weekNumber: next, tasks: [] }]);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add week
                </Button>
              </div>
              <div className="space-y-2 mt-1 max-h-72 overflow-y-auto">
                {weeklyTasks.map((b) => (
                  <div key={b.weekNumber} className="bg-secondary/30 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold">Week {b.weekNumber}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => setWeeklyTasks(weeklyTasks.map((x) => x.weekNumber === b.weekNumber ? { ...x, tasks: [...x.tasks, { id: uid(), text: "", done: false }] } : x))}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add task
                      </Button>
                    </div>
                    {b.tasks.length === 0 && (
                      <p className="text-[11px] text-muted-foreground/70 italic px-1">No tasks yet</p>
                    )}
                    {b.tasks.map((t) => (
                      <div key={t.id} className="flex gap-1 items-center">
                        <Input
                          value={t.text}
                          onChange={(e) => setWeeklyTasks(weeklyTasks.map((x) => x.weekNumber === b.weekNumber ? { ...x, tasks: x.tasks.map((y) => y.id === t.id ? { ...y, text: e.target.value } : y) } : x))}
                          placeholder="Task..."
                          className="h-6 text-xs"
                        />
                        <button onClick={() => setWeeklyTasks(weeklyTasks.map((x) => x.weekNumber === b.weekNumber ? { ...x, tasks: x.tasks.filter((y) => y.id !== t.id) } : x))} className="text-muted-foreground hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
                {weeklyTasks.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">No week blocks yet — click "Add week" to start.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{initial?.id ? "Save" : "Create goal"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
