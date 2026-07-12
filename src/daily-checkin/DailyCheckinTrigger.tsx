import React, { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { DailyCheckinModal } from "./DailyCheckinModal";
import { useDailyCheckinLog, isDismissedToday } from "./storage";
import { isEveningWindow } from "./utils";
import { useAuth } from "@/contexts/AuthContext";

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

  const done = hasToday();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 ${
          done
            ? "bg-card border border-border text-muted-foreground"
            : "bg-gradient-to-r from-orange-500 to-pink-500 text-white animate-pulse"
        }`}
        title="Daily check-in"
      >
        <Flame className="w-4 h-4" />
        <span className="text-sm font-medium">
          {done ? "Checked in ✓" : "Daily check-in"}
        </span>
      </button>
      <DailyCheckinModal open={open} onOpenChange={setOpen} />
    </>
  );
}
