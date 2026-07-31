import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InlineTextProps {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function InlineText({
  value,
  onSave,
  multiline,
  placeholder = "Click to edit…",
  className,
  inputClassName,
}: InlineTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const el = ref.current as HTMLTextAreaElement;
      el.setSelectionRange?.(el.value.length, el.value.length);
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    const shared = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
        if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          commit();
        }
      },
      className: cn(
        "w-full bg-background border border-primary/40 rounded-md px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary/40",
        inputClassName
      ),
    };
    return multiline ? (
      <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} rows={Math.max(2, Math.ceil(draft.length / 70))} {...shared} />
    ) : (
      <input ref={ref as React.RefObject<HTMLInputElement>} {...shared} />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
      className={cn(
        "cursor-text rounded-sm hover:bg-secondary/60 transition-colors whitespace-pre-wrap",
        !value && "text-muted-foreground italic",
        className
      )}
    >
      {value || placeholder}
    </span>
  );
}

interface InlineNumberProps {
  value: number;
  onSave: (v: number) => void;
  className?: string;
  suffix?: string;
}

export function InlineNumber({ value, onSave, className, suffix }: InlineNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    setEditing(false);
    const n = Number(draft);
    if (!Number.isNaN(n) && n !== value) onSave(n);
  };

  if (editing) {
    return (
      <input
        type="number"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className={cn(
          "w-20 bg-background border border-primary/40 rounded-md px-1.5 py-0.5 text-sm outline-none",
          className
        )}
      />
    );
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={cn("cursor-text rounded-sm hover:bg-secondary/60 px-0.5 tabular-nums", className)}
    >
      {value.toLocaleString()}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}
