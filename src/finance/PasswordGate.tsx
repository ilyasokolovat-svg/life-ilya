import React, { useState } from "react";

const DASHBOARD_PASSWORD = "ilya2026";

export function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [shake, setShake] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === DASHBOARD_PASSWORD) {
      sessionStorage.setItem("finance_auth", "true");
      onAuth();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setPw("");
    }
  };

  return (
    <div className="fixed inset-0 bg-fin-bg flex items-center justify-center z-50">
      <form
        onSubmit={submit}
        className={`bg-white border border-fin-border rounded-lg px-8 py-7 w-[340px] ${shake ? "animate-shake" : ""}`}
      >
        <div className="text-[11px] uppercase tracking-[0.12em] text-fin-tertiary mb-2">Private</div>
        <h1 className="text-lg text-fin-primary font-sans-fin font-medium mb-6">Finance Dashboard</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
          placeholder="Password"
          className="w-full bg-transparent border-0 border-b-[1.5px] border-fin-border focus:border-fin-blue focus:outline-none py-2 text-fin-primary font-sans-fin"
        />
        <button
          type="submit"
          className="mt-5 w-full bg-fin-primary text-white text-sm py-2 rounded-md hover:opacity-90 transition-opacity font-sans-fin"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
