import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import {
  GoalProgress,
  GoalRecord,
  GoalSubcategory,
  ProgressType,
  MilestoneItem,
} from "@/hooks/useGoalsSystem";

interface GoalExpandPanelProps {
  goal?: GoalRecord | null;
  periodType: "quarter" | "year";
  periodKey: string;
  annualGoals?: GoalRecord[];
  onSave: (data: {
    id?: string;
    category: string;
    subcategory: string;
    period_type: string;
    period_key: string;
    planned_goal: string;
    actual_result: GoalProgress;
  }) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
}

const defaultProgress: GoalProgress = {
  progress_type: "percentage",
  current_value: 0,
  target_value: 100,
  milestones: [],
  self_rating: 0,
  prev_rating: 0,
  quarterly_action: "",
  annual_goal_id: null,
  completed: false,
  notes: "",
};

export function GoalExpandPanel({
  goal,
  periodType,
  periodKey,
  annualGoals = [],
  onSave,
  onDelete,
  onCancel,
}: GoalExpandPanelProps) {
  const [name, setName] = useState(goal?.planned_goal || "");
  const [subcategory, setSubcategory] = useState<GoalSubcategory>(goal?.subcategory || "physical");
  const [progress, setProgress] = useState<GoalProgress>(goal?.actual_result || { ...defaultProgress });
  const [showTypeWarning, setShowTypeWarning] = useState(false);
  const [pendingType, setPendingType] = useState<ProgressType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.planned_goal);
      setSubcategory(goal.subcategory);
      setProgress(goal.actual_result || { ...defaultProgress });
    }
  }, [goal?.id]);

  const handleTypeChange = (newType: ProgressType) => {
    if (goal?.actual_result && newType !== progress.progress_type) {
      setPendingType(newType);
      setShowTypeWarning(true);
    } else {
      setProgress({ ...progress, progress_type: newType, current_value: 0, target_value: newType === "percentage" ? 100 : 0, milestones: [], self_rating: 0 });
    }
  };

  const confirmTypeChange = () => {
    if (pendingType) {
      setProgress({ ...progress, progress_type: pendingType, current_value: 0, target_value: pendingType === "percentage" ? 100 : 0, milestones: [], self_rating: 0 });
    }
    setShowTypeWarning(false);
    setPendingType(null);
  };

  const addMilestone = () => {
    setProgress({
      ...progress,
      milestones: [...(progress.milestones || []), { id: crypto.randomUUID(), text: "", done: false }],
    });
  };

  const updateMilestone = (id: string, updates: Partial<MilestoneItem>) => {
    setProgress({
      ...progress,
      milestones: progress.milestones.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    });
  };

  const removeMilestone = (id: string) => {
    setProgress({
      ...progress,
      milestones: progress.milestones.filter((m) => m.id !== id),
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: goal?.id,
      category: periodType === "quarter" ? "quarterly_goal" : "annual_goal",
      subcategory,
      period_type: periodType,
      period_key: periodKey,
      planned_goal: name.trim(),
      actual_result: progress,
    });
  };

  return (
    <div className="bg-card/60 border-t border-border p-4 space-y-4 animate-fade-in">
      {/* Name */}
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Goal name..."
        autoFocus
        className="text-sm font-medium"
      />

      {/* Category + Progress type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Category</label>
          <Select value={subcategory} onValueChange={(v) => setSubcategory(v as GoalSubcategory)}>
            <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="skills">Skills</SelectItem>
              <SelectItem value="personal">Personal Growth</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Progress Type</label>
          <Select value={progress.progress_type} onValueChange={(v) => handleTypeChange(v as ProgressType)}>
            <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="numeric">Numeric</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="self_rating">Self-rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Type change warning */}
      {showTypeWarning && (
        <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/20 rounded-lg text-xs">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-muted-foreground">Changing progress type will reset your current progress</span>
          <Button size="sm" variant="outline" className="h-6 text-xs ml-auto" onClick={confirmTypeChange}>Confirm</Button>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowTypeWarning(false)}>Cancel</Button>
        </div>
      )}

      {/* Progress inputs */}
      {progress.progress_type === "numeric" && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground mb-1 block">Current</label>
            <Input type="number" value={progress.current_value || ""} onChange={(e) => setProgress({ ...progress, current_value: Number(e.target.value) })} className="h-9 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-muted-foreground mb-1 block">Target</label>
            <Input type="number" value={progress.target_value || ""} onChange={(e) => setProgress({ ...progress, target_value: Number(e.target.value) })} className="h-9 text-sm" />
          </div>
        </div>
      )}

      {progress.progress_type === "percentage" && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(progress.current_value || 0)}%</span>
          </div>
          <Slider value={[progress.current_value || 0]} max={100} step={1} onValueChange={([v]) => setProgress({ ...progress, current_value: v })} />
        </div>
      )}

      {progress.progress_type === "milestone" && (
        <div className="space-y-2">
          {progress.milestones?.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Checkbox checked={m.done} onCheckedChange={(v) => updateMilestone(m.id, { done: !!v })} />
              <Input value={m.text} onChange={(e) => updateMilestone(m.id, { text: e.target.value })} placeholder="Milestone..." className="h-8 text-sm flex-1" />
              <button onClick={() => removeMilestone(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button onClick={addMilestone} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add milestone</button>
        </div>
      )}

      {progress.progress_type === "self_rating" && (
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Rating (1-10)</label>
          <Input type="number" min={1} max={10} value={progress.self_rating || ""} onChange={(e) => setProgress({ ...progress, self_rating: Number(e.target.value) })} className="h-9 text-sm w-24" />
          {progress.prev_rating > 0 && (
            <p className="text-[11px] text-muted-foreground mt-1">Last quarter: {progress.prev_rating}</p>
          )}
        </div>
      )}

      {/* Quarterly action */}
      {periodType === "quarter" && (
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Quarterly action</label>
          <Input value={progress.quarterly_action || ""} onChange={(e) => setProgress({ ...progress, quarterly_action: e.target.value })} placeholder="What specific behaviour moves this goal this quarter?" className="h-9 text-sm" />
        </div>
      )}

      {/* Link to annual goal */}
      {periodType === "quarter" && annualGoals.length > 0 && (
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Link to annual goal</label>
          <Select value={progress.annual_goal_id || "none"} onValueChange={(v) => setProgress({ ...progress, annual_goal_id: v === "none" ? null : v })}>
            <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              {annualGoals.map((ag) => (
                <SelectItem key={ag.id} value={ag.id}>{ag.planned_goal}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes (annual) */}
      {periodType === "year" && (
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Notes</label>
          <Textarea value={progress.notes || ""} onChange={(e) => setProgress({ ...progress, notes: e.target.value })} placeholder="What does achieving this actually mean for your life?" className="text-sm min-h-[60px]" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          {goal?.id && !showDeleteConfirm && (
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
          )}
          {showDeleteConfirm && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Delete this goal?</span>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { onDelete?.(goal!.id); setShowDeleteConfirm(false); }}>Confirm</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            </div>
          )}
        </div>
        <Button size="sm" onClick={handleSave} disabled={!name.trim()} className="bg-success hover:bg-success/90 text-white">Save</Button>
      </div>
    </div>
  );
}
