import React, { useEffect, useState } from "react";
import { DailyCheckinModal } from "./DailyCheckinModal";
import { useDailyCheckinLog, isDismissedToday } from "./storage";
import { isEveningWindow } from "./utils";
import { useAuth } from "@/contexts/AuthContext";

// Auto-prompts once per day in the evening. No persistent FAB button —
// users log everything directly in the "Today" card on the dashboard.
export function DailyCheckinTrigger() {
  const { user } = useAuth();
  const { hasToday } = useDailyCheckinLog();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!isEveningWindow()) return;
    if (hasToday()) return;
    if (isDismissedToday()) return;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [user, hasToday]);

  if (!user) return null;
  return <DailyCheckinModal open={open} onOpenChange={setOpen} />;
}
