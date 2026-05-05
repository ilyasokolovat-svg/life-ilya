import React, { useState } from "react";

interface EditableValueProps {
  value: string | number;
  onChange: (v: string) => void;
  editMode: boolean;
  type?: "text" | "number" | "month";
  className?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  mono?: boolean;
}

export function EditableValue({
  value, onChange, editMode, type = "text", className = "", placeholder, prefix, suffix, mono,
}: EditableValueProps) {
  const [local, setLocal] = useState(String(value ?? ""));
  React.useEffect(() => setLocal(String(value ?? "")), [value]);

  const fontClass = mono ? "font-mono-fin" : "";

  if (!editMode) {
    return (
      <span className={`${fontClass} ${className}`}>
        {prefix}{value === "" || value == null ? <span className="text-fin-tertiary italic">—</span> : value}{suffix}
      </span>
    );
  }
  return (
    <input
      type={type}
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onChange(local)}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className={`bg-transparent border-0 border-b border-transparent focus:border-fin-blue focus:outline-none px-0 py-0.5 ${fontClass} ${className}`}
    />
  );
}

interface DeleteButtonProps {
  onDelete: () => void;
}
export function DeleteButton({ onDelete }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  React.useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 2000);
    return () => clearTimeout(t);
  }, [confirming]);
  return (
    <button
      onClick={() => {
        if (confirming) onDelete();
        else setConfirming(true);
      }}
      className={`text-xs px-1.5 py-0.5 rounded ${
        confirming ? "bg-fin-red/10 text-fin-red" : "text-fin-tertiary hover:text-fin-red"
      }`}
      title={confirming ? "Click again to confirm" : "Delete"}
    >
      {confirming ? "Confirm?" : "×"}
    </button>
  );
}

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.12em] text-fin-tertiary font-medium mb-3">
      {children}
    </div>
  );
}

export function FinCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-fin-border rounded-lg p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium font-sans-fin"
      style={{ background: `${color}15`, color }}
    >
      {children}
    </span>
  );
}
