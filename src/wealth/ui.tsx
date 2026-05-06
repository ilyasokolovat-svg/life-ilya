import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

ChartJS.defaults.color = '#888784';
ChartJS.defaults.font.family = 'Geist, system-ui, sans-serif';
ChartJS.defaults.borderColor = '#2a2a2f';

export const chartColors = {
  bg: '#0c0c0e', surface: '#141416', border: '#2a2a2f', border2: '#3a3a42',
  text: '#f0efe8', muted: '#888784',
  green: '#4ade80', red: '#f87171', amber: '#fbbf24', blue: '#60a5fa', purple: '#a78bfa',
};

export const baseChartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: chartColors.text, font: { size: 11 } } },
    tooltip: {
      backgroundColor: '#1c1c1f', borderColor: '#3a3a42', borderWidth: 1,
      titleColor: chartColors.text, bodyColor: chartColors.text, padding: 10,
    },
  },
  scales: {
    x: { grid: { color: chartColors.border, display: false }, ticks: { color: chartColors.muted, font: { size: 10 } } },
    y: { grid: { color: chartColors.border }, ticks: { color: chartColors.muted, font: { size: 10 } } },
  },
};

// utility classes
export const card = "bg-w-surface border border-w-border rounded-[14px] p-5";
export const card2 = "bg-w-surface2 border border-w-border rounded-[8px] p-4";
export const kpi = "bg-w-surface border border-w-border rounded-[14px] p-4";
export const inputCls = "bg-w-surface2 border border-w-border rounded-[8px] px-3 py-2 text-w-text font-mono-w text-sm focus:outline-none focus:border-w-border2 w-full";
export const btn = "px-4 py-2 rounded-[8px] text-sm border border-w-border bg-w-surface2 text-w-text hover:bg-w-surface3 transition-colors";
export const btnPrimary = "px-4 py-2 rounded-[8px] text-sm border border-w-green bg-w-green/10 text-w-green hover:bg-w-green/20 transition-colors";
export const btnAmber = "px-4 py-2 rounded-[8px] text-sm border border-w-amber bg-w-amber/10 text-w-amber hover:bg-w-amber/20 transition-colors";

export const Heading: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) =>
  <h1 className={`font-serif-w text-w-text ${className}`}>{children}</h1>;

export const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) =>
  <div className={`text-[11px] uppercase tracking-[0.12em] text-w-muted ${className}`}>{children}</div>;

export const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) =>
  <span className={`font-mono-w ${className}`}>{children}</span>;

export const KpiCard: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'default' | 'green' | 'red' | 'amber' }> = ({ label, value, sub, tone = 'default' }) => {
  const toneCls = tone === 'green' ? 'text-w-green' : tone === 'red' ? 'text-w-red' : tone === 'amber' ? 'text-w-amber' : 'text-w-text';
  return (
    <div className={kpi}>
      <Label>{label}</Label>
      <div className={`mt-2 font-mono-w text-2xl ${toneCls}`}>{value}</div>
      {sub != null && <div className="mt-1 text-xs text-w-muted">{sub}</div>}
    </div>
  );
};

export const Empty: React.FC<{ msg?: string; cta?: React.ReactNode }> = ({ msg = "No data yet — log your first month to get started", cta }) => (
  <div className="border border-dashed border-w-border rounded-[8px] p-8 text-center">
    <div className="text-sm text-w-muted">{msg}</div>
    {cta && <div className="mt-3">{cta}</div>}
  </div>
);

export const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-3 py-1.5 text-sm rounded-[8px] transition-colors ${active ? 'bg-w-surface2 text-w-text border border-w-border' : 'text-w-muted hover:text-w-text border border-transparent'}`}>{children}</button>
);

export const Toast: React.FC<{ msg: string; onClose: () => void }> = ({ msg, onClose }) => {
  React.useEffect(() => { const t = setTimeout(onClose, 2400); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-w-surface border border-w-green rounded-[8px] px-4 py-3 text-sm text-w-green">{msg}</div>
  );
};
