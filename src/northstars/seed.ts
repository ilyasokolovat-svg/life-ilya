import { supabase } from "@/integrations/supabase/client";
import { lastDayOfMonth, toISODate } from "./utils";

type SeedMetric = {
  name: string;
  current: number;
  target: number;
  unit: string;
  direction: "up" | "down";
  priority: number;
  notes?: string;
};

type SeedRoutine = {
  name: string;
  target: number;
  travel?: number | null;
  binary: boolean;
  notes?: string;
};

type SeedCategory = {
  key: string;
  name: string;
  accent: string;
  cadence: "weekly" | "monthly";
  horizons: { tier: "five_year" | "three_year" | "one_year"; label: string; body: string }[];
  quarter: { label: string; start: string; end: string };
  metrics: SeedMetric[];
  routines: SeedRoutine[];
};

const QUARTER = { label: "Q3 2026", start: "2026-07-01", end: "2026-09-30" };

const SEED: SeedCategory[] = [
  {
    key: "personal",
    name: "Personal",
    accent: "#e0725f",
    cadence: "weekly",
    horizons: [
      {
        tier: "five_year",
        label: "mid-2031",
        body: "Married, two kids, physically strong, genuinely happy, work that does not eat life, and two bases we both love.",
      },
      {
        tier: "three_year",
        label: "mid-2029",
        body: "Married. First child born or on the way. Second base chosen and actually tested, lived there a month or more. Training is identity, not effort.",
      },
      {
        tier: "one_year",
        label: "mid-2027",
        body: "Twelve plus months in, and I know clearly whether this is the person, with an engagement or a mutual timeline said out loud. Tier 2 conversations done (timeline, wedding scale and budget number, money philosophy, the specific city). Sport habit unbroken for twelve months.",
      },
    ],
    quarter: QUARTER,
    metrics: [
      {
        name: "Tier 1 conversations had",
        current: 0,
        target: 3,
        unit: "",
        direction: "up",
        priority: 1,
        notes:
          "Directional and low stakes: do you want kids and roughly when, would you ever live outside Dubai, what does your ideal life look like in five years. Curious conversations, not negotiations. The location one feeds the Q4 relocation decision.",
      },
      {
        name: "Training sessions",
        current: 0,
        target: 22,
        unit: "sessions",
        direction: "up",
        priority: 2,
        notes: "Adjusted down for the China trip, 27 Aug to 20 Sep.",
      },
      {
        name: "Alcohol protocol weeks",
        current: 0,
        target: 9,
        unit: "weeks",
        direction: "up",
        priority: 3,
        notes:
          "Zero Sun to Thu, max 2 Friday, max 2 Saturday. Decide the travel rule before the trip, not during it.",
      },
    ],
    routines: [
      { name: "3 training sessions", target: 3, travel: 2, binary: false },
      { name: "Alcohol protocol", target: 1, binary: true },
      {
        name: "One planned evening together",
        target: 1,
        binary: true,
        notes: "Planned, not default time together.",
      },
    ],
  },
  {
    key: "professional",
    name: "Professional",
    accent: "#4f7fd4",
    cadence: "weekly",
    horizons: [
      {
        tier: "five_year",
        label: "mid-2031",
        body: "VP or Head of at a Tier 1 firm, or a company of my own in a niche I love. Known for one specific thing.",
      },
      {
        tier: "three_year",
        label: "mid-2029",
        body: "Senior leadership seat with team scope at a Tier 1 firm, or my own business past meaningful revenue. People come to me for a named domain. If the own company path is real it has to start before the first child, so the window is 2027 to 2029.",
      },
      {
        tier: "one_year",
        label: "mid-2027",
        body: "In a $250K+ OTE institutional fintech or crypto seat, external or a fixed B2Broker. Specialization narrowed to one named niche. One side venture actually tested with real customers, success optional. This is the goal that decides whether $1M is 2031 or 2034.",
      },
    ],
    quarter: QUARTER,
    metrics: [
      {
        name: "B2Broker comp resolved",
        current: 0,
        target: 1,
        unit: "",
        direction: "up",
        priority: 1,
        notes:
          "CEO conversation: 42K AED base bridge for 2 to 3 quarters, SaaS carve-out, clarity on SaaS crediting and the 50% gate.",
      },
      { name: "Publish decision by 31 Aug", current: 0, target: 1, unit: "", direction: "up", priority: 2 },
      { name: "High priority targets untouched", current: 25, target: 0, unit: "", direction: "down", priority: 3 },
      { name: "Live interview processes", current: 0, target: 2, unit: "", direction: "up", priority: 4 },
    ],
    routines: [
      { name: "Search block done", target: 5, travel: 2, binary: false },
      { name: "Warm intro sent", target: 1, binary: false },
      { name: "Friday pipeline and search review", target: 1, binary: true },
    ],
  },
  {
    key: "financial",
    name: "Financial",
    accent: "#3fa88b",
    cadence: "monthly",
    horizons: [
      {
        tier: "five_year",
        label: "mid-2031",
        body: "$420K to $500K base case, $1M if the income jump lands early or an equity event hits. Income above $250K. Savings rate above 50%. One property owned, or a deliberate decision not to. Note: two properties plus $1M by 2031 is not realistic, pick one.",
      },
      {
        tier: "three_year",
        label: "mid-2029",
        body: "Around $180K net worth. Consumer debt gone permanently. Saving $6K to $8K a month. One big trip a year, not three.",
      },
      {
        tier: "one_year",
        label: "mid-2027",
        body: "$75K to $95K if the income move lands, $60K to $65K if it does not. Card debt cleared and staying cleared. Six consecutive months of actual saving. Every year the income jump slips pushes the $1M date out by about a year.",
      },
    ],
    quarter: QUARTER,
    metrics: [
      {
        name: "Real debt (card minus bank)",
        current: 52000,
        target: 40000,
        unit: "AED",
        direction: "down",
        priority: 1,
        notes: "Track real debt, not the SMS number. Card balance minus bank balance.",
      },
      {
        name: "Net worth",
        current: 40000,
        target: 45000,
        unit: "USD",
        direction: "up",
        priority: 2,
        notes:
          "Investments minus card debt. Car loan excluded. This becomes the headline automatically once real debt reaches zero.",
      },
      {
        name: "China trip spend",
        current: 0,
        target: 18000,
        unit: "AED",
        direction: "down",
        priority: 3,
        notes: "Cap. 27 Aug to 20 Sep.",
      },
      {
        name: "19 Aug statement cleared, no installments",
        current: 0,
        target: 1,
        unit: "",
        direction: "up",
        priority: 4,
        notes:
          "Wio cash advance as a short bridge if the bonus comes in at $3K. Never convert the ENBD balance to installments at 3.2% a month.",
      },
    ],
    routines: [],
  },
];

export async function seedNorthStars(userId: string) {
  for (let ci = 0; ci < SEED.length; ci++) {
    const c = SEED[ci];
    const { data: cat, error } = await supabase
      .from("goal_categories")
      .insert({
        user_id: userId,
        key: c.key,
        name: c.name,
        accent_color: c.accent,
        cadence: c.cadence,
        sort_order: ci,
      })
      .select()
      .single();
    if (error || !cat) throw error;

    await supabase.from("goal_horizons").insert(
      c.horizons.map((h, i) => ({
        user_id: userId,
        category_id: cat.id,
        tier: h.tier,
        label: h.label,
        body: h.body,
        sort_order: i,
      }))
    );

    const { data: q } = await supabase
      .from("goal_quarters")
      .insert({
        user_id: userId,
        category_id: cat.id,
        label: c.quarter.label,
        start_date: c.quarter.start,
        end_date: c.quarter.end,
        is_active: true,
      })
      .select()
      .single();

    if (q) {
      await supabase.from("goal_metrics").insert(
        c.metrics.map((m, i) => ({
          user_id: userId,
          quarter_id: q.id,
          name: m.name,
          current_value: m.current,
          target_value: m.target,
          start_value: m.current,
          unit: m.unit,
          direction: m.direction,
          headline_priority: m.priority,
          sort_order: i,
          notes: m.notes ?? null,
        }))
      );
    }

    if (c.routines.length) {
      await supabase.from("goal_routines").insert(
        c.routines.map((r, i) => ({
          user_id: userId,
          category_id: cat.id,
          name: r.name,
          target_per_week: r.target,
          travel_mode_target: r.travel ?? null,
          is_binary: r.binary,
          is_active: true,
          sort_order: i,
          notes: r.notes ?? null,
        }))
      );
    }
  }

  await supabase.from("goal_settings").insert({
    user_id: userId,
    travel_mode_active: false,
    next_money_day: toISODate(lastDayOfMonth(new Date())),
    todoist_note:
      "Daily tasks live in Todoist. This app holds weekly routines, quarterly numbers and the review.",
  });
}

/** Archive (never migrate) the legacy Goals V2 localStorage blob. */
export function archiveLegacyGoalsV2() {
  try {
    const raw = localStorage.getItem("goals_v2_data");
    if (raw) {
      localStorage.setItem(`goals_v2_data_archived_${Date.now()}`, raw);
      localStorage.removeItem("goals_v2_data");
    }
  } catch {
    /* ignore */
  }
}
