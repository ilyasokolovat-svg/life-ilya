import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Flame, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNorthStars } from "../useNorthStars";
import { CategoryTimeline } from "../components/CategoryTimeline";
import { CheckinModal } from "../components/CheckinModal";
import { NorthStarsSettings } from "../components/NorthStarsSettings";
import { SegmentBar } from "../components/SegmentBar";
import {
  categoryEmoji,
  checkinStreak,
  quarterProgress,
  routineProgress,
  travelModeOn,
} from "../utils";

export default function NorthStars() {
  const ns = useNorthStars();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checkin, setCheckin] = useState(false);
  const [moneyDayFor, setMoneyDayFor] = useState<string | null>(null);

  const streak = useMemo(() => checkinStreak(ns.checkins), [ns.checkins]);
  const travel = travelModeOn(ns.settings);


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">North Stars</h1>
          <div className="ml-auto flex items-center gap-2">
            {travel && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                <Plane className="w-3 h-3" /> Travel mode
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
              <Flame className="w-3 h-3" /> {streak} wk
            </span>
            <Button size="sm" className="h-8 text-xs" onClick={() => setCheckin(true)}>
              Weekly check-in
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {ns.loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {ns.categories.map((c) => {
          const q = ns.quarters.find((x) => x.category_id === c.id && x.is_active);
          const metrics = q ? ns.metrics.filter((m) => m.quarter_id === q.id) : [];
          const qp = quarterProgress(metrics);
          const pct = Math.round(qp.pct * 100);
          const rp = routineProgress(
            ns.routines.filter((r) => r.category_id === c.id),
            ns.logs,
            ns.settings
          );
          const isOpen = expanded === c.id;
          return (
            <section key={c.id} className="border border-border rounded-xl bg-card overflow-hidden">
              <button
                className="w-full text-left px-4 py-3.5 flex items-center gap-3"
                onClick={() => setExpanded(isOpen ? null : c.id)}
              >
                <span className="text-xl leading-none shrink-0">{categoryEmoji(c)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <span className="text-[11px] text-muted-foreground">{q?.label}</span>
                  </div>
                  {qp.total ? (
                    <>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {qp.done}/{qp.total} quarter goals hit
                        {c.cadence === "weekly" && rp.total ? ` · weekly ${rp.done}/${rp.total}` : ""}
                      </p>
                      <div className="mt-1.5">
                        <SegmentBar parts={qp.parts} color={c.accent_color} height={5} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">No metrics yet</p>
                  )}
                </div>
                <span className="text-xs font-medium text-foreground tabular-nums w-10 text-right">{pct}%</span>
                <ChevronDown
                  className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border">
                  <CategoryTimeline category={c} ns={ns} onMoneyDay={() => setMoneyDayFor(c.id)} />
                </div>
              )}
            </section>
          );
        })}

        <NorthStarsSettings ns={ns} />
      </main>

      <CheckinModal open={checkin} onOpenChange={setCheckin} ns={ns} />
      <CheckinModal
        open={!!moneyDayFor}
        onOpenChange={(o) => !o && setMoneyDayFor(null)}
        ns={ns}
        onlyCategoryId={moneyDayFor}
        moneyDay
      />
    </div>
  );
}
