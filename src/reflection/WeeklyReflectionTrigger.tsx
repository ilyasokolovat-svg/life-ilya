import React, { useEffect, useState } from "react";
import { WeeklyReflectionModal } from "./WeeklyReflectionModal";
import { useReflections, dismissForSession, isDismissedForSession } from "./storage";
import { currentIsoWeekKey, isReflectionWindowOpen } from "./utils";

export function WeeklyReflectionTrigger() {
  const { hasForWeek } = useReflections();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const weekKey = currentIsoWeekKey();
    if (!isReflectionWindowOpen()) return;
    if (hasForWeek(weekKey)) return;
    if (isDismissedForSession(weekKey)) return;
    // Small delay so the app has time to render
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [hasForWeek]);

  return (
    <WeeklyReflectionModal
      open={open}
      onOpenChange={setOpen}
      onDismiss={() => dismissForSession(currentIsoWeekKey())}
    />
  );
}
