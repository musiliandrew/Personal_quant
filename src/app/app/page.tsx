"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Upload,
  Brain,
  HelpCircle,
  Play,
} from "lucide-react";
import { api, DashboardData } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem("quant_dashboard");
    if (cached) {
      try {
        setDashboard(JSON.parse(cached));
      } catch (_) {}
    }

    api.getDashboard()
      .then((res) => {
        setDashboard(res);
        localStorage.setItem("quant_dashboard", JSON.stringify(res));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const [showOnboardingTour, setShowOnboardingTour] = useState(false);

  useEffect(() => {
    // Check if user is new and hasn't completed onboarding tour
    const completed = localStorage.getItem("quant_onboarding_completed");
    if (!completed) {
      const timer = setTimeout(() => {
        setShowOnboardingTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleExampleClick = (query: string) => {
    router.push(`/app/quant?q=${encodeURIComponent(query)}`);
  };

  // Get dynamic insight from API or fallback
  const todayInsight =
    dashboard?.recent_insights?.[0]?.body ||
    "Wait 6 days before buying the headphones. Doing so keeps your emergency fund intact and still lets you reach your August savings goal.";
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Onboarding Tour Spotlight Backdrop */}
      {showOnboardingTour && (
        <div 
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2.5px] transition-opacity duration-300 pointer-events-auto"
          onClick={() => {
            localStorage.setItem("quant_onboarding_completed", "true");
            setShowOnboardingTour(false);
          }}
        />
      )}

      {/* Grid layout for desktop responsiveness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
        {/* Left Column: Decisions & Prompts */}
        <div className="space-y-4 sm:space-y-6">
          {/* Today's best decision card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="glass rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 border border-foreground/[0.08]"
          >
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Today's Best Decision
            </div>
            <p className="mt-3 text-[15px] sm:text-[17px] font-medium leading-snug">
              {todayInsight}
            </p>

            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-2">
              <Link
                href={`/app/quant?q=${encodeURIComponent("Why " + todayInsight.toLowerCase())}`}
                className="w-full sm:flex-1 glass flex items-center justify-center gap-1.5 rounded-full py-2.5 sm:py-3 text-[12px] sm:text-[13px] font-semibold transition-transform active:scale-[0.98]"
              >
                <HelpCircle className="h-4 w-4 text-emerald-400" /> Why?
              </Link>
              <Link
                href="/app/quant"
                className="w-full sm:flex-1 flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background py-2.5 sm:py-3 text-[12px] sm:text-[13px] font-semibold transition-transform active:scale-[0.98]"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Simulate Purchase
              </Link>
            </div>
          </motion.div>

          {/* Decision input section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="soft-card rounded-[24px] sm:rounded-[28px] p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5">
              <Brain className="h-3.5 w-3.5 text-purple-400" /> What decision are you trying to make?
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get("decision")?.toString();
                if (query) {
                  handleExampleClick(query);
                }
              }}
              className="relative flex items-center"
            >
              <input
                name="decision"
                placeholder="Ask your Quant..."
                className="w-full rounded-2xl bg-foreground/[0.04] px-4 py-3 pr-12 text-[13px] sm:text-[14px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
              />
              <button
                type="submit"
                className="absolute right-2 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full bg-foreground text-background transition-transform active:scale-[0.95]"
                aria-label="Ask"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-4">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Examples</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Can I afford a PS5?",
                  "Should I move houses?",
                  "Can I save 10K this month?",
                  "Should I invest?",
                  "Can I travel?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleExampleClick(q)}
                    className="rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] px-3 py-1.5 text-[11.5px] sm:text-[12.5px] text-left transition-colors font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Coaching & Archetypes */}
        <div className="space-y-4 sm:space-y-6">
          {/* Money Map / Teach Quant Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className={`glass rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 border border-foreground/[0.08] relative transition-all duration-300 ${
              showOnboardingTour 
                ? "z-50 ring-2 ring-purple-500/80 shadow-[0_0_30px_rgba(168,85,247,0.35)] bg-zinc-950/95" 
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                <Brain className="h-3.5 w-3.5 text-purple-400" /> Teach Quant & Money Map
              </div>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-purple-400 animate-pulse">
                Interactive
              </span>
            </div>
            
            <p className="mt-2.5 text-[13px] sm:text-[14px] font-medium leading-snug">
              Quant has detected transaction patterns. Teach Quant what these mean (e.g. rent, family support) to get hyper-customized coaching.
            </p>

            <Link
              href="/app/insights"
              onClick={() => {
                localStorage.setItem("quant_onboarding_completed", "true");
                setShowOnboardingTour(false);
              }}
              className={`mt-3.5 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 sm:py-3 text-[12px] sm:text-[13px] font-bold transition-all active:scale-[0.98] ${
                showOnboardingTour 
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/40 scale-102"
                  : "bg-foreground text-background"
              }`}
            >
              <ArrowRight className="h-4 w-4" /> Open Money Map & Label
            </Link>

            {showOnboardingTour && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute left-1/2 -translate-x-1/2 top-[102%] w-full bg-zinc-900 text-foreground rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-50 border border-purple-500/35 flex flex-col gap-2.5"
              >
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 rotate-45 border-t border-l border-purple-500/35" />
                <div className="flex gap-2.5">
                  <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" animate-bounce />
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-[12.5px] font-black tracking-wide text-foreground">Step 1: Teach your Quant</span>
                    <p className="text-[11px] font-semibold leading-relaxed text-muted-foreground">
                      Label your cryptic M-Pesa statements so you and Quant are on the same page. This unlocks hyper-personalized coaching!
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      localStorage.setItem("quant_onboarding_completed", "true");
                      setShowOnboardingTour(false);
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground font-bold tracking-wider uppercase px-2 py-1"
                  >
                    Skip
                  </button>
                  <Link
                    href="/app/insights"
                    onClick={() => {
                      localStorage.setItem("quant_onboarding_completed", "true");
                      setShowOnboardingTour(false);
                    }}
                    className="bg-purple-600 text-white text-[10.5px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl hover:bg-purple-700 active:scale-95 transition-all shadow-sm"
                  >
                    Let's Do It
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Financial Twin Confidence Meter */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass rounded-[24px] sm:rounded-[28px] p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Financial Twin</p>
                <p className="mt-0.5 text-[14px] sm:text-[16px] font-semibold">Your model is active</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-400">
                Active
              </span>
            </div>

            <div className="mt-3.5">
              <div className="flex items-center justify-between text-[11px] sm:text-[12px] text-muted-foreground font-semibold">
                <span>Prediction Confidence</span>
                <span className="tabular-nums font-bold text-foreground">
                  {dashboard?.behaviour?.impulse_score ? `${(100 - dashboard.behaviour.impulse_score).toFixed(1)}%` : "81.0%"}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 sm:h-2 rounded-full bg-foreground/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: dashboard?.behaviour?.impulse_score ? `${100 - dashboard.behaviour.impulse_score}%` : "81%" }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-foreground"
                />
              </div>
            </div>

            <Link
              href="/upload"
              className="mt-3.5 flex items-center justify-center gap-2 rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] px-4 py-2.5 sm:py-3 text-[12px] sm:text-[13px] font-bold transition-all"
            >
              <Upload className="h-4 w-4 shrink-0" /> Upload latest statement to improve forecasts
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
