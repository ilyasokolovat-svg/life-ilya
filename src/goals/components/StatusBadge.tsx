import React from "react";
import { Status } from "../types";
import { STATUS_COLOR, STATUS_LABEL } from "../utils";

export function StatusBadge({ status }: { status: Status }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
