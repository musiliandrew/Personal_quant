"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Trash2,
  EyeOff,
  Cpu,
  Compass,
  Package,
  Plus,
  X,
  Sparkles,
  TrendingDown,
  Home,
  ShoppingCart,
  Car,
  Wifi,
  Zap,
  Droplets,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";

const STEPS = ["security", "workflow", "survival", "control"] as const;

const SURVIVAL_PRESETS = [
  { label: "Rent", icon: Home, placeholder: "e.g. 12000" },
  { label: "Food & Groceries", icon: ShoppingCart, placeholder: "e.g. 8000" },
  { label: "Transport", icon: Car, placeholder: "e.g. 3000" },
  { label: "Internet", icon: Wifi, placeholder: "e.g. 3500" },
  { label: "Electricity", icon: Zap, placeholder: "e.g. 1500" },
  { label: "Water", icon: Droplets, placeholder: "e.g. 800" },
];

const fmt = (n: number) =>
  n > 0 ? `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "—";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [deleteAfter, setDeleteAfter] = useState(true);
  const router = useRouter();

  // Survival pack state
  const [survivalItems, setSurvivalItems] = useState<{ label: string; amount: string }[]>(
    SURVIVAL_PRESETS.map((p) => ({ label: p.label, amount: "" }))
  );
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [optimization, setOptimization] = useState<any>(null);
  const [savingPack, setSavingPack] = useState(false);

  const totalSurvival = survivalItems.reduce(
    (sum, i) => sum + (parseFloat(i.amount) || 0),
    0
  );

  const handleSurvivalAmount = (idx: number, val: string) => {
    setSurvivalItems((prev) => prev.map((item, i) => (i === idx ? { ...item, amount: val } : item)));
  };

  const addCustomItem = () => {
    if (!customLabel.trim() || !customAmount) return;
    setSurvivalItems((prev) => [...prev, { label: customLabel.trim(), amount: customAmount }]);
    setCustomLabel("");
    setCustomAmount("");
  };

  const removeItem = (idx: number) => {
    setSurvivalItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSavePack = async () => {
    const filled = survivalItems.filter((i) => parseFloat(i.amount) > 0);
    if (filled.length === 0) {
      next(); // skip if nothing filled
      return;
    }
    setSavingPack(true);
    try {
      const result = await api.saveSurvivalPack(
        filled.map((i) => ({ label: i.label, amount: parseFloat(i.amount) }))
      );
      setOptimization(result.optimization);
    } catch (_) {}
    setSavingPack(false);
    next();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push("/upload");
  };

  return (
    <main
      className="relative h-dvh w-full overflow-hidden flex items-center justify-center p-0 md:p-4"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Ambient Orbs */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full opacity-60 blur-3xl" style={{ background: "var(--gradient-lilac)" }} />
        <div className="absolute bottom-10 -right-24 h-80 w-80 rounded-full opacity-60 blur-3xl" style={{ background: "var(--gradient-mint)" }} />
      </div>

      {/* Floating Centered Container Card */}
      <div className="relative w-[calc(100%-32px)] xs:w-[360px] md:max-w-sm h-auto min-h-[480px] md:min-h-[540px] max-h-[92dvh] rounded-[32px] p-6 flex flex-col justify-between z-10 glass border border-foreground/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)]">
        {/* Top Header */}
        <div className="flex items-center justify-between shrink-0">
          <button
            onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))}
            className="rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] grid h-9 w-9 place-items-center transition-transform active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-350 ${i === step ? "w-5 bg-foreground" : "w-1.5 bg-foreground/20"}`}
              />
            ))}
          </div>

          <Link href="/upload" className="text-[12.5px] text-muted-foreground font-bold hover:text-foreground">
            Skip
          </Link>
        </div>

        {/* Content Slides */}
        <div className="flex-1 flex flex-col justify-center my-3 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">

            {/* ── Step 0: Security ── */}
            {step === 0 && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col text-center"
              >
                <div className="mx-auto mb-3 relative flex h-12 w-12 items-center justify-center rounded-[18px] overflow-hidden bg-foreground/[0.03] border border-foreground/10 shrink-0">
                  <div className="absolute inset-0 opacity-30 blur-lg" style={{ background: "var(--gradient-sky)" }} />
                  <ShieldCheck className="h-5 w-5 text-foreground relative z-10" strokeWidth={1.8} />
                </div>
                <h1 className="text-[21px] md:text-[24px] font-semibold leading-tight tracking-tight">Your finances.<br />Strictly private.</h1>
                <p className="mt-1.5 text-[12.5px] text-muted-foreground font-semibold px-2">Quant protects your statements on-device.</p>
                <div className="mt-4 space-y-2.5 text-left">
                  {[
                    [Lock, "AES-256 local file encryption"],
                    [EyeOff, "No selling or model-training"],
                    [Trash2, "Purge all data with one tap"],
                  ].map(([Icon, text], i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-foreground/[0.04] text-muted-foreground shrink-0">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[12.5px] font-semibold">{text as string}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 1: How it works ── */}
            {step === 1 && (
              <motion.div
                key="workflow"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col"
              >
                <div className="mx-auto mb-3 relative flex h-12 w-12 items-center justify-center rounded-[18px] overflow-hidden bg-foreground/[0.03] border border-foreground/10 shrink-0">
                  <div className="absolute inset-0 opacity-30 blur-lg" style={{ background: "var(--gradient-lilac)" }} />
                  <Cpu className="h-5 w-5 text-foreground relative z-10" strokeWidth={1.8} />
                </div>
                <h1 className="text-center text-[21px] md:text-[24px] font-semibold leading-tight tracking-tight">How it works.</h1>
                <p className="mt-1.5 text-center text-[12.5px] text-muted-foreground font-semibold px-2">Building your private Financial Twin.</p>
                <div className="mt-4 relative border-l border-foreground/10 pl-5 ml-3 space-y-3.5">
                  {[
                    ["Set your Survival Pack", "Declare your fixed essential costs."],
                    ["Upload statement", "Drop your M-Pesa PDF file."],
                    ["Compile twin model", "Quant maps income, bills, and habits."],
                    ["Get insights", "Simulate purchases & surplus capacity."],
                  ].map(([title, sub], i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[27px] top-0.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-foreground text-background text-[9px] font-bold">{i + 1}</span>
                      <h3 className="text-[12.5px] font-bold">{title}</h3>
                      <p className="text-[11px] text-muted-foreground font-semibold leading-tight">{sub}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 2: SURVIVAL PACK ── */}
            {step === 2 && (
              <motion.div
                key="survival"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] overflow-hidden bg-foreground/[0.03] border border-foreground/10 shrink-0">
                    <div className="absolute inset-0 opacity-30 blur-lg" style={{ background: "var(--gradient-mint)" }} />
                    <Package className="h-4.5 w-4.5 text-foreground relative z-10" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h1 className="text-[18px] md:text-[20px] font-semibold leading-tight tracking-tight">Survival Pack</h1>
                    <p className="text-[11px] text-muted-foreground font-semibold">Your non-negotiable monthly essentials</p>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[200px] xs:max-h-[230px] md:max-h-[300px] overflow-y-auto pr-0.5">
                  {survivalItems.map((item, idx) => {
                    const preset = SURVIVAL_PRESETS.find((p) => p.label === item.label);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 glass rounded-xl flex items-center gap-2 px-3 py-2">
                          {(() => {
                            const IconComponent = preset?.icon || Tag;
                            return <IconComponent className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
                          })()}
                          <span className="text-[12px] font-semibold flex-1 truncate">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground font-bold shrink-0">KSh</span>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleSurvivalAmount(idx, e.target.value)}
                            placeholder={preset?.placeholder || "0"}
                            className="w-20 text-right bg-transparent text-[12px] font-bold outline-none"
                          />
                        </div>
                        {!preset && (
                          <button onClick={() => removeItem(idx)} className="shrink-0 grid h-7 w-7 place-items-center rounded-full bg-foreground/[0.04] hover:bg-destructive/10">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add custom item */}
                  <div className="flex gap-2 pt-0.5">
                    <input
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="Add custom (e.g. Gym)"
                      className="flex-1 glass rounded-xl px-3 py-2 text-[12px] outline-none"
                    />
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-20 glass rounded-xl px-3 py-2 text-[12px] text-right outline-none"
                    />
                    <button onClick={addCustomItem} className="shrink-0 grid h-8 w-8 place-items-center rounded-xl bg-foreground text-background">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Running total */}
                {totalSurvival > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-2.5 glass rounded-xl px-3.5 py-2.5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Monthly Baseline</p>
                      <p className="text-[17px] font-bold tracking-tight mt-0.5">{fmt(totalSurvival)}</p>
                    </div>
                    <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Step 3: Control ── */}
            {step === 3 && (
              <motion.div
                key="control"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col text-center"
              >
                <div className="mx-auto mb-3 relative flex h-12 w-12 items-center justify-center rounded-[18px] overflow-hidden bg-foreground/[0.03] border border-foreground/10 shrink-0">
                  <div className="absolute inset-0 opacity-30 blur-lg" style={{ background: "var(--gradient-mint)" }} />
                  <Compass className="h-5 w-5 text-foreground relative z-10" strokeWidth={1.8} />
                </div>
                <h1 className="text-[21px] md:text-[24px] font-semibold leading-tight tracking-tight">You are in control.</h1>
                <p className="mt-1.5 text-[12.5px] text-muted-foreground font-semibold px-2">Choose how your statement is kept.</p>

                <div className="mt-4 rounded-xl bg-foreground/[0.03] p-3 text-left flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-[12.5px] font-bold">Delete after processing</h4>
                      <p className="text-[10.5px] text-muted-foreground font-semibold mt-0.5 leading-tight">
                        Discards raw PDFs once twin metrics are built.
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteAfter((v) => !v)}
                      className={`relative h-5.5 w-9.5 rounded-full transition-colors shrink-0 ${deleteAfter ? "bg-foreground" : "bg-foreground/15"}`}
                      aria-pressed={deleteAfter}
                    >
                      <motion.span
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-background shadow ${deleteAfter ? "left-[16px]" : "left-0.5"}`}
                      />
                    </button>
                  </div>
                  <div className="border-t border-foreground/5 pt-2 text-[10.5px] text-muted-foreground font-semibold leading-relaxed">
                    You can clear all twins, goals, and conversations from settings anytime.
                  </div>
                </div>

                {/* Survival pack recap */}
                {totalSurvival > 0 && (
                  <div className="mt-3.5 glass rounded-xl p-3 text-left flex gap-2.5 items-start">
                    <TrendingDown className="h-4.5 w-4.5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11.5px] font-bold">Survival pack saved</p>
                      <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 leading-tight">
                        Baseline: <span className="text-foreground font-bold">{fmt(totalSurvival)}/mo</span>. Quant will compare this against your statement to find leakages.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <button
          onClick={step === 2 ? handleSavePack : next}
          disabled={savingPack}
          className="flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[14.5px] font-medium text-background transition-transform active:scale-[0.98] w-full disabled:opacity-60 shrink-0"
        >
          {savingPack
            ? "Saving pack…"
            : step === 2
            ? totalSurvival > 0 ? `Save Pack (${fmt(totalSurvival)}/mo)` : "Skip for now"
            : step === STEPS.length - 1
            ? "Continue to Upload"
            : "Continue"}
          {!savingPack && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </main>
  );
}
