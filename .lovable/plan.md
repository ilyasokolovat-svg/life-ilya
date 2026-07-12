# Make Priority Streaks Impossible to Forget

Streaks currently live at the bottom of Healthy Life. We'll surface them in three complementary places and add a short evening check-in that covers streaks plus the 4 core daily habits — so one 20-second tap session updates everything.

---

## 1. Persistent header strip (every page)

A slim strip inside the existing top bar (right side of `Dashboard.tsx` header — and reused on every page that renders `DashboardSidebar`, so we'll lift it into a shared `AppShell` layout wrapper).

Layout: one small pill per priority streak habit + one pill per core habit (sleep, gym, sober, mindfulness).

```text
[💪 Gym ●●●○●●●] [🚫 Alcohol ●●●●●●○] [😴 7.5h] [🧘 ✓]    [ Daily check-in ]
```

- Each pill = last 7 days as dots (filled = done). Today's dot pulses if not yet marked.
- Click a pill = toggle today's status inline (optimistic update to Supabase `habit_days` / localStorage `streakHabits`).
- "Daily check-in" button opens the modal (see §3).
- Collapses to just the check-in button + a count "3/6 today" below 768px.

## 2. Dashboard card (top of `/`)

Move `HabitStreakSummary` and streak habits above the Non-Negotiable card. New unified `TodayStreaksCard`:

- Big header: "Today — {weekday, date}" + streak count "🔥 12-day streak"
- Row of large tappable tiles, one per habit (streaks + 4 core), showing:
  - Icon + name
  - Current streak length
  - Today's status: ✓ done / ○ pending / ✗ missed
  - Tap = toggle today
- Below: existing 7-day mini-grid from `HabitStreakSummary` for context.

## 3. Evening daily check-in modal (after 6pm Dubai time)

New module `src/daily-checkin/` mirroring `src/reflection/` architecture.

**Trigger** (`DailyCheckinTrigger.tsx`, mounted in `App.tsx` next to `WeeklyReflectionTrigger`):
- Fires when: current Dubai time ≥ 18:00 AND no check-in stored for today's ISO date AND not dismissed this session.
- Re-prompts next visit until submitted.
- Also openable manually from the header "Daily check-in" button any time of day.

**Modal** (`DailyCheckinModal.tsx`) — one screen, ~20 seconds:

```text
┌──────────────────────────────────────┐
│ Daily check-in · Sun, Jul 12         │
│                                      │
│ SLEEP        [ 7.5 h ] [😊 rested]   │
│ GYM          [ ✓ full ] [hiit][walk] │
│ ALCOHOL      [🚫 sober] [🍷 anchor]  │
│ MINDFULNESS  [ ✓ ]                   │
│ ──────────────────────────────────── │
│ PRIORITY STREAKS                     │
│  • No sugar    [ ✓ ] [ ✗ ]           │
│  • Reading     [ ✓ ] [ ✗ ]           │
│                                      │
│ 🔥 12-day streak — don't break it    │
│                                      │
│         [ Later ]   [ Save ]         │
└──────────────────────────────────────┘
```

- All fields pre-filled with today's current values (edits, doesn't overwrite prior taps).
- Save writes to `habit_days` (core habits) + `streakHabits` localStorage (priority streaks) + `daily_checkin` localStorage log (so we can compute streak-of-checkins itself).
- Reward on save: brief inline "🔥 12 days — nice" pulse, then close.

## 4. Storage & data

- Core habits: existing `habit_days` table + `useSupabaseHabits` hook.
- Priority streaks: existing `useStreakHabits` (localStorage). No schema changes.
- Check-in log: new `localStorage['daily_checkin']` = `{ [isoDate]: { savedAt } }` to power the "did I check in today" flag and a check-in streak count.

## 5. Files

New:
- `src/daily-checkin/types.ts`
- `src/daily-checkin/storage.ts`
- `src/daily-checkin/utils.ts` (Dubai-time "after 6pm" + "today submitted" checks)
- `src/daily-checkin/DailyCheckinModal.tsx`
- `src/daily-checkin/DailyCheckinTrigger.tsx`
- `src/components/dashboard/HeaderStreakStrip.tsx` (the persistent strip)
- `src/components/dashboard/TodayStreaksCard.tsx` (the dashboard card)

Modified:
- `src/App.tsx` — mount `<DailyCheckinTrigger />`.
- `src/pages/Dashboard.tsx` — replace `HabitStreakSummary` with `TodayStreaksCard` at the top; keep sidebar/layout otherwise unchanged.
- Top-bar header in `Dashboard.tsx` (and, to appear on every page, lift the header into a small shared `AppTopBar` used by pages that currently render their own header — for now just Dashboard + Healthy Life to keep scope tight) — render `<HeaderStreakStrip />`.
- `src/components/StreakHabits.tsx` — unchanged for management (add/remove); still available in Healthy Life tab.

Design tokens only (no hardcoded hex). Light theme, matches existing dashboard aesthetic.

## 6. Out of scope

- No changes to weekly reflection module.
- No changes to Supabase tables.
- Header strip rolls out to Dashboard + Healthy Life first; we can extend to other pages later if you want it truly everywhere.
