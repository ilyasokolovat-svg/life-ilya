import React from "react";
import { useCheckinTrigger } from "@/hooks/useCheckinTrigger";
import CheckinModal from "@/components/checkin/CheckinModal";

export function CheckinTrigger() {
  const { dueCheckin, periodKey, showModal, dismiss } = useCheckinTrigger();

  if (!showModal || !dueCheckin) return null;

  return (
    <CheckinModal type={dueCheckin} periodKey={periodKey} onClose={dismiss} />
  );
}
