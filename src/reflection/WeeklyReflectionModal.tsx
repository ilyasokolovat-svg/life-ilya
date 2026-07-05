import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useReflections } from "./storage";
import type { Tri, WeeklyReflection } from "./types";
import { currentIsoWeekKey, currentIsoWeekLabel } from "./utils";
import { ReflectionsView } from "./ReflectionsView";

const OVERALL_OPTIONS: { value: 1 | 2 | 3 | 4 | 5; emoji: string; label: string }[] = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "🙁", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

const TRI_LABELS: Record<"goals" | "health" | "energy", [string, string, string]> = {
  goals: ["Slipped", "Held", "Progress"],
  health: ["Off track", "Okay", "Strong"],
  energy: ["Drained", "Steady", "Sharp"],
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDismiss?: () => void;
}

export function WeeklyReflectionModal({ open, onOpenChange, onDismiss }: Props) {
  const { entries, upsert } = useReflections();
  const weekKey = useMemo(() => currentIsoWeekKey(), []);
  const weekLabel = useMemo(() => currentIsoWeekLabel(), []);
  const existing = entries.find((e) => e.weekKey === weekKey);

  const [overall, setOverall] = useState<1 | 2 | 3 | 4 | 5 | null>(existing?.overall ?? null);
  const [goalsProgress, setGoalsProgress] = useState<Tri>(existing?.goalsProgress ?? 0);
  const [health, setHealth] = useState<Tri>(existing?.health ?? 0);
  const [energy, setEnergy] = useState<Tri>(existing?.energy ?? 0);
  const [note, setNote] = useState<string>(existing?.note ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOverall(existing?.overall ?? null);
    setGoalsProgress(existing?.goalsProgress ?? 0);
    setHealth(existing?.health ?? 0);
    setEnergy(existing?.energy ?? 0);
    setNote(existing?.note ?? "");
    setSaved(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (overall == null) return;
    const entry: WeeklyReflection = {
      weekKey,
      weekLabel,
      overall,
      goalsProgress,
      health,
      energy,
      note: note.trim() || undefined,
      submittedAt: Date.now(),
    };
    upsert(entry);
    setSaved(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-5">
        {saved ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">Saved — here's your streak</DialogTitle>
            </DialogHeader>
            <div className="mt-3">
              <ReflectionsView compact />
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Week of {weekLabel}
                <span className="ml-2 text-xs font-normal text-muted-foreground">· takes ~45 seconds</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Q1 overall */}
              <Section title="How was your week overall?">
                <div className="grid grid-cols-5 gap-2">
                  {OVERALL_OPTIONS.map((o) => (
                    <PickButton
                      key={o.value}
                      selected={overall === o.value}
                      onClick={() => setOverall(o.value)}
                      className="flex-col py-2.5"
                    >
                      <span className="text-2xl leading-none">{o.emoji}</span>
                      <span className="text-[10px] mt-1">{o.label}</span>
                    </PickButton>
                  ))}
                </div>
              </Section>

              <TriRow
                title="Did you move toward your goals?"
                subtitle="Career, money, the $1M plan — net feeling."
                labels={TRI_LABELS.goals}
                value={goalsProgress}
                onChange={setGoalsProgress}
              />

              <TriRow
                title="Health & body"
                subtitle="Training, alcohol, sleep."
                labels={TRI_LABELS.health}
                value={health}
                onChange={setHealth}
              />

              <TriRow
                title="Energy & headspace"
                subtitle="Stress, focus, mood."
                labels={TRI_LABELS.energy}
                value={energy}
                onChange={setEnergy}
              />

              <Section title="One thing that mattered (optional)">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Closed the demo with X — felt like the plan is real."
                  className="resize-none text-sm"
                />
              </Section>
            </div>

            <div className="flex items-center justify-between mt-5">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                onClick={() => { onDismiss?.(); onOpenChange(false); }}
              >
                Later
              </button>
              <Button size="sm" onClick={save} disabled={overall == null}>
                Save week
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium text-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function TriRow({
  title,
  subtitle,
  labels,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  labels: [string, string, string];
  value: Tri;
  onChange: (v: Tri) => void;
}) {
  const opts: Tri[] = [-1, 0, 1];
  return (
    <div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="text-[11px] text-muted-foreground mb-2">{subtitle}</div>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((v, i) => (
          <PickButton key={v} selected={value === v} onClick={() => onChange(v)} className="py-2">
            <span className="text-xs font-medium">{labels[i]}</span>
          </PickButton>
        ))}
      </div>
    </div>
  );
}

function PickButton({
  selected,
  onClick,
  className,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-lg border-2 bg-background transition-all",
        selected
          ? "border-primary text-primary bg-primary/5"
          : "border-border text-foreground hover:border-muted-foreground/40",
        className
      )}
    >
      {children}
    </button>
  );
}
