import React, { useEffect, useMemo, useState, useRef } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Plus, Briefcase, Trash2, Calendar as CalendarIcon, AlertCircle, Users, Target, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format, differenceInWeeks, differenceInDays, startOfWeek, parseISO, isBefore } from "date-fns";

// ================= constants =================
const LOCATIONS = ["Dubai", "Hong Kong", "Other"] as const;
type Location = typeof LOCATIONS[number];

const LOCATION_STYLES: Record<Location, { dot: string; bg: string; text: string; border: string }> = {
  "Dubai":     { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Hong Kong": { dot: "bg-rose-500",  bg: "bg-rose-50",  text: "text-rose-700",  border: "border-rose-200" },
  "Other":     { dot: "bg-slate-500", bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

const OPPORTUNITY_TYPES = ["External role", "Internal path", "Equity/Partnership", "Business venture"] as const;
type OppType = typeof OPPORTUNITY_TYPES[number];

const STAGES = ["Lead", "Applied", "Screen", "Interview", "Offer", "Rejected"] as const;
type Stage = typeof STAGES[number];

const COMPANY_STAGES = ["Seed", "Series A", "Series B", "Series C+", "Public/Large", "Unknown"];
const VESTING_TYPES = ["Time-based", "KPI-gated", "None", "Unknown"] as const;
const SOURCE_OPTIONS = ["Direct outreach", "Recruiter", "Inbound/Job board", "Referral"];
const STALE_DAYS = 14;

// ================= types =================
type Opp = {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string | null;
  location: Location;
  opportunity_type: OppType;
  stage: Stage;
  company_stage: string | null;
  net_annual_usd: number | null;
  net_year1_usd: number | null;
  comp_notes: string | null;
  living_cost_annual_usd: number | null;
  equity_pct: number | null;
  company_valuation_usd: number | null;
  vesting_years: number | null;
  vesting_type: string | null;
  liq_pref_known: boolean;
  equity_confidence_pct: number;
  optionality_rating: number | null;
  domain_fit_rating: number | null;
  stability_rating: number | null;
  last_touched_at: string;
  contact_name: string | null;
  contact_role: string | null;
  contact_linkedin: string | null;
  source: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
};

type Settings = {
  id?: string;
  user_id?: string;
  target_offer_date: string;
  checkpoint_date: string;
  weekly_target_applications: number;
  weekly_target_outreach: number;
  current_net_worth_usd: number;
  target_net_worth_usd: number;
  assumed_annual_return_pct: number;
  target_annual_savings_usd: number;
  equity_benchmark_usd: number;
  living_cost_dubai_usd: number;
  living_cost_hk_usd: number;
  living_cost_other_usd: number;
  weight_comp: number;
  weight_equity: number;
  weight_optionality: number;
  weight_fit: number;
  weight_risk: number;
};

type Activity = {
  id?: string;
  user_id?: string;
  week_start_date: string;
  applications_sent: number;
  outreach_sent: number;
  recruiter_contacts: number;
};

type Recruiter = {
  id: string;
  user_id: string;
  name: string;
  agency: string | null;
  specialization: string | null;
  region_focus: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  relationship_status: string;
  last_contacted: string | null;
  next_followup: string | null;
  roles_pitched: string | null;
  notes: string | null;
};

const RECRUITER_STATUSES = ["New", "Active", "Warm", "Cold", "Placed me before", "Dormant"];
const RECRUITER_REGIONS = ["Dubai/GCC", "Hong Kong/APAC", "Remote/Global", "Other"];

const sb = supabase as any;

// ================= math helpers =================
export function annualSavings(o: Opp): number {
  return (Number(o.net_annual_usd) || 0) - (Number(o.living_cost_annual_usd) || 0);
}

export function annualSavingsYear1(o: Opp): number {
  const y1 = o.net_year1_usd != null ? Number(o.net_year1_usd) : Number(o.net_annual_usd) || 0;
  return y1 - (Number(o.living_cost_annual_usd) || 0);
}

export function yearsTo1M(s: Settings, o: Opp): number | null {
  const r = (Number(s.assumed_annual_return_pct) || 0) / 100;
  const savings1 = annualSavingsYear1(o);
  const savings = annualSavings(o);
  const PV = Number(s.current_net_worth_usd) || 0;
  const FV = Number(s.target_net_worth_usd) || 0;
  if (PV >= FV) return 0;
  const pvAfterY1 = PV * (1 + r) + savings1;
  if (pvAfterY1 >= FV) return 1;
  if (savings <= 0) return null;
  if (r === 0) return 1 + (FV - pvAfterY1) / savings;
  const num = FV + savings / r;
  const den = pvAfterY1 + savings / r;
  if (num <= 0 || den <= 0) return null;
  const yrs = 1 + Math.log(num / den) / Math.log(1 + r);
  return isFinite(yrs) && yrs >= 0 ? yrs : null;
}

export function equityPaperValue(o: Opp): number {
  return ((Number(o.equity_pct) || 0) / 100) * (Number(o.company_valuation_usd) || 0);
}

export function equityRiskAdjusted(o: Opp): number {
  const paper = equityPaperValue(o);
  const conf = (Number(o.equity_confidence_pct) || 0) / 100;
  const vesting = o.vesting_type === "KPI-gated" ? 0.5 : 1;
  const liq = o.liq_pref_known ? 1 : 0.8;
  return paper * conf * vesting * liq;
}

type ScoreBreakdown = {
  total: number;
  comp: number;
  equity: number;
  optionality: number;
  fit: number;
  risk: number;
};

export function computeScore(o: Opp, s: Settings): ScoreBreakdown {
  const savings = annualSavings(o);
  const compRaw = Math.min((s.target_annual_savings_usd || 1) > 0 ? savings / s.target_annual_savings_usd : 0, 1);
  const comp = Math.max(0, compRaw) * 100;
  const eqAdj = equityRiskAdjusted(o);
  const equity = Math.max(0, Math.min(eqAdj / (s.equity_benchmark_usd || 1), 1)) * 100;
  const optionality = ((o.optionality_rating || 0) / 5) * 100;
  const fit = ((o.domain_fit_rating || 0) / 5) * 100;
  const risk = ((o.stability_rating || 0) / 5) * 100;

  const weights = [s.weight_comp, s.weight_equity, s.weight_optionality, s.weight_fit, s.weight_risk].map(
    (w) => Number(w) || 0
  );
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const [wC, wE, wO, wF, wR] = weights.map((w) => w / sum);
  const total = comp * wC + equity * wE + optionality * wO + fit * wF + risk * wR;
  return { total, comp, equity, optionality, fit, risk };
}

export function isStale(o: Opp): boolean {
  if (o.next_action_date && isBefore(parseISO(o.next_action_date), new Date())) return true;
  const last = o.last_touched_at ? new Date(o.last_touched_at) : null;
  if (last && differenceInDays(new Date(), last) > STALE_DAYS) return true;
  return false;
}

function defaultLivingCost(loc: Location, s: Settings): number {
  return loc === "Dubai" ? s.living_cost_dubai_usd
    : loc === "Hong Kong" ? s.living_cost_hk_usd
    : s.living_cost_other_usd;
}

const fmtUSD = (n: number | null | undefined) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`;
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(v >= 100_000 ? 0 : 1)}k`;
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const fmtYrs = (y: number | null) => (y === null ? "Not on track" : `${y.toFixed(1)} yrs`);

// ================= main =================
export default function JobSearch() {
  const { user } = useAuth();
  const [opps, setOpps] = useState<Opp[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Opp | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(null);
  const [showNewRecruiter, setShowNewRecruiter] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const weekStart = useMemo(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), []);

  const reload = async () => {
    if (!user) return;
    const [oR, sR, aR, rR] = await Promise.all([
      sb.from("job_opportunities").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      sb.from("job_search_settings").select("*").eq("user_id", user.id).maybeSingle(),
      sb.from("weekly_activity").select("*").eq("user_id", user.id).eq("week_start_date", weekStart).maybeSingle(),
      sb.from("job_recruiters").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    ]);
    let s: Settings | null = sR.data;
    if (!s) {
      const def = {
        user_id: user.id,
        target_offer_date: "2026-10-31",
        checkpoint_date: "2026-08-31",
        weekly_target_applications: 7,
        weekly_target_outreach: 9,
      };
      const ins = await sb.from("job_search_settings").insert(def).select().single();
      s = ins.data;
    }
    let a: Activity | null = aR.data;
    if (!a) {
      const def = {
        user_id: user.id, week_start_date: weekStart,
        applications_sent: 0, outreach_sent: 0, recruiter_contacts: 0,
      };
      const ins = await sb.from("weekly_activity").insert(def).select().single();
      a = ins.data;
    }
    setOpps(oR.data || []);
    setRecruiters(rR.data || []);
    setSettings(s);
    setActivity(a);
    setLoading(false);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  const saveOpp = async (o: Partial<Opp> & { id?: string }) => {
    if (!user) return;
    const nowIso = new Date().toISOString();
    if (o.id) {
      const { id, ...patch } = o;
      const { error } = await sb.from("job_opportunities")
        .update({ ...patch, last_touched_at: nowIso, updated_at: nowIso }).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from("job_opportunities").insert({
        user_id: user.id,
        company_name: o.company_name || "Untitled",
        role_title: o.role_title || null,
        location: o.location || "Dubai",
        opportunity_type: o.opportunity_type || "External role",
        stage: o.stage || "Lead",
        company_stage: o.company_stage || "Unknown",
        net_annual_usd: o.net_annual_usd ?? null,
        net_year1_usd: o.net_year1_usd ?? o.net_annual_usd ?? null,
        comp_notes: o.comp_notes || null,
        living_cost_annual_usd: o.living_cost_annual_usd ?? (settings ? defaultLivingCost(o.location || "Dubai", settings) : null),
        equity_pct: o.equity_pct ?? null,
        company_valuation_usd: o.company_valuation_usd ?? null,
        vesting_years: o.vesting_years ?? null,
        vesting_type: o.vesting_type || "Unknown",
        liq_pref_known: !!o.liq_pref_known,
        equity_confidence_pct: o.equity_confidence_pct ?? 20,
        optionality_rating: o.optionality_rating ?? null,
        domain_fit_rating: o.domain_fit_rating ?? null,
        stability_rating: o.stability_rating ?? null,
        contact_name: o.contact_name || null,
        contact_role: o.contact_role || null,
        contact_linkedin: o.contact_linkedin || null,
        source: o.source || null,
        next_action: o.next_action || null,
        next_action_date: o.next_action_date || null,
        notes: o.notes || null,
        last_touched_at: nowIso,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditing(null); setShowNew(false);
    reload();
  };

  const deleteOpp = async (id: string) => {
    if (!confirm("Delete this opportunity?")) return;
    await sb.from("job_opportunities").delete().eq("id", id);
    setEditing(null);
    reload();
  };

  const bulkDeleteOpps = async (ids: string[]) => {
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} opportunit${ids.length === 1 ? "y" : "ies"}?`)) return;
    await sb.from("job_opportunities").delete().in("id", ids);
    toast.success(`Deleted ${ids.length}`);
    reload();
  };

  const clearAllOpps = async () => {
    if (!user) return;
    if (!confirm("Delete ALL opportunities? This cannot be undone.")) return;
    await sb.from("job_opportunities").delete().eq("user_id", user.id);
    toast.success("All opportunities cleared");
    reload();
  };

  const saveRecruiter = async (r: Partial<Recruiter> & { id?: string }) => {
    if (!user) return;
    if (r.id) {
      const { id, ...patch } = r;
      const { error } = await sb.from("job_recruiters").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from("job_recruiters").insert({
        user_id: user.id,
        name: r.name || "Untitled",
        agency: r.agency || null,
        specialization: r.specialization || null,
        region_focus: r.region_focus || null,
        email: r.email || null,
        phone: r.phone || null,
        linkedin: r.linkedin || null,
        relationship_status: r.relationship_status || "New",
        last_contacted: r.last_contacted || null,
        next_followup: r.next_followup || null,
        roles_pitched: r.roles_pitched || null,
        notes: r.notes || null,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditingRecruiter(null); setShowNewRecruiter(false);
    reload();
  };

  const deleteRecruiter = async (id: string) => {
    if (!confirm("Delete this recruiter?")) return;
    await sb.from("job_recruiters").delete().eq("id", id);
    setEditingRecruiter(null);
    reload();
  };

  const saveSettings = async (patch: Partial<Settings>) => {
    if (!settings?.id) return;
    const { error } = await sb.from("job_search_settings")
      .update({ ...patch, updated_at: new Date().toISOString() }).eq("id", settings.id);
    if (error) return toast.error(error.message);
    setSettings({ ...settings, ...patch } as Settings);
  };

  const moveStage = async (id: string, stage: Stage) => {
    const nowIso = new Date().toISOString();
    setOpps((prev) => prev.map((o) => (o.id === id ? { ...o, stage, last_touched_at: nowIso } : o)));
    await sb.from("job_opportunities").update({ stage, last_touched_at: nowIso, updated_at: nowIso }).eq("id", id);
  };

  const bumpActivity = async (field: keyof Activity, delta: number) => {
    if (!activity) return;
    const next = { ...activity, [field]: Math.max(0, (activity as any)[field] + delta) };
    setActivity(next);
    await sb.from("weekly_activity")
      .update({ [field]: next[field as keyof Activity] as any, updated_at: new Date().toISOString() })
      .eq("id", activity.id);
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      else toast.error("Compare up to 5 opportunities");
      return next;
    });
  };

  const weeksToTarget = settings ? Math.max(0, differenceInWeeks(parseISO(settings.target_offer_date), new Date())) : 0;
  const weeksToCheckpt = settings ? Math.max(0, differenceInWeeks(parseISO(settings.checkpoint_date), new Date())) : 0;
  const checkpointSoon = weeksToCheckpt <= 2;

  const activeOpps = useMemo(() => opps.filter((o) => o.stage !== "Rejected"), [opps]);
  const rankedOpps = useMemo(() => {
    if (!settings) return [] as (Opp & { _score: ScoreBreakdown; _savings: number; _yrs: number | null })[];
    return activeOpps.map((o) => {
      const _score = computeScore(o, settings);
      const _savings = annualSavings(o);
      const _yrs = yearsTo1M(settings, o);
      return { ...o, _score, _savings, _yrs };
    }).sort((a, b) => b._score.total - a._score.total);
  }, [activeOpps, settings]);

  const best = rankedOpps[0] || null;
  const staleList = useMemo(() => activeOpps.filter(isStale), [activeOpps]);

  if (loading || !settings || !activity) {
    return (
      <div className="min-h-screen flex">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <header className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Job Search</h1>
                <p className="text-sm text-slate-500">Decide by fastest path to $1M</p>
              </div>
            </div>
            <Button onClick={() => setShowNew(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add opportunity
            </Button>
          </header>

          <Card className={`p-4 ${checkpointSoon ? "bg-amber-50 border-amber-200" : "bg-white"}`}>
            <div className="flex items-center gap-4 flex-wrap">
              <CalendarIcon className={`w-5 h-5 ${checkpointSoon ? "text-amber-600" : "text-slate-500"}`} />
              <div className="flex-1 flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-slate-500">Target offer:</span>{" "}
                  <span className="font-semibold text-slate-900">{format(parseISO(settings.target_offer_date), "d MMM yyyy")}</span>{" "}
                  <span className="text-slate-600">— {weeksToTarget} weeks left</span>
                </div>
                <div>
                  <span className="text-slate-500">Checkpoint:</span>{" "}
                  <span className={`font-semibold ${checkpointSoon ? "text-amber-700" : "text-slate-900"}`}>
                    {format(parseISO(settings.checkpoint_date), "d MMM yyyy")}
                  </span>{" "}
                  <span className={checkpointSoon ? "text-amber-700" : "text-slate-600"}>— {weeksToCheckpt} weeks left</span>
                </div>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="dashboard">
            <TabsList className="bg-white border">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="compare">Compare {compareIds.size > 0 && <Badge variant="secondary" className="ml-2">{compareIds.size}</Badge>}</TabsTrigger>
              <TabsTrigger value="outreach">Outreach</TabsTrigger>
              <TabsTrigger value="resumes">Resumes</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* ============ DASHBOARD ============ */}
            <TabsContent value="dashboard" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-2">
                    <TrendingUp className="w-4 h-4" /> Best live option
                  </div>
                  {best ? (
                    <>
                      <div className="text-xl font-bold text-slate-900">{best.company_name}</div>
                      <div className="text-sm text-slate-600 mb-3">{best.role_title || "—"} · {best.location}</div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-slate-500">Net / yr</div>
                          <div className="text-lg font-semibold text-slate-900">{fmtUSD(best.net_annual_usd)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Savings / yr</div>
                          <div className="text-lg font-semibold text-slate-900">{fmtUSD(best._savings)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Years to $1M</div>
                          <div className="text-lg font-semibold text-blue-700">{fmtYrs(best._yrs)}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">Add an opportunity to see your best path.</div>
                  )}
                </Card>

                <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-2">
                    <Target className="w-4 h-4" /> $1M tracker
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-slate-500">Current net worth</div>
                      <div className="text-lg font-semibold text-slate-900">{fmtUSD(settings.current_net_worth_usd)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Target</div>
                      <div className="text-lg font-semibold text-slate-900">{fmtUSD(settings.target_net_worth_usd)}</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    {best
                      ? <>At <strong>{best.company_name}</strong>, you reach $1M in <strong className="text-emerald-700">{fmtYrs(best._yrs)}</strong>.</>
                      : "Add an opportunity to see your projected timeline."}
                  </p>
                </Card>
              </div>

              <Card className="p-5">
                <h3 className="font-semibold text-slate-900 mb-4">This week ({format(parseISO(weekStart), "d MMM")})</h3>
                <div className="space-y-4">
                  <ActivityRow label="Applications sent" actual={activity.applications_sent} target={settings.weekly_target_applications}
                    onBump={() => bumpActivity("applications_sent", 1)} onDec={() => bumpActivity("applications_sent", -1)} />
                  <ActivityRow label="Outreach sent" actual={activity.outreach_sent} target={settings.weekly_target_outreach}
                    onBump={() => bumpActivity("outreach_sent", 1)} onDec={() => bumpActivity("outreach_sent", -1)} />
                  <ActivityRow label="Recruiter contacts" actual={activity.recruiter_contacts} target={3}
                    onBump={() => bumpActivity("recruiter_contacts", 1)} onDec={() => bumpActivity("recruiter_contacts", -1)} />
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Needs attention</h3>
                {staleList.length === 0 ? (
                  <p className="text-sm text-slate-500">Nothing stale — nice.</p>
                ) : (
                  <div className="space-y-2">
                    {staleList.map((o) => {
                      const overdueDate = o.next_action_date ? parseISO(o.next_action_date) : null;
                      const overdueDays = overdueDate && isBefore(overdueDate, new Date())
                        ? differenceInDays(new Date(), overdueDate) : null;
                      const untouchedDays = differenceInDays(new Date(), new Date(o.last_touched_at));
                      return (
                        <button key={o.id} onClick={() => setEditing(o)}
                          className="w-full flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition text-left">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full ${LOCATION_STYLES[o.location].dot}`} />
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-slate-900 truncate">{o.company_name}</div>
                              <div className="text-xs text-slate-500 truncate">{o.next_action || "No next action set"}</div>
                            </div>
                          </div>
                          <div className="text-xs font-medium shrink-0 ml-3 text-amber-700">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            {overdueDays !== null ? `${overdueDays}d overdue` : `${untouchedDays}d untouched`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ============ PIPELINE ============ */}
            <TabsContent value="pipeline" className="mt-4">
              <PipelineKanban
                ranked={rankedOpps}
                onMove={moveStage}
                onOpen={setEditing}
                compareIds={compareIds}
                onToggleCompare={toggleCompare}
              />
            </TabsContent>

            {/* ============ COMPARE ============ */}
            <TabsContent value="compare" className="mt-4">
              <CompareTab
                allRanked={rankedOpps}
                ids={compareIds}
                onToggle={toggleCompare}
                onClear={() => setCompareIds(new Set())}
                settings={settings}
              />
            </TabsContent>

            {/* ============ OUTREACH ============ */}
            <TabsContent value="outreach" className="mt-4">
              <OutreachSection
                opps={opps}
                recruiters={recruiters}
                onOpenOpp={setEditing}
                onBulkDeleteOpps={bulkDeleteOpps}
                onClearAllOpps={clearAllOpps}
                onOpenRecruiter={setEditingRecruiter}
                onNewRecruiter={() => setShowNewRecruiter(true)}
              />
            </TabsContent>

            {/* ============ RESUMES ============ */}
            <TabsContent value="resumes" className="mt-4">
              <ResumesSection />
            </TabsContent>

            {/* ============ SETTINGS ============ */}
            <TabsContent value="settings" className="mt-4">
              <SettingsTab settings={settings} onSave={saveSettings} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {(editing || showNew) && (
        <OpportunityDialog
          opp={editing}
          settings={settings}
          onClose={() => { setEditing(null); setShowNew(false); }}
          onSave={saveOpp}
          onDelete={editing ? () => deleteOpp(editing.id) : undefined}
        />
      )}

      {(editingRecruiter || showNewRecruiter) && (
        <RecruiterDialog
          recruiter={editingRecruiter}
          onClose={() => { setEditingRecruiter(null); setShowNewRecruiter(false); }}
          onSave={saveRecruiter}
          onDelete={editingRecruiter ? () => deleteRecruiter(editingRecruiter.id) : undefined}
        />
      )}
    </div>
  );
}

// ================= subcomponents =================
function ActivityRow({ label, actual, target, onBump, onDec }: {
  label: string; actual: number; target: number; onBump: () => void; onDec: () => void;
}) {
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{actual} / {target}</span>
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={onDec}>−</Button>
          <Button size="sm" className="h-7 px-2 gap-1" onClick={onBump}><Plus className="w-3 h-3" />1</Button>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

type Ranked = Opp & { _score: ScoreBreakdown; _savings: number; _yrs: number | null };

function ScoreBadge({ s }: { s: ScoreBreakdown }) {
  const color = s.total >= 70 ? "bg-green-100 text-green-800"
    : s.total >= 50 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700";
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${color} hover:${color}`}>Score {s.total.toFixed(0)}</Badge>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          <div className="space-y-0.5">
            <div>Comp: {s.comp.toFixed(0)}</div>
            <div>Equity: {s.equity.toFixed(0)}</div>
            <div>Optionality: {s.optionality.toFixed(0)}</div>
            <div>Fit: {s.fit.toFixed(0)}</div>
            <div>Stability: {s.risk.toFixed(0)}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function PipelineKanban({ ranked, onMove, onOpen, compareIds, onToggleCompare }: {
  ranked: Ranked[];
  onMove: (id: string, s: Stage) => void;
  onOpen: (o: Opp) => void;
  compareIds: Set<string>;
  onToggleCompare: (id: string) => void;
}) {
  const [filterLoc, setFilterLoc] = useState<string>("all");
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = ranked.filter((o) => filterLoc === "all" || o.location === filterLoc);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterLoc} onValueChange={setFilterLoc}>
          <SelectTrigger className="w-44 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = filtered.filter((o) => o.stage === stage);
          return (
            <div key={stage} className="min-w-[280px] w-[280px] shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) { onMove(dragId, stage); setDragId(null); } }}>
              <div className="bg-white rounded-lg border p-3 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-slate-800">{stage}</div>
                  <Badge variant="secondary">{cards.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {cards.map((o) => {
                    const stale = isStale(o);
                    const locSt = LOCATION_STYLES[o.location];
                    return (
                      <div key={o.id} draggable onDragStart={() => setDragId(o.id)}
                        className="p-3 rounded-md border bg-white cursor-grab active:cursor-grabbing hover:shadow-sm transition">
                        <div className="flex items-start gap-2 mb-1">
                          <Checkbox
                            checked={compareIds.has(o.id)}
                            onCheckedChange={() => onToggleCompare(o.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Add to compare"
                            className="mt-0.5"
                          />
                          <button onClick={() => onOpen(o)} className="flex-1 text-left min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{o.company_name}</div>
                            {o.role_title && <div className="text-xs text-slate-500 truncate">{o.role_title}</div>}
                          </button>
                          {stale && <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" title="Stale" />}
                        </div>
                        <button onClick={() => onOpen(o)} className="w-full text-left">
                          <div className="flex flex-wrap items-center gap-1 mb-2">
                            <Badge variant="outline" className={`${locSt.bg} ${locSt.text} ${locSt.border} text-[10px]`}>{o.location}</Badge>
                            <Badge variant="outline" className="text-[10px]">{o.opportunity_type}</Badge>
                            {o.vesting_type === "KPI-gated" && (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">KPI vesting</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-600 mb-2">
                            <div><div className="text-slate-400">Net</div><div className="font-medium">{fmtUSD(o.net_annual_usd)}</div></div>
                            <div><div className="text-slate-400">Save</div><div className="font-medium">{fmtUSD(o._savings)}</div></div>
                            <div><div className="text-slate-400">$1M</div><div className="font-medium">{fmtYrs(o._yrs)}</div></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <ScoreBadge s={o._score} />
                            {o.next_action_date && (
                              <span className={`text-[10px] ${isBefore(parseISO(o.next_action_date), new Date()) ? "text-red-600" : "text-slate-500"}`}>
                                {format(parseISO(o.next_action_date), "d MMM")}
                              </span>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareTab({ allRanked, ids, onToggle, onClear, settings }: {
  allRanked: Ranked[]; ids: Set<string>; onToggle: (id: string) => void; onClear: () => void; settings: Settings;
}) {
  const selected = allRanked.filter((o) => ids.has(o.id));
  const rows: { label: string; getValue: (o: Ranked) => number | string | null; higherBetter?: boolean; fmt?: (v: any) => string }[] = [
    { label: "Company / role", getValue: (o) => `${o.company_name}${o.role_title ? " · " + o.role_title : ""}` },
    { label: "Location", getValue: (o) => o.location },
    { label: "Type", getValue: (o) => o.opportunity_type },
    { label: "Net annual", getValue: (o) => Number(o.net_annual_usd) || 0, higherBetter: true, fmt: fmtUSD },
    { label: "Living cost", getValue: (o) => Number(o.living_cost_annual_usd) || 0, higherBetter: false, fmt: fmtUSD },
    { label: "Annual savings", getValue: (o) => o._savings, higherBetter: true, fmt: fmtUSD },
    { label: "Years to $1M", getValue: (o) => (o._yrs === null ? Infinity : o._yrs), higherBetter: false, fmt: (v) => v === Infinity ? "Not on track" : `${v.toFixed(1)} yrs` },
    { label: "Equity paper value", getValue: (o) => equityPaperValue(o), higherBetter: true, fmt: fmtUSD },
    { label: "Equity risk-adjusted", getValue: (o) => equityRiskAdjusted(o), higherBetter: true, fmt: fmtUSD },
    { label: "Vesting type", getValue: (o) => o.vesting_type || "Unknown" },
    { label: "Optionality", getValue: (o) => o.optionality_rating || 0, higherBetter: true, fmt: (v) => `${v}/5` },
    { label: "Domain fit", getValue: (o) => o.domain_fit_rating || 0, higherBetter: true, fmt: (v) => `${v}/5` },
    { label: "Stability", getValue: (o) => o.stability_rating || 0, higherBetter: true, fmt: (v) => `${v}/5` },
    { label: "TOTAL SCORE", getValue: (o) => o._score.total, higherBetter: true, fmt: (v) => v.toFixed(0) },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-slate-900">Select 2–5 opportunities to compare</h3>
          {ids.size > 0 && <Button variant="ghost" size="sm" onClick={onClear}>Clear selection</Button>}
        </div>
        <div className="flex flex-wrap gap-2">
          {allRanked.map((o) => (
            <label key={o.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm cursor-pointer transition ${ids.has(o.id) ? "bg-blue-50 border-blue-300" : "bg-white hover:bg-slate-50"}`}>
              <Checkbox checked={ids.has(o.id)} onCheckedChange={() => onToggle(o.id)} />
              <span>{o.company_name}</span>
              <span className="text-xs text-slate-500">· {o.location}</span>
            </label>
          ))}
        </div>
      </Card>

      {selected.length < 2 ? (
        <Card className="p-8 text-center text-sm text-slate-500">Select at least 2 opportunities to compare.</Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-medium text-slate-600 sticky left-0 bg-slate-50">Metric</th>
                {selected.map((o) => (
                  <th key={o.id} className="text-left p-3 font-semibold text-slate-900 min-w-[160px]">{o.company_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const values = selected.map((o) => row.getValue(o));
                let bestIdx = -1;
                if (row.higherBetter !== undefined) {
                  const nums = values.map((v) => (typeof v === "number" ? v : NaN));
                  const valid = nums.filter((n) => !isNaN(n));
                  if (valid.length) {
                    const targetVal = row.higherBetter ? Math.max(...valid) : Math.min(...valid);
                    bestIdx = nums.findIndex((n) => n === targetVal);
                  }
                }
                return (
                  <tr key={row.label} className="border-b last:border-b-0">
                    <td className="p-3 font-medium text-slate-700 sticky left-0 bg-white">{row.label}</td>
                    {values.map((v, i) => (
                      <td key={i} className={`p-3 ${i === bestIdx ? "bg-green-50 text-green-800 font-semibold" : "text-slate-800"}`}>
                        {row.fmt ? row.fmt(v as any) : String(v)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function OutreachSection({ opps, recruiters, onOpenOpp, onBulkDeleteOpps, onClearAllOpps, onOpenRecruiter, onNewRecruiter }: {
  opps: Opp[]; recruiters: Recruiter[];
  onOpenOpp: (o: Opp) => void;
  onBulkDeleteOpps: (ids: string[]) => void;
  onClearAllOpps: () => void;
  onOpenRecruiter: (r: Recruiter) => void;
  onNewRecruiter: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = (ids: string[]) => setSelected((p) => {
    const n = new Set(p); const allOn = ids.every((id) => n.has(id));
    if (allOn) ids.forEach((id) => n.delete(id)); else ids.forEach((id) => n.add(id));
    return n;
  });

  return (
    <Tabs defaultValue="companies">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="companies">Companies ({opps.length})</TabsTrigger>
          <TabsTrigger value="recruiters" className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> Recruiters ({recruiters.length})
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button variant="outline" className="text-red-600 border-red-200 gap-1.5"
              onClick={() => { onBulkDeleteOpps(Array.from(selected)); setSelected(new Set()); }}>
              <Trash2 className="w-4 h-4" /> Delete {selected.size}
            </Button>
          )}
          {opps.length > 0 && (
            <Button variant="outline" className="text-red-600 border-red-200 gap-1.5"
              onClick={() => { onClearAllOpps(); setSelected(new Set()); }}>
              <Trash2 className="w-4 h-4" /> Clear all
            </Button>
          )}
        </div>
      </div>

      <TabsContent value="companies">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LOCATIONS.map((loc) => {
            const list = opps.filter((o) => o.location === loc).sort((a, b) => a.company_name.localeCompare(b.company_name));
            const st = LOCATION_STYLES[loc];
            const ids = list.map((o) => o.id);
            const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
            return (
              <Card key={loc} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {list.length > 0 && (
                    <Checkbox checked={allSelected} onCheckedChange={() => toggleAll(ids)} aria-label={`Select all in ${loc}`} />
                  )}
                  <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                  <h3 className={`font-semibold ${st.text}`}>{loc}</h3>
                  <Badge variant="secondary" className="ml-auto">{list.length}</Badge>
                </div>
                {list.length === 0 ? (
                  <p className="text-sm text-slate-500">No companies yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {list.map((o) => (
                      <div key={o.id}
                        className={`w-full flex items-center gap-2 p-2 rounded hover:bg-slate-50 transition ${selected.has(o.id) ? "bg-blue-50" : ""}`}>
                        <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} aria-label={`Select ${o.company_name}`} />
                        <button onClick={() => onOpenOpp(o)} className="flex-1 flex items-center justify-between text-left min-w-0">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{o.company_name}</div>
                            <div className="text-xs text-slate-500 truncate">
                              {o.opportunity_type} · {o.stage}
                              {o.contact_name ? ` · ${o.contact_name}` : ""}
                            </div>
                          </div>
                          {o.next_action_date && isBefore(parseISO(o.next_action_date), new Date()) && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] shrink-0">Overdue</Badge>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="recruiters">
        <div className="flex justify-end mb-3">
          <Button onClick={onNewRecruiter} className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> Add recruiter
          </Button>
        </div>
        {recruiters.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">No recruiters yet.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recruiters.slice().sort((a, b) => a.name.localeCompare(b.name)).map((r) => {
              const overdue = r.next_followup && isBefore(parseISO(r.next_followup), new Date());
              return (
                <button key={r.id} onClick={() => onOpenRecruiter(r)}
                  className={`text-left p-4 rounded-lg border hover:shadow-sm transition ${overdue ? "bg-red-50 border-red-200" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{r.name}</div>
                      {r.agency && <div className="text-xs text-slate-500 truncate">{r.agency}</div>}
                    </div>
                    <Badge variant="secondary" className="shrink-0">{r.relationship_status}</Badge>
                  </div>
                  <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                    {r.specialization && <div>🎯 {r.specialization}</div>}
                    {r.region_focus && <div>🌍 {r.region_focus}</div>}
                    {r.last_contacted && <div>Last: {format(parseISO(r.last_contacted), "d MMM yyyy")}</div>}
                    {r.next_followup && (
                      <div className={overdue ? "text-red-600 font-medium" : ""}>
                        Follow up: {format(parseISO(r.next_followup), "d MMM yyyy")}{overdue ? " · overdue" : ""}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function RecruiterDialog({ recruiter, onClose, onSave, onDelete }: {
  recruiter: Recruiter | null; onClose: () => void;
  onSave: (r: Partial<Recruiter> & { id?: string }) => void; onDelete?: () => void;
}) {
  const [form, setForm] = useState<Partial<Recruiter>>(recruiter || { relationship_status: "New" });
  const set = (k: keyof Recruiter, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{recruiter ? "Edit recruiter" : "New recruiter"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *"><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Agency"><Input value={form.agency || ""} onChange={(e) => set("agency", e.target.value)} /></Field>
          <Field label="Specialization"><Input value={form.specialization || ""} onChange={(e) => set("specialization", e.target.value)} /></Field>
          <Field label="Region focus">
            <Select value={form.region_focus || ""} onValueChange={(v) => set("region_focus", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{RECRUITER_REGIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Relationship">
            <Select value={form.relationship_status || "New"} onValueChange={(v) => set("relationship_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RECRUITER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Email"><Input value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="LinkedIn URL" full><Input value={form.linkedin || ""} onChange={(e) => set("linkedin", e.target.value)} /></Field>
          <Field label="Last contacted">
            <Input type="date" value={form.last_contacted || ""} onChange={(e) => set("last_contacted", e.target.value || null)} />
          </Field>
          <Field label="Next follow-up">
            <Input type="date" value={form.next_followup || ""} onChange={(e) => set("next_followup", e.target.value || null)} />
          </Field>
          <Field label="Roles they've pitched" full>
            <Textarea rows={2} value={form.roles_pitched || ""} onChange={(e) => set("roles_pitched", e.target.value)} />
          </Field>
          <Field label="Notes" full>
            <Textarea rows={4} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          {onDelete && (
            <Button variant="outline" className="text-red-600 mr-auto gap-1" onClick={onDelete}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...form, id: recruiter?.id })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OpportunityDialog({ opp, settings, onClose, onSave, onDelete }: {
  opp: Opp | null; settings: Settings; onClose: () => void;
  onSave: (o: Partial<Opp> & { id?: string }) => void; onDelete?: () => void;
}) {
  const [form, setForm] = useState<Partial<Opp>>(
    opp || {
      location: "Dubai", opportunity_type: "External role", stage: "Lead", company_stage: "Unknown",
      vesting_type: "Unknown", equity_confidence_pct: 20, liq_pref_known: false,
      living_cost_annual_usd: settings.living_cost_dubai_usd,
    }
  );
  const set = (k: keyof Opp, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const onLocationChange = (loc: Location) => {
    setForm((p) => ({
      ...p,
      location: loc,
      living_cost_annual_usd: p.living_cost_annual_usd ?? defaultLivingCost(loc, settings),
    }));
    // If user hasn't overridden yet in this dialog session, prefill for new locations
    if (!opp) {
      setForm((p) => ({ ...p, location: loc, living_cost_annual_usd: defaultLivingCost(loc, settings) }));
    }
  };

  const previewScore = settings ? computeScore(form as Opp, settings) : null;
  const previewSavings = annualSavings(form as Opp);
  const previewYrs = settings ? yearsTo1M(settings, form as Opp) : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{opp ? "Edit opportunity" : "New opportunity"}</DialogTitle>
        </DialogHeader>

        {previewScore && (
          <div className="p-3 rounded-lg bg-slate-50 border grid grid-cols-4 gap-3 text-sm">
            <div><div className="text-xs text-slate-500">Savings / yr</div><div className="font-semibold">{fmtUSD(previewSavings)}</div></div>
            <div><div className="text-xs text-slate-500">Years to $1M</div><div className="font-semibold text-blue-700">{fmtYrs(previewYrs)}</div></div>
            <div><div className="text-xs text-slate-500">Equity (risk-adj)</div><div className="font-semibold">{fmtUSD(equityRiskAdjusted(form as Opp))}</div></div>
            <div><div className="text-xs text-slate-500">Score</div><div className="font-semibold">{previewScore.total.toFixed(0)}</div></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Company *"><Input value={form.company_name || ""} onChange={(e) => set("company_name", e.target.value)} /></Field>
          <Field label="Role"><Input value={form.role_title || ""} onChange={(e) => set("role_title", e.target.value)} /></Field>
          <Field label="Location">
            <Select value={form.location} onValueChange={(v) => onLocationChange(v as Location)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LOCATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Opportunity type">
            <Select value={form.opportunity_type} onValueChange={(v) => set("opportunity_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{OPPORTUNITY_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Stage">
            <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Company stage">
            <Select value={form.company_stage || "Unknown"} onValueChange={(v) => set("company_stage", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COMPANY_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <Field label="Net annual earnings (USD, after tax)">
            <Input type="number" value={form.net_annual_usd ?? ""} onChange={(e) => set("net_annual_usd", e.target.value === "" ? null : parseFloat(e.target.value))} />
          </Field>
          <Field label="Living cost / yr (USD)">
            <Input type="number" value={form.living_cost_annual_usd ?? ""} onChange={(e) => set("living_cost_annual_usd", e.target.value === "" ? null : parseFloat(e.target.value))} />
          </Field>
          <Field label="Comp notes (base / OTE split)" full>
            <Input value={form.comp_notes || ""} onChange={(e) => set("comp_notes", e.target.value)} />
          </Field>

          <Field label="Equity %">
            <Input type="number" step="0.01" value={form.equity_pct ?? ""} onChange={(e) => set("equity_pct", e.target.value === "" ? null : parseFloat(e.target.value))} />
          </Field>
          <Field label="Company valuation (USD)">
            <Input type="number" value={form.company_valuation_usd ?? ""} onChange={(e) => set("company_valuation_usd", e.target.value === "" ? null : parseFloat(e.target.value))} />
          </Field>
          <Field label="Vesting years">
            <Input type="number" step="0.1" value={form.vesting_years ?? ""} onChange={(e) => set("vesting_years", e.target.value === "" ? null : parseFloat(e.target.value))} />
          </Field>
          <Field label="Vesting type">
            <Select value={form.vesting_type || "Unknown"} onValueChange={(v) => set("vesting_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VESTING_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Equity confidence %">
            <Input type="number" value={form.equity_confidence_pct ?? 20} onChange={(e) => set("equity_confidence_pct", parseFloat(e.target.value) || 0)} />
          </Field>
          <Field label="Liq. pref known?">
            <div className="flex items-center h-10 gap-2">
              <Switch checked={!!form.liq_pref_known} onCheckedChange={(v) => set("liq_pref_known", v)} />
              <span className="text-sm text-slate-600">{form.liq_pref_known ? "Yes" : "Unknown"}</span>
            </div>
          </Field>

          <Field label="Optionality (1–5)"><RatingInput value={form.optionality_rating} onChange={(v) => set("optionality_rating", v)} /></Field>
          <Field label="Domain fit (1–5)"><RatingInput value={form.domain_fit_rating} onChange={(v) => set("domain_fit_rating", v)} /></Field>
          <Field label="Stability (1–5)"><RatingInput value={form.stability_rating} onChange={(v) => set("stability_rating", v)} /></Field>

          <Field label="Contact name"><Input value={form.contact_name || ""} onChange={(e) => set("contact_name", e.target.value)} /></Field>
          <Field label="Contact role"><Input value={form.contact_role || ""} onChange={(e) => set("contact_role", e.target.value)} /></Field>
          <Field label="LinkedIn URL" full><Input value={form.contact_linkedin || ""} onChange={(e) => set("contact_linkedin", e.target.value)} /></Field>
          <Field label="Source">
            <Select value={form.source || ""} onValueChange={(v) => set("source", v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{SOURCE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Next action date">
            <Input type="date" value={form.next_action_date || ""} onChange={(e) => set("next_action_date", e.target.value || null)} />
          </Field>
          <Field label="Next action" full><Input value={form.next_action || ""} onChange={(e) => set("next_action", e.target.value)} /></Field>
          <Field label="Notes" full>
            <Textarea rows={4} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {onDelete && (
            <Button variant="outline" className="text-red-600 mr-auto gap-1" onClick={onDelete}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...form, id: opp?.id })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RatingInput({ value, onChange }: { value: number | null | undefined; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`w-8 h-8 rounded-md border text-sm font-medium transition ${value === n ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
          {n}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ================= Settings tab =================
function SettingsTab({ settings, onSave }: { settings: Settings; onSave: (patch: Partial<Settings>) => void }) {
  const [form, setForm] = useState<Settings>(settings);
  useEffect(() => setForm(settings), [settings]);
  const set = (k: keyof Settings, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const weights = [form.weight_comp, form.weight_equity, form.weight_optionality, form.weight_fit, form.weight_risk].map((w) => Number(w) || 0);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const weightsOk = Math.round(weightSum) === 100;

  const save = () => {
    onSave({
      target_offer_date: form.target_offer_date,
      checkpoint_date: form.checkpoint_date,
      weekly_target_applications: Number(form.weekly_target_applications) || 0,
      weekly_target_outreach: Number(form.weekly_target_outreach) || 0,
      current_net_worth_usd: Number(form.current_net_worth_usd) || 0,
      target_net_worth_usd: Number(form.target_net_worth_usd) || 0,
      assumed_annual_return_pct: Number(form.assumed_annual_return_pct) || 0,
      target_annual_savings_usd: Number(form.target_annual_savings_usd) || 0,
      equity_benchmark_usd: Number(form.equity_benchmark_usd) || 0,
      living_cost_dubai_usd: Number(form.living_cost_dubai_usd) || 0,
      living_cost_hk_usd: Number(form.living_cost_hk_usd) || 0,
      living_cost_other_usd: Number(form.living_cost_other_usd) || 0,
      weight_comp: Number(form.weight_comp) || 0,
      weight_equity: Number(form.weight_equity) || 0,
      weight_optionality: Number(form.weight_optionality) || 0,
      weight_fit: Number(form.weight_fit) || 0,
      weight_risk: Number(form.weight_risk) || 0,
    });
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Timeline & activity targets</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target offer date"><Input type="date" value={form.target_offer_date} onChange={(e) => set("target_offer_date", e.target.value)} /></Field>
          <Field label="Checkpoint date"><Input type="date" value={form.checkpoint_date} onChange={(e) => set("checkpoint_date", e.target.value)} /></Field>
          <Field label="Weekly applications"><Input type="number" value={form.weekly_target_applications} onChange={(e) => set("weekly_target_applications", parseInt(e.target.value) || 0)} /></Field>
          <Field label="Weekly outreach"><Input type="number" value={form.weekly_target_outreach} onChange={(e) => set("weekly_target_outreach", parseInt(e.target.value) || 0)} /></Field>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">$1M plan</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Current net worth (USD)"><Input type="number" value={form.current_net_worth_usd} onChange={(e) => set("current_net_worth_usd", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Target net worth (USD)"><Input type="number" value={form.target_net_worth_usd} onChange={(e) => set("target_net_worth_usd", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Assumed annual return %"><Input type="number" step="0.1" value={form.assumed_annual_return_pct} onChange={(e) => set("assumed_annual_return_pct", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Target annual savings (USD)"><Input type="number" value={form.target_annual_savings_usd} onChange={(e) => set("target_annual_savings_usd", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Equity benchmark (USD)"><Input type="number" value={form.equity_benchmark_usd} onChange={(e) => set("equity_benchmark_usd", parseFloat(e.target.value) || 0)} /></Field>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Living cost defaults (USD / yr)</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Dubai"><Input type="number" value={form.living_cost_dubai_usd} onChange={(e) => set("living_cost_dubai_usd", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Hong Kong"><Input type="number" value={form.living_cost_hk_usd} onChange={(e) => set("living_cost_hk_usd", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Other"><Input type="number" value={form.living_cost_other_usd} onChange={(e) => set("living_cost_other_usd", parseFloat(e.target.value) || 0)} /></Field>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Score weights</h3>
          <span className={`text-xs font-medium ${weightsOk ? "text-emerald-700" : "text-amber-700"}`}>
            Sum: {weightSum.toFixed(0)} {weightsOk ? "✓" : "(will be normalised)"}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <Field label="Comp"><Input type="number" value={form.weight_comp} onChange={(e) => set("weight_comp", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Equity"><Input type="number" value={form.weight_equity} onChange={(e) => set("weight_equity", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Optionality"><Input type="number" value={form.weight_optionality} onChange={(e) => set("weight_optionality", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Fit"><Input type="number" value={form.weight_fit} onChange={(e) => set("weight_fit", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Risk"><Input type="number" value={form.weight_risk} onChange={(e) => set("weight_risk", parseFloat(e.target.value) || 0)} /></Field>
        </div>
      </Card>

      <Button onClick={save}>Save settings</Button>
    </div>
  );
}

// ================= Resumes (PDF only) =================
type Resume = { id: string; user_id: string; label: string; kind: string; file_path: string | null; updated_at: string };

function ResumesSection() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bucketMissing, setBucketMissing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await sb.from("job_resumes").select("*").eq("user_id", user.id).eq("kind", "pdf").order("updated_at", { ascending: false });
    setResumes(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const uploadPdf = async (file: File) => {
    if (!user) return;
    if (file.type !== "application/pdf") return toast.error("Only PDF files");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB");
    setUploading(true);
    const path = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("resumes").upload(path, file, { contentType: "application/pdf" });
    if (upErr) {
      setUploading(false);
      if (upErr.message?.toLowerCase().includes("bucket")) {
        setBucketMissing(true);
        return toast.error("Storage bucket missing");
      }
      return toast.error(upErr.message);
    }
    const label = file.name.replace(/\.pdf$/i, "");
    const { error } = await sb.from("job_resumes").insert({ user_id: user.id, label, kind: "pdf", file_path: path });
    setUploading(false);
    if (error) return toast.error(error.message);
    toast.success("Uploaded");
    load();
  };

  const downloadPdf = async (r: Resume) => {
    if (!r.file_path) return;
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(r.file_path, 60);
    if (error || !data?.signedUrl) return toast.error("Could not download");
    window.open(data.signedUrl, "_blank");
  };

  const deleteResume = async (r: Resume) => {
    if (!confirm(`Delete "${r.label}"?`)) return;
    if (r.file_path) await supabase.storage.from("resumes").remove([r.file_path]);
    await sb.from("job_resumes").delete().eq("id", r.id);
    load();
  };

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      {bucketMissing && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-sm text-amber-800">
          <strong>Storage bucket missing.</strong> Create a private bucket named <code className="bg-amber-100 px-1 rounded">resumes</code> in Supabase Storage.
        </Card>
      )}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-slate-900">PDF resumes</h3>
            <p className="text-xs text-slate-500">Upload, download, or delete your resume versions.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.target.value = ""; }} />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> {uploading ? "Uploading…" : "Upload PDF"}
          </Button>
        </div>
        {resumes.length === 0 ? (
          <p className="text-sm text-slate-500">No PDFs uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resumes.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border bg-white flex items-center gap-3">
                <div className="p-2 rounded bg-red-50 text-red-600 shrink-0"><Briefcase className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{r.label}</div>
                  <div className="text-xs text-slate-500">PDF · {format(parseISO(r.updated_at), "d MMM yyyy")}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => downloadPdf(r)}>Download</Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteResume(r)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
