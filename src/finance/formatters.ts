export const fmtMoney = (n: number, opts: { sign?: boolean } = {}) => {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(Math.round(n));
  const formatted = `$${abs.toLocaleString("en-US")}`;
  if (n < 0) return `\u2212${formatted}`;
  return opts.sign && n > 0 ? `+${formatted}` : formatted;
};

export const fmtMoneyShort = (n: number) => {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "\u2212" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}$${abs}`;
};

export const fmtPct = (n: number, digits = 1) => {
  if (n == null || isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
};

export const fmtMonth = (date: string) => {
  if (!date) return "";
  const [y, m] = date.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${y}`;
};

export const currentYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
