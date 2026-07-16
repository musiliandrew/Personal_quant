"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import {
  Sparkles, TrendingDown, TrendingUp, Tag, X,
  Scissors, Zap, AlertTriangle, CheckCircle2, Edit3, SkipForward, Brain,
} from "lucide-react";
import { api } from "@/lib/api";
import UpgradeModal from "@/components/UpgradeModal";

const fmt = (n: number) =>
  `KSh ${Number(n).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

function formatDateRange(start?: string, end?: string) {
  if (!start || !end) return "Last 30 Days";
  const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const s = new Date(start).toLocaleDateString('en-US', opt);
  const e = new Date(end).toLocaleDateString('en-US', opt);
  return `${s} – ${e}`;
}

function cleanPatternName(pattern: string): string {
  if (!pattern) return "";
  let name = pattern.trim();
  
  // 1. Check for received from
  const receivedRegex = /(?:funds received from|received from)\s*(?:-\s*)?(?:\+?\d+[\d\*]*)?\s*(.+)/i;
  const mRec = name.match(receivedRegex);
  if (mRec) {
    name = mRec[1];
  } else {
    // 2. Check for send / transfer / payment to
    const sentRegex = /(?:customer transfer to|customer send money|send money to|payment to|sent to)\s*(?:-\s*)?(?:\+?\d+[\d\*]*)?\s*(.+)/i;
    const mSent = name.match(sentRegex);
    if (mSent) {
      name = mSent[1];
    }
  }

  // 3. Clean up account suffix
  name = name.replace(/\s+acc\..*$/i, "").replace(/\s+account\..*$/i, "");
  // 4. Clean up leading numbers
  name = name.replace(/^\+?\d+[\d\*]*\s+/, "");
  // 5. Trim special symbols
  name = name.replace(/^[-_\s\.\*]+/, "").replace(/[-_\s\.\*]+$/, "").trim();

  return name || pattern;
}

const TINTS = [
  "var(--gradient-sky)", "var(--gradient-lilac)", "var(--gradient-mint)",
  "var(--gradient-peach)", "var(--gradient-sky)",
];

export default function InsightsPage() {
  const [moneyMap, setMoneyMap] = useState<any>(null);
  const [aliases, setAliases] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isEditingRange, setIsEditingRange] = useState(false);
  const [unresolved, setUnresolved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllIncome, setShowAllIncome] = useState(false);
  const [showAllSpend, setShowAllSpend] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "teach" | "saved">("map");

  // Teach Quant drawer
  const [teachOpen, setTeachOpen] = useState(false);
  const [teachTarget, setTeachTarget] = useState<string>("");
  const [teachLabel, setTeachLabel] = useState("");
  const [teachCategory, setTeachCategory] = useState("");
  const [teachReason, setTeachReason] = useState("");
  const [teachNecessary, setTeachNecessary] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cut simulator drawer
  const [simOpen, setSimOpen] = useState(false);
  const [simTarget, setSimTarget] = useState<any>(null);
  const [simCut, setSimCut] = useState(50);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  // AI auto-label suggestions
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [editingSuggestion, setEditingSuggestion] = useState<any>(null);
  const [detailSuggestion, setDetailSuggestion] = useState<any>(null);
  // Premium subscription gates
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await api.getMoneyMap();
      setMoneyMap(res.money_map);
      setAliases(res.aliases || []);
      setUnresolved(res.unresolved_patterns || []);
      
      const user = await api.getMe();
      setIsPro(user.is_pro_active ?? user.is_pro);
    } catch (_) {
      setIsPro(false);
    }
    if (!background) setLoading(false);
    // Load AI suggestions in background (non-blocking)
    fetchAiSuggestions();
  };

  const fetchAiSuggestions = async () => {
    setAiLoading(true);
    try {
      const res = await api.getAutoLabels(15);
      setAiSuggestions(res.suggestions || []);
    } catch (_) {}
    setAiLoading(false);
  };

  const confirmSuggestion = async (s: any, overrideLabel?: string, overrideCategory?: string) => {
    try {
      await api.saveMerchantAlias({
        raw_pattern: s.raw_pattern,
        label: overrideLabel || s.suggested_label,
        category: overrideCategory || s.suggested_category,
        is_necessary: s.is_necessary,
      });
      setDismissedSuggestions((prev) => new Set([...prev, s.raw_pattern]));
      setEditingSuggestion(null);
      fetchInsights(true); // refresh money map with new alias in the background
    } catch (_) {}
  };

  const skipSuggestion = (raw: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, raw]));
  };

  const openTeach = (rawPattern: string) => {
    if (isPro === false) {
      setIsUpgradeOpen(true);
      return;
    }
    setTeachTarget(rawPattern);
    setTeachLabel("");
    setTeachCategory("");
    setTeachReason("");
    setTeachNecessary(false);
    setTeachOpen(true);
  };

  const saveAlias = async () => {
    if (!teachLabel.trim() || saving) return;
    setSaving(true);
    try {
      await api.saveMerchantAlias({
        raw_pattern: teachTarget,
        label: teachLabel,
        category: teachCategory,
        reason: teachReason,
        is_necessary: teachNecessary,
      });
      setTeachOpen(false);
      fetchInsights(true); // refresh money map with new alias in the background
    } catch (_) {}
    setSaving(false);
  };

  const openSim = (sink: any) => {
    if (isPro === false) {
      setIsUpgradeOpen(true);
      return;
    }
    setSimTarget(sink);
    setSimCut(50);
    setSimResult(null);
    setSimOpen(true);
  };

  const runSimulation = async () => {
    if (!simTarget || simLoading) return;
    setSimLoading(true);
    try {
      const result = await api.simulateSpendCut({
        label: simTarget.label,
        category: simTarget.category,
        cut_pct: simCut,
      });
      setSimResult(result);
    } catch (_) {
      // Local fallback
      const saving = simTarget.total * (simCut / 100);
      setSimResult({
        monthly_saving: saving,
        annual_saving: saving * 12,
        verdict: `Cutting ${simTarget.label} by ${simCut}% saves ${fmt(saving)}/mo (${fmt(saving * 12)}/yr).`,
        goal_impact: null,
      });
    }
    setSimLoading(false);
  };

  useEffect(() => {
    const open = teachOpen || simOpen;
    const event = new CustomEvent("quant-drawer-state", { detail: { open } });
    window.dispatchEvent(event);
  }, [teachOpen, simOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }}
          className="text-[12px] sm:text-[13px] text-muted-foreground font-semibold">Loading your money map…</motion.div>
      </div>
    );
  }

  const totalIn = moneyMap?.total_income_30d || 0;
  const totalOut = moneyMap?.total_spend_30d || 0;
  const net30 = moneyMap?.net_30d || 0;
  const incomeSources = moneyMap?.income_sources || [];
  const spendSinks = moneyMap?.spend_sinks || [];

  return (
    <div className="space-y-4 sm:space-y-6 pt-2">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight">Money Map</h1>
        <p className="mt-0.5 text-[11px] sm:text-[13px] text-muted-foreground font-semibold">
          Where it comes from. Where it goes. What to cut.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="grid grid-cols-3 rounded-xl bg-foreground/[0.04] p-1 border border-foreground/[0.06] w-full shrink-0">
        {[
          { id: "map", labelMobile: "Map", labelDesktop: "Money Map" },
          { 
            id: "teach", 
            labelMobile: "Teach", 
            labelDesktop: "Teach Quant",
            badge: (aiSuggestions.filter(s => !dismissedSuggestions.has(s.raw_pattern)).length + unresolved.length) || 0
          },
          { 
            id: "saved", 
            labelMobile: "Rules", 
            labelDesktop: "Quant Knows", 
            badge: aliases.length || 0 
          }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative py-2 text-[12px] sm:text-[13px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === tab.id
                ? "bg-foreground text-background shadow-sm animate-fade-in"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>
              <span className="inline sm:hidden">{tab.labelMobile}</span>
              <span className="hidden sm:inline">{tab.labelDesktop}</span>
            </span>
            {!!tab.badge && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === tab.id 
                  ? "bg-background text-foreground" 
                  : "bg-foreground/[0.08] text-muted-foreground"
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Money Map */}
      {activeTab === "map" && moneyMap && (
        <div className="space-y-4 sm:space-y-6">
          {/* 30-day net summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="glass rounded-[20px] sm:rounded-3xl p-4 sm:p-5"
          >
            {!isEditingRange ? (
              <button
                onClick={() => {
                  if (moneyMap?.end_date) {
                    setSelectedMonth(moneyMap.end_date.substring(0, 7));
                  }
                  setIsEditingRange(true);
                }}
                className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground font-bold transition-colors"
              >
                <span>{formatDateRange(moneyMap?.start_date, moneyMap?.end_date)}</span>
                <span className="text-[8px]">▼</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-foreground/[0.04] text-[10px] sm:text-[11.5px] px-2.5 py-1 rounded-md border border-foreground/10 text-foreground font-semibold focus:outline-none focus:border-sky-500/50"
                />
                <button
                  onClick={async () => {
                    if (!selectedMonth) return;
                    setIsEditingRange(false);
                    setLoading(true);
                    const [year, month] = selectedMonth.split("-").map(Number);
                    const start = `${selectedMonth}-01`;
                    const lastDay = new Date(year, month, 0).getDate();
                    const end = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;
                    try {
                      const res = await api.getMoneyMap(start, end);
                      setMoneyMap(res.money_map);
                      setAliases(res.aliases || []);
                      setUnresolved(res.unresolved_patterns || []);
                    } catch (_) {}
                    finally { setLoading(false); }
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white text-[9px] sm:text-[10px] px-2 py-1 rounded-md font-bold transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => setIsEditingRange(false)}
                  className="text-muted-foreground hover:text-foreground text-[9px] sm:text-[10px] px-1 py-1 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { label: "Income", value: totalIn, color: "text-emerald-400" },
                { label: "Spent", value: totalOut, color: "text-orange-400" },
                { label: "Net", value: net30, color: net30 >= 0 ? "text-sky-400" : "text-destructive" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl sm:rounded-2xl bg-foreground/[0.04] p-2.5 sm:p-3 min-w-0">
                  <p className="text-[8.5px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">{label}</p>
                  <p className={`mt-0.5 text-[12.5px] xs:text-[14px] sm:text-[16px] font-bold tabular-nums truncate ${color}`} title={fmt(value)}>{fmt(value)}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Income Sources */}
          {incomeSources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass rounded-[20px] sm:rounded-3xl p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Money comes from
              </div>
              <div className="space-y-3.5">
                {incomeSources.slice(0, showAllIncome ? incomeSources.length : 5).map((src: any, i: number) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-[12.5px] sm:text-[13px] mb-1">
                      <span className="font-semibold truncate max-w-[45%] xs:max-w-[55%] sm:max-w-[60%]">{src.label}</span>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-muted-foreground text-[10px] sm:text-[11px] font-bold">{src.pct_of_income}%</span>
                        <span className="font-bold text-emerald-400">{fmt(src.total)}</span>
                      </div>
                    </div>
                    <div className="h-1 sm:h-1.5 rounded-full bg-foreground/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(src.pct_of_income, 100)}%` }}
                        transition={{ duration: 0.9, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-emerald-500/70"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {incomeSources.length > 5 && (
                <button
                  onClick={() => setShowAllIncome(prev => !prev)}
                  className="w-full mt-4 text-[10px] sm:text-[11px] text-sky-400 hover:text-sky-500 font-bold text-center transition-colors"
                >
                  {showAllIncome ? "Show less" : `Show all (+${incomeSources.length - 5} sources)`}
                </button>
              )}
            </motion.div>
          )}

          {/* Spend Sinks */}
          {spendSinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              className="rounded-[20px] sm:rounded-3xl p-4 sm:p-5 soft-card"
            >
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3.5">
                <TrendingDown className="h-3.5 w-3.5 text-orange-400" /> Money goes to
              </div>
              <div className="space-y-3">
                {spendSinks.slice(0, showAllSpend ? spendSinks.length : 5).map((sink: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => openSim(sink)}
                    className="w-full group text-left"
                  >
                    <div className="flex items-center justify-between text-[12.5px] sm:text-[13px] mb-1">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <span className="font-semibold truncate max-w-[50%] xs:max-w-[60%] sm:max-w-[70%]">{sink.label}</span>
                        {!sink.is_necessary && (
                          <span className="text-[8.5px] bg-orange-500/10 text-orange-400 font-bold px-1.5 py-0.5 rounded-full shrink-0">discretionary</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-muted-foreground text-[10px] sm:text-[11px] font-bold">{sink.pct_of_spend}%</span>
                        <span className="font-bold">{fmt(sink.total)}</span>
                        <Scissors className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                      </div>
                    </div>
                    <div className="h-1 sm:h-1.5 rounded-full bg-foreground/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(sink.pct_of_spend, 100)}%` }}
                        transition={{ duration: 0.9, delay: 0.05 * i }}
                        className="h-full rounded-full"
                        style={{ background: TINTS[i % TINTS.length] }}
                      />
                    </div>
                  </button>
                ))}
              </div>
              {spendSinks.length > 5 && (
                <button
                  onClick={() => setShowAllSpend(prev => !prev)}
                  className="w-full mt-4 text-[10px] sm:text-[11px] text-sky-400 hover:text-sky-500 font-bold text-center transition-colors"
                >
                  {showAllSpend ? "Show less" : `Show all (+${spendSinks.length - 5} destinations)`}
                </button>
              )}
              <p className="mt-3.5 text-[10px] sm:text-[11px] text-muted-foreground font-semibold text-center">
                Tap any row to simulate cutting it
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab: Teach Quant */}
      {activeTab === "teach" && moneyMap && (
        <div className="space-y-4 sm:space-y-6">
          {/* AI suggestions */}
          {(aiLoading || aiSuggestions.filter(s => !dismissedSuggestions.has(s.raw_pattern)).length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass rounded-[20px] sm:rounded-3xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  <Brain className="h-3.5 w-3.5 text-sky-400" />
                  Quant Labelled These
                </div>
                {aiLoading && (
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-[9px] sm:text-[10px] text-muted-foreground font-bold">Classifying…</motion.div>
                )}
              </div>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold mb-3.5">
                Confirm the ones Quant got right. Edit or skip the rest.
              </p>

              <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {aiSuggestions
                  .filter(s => !dismissedSuggestions.has(s.raw_pattern))
                  .map((s: any, i: number) => (
                    <motion.div
                      key={s.raw_pattern}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ delay: 0.04 * i }}
                      className="rounded-xl sm:rounded-2xl bg-foreground/[0.04] overflow-hidden"
                    >
                      <div 
                        onClick={() => setDetailSuggestion(s)}
                        className="px-3.5 sm:px-4 pt-3 pb-2.5 cursor-pointer hover:bg-foreground/[0.02] active:bg-foreground/[0.04] transition-colors"
                      >
                        {/* Raw Pattern as Main Header + confidence badge */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-[12px] sm:text-[13px] font-bold font-mono tracking-tight text-foreground truncate max-w-[70%]">
                            {cleanPatternName(s.raw_pattern)}
                          </p>
                          <span className={`shrink-0 text-[8.5px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                            s.confidence === "high" ? "bg-emerald-500/15 text-emerald-400" :
                            s.confidence === "medium" ? "bg-amber-500/15 text-amber-400" :
                            "bg-foreground/10 text-muted-foreground"
                          }`}>
                            {s.source === "ai" ? (
                              <>
                                <Brain className="h-2.5 w-2.5 animate-pulse" />
                                <span>AI</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-2.5 w-2.5" />
                                <span>Rule</span>
                              </>
                            )}
                            <span className="opacity-40">·</span>
                            <span>{s.confidence}</span>
                          </span>
                        </div>

                        {/* AI Suggested Label & Category details */}
                        <div className="flex items-center gap-1.5 flex-wrap text-muted-foreground text-[10.5px] sm:text-[11px] font-semibold mt-1">
                          <span>Quant suggests:</span>
                          <strong className="text-foreground font-bold">{s.suggested_label}</strong>
                          <span className="text-[9px] bg-foreground/[0.06] text-foreground/80 px-1.5 py-0.5 rounded-full font-bold">{s.suggested_category}</span>
                          {s.is_necessary && (
                            <span className="text-[8.5px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">essential</span>
                          )}
                        </div>
                        
                        <p className="text-[10px] sm:text-[10.5px] text-muted-foreground/80 font-bold mt-1.5">
                          {s.tx_count}x · {fmt(s.total_30d)} {s.tx_type === "CREDIT" ? "received" : "spent"}
                        </p>
                      </div>

                      {/* Edit inline if active */}
                      {editingSuggestion?.raw_pattern === s.raw_pattern ? (
                        <div className="px-3.5 pb-3 space-y-2 border-t border-foreground/[0.06] pt-2.5">
                          <input
                            defaultValue={s.suggested_label}
                            id={`edit-label-${i}`}
                            placeholder="Label"
                            className="w-full rounded-lg bg-foreground/[0.06] px-3 py-2 text-[12.5px] sm:text-[13px] outline-none"
                          />
                          <input
                            defaultValue={s.suggested_category}
                            id={`edit-cat-${i}`}
                            placeholder="Category"
                            className="w-full rounded-lg bg-foreground/[0.06] px-3 py-2 text-[12.5px] sm:text-[13px] outline-none"
                          />
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                const lbl = (document.getElementById(`edit-label-${i}`) as HTMLInputElement)?.value;
                                const cat = (document.getElementById(`edit-cat-${i}`) as HTMLInputElement)?.value;
                                confirmSuggestion(s, lbl, cat);
                              }}
                              className="flex-1 bg-foreground text-background py-2 rounded-xl text-[12px] sm:text-[12.5px] font-bold"
                            >Save</button>
                            <button onClick={() => setEditingSuggestion(null)}
                              className="px-4 rounded-xl bg-foreground/[0.06] text-[12px] sm:text-[12.5px] font-bold">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        /* Action row */
                        <div className="flex border-t border-foreground/[0.06]">
                          <button onClick={() => confirmSuggestion(s)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] sm:text-[12px] font-bold text-emerald-400 hover:bg-emerald-500/5 transition-colors">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                          </button>
                          <div className="w-px bg-foreground/[0.06]" />
                          <button onClick={() => setEditingSuggestion(s)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] sm:text-[12px] font-bold text-sky-400 hover:bg-sky-500/5 transition-colors">
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <div className="w-px bg-foreground/[0.06]" />
                          <button onClick={() => skipSuggestion(s.raw_pattern)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] sm:text-[12px] font-bold text-muted-foreground hover:bg-foreground/[0.04] transition-colors">
                            <SkipForward className="h-3.5 w-3.5" /> Skip
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Unresolved — Teach Quant */}
          {unresolved.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              className="glass rounded-[20px] sm:rounded-3xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Teach Quant
                </div>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold">{unresolved.length} unlabelled</span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold mb-3">
                These merchant names are unknown. Tell Quant what they are — it'll use this to coach you better.
              </p>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {unresolved.slice(0, 6).map((u: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => openTeach(u.raw)}
                    className="w-full flex items-center justify-between glass rounded-xl sm:rounded-2xl px-3 py-2.5 sm:py-3 text-left hover:bg-foreground/[0.02] active:scale-[0.98] transition-all"
                  >
                    <div className="min-w-0 mr-2 flex-1">
                      <p className="text-[11.5px] sm:text-[12.5px] font-semibold font-mono truncate">{cleanPatternName(u.raw)}</p>
                      <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-semibold">{fmt(u.total)}/mo</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10.5px] sm:text-[11px] text-sky-400 font-bold shrink-0">
                      <Tag className="h-3.5 w-3.5" /> Label
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Caught up empty state */}
          {aiSuggestions.filter(s => !dismissedSuggestions.has(s.raw_pattern)).length === 0 && unresolved.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-[20px] sm:rounded-3xl p-8 text-center"
            >
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2.5" />
              <p className="text-[14px] font-bold">You're all caught up!</p>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold mt-1">
                No unlabelled recurring patterns found in your statements.
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab: Quant Knows */}
      {activeTab === "saved" && moneyMap && (
        <div className="space-y-4 sm:space-y-6">
          {aliases.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="glass rounded-[20px] sm:rounded-3xl p-4 sm:p-5"
            >
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Quant Knows</p>
              <div className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {aliases.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2.5 rounded-xl sm:rounded-2xl bg-foreground/[0.03] px-3 py-2.5">
                    <span className="grid h-6.5 w-6.5 place-items-center rounded-lg bg-foreground/[0.06] shrink-0">
                      <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] sm:text-[12px] font-semibold truncate">{a.label}</p>
                      <p className="text-[10px] sm:text-[10.5px] text-muted-foreground font-semibold font-mono truncate">{a.raw_pattern}</p>
                    </div>
                    {a.category && (
                      <span className="text-[9px] sm:text-[10px] bg-foreground/[0.06] px-1.5 py-0.5 rounded-full font-bold shrink-0">{a.category}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-[20px] sm:rounded-3xl p-8 text-center"
            >
              <Brain className="mx-auto h-8 w-8 text-sky-400 mb-2.5" />
              <p className="text-[14px] font-bold">No rules defined yet</p>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold mt-1">
                Label transaction patterns in the "Teach Quant" tab to see them here.
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* ── TEACH QUANT DRAWER ── */}
      <AnimatePresence>
        {teachOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="glass-strong w-full max-w-md rounded-t-[28px] px-5 pt-4 pb-10 border-t border-foreground/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-[16px] font-semibold">Teach Quant</p>
                <button onClick={() => setTeachOpen(false)} className="glass grid h-8 w-8 place-items-center rounded-full">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl bg-foreground/[0.04] px-3.5 py-3 mb-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Transaction pattern</p>
                <p className="mt-1 text-[14px] font-bold font-mono">{teachTarget}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">What is this? *</label>
                  <input value={teachLabel} onChange={(e) => setTeachLabel(e.target.value)}
                    placeholder="e.g. Liquor Store, Rent, Gym"
                    className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-3 text-[13.5px] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Category</label>
                  <input value={teachCategory} onChange={(e) => setTeachCategory(e.target.value)}
                    placeholder="e.g. Alcohol, Food, Transport"
                    className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-3 text-[13.5px] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Reason (optional)</label>
                  <input value={teachReason} onChange={(e) => setTeachReason(e.target.value)}
                    placeholder="e.g. I buy alcohol here on weekends"
                    className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-3 text-[13.5px] outline-none" />
                </div>

                <button
                  onClick={() => setTeachNecessary((v) => !v)}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 transition-colors ${teachNecessary ? "bg-emerald-500/10" : "bg-foreground/[0.04]"}`}
                >
                  <span className="text-[13px] font-semibold">Essential / Non-negotiable?</span>
                  <span className={`text-[12px] font-bold ${teachNecessary ? "text-emerald-400" : "text-muted-foreground"}`}>
                    {teachNecessary ? "Yes" : "No"}
                  </span>
                </button>
              </div>

              <button
                onClick={saveAlias}
                disabled={saving || !teachLabel.trim()}
                className="mt-5 w-full bg-foreground text-background py-3.5 rounded-full text-[13.5px] font-bold disabled:opacity-50"
              >
                {saving ? "Saving…" : "Teach Quant"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CUT SIMULATOR DRAWER ── */}
      <AnimatePresence>
        {simOpen && simTarget && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="glass-strong w-full max-w-md rounded-t-[28px] px-5 pt-4 pb-10 border-t border-foreground/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-[16px] font-semibold">Cut Simulator</p>
                <button onClick={() => setSimOpen(false)} className="glass grid h-8 w-8 place-items-center rounded-full">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl bg-foreground/[0.04] px-4 py-3.5 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">{simTarget.label}</p>
                    <p className="text-[22px] font-bold">{fmt(simTarget.total)}<span className="text-[13px] text-muted-foreground font-semibold">/mo</span></p>
                  </div>
                  <Scissors className="h-6 w-6 text-orange-400" />
                </div>
              </div>

              {/* Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] text-muted-foreground font-semibold">Cut by</p>
                  <p className="text-[18px] font-bold">{simCut}%</p>
                </div>
                <input
                  type="range" min={10} max={100} step={5}
                  value={simCut} onChange={(e) => { setSimCut(Number(e.target.value)); setSimResult(null); }}
                  className="w-full h-2 rounded-full accent-foreground"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold mt-1">
                  <span>10%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>

              <button
                onClick={runSimulation}
                disabled={simLoading}
                className="mt-5 w-full bg-foreground text-background py-3 rounded-full text-[13.5px] font-bold disabled:opacity-50"
              >
                {simLoading ? "Calculating…" : `Show me if I cut by ${simCut}%`}
              </button>

              {simResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-emerald-500/10 p-3.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Monthly Saving</p>
                      <p className="mt-1 text-[18px] font-bold text-emerald-400">{fmt(simResult.monthly_saving)}</p>
                    </div>
                    <div className="rounded-2xl bg-sky-500/10 p-3.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Annual Saving</p>
                      <p className="mt-1 text-[18px] font-bold text-sky-400">{fmt(simResult.annual_saving)}</p>
                    </div>
                  </div>

                  {simResult.goal_impact && simResult.goal_impact.months_saved > 0 && (
                    <div className="rounded-2xl bg-foreground/[0.04] p-3.5 flex gap-2.5 items-start">
                      <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[12.5px] font-semibold leading-snug">
                        Your <strong>{simResult.goal_impact.goal_title}</strong> goal arrives{" "}
                        <strong className="text-emerald-400">{simResult.goal_impact.months_saved} months sooner</strong>.
                      </p>
                    </div>
                  )}

                  <p className="text-[12px] text-muted-foreground font-semibold leading-relaxed">
                    {simResult.verdict}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DETAIL SUGGESTION MODAL ── */}
      <AnimatePresence>
        {detailSuggestion && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="glass-strong w-full max-w-md rounded-t-[32px] px-6 pt-5 pb-10 border-t border-foreground/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Brain className="h-4.5 w-4.5 text-sky-400" />
                  <p className="text-[15px] sm:text-[16px] font-semibold">Classification Detail</p>
                </div>
                <button onClick={() => setDetailSuggestion(null)} className="glass grid h-8 w-8 place-items-center rounded-full">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Full statement pattern (word-wrap) */}
                <div className="rounded-2xl bg-foreground/[0.04] p-4">
                  <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground font-bold">Statement Pattern</p>
                  <p className="mt-1 text-[13px] font-mono leading-relaxed break-all font-semibold text-foreground/95">
                    {detailSuggestion.raw_pattern}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-foreground/[0.03] p-3">
                    <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground font-bold">Suggested Label</p>
                    <p className="mt-1 text-[14px] font-bold">{detailSuggestion.suggested_label}</p>
                  </div>
                  <div className="rounded-xl bg-foreground/[0.03] p-3">
                    <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground font-bold">Category</p>
                    <p className="mt-1 text-[14px] font-bold">{detailSuggestion.suggested_category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-foreground/[0.03] p-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Frequency</p>
                    <p className="mt-0.5 text-[12.5px] font-bold">{detailSuggestion.tx_count}x</p>
                  </div>
                  <div className="rounded-xl bg-foreground/[0.03] p-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Total Amount</p>
                    <p className="mt-0.5 text-[12.5px] font-bold text-sky-400">{fmt(detailSuggestion.total_30d)}</p>
                  </div>
                  <div className="rounded-xl bg-foreground/[0.03] p-2.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Confidence</p>
                    <p className="mt-0.5 text-[12.5px] font-bold capitalize">{detailSuggestion.confidence}</p>
                  </div>
                </div>

                {detailSuggestion.is_necessary && (
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="text-[12px] font-bold">Classified as Essential / Non-negotiable</span>
                  </div>
                )}
              </div>

              {/* Action buttons inside the modal drawer */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    confirmSuggestion(detailSuggestion);
                    setDetailSuggestion(null);
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-full text-[13px] font-bold transition-all active:scale-[0.98]"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setEditingSuggestion(detailSuggestion);
                    setDetailSuggestion(null);
                  }}
                  className="flex-1 bg-foreground text-background py-3 rounded-full text-[13px] font-bold transition-all active:scale-[0.98]"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    skipSuggestion(detailSuggestion.raw_pattern);
                    setDetailSuggestion(null);
                  }}
                  className="px-5 bg-foreground/[0.06] hover:bg-foreground/[0.1] text-foreground py-3 rounded-full text-[13px] font-bold transition-all active:scale-[0.98]"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        onSuccess={() => setIsPro(true)} 
      />
    </div>
  );
}
