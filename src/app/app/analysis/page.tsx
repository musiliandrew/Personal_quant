"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import UpgradeModal from "@/components/UpgradeModal";

// ── Types ────────────────────────────────────────────────────────────────────

interface MonthData {
  month: string;
  month_key: string;
  income: number;
  expenses: number;
  net_savings: number;
  transaction_count: number;
  top_categories: { category: string; amount: number }[];
  verdict: string;
}

interface WeekData {
  week_label: string;
  week_start: string;
  week_end: string;
  income: number;
  expenses: number;
  net: number;
  heaviest_day: string | null;
  heaviest_day_spend: number;
  top_category: string;
  top_category_spend: number;
  signal: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function savingsIcon(net: number) {
  if (net > 0) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
  if (net < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function savingsColor(net: number) {
  if (net > 0) return "text-emerald-400";
  if (net < 0) return "text-red-400";
  return "text-muted-foreground";
}

// ── Sub-components ───────────────────────────────────────────────────────────

function VerdictCard({ verdict, isFirst }: { verdict: string; isFirst: boolean }) {
  const isPositive =
    verdict.toLowerCase().includes("strong") ||
    verdict.toLowerCase().includes("good") ||
    verdict.toLowerCase().includes("compounding");
  const isCritical =
    verdict.toLowerCase().includes("more than you earned") ||
    verdict.toLowerCase().includes("act now") ||
    verdict.toLowerCase().includes("outspend");

  return (
    <div
      className={`mt-3 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 text-[12.5px] sm:text-[13.5px] leading-snug font-medium ${
        isCritical
          ? "bg-red-500/10 text-red-300"
          : isPositive
          ? "bg-emerald-500/10 text-emerald-300"
          : "bg-foreground/[0.05] text-foreground/80"
      }`}
    >
      {isCritical ? (
        <AlertCircle className="mb-0.5 h-3.5 w-3.5 inline mr-1.5 opacity-80" />
      ) : isPositive ? (
        <CheckCircle2 className="mb-0.5 h-3.5 w-3.5 inline mr-1.5 opacity-80" />
      ) : null}
      {verdict}
    </div>
  );
}

function MonthCard({ data, index }: { data: MonthData; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const hasActivity = data.income > 0 || data.expenses > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-[20px] sm:rounded-[22px] border border-foreground/[0.07] bg-foreground/[0.03] overflow-hidden"
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 text-left"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {savingsIcon(data.net_savings)}
          <div className="min-w-0">
            <p className="text-[13.5px] sm:text-[15px] font-semibold truncate">{data.month}</p>
            {hasActivity && (
              <p className="text-[10.5px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                {data.transaction_count} transactions
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {hasActivity && (
            <span className={`text-[13px] sm:text-[14px] font-bold tabular-nums ${savingsColor(data.net_savings)}`}>
              {data.net_savings >= 0 ? "+" : ""}
              {fmt(data.net_savings)}
            </span>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3.5">
              {hasActivity ? (
                <>
                  {/* Income / Expenses bar */}
                  <div className="flex items-center gap-3 bg-foreground/[0.02] border border-foreground/[0.04] px-3.5 py-2.5 rounded-xl">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <div className="min-w-0 leading-tight">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mr-1">In</span>
                        <p className="text-[13.5px] font-bold text-emerald-300 tabular-nums truncate">{fmt(data.income)}</p>
                      </div>
                    </div>
                    <div className="h-5 w-px bg-foreground/[0.08] shrink-0" />
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                      <div className="min-w-0 leading-tight">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mr-1">Out</span>
                        <p className="text-[13.5px] font-bold text-red-300 tabular-nums truncate">{fmt(data.expenses)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top categories */}
                  {data.top_categories.length > 0 && (
                    <div>
                      <p className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Where it went
                      </p>
                      <div className="space-y-2">
                        {data.top_categories.map((cat, i) => {
                          const pct = data.expenses > 0
                            ? Math.round((cat.amount / data.expenses) * 100)
                            : 0;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex justify-between text-[11.5px] sm:text-[12px] font-semibold mb-1">
                                  <span className="truncate pr-1">{cat.category}</span>
                                  <span className="text-muted-foreground tabular-nums shrink-0">
                                    {fmt(cat.amount)} · {pct}%
                                  </span>
                                </div>
                                <div className="h-1 rounded-full bg-foreground/[0.08]">
                                  <div
                                    className="h-full rounded-full bg-foreground/40"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Verdict */}
                  <VerdictCard verdict={data.verdict} isFirst={index === 0} />
                </>
              ) : (
                <p className="text-[12px] sm:text-[13px] text-muted-foreground">
                  No transactions recorded this month.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WeekCard({ data, index }: { data: WeekData; index: number }) {
  const isSignalCritical =
    data.signal.toLowerCase().includes("act now") ||
    data.signal.toLowerCase().includes("outspend");
  const isSignalGood = data.signal.toLowerCase().includes("good position");

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-[20px] sm:rounded-[22px] border border-foreground/[0.07] bg-foreground/[0.03] p-4 sm:p-5 space-y-3"
    >
      {/* Week label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold">
            {data.week_label}
          </p>
        </div>
        <span
          className={`text-[12.5px] sm:text-[13px] font-bold tabular-nums ${savingsColor(data.net)}`}
        >
          {data.net >= 0 ? "+" : ""}
          {fmt(data.net)}
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 text-[11.5px] sm:text-[12px]">
        {data.heaviest_day && (
          <div className="rounded-xl bg-foreground/[0.05] px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-0">
            <p className="text-muted-foreground text-[9px] sm:text-[10px] uppercase tracking-wide font-bold truncate">
              Heaviest day
            </p>
            <p className="font-semibold mt-0.5 truncate">
              {data.heaviest_day}{" "}
              <span className="text-muted-foreground font-medium tabular-nums block xs:inline">
                ({fmt(data.heaviest_day_spend)})
              </span>
            </p>
          </div>
        )}
        {data.top_category && (
          <div className="rounded-xl bg-foreground/[0.05] px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-0">
            <p className="text-muted-foreground text-[9px] sm:text-[10px] uppercase tracking-wide font-bold truncate">
              Top category
            </p>
            <p className="font-semibold mt-0.5 truncate">
              {data.top_category}{" "}
              <span className="text-muted-foreground font-medium tabular-nums block xs:inline">
                ({fmt(data.top_category_spend)})
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Signal */}
      <div
        className={`rounded-xl sm:rounded-2xl px-3.5 py-2.5 text-[12px] sm:text-[13px] font-medium leading-snug ${
          isSignalCritical
            ? "bg-red-500/10 text-red-300"
            : isSignalGood
            ? "bg-emerald-500/10 text-emerald-300"
            : "bg-foreground/[0.05] text-foreground/80"
        }`}
      >
        <Zap
          className={`mb-0.5 h-3.5 w-3.5 inline mr-1.5 ${
            isSignalCritical
              ? "text-red-400"
              : isSignalGood
              ? "text-emerald-400"
              : "text-muted-foreground"
          }`}
        />
        {data.signal}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "monthly" | "weekly";

export default function AnalysisPage() {
  const [tab, setTab] = useState<Tab>("monthly");
  const [monthly, setMonthly] = useState<{ months: MonthData[]; overall_summary: string } | null>(null);
  const [weekly, setWeekly]   = useState<{ weeks: WeekData[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    Promise.all([api.getMonthlyAnalysis(), api.getWeeklyAnalysis(), api.getMe()])
      .then(([m, w, user]) => {
        setMonthly(m);
        setWeekly(w);
        setIsPro(user.is_pro);
      })
      .catch((err) => {
        console.error("Error loading analysis data:", err);
        setIsPro(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4 sm:space-y-5 pt-2 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[10px] sm:text-[12px] text-muted-foreground font-semibold uppercase tracking-wider">
          Your money, explained
        </p>
        <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight mt-0.5">
          Analysis
        </h1>
      </motion.div>

      {/* Overall summary */}
      {monthly?.overall_summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 sm:mt-5 rounded-[20px] sm:rounded-3xl bg-foreground/[0.05] border border-foreground/[0.07] p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Quant's take
          </div>
          <p className="text-[13px] sm:text-[14px] font-medium leading-snug">
            {monthly.overall_summary}
          </p>
        </motion.div>
      )}

      {/* Tab switcher */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-4 sm:mt-5 flex gap-2 rounded-xl sm:rounded-2xl bg-foreground/[0.05] p-1"
      >
        {(["monthly", "weekly"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl py-2 text-[12.5px] sm:text-[13px] font-semibold transition-all ${
              tab === t
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {t === "monthly" ? (
              <Calendar className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {t === "monthly" ? "By Month" : "By Week"}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <div className="mt-4 sm:mt-5 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-[20px] sm:rounded-[22px] bg-foreground/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : tab === "monthly" ? (
          <>
            {monthly?.months.slice(0, isPro ? undefined : 1).map((m, i) => (
              <MonthCard key={m.month_key} data={m} index={i} />
            ))}
            {isPro === false && monthly?.months && monthly.months.length > 1 && (
              <div className="relative mt-4 overflow-hidden rounded-[24px] border border-foreground/10 p-6 text-center bg-transparent glass flex flex-col items-center justify-center min-h-[220px]">
                <div className="absolute inset-0 -z-10 bg-background/30 backdrop-blur-md" />
                <div className="absolute inset-0 -z-20 bg-gradient-to-b from-transparent to-background/90" />
                
                <div className="relative z-10 flex flex-col items-center max-w-xs">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 grid place-items-center mb-3">
                    <Lock className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-[16px] font-bold text-foreground">Unlock Complete Analysis</h3>
                  <p className="text-[11.5px] text-muted-foreground font-semibold mt-1 px-2">
                    Get unlimited monthly history, deep weekly velocity trends, and AI cashflow forecasts.
                  </p>
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="mt-4 rounded-full bg-foreground text-background px-6 py-2.5 text-[12.5px] font-bold active:scale-95 transition-transform"
                  >
                    Upgrade to Quant Pro
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {weekly?.weeks.slice(0, isPro ? undefined : 1).map((w, i) => (
              <WeekCard key={w.week_start} data={w} index={i} />
            ))}
            {isPro === false && weekly?.weeks && weekly.weeks.length > 1 && (
              <div className="relative mt-4 overflow-hidden rounded-[24px] border border-foreground/10 p-6 text-center bg-transparent glass flex flex-col items-center justify-center min-h-[220px]">
                <div className="absolute inset-0 -z-10 bg-background/30 backdrop-blur-md" />
                <div className="absolute inset-0 -z-20 bg-gradient-to-b from-transparent to-background/90" />
                
                <div className="relative z-10 flex flex-col items-center max-w-xs">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 grid place-items-center mb-3">
                    <Lock className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="text-[16px] font-bold text-foreground">Unlock Complete Analysis</h3>
                  <p className="text-[11.5px] text-muted-foreground font-semibold mt-1 px-2">
                    Get unlimited weekly breakdowns, cash velocity metrics, and automated alerts.
                  </p>
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="mt-4 rounded-full bg-foreground text-background px-6 py-2.5 text-[12.5px] font-bold active:scale-95 transition-transform"
                  >
                    Upgrade to Quant Pro
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Interactive Teach Quant Banner */}
      {isPro !== false && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 sm:mt-6 rounded-[20px] sm:rounded-[22px] border border-dashed border-purple-500/30 bg-purple-500/5 p-4 flex flex-col items-start justify-between gap-4"
        >
          <div>
            <h4 className="text-[13px] sm:text-[14px] font-bold text-purple-300">Improve Analysis Accuracy</h4>
            <p className="text-[11.5px] sm:text-[12px] text-muted-foreground mt-0.5 leading-snug">
              Got uncategorized transactions or repeated peer-to-peer transfers? Teach Quant your custom merchant aliases.
            </p>
          </div>
          <Link
            href="/app/insights"
            className="w-full text-center rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-4 py-2.5 text-[12.5px] sm:text-[13px] font-bold transition-all active:scale-[0.98]"
          >
            Open Money Map & Label
          </Link>
        </motion.div>
      )}

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} onSuccess={() => { setShowUpgrade(false); window.location.reload(); }} />
    </div>
  );
}
