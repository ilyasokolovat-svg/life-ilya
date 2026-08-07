import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Checkin,
  GoalCategory,
  GoalHorizon,
  GoalMetric,
  GoalQuarter,
  GoalRoutine,
  GoalSettings,
  RoutineLog,
} from "./types";
import { archiveLegacyGoalsV2, seedNorthStars } from "./seed";
import { fetchAutoSources } from "./autoSources";
import { addDays, currentWeekStart, effectiveTarget, lastDayOfMonth, parseISODate, toISODate, weekStart } from "./utils";
import { AED_PER_USD } from "@/wealth/format";

export interface NorthStarsData {
  categories: GoalCategory[];
  horizons: GoalHorizon[];
  quarters: GoalQuarter[];
  metrics: GoalMetric[];
  routines: GoalRoutine[];
  logs: RoutineLog[];
  checkins: Checkin[];
  settings: GoalSettings | null;
}

const empty: NorthStarsData = {
  categories: [],
  horizons: [],
  quarters: [],
  metrics: [],
  routines: [],
  logs: [],
  checkins: [],
  settings: null,
};

export function useNorthStars() {
  const { user } = useAuth();
  const userId = user?.id;
  const [data, setData] = useState<NorthStarsData>(empty);
  const [loading, setLoading] = useState(true);
  const seeding = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const [cats, hor, qs, mets, rts, lgs, cis, st, auto] = await Promise.all([
      supabase.from("goal_categories").select("*").order("sort_order"),
      supabase.from("goal_horizons").select("*").order("sort_order"),
      supabase.from("goal_quarters").select("*").order("start_date"),
      supabase.from("goal_metrics").select("*").order("sort_order"),
      supabase.from("goal_routines").select("*").order("sort_order"),
      supabase.from("routine_log").select("*"),
      supabase.from("checkins").select("*").order("week_start_date", { ascending: false }),
      supabase.from("goal_settings").select("*").maybeSingle(),
      fetchAutoSources(userId),
    ]);

    const quarters = (qs.data || []) as GoalQuarter[];

    // Auto-roll the active quarter forward once the previous one ends.
    const today = toISODate(new Date());
    const rollovers: PromiseLike<unknown>[] = [];
    for (const c of (cats.data || []) as GoalCategory[]) {
      const mine = quarters.filter((q) => q.category_id === c.id);
      const active = mine.find((q) => q.is_active);
      if (active && active.end_date < today) {
        const next = mine
          .filter((q) => q.start_date > active.start_date && q.end_date >= today)
          .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
        if (next) {
          active.is_active = false;
          next.is_active = true;
          rollovers.push(
            supabase.from("goal_quarters").update({ is_active: false }).eq("id", active.id),
            supabase.from("goal_quarters").update({ is_active: true }).eq("id", next.id)
          );
        }
      }
    }
    if (rollovers.length) await Promise.all(rollovers);

    const quarterById = new Map(quarters.map((q) => [q.id, q]));
    const metrics = ((mets.data || []) as GoalMetric[]).map((m) => {
      if (!m.auto_source) return m;
      const isAED = (m.unit || "").trim().toUpperCase() === "AED";
      if (m.auto_source === "net_worth") {
        return { ...m, current_value: isAED ? auto.netWorth * AED_PER_USD : auto.netWorth };
      }
      if (m.auto_source === "debt") {
        return { ...m, current_value: isAED ? auto.debt * AED_PER_USD : auto.debt };
      }
      const q = quarterById.get(m.quarter_id);
      return q ? { ...m, current_value: auto.gymSessions(q.start_date, q.end_date) } : m;
    });

    const routines = (rts.data || []) as GoalRoutine[];
    let logs = (lgs.data || []) as RoutineLog[];

    // Routines with an auto source are computed per week from the source of truth.
    const autoRoutines = routines.filter((r) => r.auto_source === "gym_sessions");
    if (autoRoutines.length) {
      const monday = weekStart();
      const weeks: string[] = [];
      for (let i = 0; i < 26; i++) weeks.push(toISODate(addDays(monday, -7 * i)));
      const kept = logs.filter((l) => !autoRoutines.some((r) => r.id === l.routine_id));
      const synth: RoutineLog[] = [];
      for (const r of autoRoutines) {
        for (const w of weeks) {
          const existing = logs.find((l) => l.routine_id === r.id && l.week_start_date === w);
          synth.push({
            id: existing?.id || `auto-${r.id}-${w}`,
            user_id: userId,
            routine_id: r.id,
            week_start_date: w,
            value: auto.gymSessions(w, toISODate(addDays(parseISODate(w), 6))),
            note: existing?.note ?? null,
            target_snapshot: existing?.target_snapshot ?? r.target_per_week,
          });
        }
      }
      logs = [...kept, ...synth];
    }

    setData({
      categories: (cats.data || []) as GoalCategory[],
      horizons: (hor.data || []) as GoalHorizon[],
      quarters,
      metrics,
      routines,
      logs,
      checkins: (cis.data || []) as Checkin[],
      settings: (st.data as GoalSettings) || null,
    });
    return (cats.data || []).length;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      archiveLegacyGoalsV2();
      const count = await load();
      if (cancelled) return;
      const seededFlag = localStorage.getItem(`northstars_seeded_${userId}`);
      if (count === 0 && !seededFlag && !seeding.current) {
        seeding.current = true;
        try {
          await seedNorthStars(userId);
          localStorage.setItem(`northstars_seeded_${userId}`, "1");
          await load();
        } catch (e) {
          console.error("Seed failed", e);
        } finally {
          seeding.current = false;
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, load]);

  // ---- mutations (all reload afterwards) ----
  const withUser = <T extends object>(row: T) => ({ ...row, user_id: userId as string });

  const api = {
    reload: load,

    updateCategory: async (id: string, patch: Partial<GoalCategory>) => {
      await supabase.from("goal_categories").update(patch).eq("id", id);
      await load();
    },
    addCategory: async (name: string, accent: string, cadence: "weekly" | "monthly") => {
      const sort = data.categories.length;
      const { data: cat } = await supabase
        .from("goal_categories")
        .insert(withUser({ key: name.toLowerCase().replace(/\s+/g, "_"), name, accent_color: accent, cadence, sort_order: sort }))
        .select()
        .single();
      if (cat) {
        const tiers: Array<"five_year" | "three_year" | "one_year"> = ["five_year", "three_year", "one_year"];
        await supabase.from("goal_horizons").insert(
          tiers.map((tier, i) => withUser({ category_id: cat.id, tier, label: "", body: "", sort_order: i }))
        );
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3);
        await supabase.from("goal_quarters").insert(
          withUser({
            category_id: cat.id,
            label: `Q${q + 1} ${now.getFullYear()}`,
            start_date: toISODate(new Date(now.getFullYear(), q * 3, 1)),
            end_date: toISODate(new Date(now.getFullYear(), q * 3 + 3, 0)),
            is_active: true,
          })
        );
      }
      await load();
    },
    deleteCategory: async (id: string) => {
      await supabase.from("goal_categories").delete().eq("id", id);
      await load();
    },

    updateHorizon: async (id: string, patch: Partial<GoalHorizon>) => {
      await supabase.from("goal_horizons").update(patch).eq("id", id);
      await load();
    },

    updateQuarter: async (id: string, patch: Partial<GoalQuarter>) => {
      await supabase.from("goal_quarters").update(patch).eq("id", id);
      await load();
    },
    startNextQuarter: async (quarter: GoalQuarter, label: string, start: string, end: string, copyMetrics: boolean) => {
      const today = toISODate(new Date());
      const startsLater = start > today;
      const { data: q } = await supabase
        .from("goal_quarters")
        .insert(withUser({ category_id: quarter.category_id, label, start_date: start, end_date: end, is_active: !startsLater }))
        .select()
        .single();
      if (q && copyMetrics) {
        const old = data.metrics.filter((m) => m.quarter_id === quarter.id);
        if (old.length) {
          await supabase.from("goal_metrics").insert(
            old.map((m) =>
              withUser({
                quarter_id: q.id,
                name: m.name,
                current_value: 0,
                target_value: m.target_value,
                start_value: 0,
                unit: m.unit,
                direction: m.direction,
                headline_priority: m.headline_priority,
                sort_order: m.sort_order,
                notes: m.notes,
                auto_source: m.auto_source,
              })
            )
          );
        }
      }
      if (!startsLater) {
        await supabase.from("goal_quarters").update({ is_active: false }).eq("id", quarter.id);
      }
      await load();
    },

    addMetric: async (quarterId: string, patch: Partial<GoalMetric>) => {
      const count = data.metrics.filter((m) => m.quarter_id === quarterId).length;
      await supabase.from("goal_metrics").insert(
        withUser({
          quarter_id: quarterId,
          name: patch.name || "New metric",
          current_value: patch.current_value ?? 0,
          target_value: patch.target_value ?? 1,
          start_value: patch.current_value ?? 0,
          unit: patch.unit ?? "",
          direction: patch.direction ?? "up",
          headline_priority: patch.headline_priority ?? count + 1,
          sort_order: count,
          notes: patch.notes ?? null,
          auto_source: patch.auto_source ?? null,
        })
      );
      await load();
    },
    updateMetric: async (id: string, patch: Partial<GoalMetric>) => {
      await supabase.from("goal_metrics").update(patch).eq("id", id);
      await load();
    },
    deleteMetric: async (id: string) => {
      await supabase.from("goal_metrics").delete().eq("id", id);
      await load();
    },

    addRoutine: async (categoryId: string, patch: Partial<GoalRoutine>) => {
      const count = data.routines.filter((r) => r.category_id === categoryId).length;
      await supabase.from("goal_routines").insert(
        withUser({
          category_id: categoryId,
          name: patch.name || "New routine",
          target_per_week: patch.target_per_week ?? 1,
          travel_mode_target: patch.travel_mode_target ?? null,
          is_binary: patch.is_binary ?? true,
          is_active: true,
          sort_order: count,
          notes: patch.notes ?? null,
          auto_source: patch.auto_source ?? null,
        })
      );
      await load();
    },
    updateRoutine: async (id: string, patch: Partial<GoalRoutine>) => {
      await supabase.from("goal_routines").update(patch).eq("id", id);
      await load();
    },
    deleteRoutine: async (id: string) => {
      await supabase.from("goal_routines").delete().eq("id", id);
      await load();
    },

    setRoutineValue: async (routineId: string, value: number, week = currentWeekStart()) => {
      const prev = data.logs.find((l) => l.routine_id === routineId && l.week_start_date === week)?.value ?? 0;
      const routine = data.routines.find((r) => r.id === routineId);
      if (routine?.auto_source) return; // computed from the source of truth
      const target = routine ? effectiveTarget(routine, data.settings) : null;
      await supabase
        .from("routine_log")
        .upsert(withUser({ routine_id: routineId, week_start_date: week, value, target_snapshot: target }), {
          onConflict: "routine_id,week_start_date",
        });

      // Routines linked to a quarterly metric roll their delta into the quarter total.
      const metric = routine?.linked_metric_id
        ? data.metrics.find((m) => m.id === routine.linked_metric_id)
        : null;
      const delta = value - prev;
      if (metric && delta !== 0) {
        await supabase
          .from("goal_metrics")
          .update({ current_value: Math.max(0, metric.current_value + delta) })
          .eq("id", metric.id);
      }
      await load();
    },

    setRoutineNote: async (routineId: string, note: string, week = currentWeekStart()) => {
      const existing = data.logs.find((l) => l.routine_id === routineId && l.week_start_date === week);
      const routine = data.routines.find((r) => r.id === routineId);
      await supabase.from("routine_log").upsert(
        withUser({
          routine_id: routineId,
          week_start_date: week,
          value: existing?.value ?? 0,
          note: note || null,
          target_snapshot: existing?.target_snapshot ?? (routine ? effectiveTarget(routine, data.settings) : null),
        }),
        { onConflict: "routine_id,week_start_date" }
      );
      await load();
    },


    saveCheckin: async (note: string, week = currentWeekStart()) => {
      await supabase
        .from("checkins")
        .upsert(withUser({ week_start_date: week, note }), { onConflict: "user_id,week_start_date" });
      await load();
    },

    updateSettings: async (patch: Partial<GoalSettings>) => {
      if (data.settings) {
        await supabase.from("goal_settings").update(patch).eq("id", data.settings.id);
      } else {
        await supabase.from("goal_settings").insert(withUser({
          travel_mode_active: false,
          next_money_day: toISODate(lastDayOfMonth(new Date())),
          ...patch,
        }));
      }
      await load();
    },
  };

  return { ...data, loading, ready: !!userId, ...api };
}

export type NorthStarsApi = ReturnType<typeof useNorthStars>;
