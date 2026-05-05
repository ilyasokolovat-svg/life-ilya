import React, { useEffect, useState } from "react";
import { PasswordGate } from "@/finance/PasswordGate";
import {
  useFinanceData, Overview, NetWorthSection, HoldingsSection,
  AllocationSection, ExpenseSection, DisciplineSection, IncomeSection, BudgetSection,
} from "@/finance/sections";

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "networth", label: "Net Worth" },
  { id: "holdings", label: "Holdings" },
  { id: "allocation", label: "Allocation" },
  { id: "expenses", label: "Expense Planner" },
  { id: "discipline", label: "Discipline" },
  { id: "income", label: "Income" },
  { id: "budget", label: "Budget" },
];

export default function Finance() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("finance_auth") === "true");
  const ctx = useFinanceData();
  const [active, setActive] = useState("overview");
  const [savedAt, setSavedAt] = useState<string>("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handler = () => setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    window.addEventListener("finance-saved", handler);
    return () => window.removeEventListener("finance-saved", handler);
  }, []);

  useEffect(() => {
    if (!authed) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.25, 0.5] }
    );
    NAV.forEach(n => { const el = document.getElementById(n.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [authed]);

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-fin-bg font-sans-fin text-fin-primary">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-fin-border px-4 py-3 flex items-center justify-between">
        <div className="text-sm font-medium">Finance</div>
        <button onClick={() => setMobileNavOpen(o => !o)} className="text-xs text-fin-blue">
          {mobileNavOpen ? "Close" : "Menu"}
        </button>
      </div>
      {mobileNavOpen && (
        <div className="md:hidden bg-white border-b border-fin-border px-4 py-2">
          {NAV.map(n => (
            <button key={n.id} onClick={() => scrollTo(n.id)} className="block w-full text-left py-1.5 text-sm text-fin-secondary">{n.label}</button>
          ))}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[200px] bg-white border-r border-fin-border z-30">
          <div className="px-5 py-5 border-b border-fin-border">
            <div className="text-[11px] uppercase tracking-[0.12em] text-fin-tertiary">Private</div>
            <div className="text-base font-medium font-sans-fin mt-1">Finance</div>
          </div>
          <nav className="flex-1 py-3">
            {NAV.map(n => {
              const isActive = active === n.id;
              return (
                <button
                  key={n.id} onClick={() => scrollTo(n.id)}
                  className={`block w-full text-left px-5 py-2 text-sm transition-colors border-l-[3px] ${
                    isActive ? "border-fin-blue text-fin-primary" : "border-transparent text-fin-secondary hover:text-fin-primary"
                  }`}
                >{n.label}</button>
              );
            })}
          </nav>
          <div className="px-5 py-4 border-t border-fin-border space-y-2">
            <button
              onClick={() => ctx.setEdit(!ctx.edit)}
              className={`w-full text-xs px-3 py-1.5 rounded-full border transition-colors ${
                ctx.edit ? "bg-fin-blue text-white border-fin-blue" : "border-fin-border text-fin-secondary hover:border-fin-blue hover:text-fin-blue"
              }`}
            >Edit mode {ctx.edit ? "ON" : "OFF"}</button>
            <div className="text-[10px] text-fin-tertiary text-center">
              {savedAt ? `Saved · ${savedAt}` : "Auto-save enabled"}
            </div>
            <a href="/" className="block text-[10px] text-fin-tertiary text-center hover:text-fin-blue">← back to dashboard</a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-[200px] px-4 md:px-10 py-6 max-w-5xl">
          {ctx.edit && (
            <div className="md:hidden mb-4">
              <button
                onClick={() => ctx.setEdit(false)}
                className="text-xs px-3 py-1.5 rounded-full bg-fin-blue text-white"
              >Edit mode ON — tap to disable</button>
            </div>
          )}
          <div className={ctx.edit ? "[&_section]:outline [&_section]:outline-1 [&_section]:outline-dashed [&_section]:outline-fin-border [&_section]:outline-offset-4 [&_section]:rounded" : ""}>
            <Overview ctx={ctx} />
            <NetWorthSection ctx={ctx} />
            <HoldingsSection ctx={ctx} />
            <AllocationSection ctx={ctx} />
            <ExpenseSection ctx={ctx} />
            <DisciplineSection ctx={ctx} />
            <IncomeSection ctx={ctx} />
            <BudgetSection ctx={ctx} />
          </div>
        </main>
      </div>
    </div>
  );
}
