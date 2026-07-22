import React, { useEffect, useMemo, useState } from "react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Plus, Briefcase, Trash2, Calendar, AlertCircle, Check, Users, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format, differenceInWeeks, startOfWeek, parseISO, isBefore } from "date-fns";

// ---------- constants ----------
const DIRECTIONS = ["Dubai", "Singapore", "Remote/Global", "Saudi"] as const;
type Direction = typeof DIRECTIONS[number];

const DIRECTION_STYLES: Record<Direction, { dot: string; bg: string; text: string; border: string }> = {
  "Dubai":          { dot: "bg-amber-500",  bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  "Singapore":      { dot: "bg-teal-500",   bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200" },
  "Remote/Global":  { dot: "bg-purple-500", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Saudi":          { dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
};

const STAGES = [
  "Lead", "Applied", "Recruiter call", "1st interview", "Final round", "Offer", "Rejected", "Passed",
] as const;
const PIPELINE_STAGES = STAGES.slice(0, 6);
type Stage = typeof STAGES[number];

const COMPANY_STAGES = ["Seed", "Series A", "Series B", "Series C+", "Public/Large", "Unknown"];
const EQUITY_OPTIONS = ["Yes - real equity", "Phantom/cash-settled", "None", "Unknown"];
const ENTITY_OPTIONS = ["DIFC/ADGM", "Foreign entity (real shares)", "Mainland UAE", "Other", "Unknown"];
const SOURCE_OPTIONS = ["Direct outreach", "Recruiter", "Inbound/Job board", "Referral"];

const SEED_OPPS = [
  { company_name: "oneZero",          role_title: "",  direction: "Singapore",     company_stage: "Series C+" },
  { company_name: "PrimeXM",          role_title: "",  direction: "Dubai",         company_stage: "Unknown" },
  { company_name: "PrimeXM",          role_title: "",  direction: "Singapore",     company_stage: "Unknown" },
  { company_name: "Tools for Brokers",role_title: "",  direction: "Singapore",     company_stage: "Unknown" },
  { company_name: "Tabby",            role_title: "",  direction: "Dubai",         company_stage: "Series C+" },
  { company_name: "Stake",            role_title: "",  direction: "Dubai",         company_stage: "Series B" },
  { company_name: "Tazapay",          role_title: "",  direction: "Singapore",     company_stage: "Series B" },
  { company_name: "MetaComp",         role_title: "",  direction: "Singapore",     company_stage: "Series A" },
  { company_name: "RedotPay",         role_title: "",  direction: "Remote/Global", company_stage: "Series B" },
  { company_name: "YC Remote Sales Role", role_title: "Head of Sales", direction: "Remote/Global", company_stage: "Series A" },
];

// ---------- types ----------
type Opp = {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string | null;
  direction: Direction;
  stage: Stage;
  company_stage: string | null;
  base_salary_monthly_usd: number | null;
  equity_offered: string | null;
  entity_type: string | null;
  contact_name: string | null;
  contact_role: string | null;
  contact_linkedin: string | null;
  source: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  sort_order: number | null;
};

type Settings = {
  id?: string;
  user_id?: string;
  target_offer_date: string;
  checkpoint_date: string;
  weekly_target_applications: number;
  weekly_target_outreach: number;
  weekly_target_posts: number;
};

type Activity = {
  id?: string;
  user_id?: string;
  week_start_date: string;
  applications_sent: number;
  outreach_sent: number;
  linkedin_posts: number;
  recruiter_contacts: number;
};

const sb = supabase as any;

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
  sort_order: number | null;
};

const RECRUITER_STATUSES = ["New", "Active", "Warm", "Cold", "Placed me before", "Dormant"];
const RECRUITER_REGIONS = ["Dubai/GCC", "Singapore/APAC", "Remote/Global", "Saudi", "Multi-region"];

// ---------- helpers ----------
function fitScore(o: Opp): number {
  let s = 0;
  if ((o.base_salary_monthly_usd ?? 0) >= 15000) s++;
  if (o.equity_offered === "Yes - real equity") s++;
  if (o.entity_type === "DIFC/ADGM" || o.entity_type === "Foreign entity (real shares)") s++;
  return s;
}

function FitBadge({ score }: { score: number }) {
  if (score === 3) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">3/3 Strong fit</Badge>;
  if (score === 2) return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">2/3</Badge>;
  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{score}/3 Below bar</Badge>;
}

// ---------- main ----------
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

  const weekStart = useMemo(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), []);

  // ---------- load ----------
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
        weekly_target_posts: 1,
      };
      const ins = await sb.from("job_search_settings").insert(def).select().single();
      s = ins.data;
    }
    let a: Activity | null = aR.data;
    const isFirstEver = !sR.data;
    if (!a) {
      const def = {
        user_id: user.id, week_start_date: weekStart,
        applications_sent: 0, outreach_sent: 0, linkedin_posts: 0, recruiter_contacts: 0,
      };
      const ins = await sb.from("weekly_activity").insert(def).select().single();
      a = ins.data;
    }

    let list: Opp[] = oR.data || [];
    // Only seed on the very first-ever load (when the settings row also had to be created).
    // Otherwise an empty list means the user cleared it, and we must NOT repopulate.
    if (list.length === 0 && isFirstEver) {
      const seed = SEED_OPPS.map((o) => ({ ...o, user_id: user.id, stage: "Lead" }));
      const insSeed = await sb.from("job_opportunities").insert(seed).select();
      list = insSeed.data || [];
    }

    setOpps(list);
    setRecruiters(rR.data || []);
    setSettings(s);
    setActivity(a);
    setLoading(false);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  // ---------- actions ----------
  const saveOpp = async (o: Partial<Opp> & { id?: string }) => {
    if (!user) return;
    if (o.id) {
      const { id, ...patch } = o;
      const { error } = await sb.from("job_opportunities").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from("job_opportunities").insert({
        user_id: user.id,
        company_name: o.company_name || "Untitled",
        role_title: o.role_title || null,
        direction: o.direction || "Dubai",
        stage: o.stage || "Lead",
        company_stage: o.company_stage || "Unknown",
        base_salary_monthly_usd: o.base_salary_monthly_usd || 0,
        equity_offered: o.equity_offered || "Unknown",
        entity_type: o.entity_type || "Unknown",
        contact_name: o.contact_name || null,
        contact_role: o.contact_role || null,
        contact_linkedin: o.contact_linkedin || null,
        source: o.source || null,
        next_action: o.next_action || null,
        next_action_date: o.next_action_date || null,
        notes: o.notes || null,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditing(null);
    setShowNew(false);
    reload();
  };

  const deleteOpp = async (id: string) => {
    if (!confirm("Delete this opportunity?")) return;
    await sb.from("job_opportunities").delete().eq("id", id);
    setEditing(null);
    reload();
  };

  const bulkDeleteOpps = async (ids: string[]) => {
    if (ids.length === 0) return;
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
    setEditingRecruiter(null);
    setShowNewRecruiter(false);
    reload();
  };

  const deleteRecruiter = async (id: string) => {
    if (!confirm("Delete this recruiter?")) return;
    await sb.from("job_recruiters").delete().eq("id", id);
    setEditingRecruiter(null);
    reload();
  };

  const moveStage = async (id: string, stage: Stage) => {
    setOpps((prev) => prev.map((o) => (o.id === id ? { ...o, stage } : o)));
    await sb.from("job_opportunities").update({ stage, updated_at: new Date().toISOString() }).eq("id", id);
  };

  const bumpActivity = async (field: keyof Activity, delta: number) => {
    if (!activity) return;
    const next = { ...activity, [field]: Math.max(0, (activity as any)[field] + delta) };
    setActivity(next);
    await sb.from("weekly_activity").update({ [field]: next[field as keyof Activity] as any, updated_at: new Date().toISOString() })
      .eq("id", activity.id);
  };

  // ---------- derived ----------
  const weeksToTarget  = settings ? Math.max(0, differenceInWeeks(parseISO(settings.target_offer_date), new Date())) : 0;
  const weeksToCheckpt = settings ? Math.max(0, differenceInWeeks(parseISO(settings.checkpoint_date),  new Date())) : 0;
  const checkpointSoon = weeksToCheckpt <= 2;

  const activeOpps = opps.filter((o) => o.stage !== "Rejected" && o.stage !== "Passed");

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
                <p className="text-sm text-slate-500">Confidential pipeline across 4 directions</p>
              </div>
            </div>
            <Button onClick={() => setShowNew(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add opportunity
            </Button>
          </header>

          {/* Countdown */}
          <Card className={`p-4 ${checkpointSoon ? "bg-amber-50 border-amber-200" : "bg-white"}`}>
            <div className="flex items-center gap-4 flex-wrap">
              <Calendar className={`w-5 h-5 ${checkpointSoon ? "text-amber-600" : "text-slate-500"}`} />
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
              <TabsTrigger value="outreach">Outreach lists</TabsTrigger>
              <TabsTrigger value="resumes">Resumes</TabsTrigger>
            </TabsList>

            {/* DASHBOARD */}
            <TabsContent value="dashboard" className="space-y-6 mt-4">
              {/* Direction cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {DIRECTIONS.map((d) => {
                  const inDir = activeOpps.filter((o) => o.direction === d);
                  const advanced = inDir.filter((o) =>
                    ["1st interview", "Final round", "Offer"].includes(o.stage)
                  ).length;
                  const st = DIRECTION_STYLES[d];
                  return (
                    <Card key={d} className={`p-4 ${st.bg} ${st.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                        <span className={`text-sm font-medium ${st.text}`}>{d}</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-900">{inDir.length}</div>
                      <div className="text-xs text-slate-600 mt-1">{advanced} at 1st interview+</div>
                    </Card>
                  );
                })}
              </div>

              {/* Funnel */}
              <Card className="p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Pipeline funnel</h3>
                <div className="space-y-2">
                  {PIPELINE_STAGES.map((s) => {
                    const count = opps.filter((o) => o.stage === s).length;
                    const max = Math.max(1, ...PIPELINE_STAGES.map((st) => opps.filter((o) => o.stage === st).length));
                    const pct = (count / max) * 100;
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-slate-600">{s}</div>
                        <div className="flex-1 bg-slate-100 rounded-full h-7 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center px-3 text-xs font-medium text-white transition-all"
                            style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                          >
                            {count > 0 && count}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* This week */}
              <Card className="p-5">
                <h3 className="font-semibold text-slate-900 mb-4">This week ({format(parseISO(weekStart), "d MMM")})</h3>
                <div className="space-y-4">
                  <ActivityRow
                    label="Applications sent"
                    actual={activity.applications_sent}
                    target={settings.weekly_target_applications}
                    onBump={() => bumpActivity("applications_sent", 1)}
                    onDec={() => bumpActivity("applications_sent", -1)}
                  />
                  <ActivityRow
                    label="Outreach sent"
                    actual={activity.outreach_sent}
                    target={settings.weekly_target_outreach}
                    onBump={() => bumpActivity("outreach_sent", 1)}
                    onDec={() => bumpActivity("outreach_sent", -1)}
                  />
                  <ActivityRow
                    label="LinkedIn posts"
                    actual={activity.linkedin_posts}
                    target={settings.weekly_target_posts}
                    onBump={() => bumpActivity("linkedin_posts", 1)}
                    onDec={() => bumpActivity("linkedin_posts", -1)}
                  />
                </div>
              </Card>

              {/* Upcoming */}
              <Card className="p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Upcoming next actions</h3>
                {activeOpps.filter((o) => o.next_action_date).length === 0 ? (
                  <p className="text-sm text-slate-500">No scheduled next actions.</p>
                ) : (
                  <div className="space-y-2">
                    {activeOpps
                      .filter((o) => o.next_action_date)
                      .sort((a, b) => (a.next_action_date! < b.next_action_date! ? -1 : 1))
                      .map((o) => {
                        const overdue = isBefore(parseISO(o.next_action_date!), new Date());
                        return (
                          <button
                            key={o.id}
                            onClick={() => setEditing(o)}
                            className="w-full flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-2.5 h-2.5 rounded-full ${DIRECTION_STYLES[o.direction].dot}`} />
                              <div className="min-w-0">
                                <div className="font-medium text-sm text-slate-900 truncate">{o.company_name}</div>
                                <div className="text-xs text-slate-500 truncate">{o.next_action || "—"}</div>
                              </div>
                            </div>
                            <div className={`text-xs font-medium shrink-0 ml-3 ${overdue ? "text-red-600" : "text-slate-600"}`}>
                              {overdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
                              {format(parseISO(o.next_action_date!), "d MMM")}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* PIPELINE */}
            <TabsContent value="pipeline" className="mt-4">
              <PipelineKanban opps={opps} onMove={moveStage} onOpen={setEditing} />
            </TabsContent>

            {/* OUTREACH */}
            <TabsContent value="outreach" className="mt-4">
              <OutreachSection
                opps={opps}
                recruiters={recruiters}
                onOpenOpp={setEditing}
                onBulkDeleteOpps={bulkDeleteOpps}
                onOpenRecruiter={setEditingRecruiter}
                onNewRecruiter={() => setShowNewRecruiter(true)}
              />
            </TabsContent>

            {/* RESUMES */}
            <TabsContent value="resumes" className="mt-4">
              <ResumesSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {(editing || showNew) && (
        <OpportunityDialog
          opp={editing}
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

// ---------- subcomponents ----------
function ActivityRow({
  label, actual, target, onBump, onDec,
}: { label: string; actual: number; target: number; onBump: () => void; onDec: () => void }) {
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
      <Progress value={pct} className="h-2" />
    </div>
  );
}

function PipelineKanban({
  opps, onMove, onOpen,
}: { opps: Opp[]; onMove: (id: string, s: Stage) => void; onOpen: (o: Opp) => void }) {
  const [filterDir, setFilterDir] = useState<string>("all");
  const [minFit, setMinFit] = useState<string>("0");
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = opps.filter((o) => {
    if (filterDir !== "all" && o.direction !== filterDir) return false;
    if (fitScore(o) < parseInt(minFit)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterDir} onValueChange={setFilterDir}>
          <SelectTrigger className="w-44 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All directions</SelectItem>
            {DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={minFit} onValueChange={setMinFit}>
          <SelectTrigger className="w-44 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any fit</SelectItem>
            <SelectItem value="2">2/3 or better</SelectItem>
            <SelectItem value="3">3/3 only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const cards = filtered.filter((o) => o.stage === stage);
          return (
            <div
              key={stage}
              className="min-w-[260px] w-[260px] shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) { onMove(dragId, stage); setDragId(null); } }}
            >
              <div className="bg-white rounded-lg border p-3 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-slate-800">{stage}</div>
                  <Badge variant="secondary">{cards.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {cards.map((o) => {
                    const fs = fitScore(o);
                    const dim = fs <= 1;
                    return (
                      <div
                        key={o.id}
                        draggable
                        onDragStart={() => setDragId(o.id)}
                        onClick={() => onOpen(o)}
                        className={`p-3 rounded-md border bg-white cursor-grab active:cursor-grabbing hover:shadow-sm transition ${dim ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${DIRECTION_STYLES[o.direction].dot}`} />
                          <div className="text-sm font-medium text-slate-900 truncate flex-1">{o.company_name}</div>
                        </div>
                        {o.role_title && <div className="text-xs text-slate-500 mb-2 truncate">{o.role_title}</div>}
                        <div className="flex items-center justify-between gap-2">
                          <FitBadge score={fs} />
                          {o.base_salary_monthly_usd ? (
                            <span className="text-xs text-slate-600">${(o.base_salary_monthly_usd / 1000).toFixed(0)}k/mo</span>
                          ) : null}
                        </div>
                        {o.next_action && (
                          <div className="text-xs text-slate-500 mt-2 truncate">→ {o.next_action}</div>
                        )}
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

function OutreachSection({
  opps, recruiters, onOpenOpp, onBulkDeleteOpps, onOpenRecruiter, onNewRecruiter,
}: {
  opps: Opp[];
  recruiters: Recruiter[];
  onOpenOpp: (o: Opp) => void;
  onBulkDeleteOpps: (ids: string[]) => void;
  onOpenRecruiter: (r: Recruiter) => void;
  onNewRecruiter: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllForDirection = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = ids.every((id) => next.has(id));
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  return (
    <Tabs defaultValue="companies">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="companies">Companies ({opps.length})</TabsTrigger>
          <TabsTrigger value="recruiters" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Recruiters ({recruiters.length})
          </TabsTrigger>
        </TabsList>
        {selected.size > 0 && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 gap-1.5"
            onClick={() => {
              onBulkDeleteOpps(Array.from(selected));
              setSelected(new Set());
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete {selected.size} selected
          </Button>
        )}
      </div>

      <TabsContent value="companies">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIRECTIONS.map((d) => {
            const list = opps.filter((o) => o.direction === d).sort((a, b) => a.company_name.localeCompare(b.company_name));
            const st = DIRECTION_STYLES[d];
            const ids = list.map((o) => o.id);
            const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
            return (
              <Card key={d} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {list.length > 0 && (
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleAllForDirection(ids)}
                      aria-label={`Select all in ${d}`}
                    />
                  )}
                  <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                  <h3 className={`font-semibold ${st.text}`}>{d}</h3>
                  <Badge variant="secondary" className="ml-auto">{list.length}</Badge>
                </div>
                {list.length === 0 ? (
                  <p className="text-sm text-slate-500">No companies yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {list.map((o) => (
                      <div
                        key={o.id}
                        className={`w-full flex items-center gap-2 p-2 rounded hover:bg-slate-50 transition ${selected.has(o.id) ? "bg-blue-50" : ""}`}
                      >
                        <Checkbox
                          checked={selected.has(o.id)}
                          onCheckedChange={() => toggle(o.id)}
                          aria-label={`Select ${o.company_name}`}
                        />
                        <button
                          onClick={() => onOpenOpp(o)}
                          className="flex-1 flex items-center justify-between text-left min-w-0"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{o.company_name}</div>
                            <div className="text-xs text-slate-500 truncate">
                              {o.company_stage} · {o.stage}
                              {o.contact_name ? ` · ${o.contact_name}` : ""}
                            </div>
                          </div>
                          <FitBadge score={fitScore(o)} />
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
          <Card className="p-8 text-center text-sm text-slate-500">
            No recruiters yet. Add agency recruiters, in-house TA contacts, or executive search reps you're working with.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recruiters
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((r) => {
                const statusColor =
                  r.relationship_status === "Active" ? "bg-green-100 text-green-700" :
                  r.relationship_status === "Warm" ? "bg-amber-100 text-amber-700" :
                  r.relationship_status === "Cold" ? "bg-slate-100 text-slate-600" :
                  r.relationship_status === "Placed me before" ? "bg-purple-100 text-purple-700" :
                  r.relationship_status === "Dormant" ? "bg-slate-100 text-slate-500" :
                  "bg-blue-100 text-blue-700";
                return (
                  <button
                    key={r.id}
                    onClick={() => onOpenRecruiter(r)}
                    className="text-left p-4 rounded-lg border bg-white hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{r.name}</div>
                        {r.agency && <div className="text-xs text-slate-500 truncate">{r.agency}</div>}
                      </div>
                      <Badge className={`${statusColor} hover:${statusColor} shrink-0`}>{r.relationship_status}</Badge>
                    </div>
                    <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                      {r.specialization && <div>🎯 {r.specialization}</div>}
                      {r.region_focus && <div>🌍 {r.region_focus}</div>}
                      {r.last_contacted && <div>Last contact: {format(parseISO(r.last_contacted), "d MMM yyyy")}</div>}
                      {r.next_followup && (
                        <div className={isBefore(parseISO(r.next_followup), new Date()) ? "text-red-600 font-medium" : ""}>
                          Follow up: {format(parseISO(r.next_followup), "d MMM yyyy")}
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

function RecruiterDialog({
  recruiter, onClose, onSave, onDelete,
}: {
  recruiter: Recruiter | null;
  onClose: () => void;
  onSave: (r: Partial<Recruiter> & { id?: string }) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<Partial<Recruiter>>(
    recruiter || { relationship_status: "New" }
  );
  const set = (k: keyof Recruiter, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recruiter ? "Edit recruiter" : "New recruiter"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *"><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Agency / Firm"><Input value={form.agency || ""} onChange={(e) => set("agency", e.target.value)} placeholder="e.g. Cooper Fitch, in-house" /></Field>
          <Field label="Specialization"><Input value={form.specialization || ""} onChange={(e) => set("specialization", e.target.value)} placeholder="e.g. Fintech sales, C-suite" /></Field>
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
            <Textarea rows={2} value={form.roles_pitched || ""} onChange={(e) => set("roles_pitched", e.target.value)} placeholder="What roles/companies have they brought you?" />
          </Field>
          <Field label="Notes" full>
            <Textarea rows={4} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="How you met, what they're good at, what to avoid..." />
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

function OpportunityDialog({
  opp, onClose, onSave, onDelete,
}: {
  opp: Opp | null;
  onClose: () => void;
  onSave: (o: Partial<Opp> & { id?: string }) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<Partial<Opp>>(
    opp || { direction: "Dubai", stage: "Lead", company_stage: "Unknown", equity_offered: "Unknown", entity_type: "Unknown" }
  );
  const set = (k: keyof Opp, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const fs = fitScore(form as Opp);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{opp ? "Edit opportunity" : "New opportunity"}</DialogTitle>
        </DialogHeader>

        {/* Non-negotiables */}
        <div className="p-3 rounded-lg bg-slate-50 border space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-700 uppercase tracking-wide">Non-negotiables</span>
            <FitBadge score={fs} />
          </div>
          <Criterion ok={(form.base_salary_monthly_usd ?? 0) >= 15000} label="Base salary ≥ $15,000/month" />
          <Criterion ok={form.equity_offered === "Yes - real equity"} label="Real equity (not phantom)" />
          <Criterion
            ok={form.entity_type === "DIFC/ADGM" || form.entity_type === "Foreign entity (real shares)"}
            label="Proper entity for equity"
            tooltip="Equity is only enforceable if the company is structured to issue real shares. ✅ DIFC/ADGM (common-law free zones with real share registries) or a foreign holding entity (Cayman, Delaware, Singapore). ❌ Mainland UAE LLCs can't cleanly issue equity to employees, and 'phantom equity' is just a deferred cash bonus."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Company *"><Input value={form.company_name || ""} onChange={(e) => set("company_name", e.target.value)} /></Field>
          <Field label="Role"><Input value={form.role_title || ""} onChange={(e) => set("role_title", e.target.value)} /></Field>
          <Field label="Direction">
            <Select value={form.direction} onValueChange={(v) => set("direction", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
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
          <Field label="Base salary (USD/mo)">
            <Input type="number" value={form.base_salary_monthly_usd || 0}
              onChange={(e) => set("base_salary_monthly_usd", parseFloat(e.target.value) || 0)} />
          </Field>
          <Field label="Equity">
            <Select value={form.equity_offered || "Unknown"} onValueChange={(v) => set("equity_offered", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EQUITY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Entity type">
            <Select value={form.entity_type || "Unknown"} onValueChange={(v) => set("entity_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ENTITY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
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
          <Field label="Notes / timeline" full>
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

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Criterion({ ok, label, tooltip }: { ok: boolean; label: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${ok ? "bg-green-500" : "bg-slate-300"}`}>
        {ok && <Check className="w-3 h-3 text-white" />}
      </span>
      <span className={ok ? "text-slate-800" : "text-slate-500"}>{label}</span>
      {tooltip && (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-slate-400 hover:text-slate-600">
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs leading-relaxed">{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// ---------- Resumes ----------
type Resume = {
  id: string;
  user_id: string;
  label: string;
  kind: "pdf" | "ats";
  file_path: string | null;
  content: string | null;
  notes: string | null;
  updated_at: string;
};

function ResumesSection() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Resume | null>(null);
  const [showNewAts, setShowNewAts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bucketMissing, setBucketMissing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await sb.from("job_resumes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
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
        return toast.error("Storage bucket missing — see banner above");
      }
      return toast.error(upErr.message);
    }
    const label = file.name.replace(/\.pdf$/i, "");
    const { error } = await sb.from("job_resumes").insert({
      user_id: user.id, label, kind: "pdf", file_path: path,
    });
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
    if (r.file_path) {
      await supabase.storage.from("resumes").remove([r.file_path]);
    }
    await sb.from("job_resumes").delete().eq("id", r.id);
    setEditing(null);
    load();
  };

  const saveResume = async (r: Partial<Resume> & { id?: string }) => {
    if (!user) return;
    if (r.id) {
      const { id, ...patch } = r;
      const { error } = await sb.from("job_resumes").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await sb.from("job_resumes").insert({
        user_id: user.id,
        label: r.label || "Untitled",
        kind: r.kind || "ats",
        content: r.content || "",
        notes: r.notes || null,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditing(null);
    setShowNewAts(false);
    load();
  };

  const pdfs = resumes.filter((r) => r.kind === "pdf");
  const atsVersions = resumes.filter((r) => r.kind === "ats");

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      {bucketMissing && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-sm text-amber-800">
          <strong>Storage bucket missing.</strong> Create a private bucket named <code className="bg-amber-100 px-1 rounded">resumes</code> in your Supabase dashboard → Storage, then retry the upload. RLS policies are already set up.
        </Card>
      )}

      {/* PDF resumes */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-slate-900">PDF resumes</h3>
            <p className="text-xs text-slate-500">Upload polished versions for different directions or roles.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.target.value = ""; }}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> {uploading ? "Uploading…" : "Upload PDF"}
          </Button>
        </div>

        {pdfs.length === 0 ? (
          <p className="text-sm text-slate-500">No PDFs uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pdfs.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border bg-white flex items-center gap-3">
                <div className="p-2 rounded bg-red-50 text-red-600 shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{r.label}</div>
                  <div className="text-xs text-slate-500">PDF · {format(parseISO(r.updated_at), "d MMM yyyy")}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => downloadPdf(r)}>Download</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteResume(r)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ATS text versions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-slate-900">ATS-friendly text versions</h3>
            <p className="text-xs text-slate-500">Plain-text resumes for application forms and ATS parsers. No tables, no columns, no graphics.</p>
          </div>
          <Button onClick={() => setShowNewAts(true)} className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> New ATS version
          </Button>
        </div>

        {atsVersions.length === 0 ? (
          <p className="text-sm text-slate-500">No ATS versions yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {atsVersions.map((r) => (
              <button
                key={r.id}
                onClick={() => setEditing(r)}
                className="text-left p-3 rounded-lg border bg-white hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-slate-900 truncate">{r.label}</div>
                  <Badge variant="secondary" className="shrink-0">ATS</Badge>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {(r.content?.length || 0).toLocaleString()} chars · Updated {format(parseISO(r.updated_at), "d MMM yyyy")}
                </div>
                {r.content && (
                  <div className="text-xs text-slate-600 mt-2 line-clamp-2 whitespace-pre-wrap font-mono">
                    {r.content.slice(0, 140)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>

      {(editing || showNewAts) && (
        <ResumeDialog
          resume={editing}
          onClose={() => { setEditing(null); setShowNewAts(false); }}
          onSave={saveResume}
          onDelete={editing ? () => deleteResume(editing) : undefined}
          onDownload={editing?.kind === "pdf" ? () => downloadPdf(editing) : undefined}
        />
      )}
    </div>
  );
}

function ResumeDialog({
  resume, onClose, onSave, onDelete, onDownload,
}: {
  resume: Resume | null;
  onClose: () => void;
  onSave: (r: Partial<Resume> & { id?: string }) => void;
  onDelete?: () => void;
  onDownload?: () => void;
}) {
  const [form, setForm] = useState<Partial<Resume>>(
    resume || { kind: "ats", label: "", content: "" }
  );
  const set = (k: keyof Resume, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const isPdf = form.kind === "pdf";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {resume ? `Edit ${isPdf ? "PDF" : "ATS"} resume` : "New ATS resume"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Label *">
            <Input value={form.label || ""} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Dubai Fintech Sales – v3" />
          </Field>

          {!isPdf && (
            <Field label="ATS-friendly text content">
              <Textarea
                rows={20}
                className="font-mono text-xs"
                value={form.content || ""}
                onChange={(e) => set("content", e.target.value)}
                placeholder={`NAME\nemail · phone · LinkedIn · city\n\nSUMMARY\n...\n\nEXPERIENCE\nCompany — Title (Mon YYYY – Present)\n• Achievement with metric\n• Achievement with metric\n\nEDUCATION\n...\n\nSKILLS\n...`}
              />
              <p className="text-xs text-slate-500 mt-1">
                Plain text only. Use • for bullets. No tables, columns, headers/footers, or icons.
              </p>
            </Field>
          )}

          <Field label="Notes">
            <Textarea
              rows={2}
              value={form.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="When to use this version, tweaks to make..."
            />
          </Field>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {onDelete && (
            <Button variant="outline" className="text-red-600 mr-auto gap-1" onClick={onDelete}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" onClick={onDownload}>Download PDF</Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...form, id: resume?.id })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
