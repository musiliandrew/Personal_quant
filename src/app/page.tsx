"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Trash2,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Calculator,
  Compass,
  ArrowLeft,
  Info,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Logo } from "@/components/quant/logo";
import { api } from "@/lib/api";

const currency = (n: number) => `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export default function Landing() {
  const router = useRouter();
  const [activeSheet, setActiveSheet] = useState<"simulator" | "quiz" | "chat" | "auth" | null>(null);

  // Auth States
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Decision Simulator State
  const [simIncome, setSimIncome] = useState("50000");
  const [simRent, setSimRent] = useState("15000");
  const [simExpenses, setSimExpenses] = useState("17000");
  const [simGoalName, setSimGoalName] = useState("MacBook Pro");
  const [simGoalTarget, setSimGoalTarget] = useState("150000");
  const [simResult, setSimResult] = useState<any>(null);

  // 2. Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  // 3. Landing Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    const income = parseFloat(simIncome) || 0;
    const rent = parseFloat(simRent) || 0;
    const expenses = parseFloat(simExpenses) || 0;
    const target = parseFloat(simGoalTarget) || 0;

    const surplus = income - rent - expenses;
    if (surplus <= 0) {
      setSimResult({
        error: "Your fixed expenses exceed your income. Switch to Survival Mode to find savings.",
      });
      return;
    }

    const months = target / surplus;
    const optimizedSurplus = surplus + 4000;
    const optimizedMonths = target / optimizedSurplus;

    setSimResult({
      surplus,
      months: Math.ceil(months),
      optimizedMonths: Math.ceil(optimizedMonths),
      tip: `Reducing restaurant/discretionary spending by KSh 4,000/mo shortens your path by ${Math.max(0, Math.ceil(months) - Math.ceil(optimizedMonths))} months.`,
    });
  };

  const quizQuestions = [
    {
      q: "If you unexpectedly receive KSh 10,000, what do you do?",
      options: [
        { text: "Put it straight into my savings/investments", value: "builder" },
        { text: "Buy something I've had my eye on for weeks", value: "explorer" },
        { text: "Take friends out or enjoy a nice weekend", value: "social" },
      ],
    },
    {
      q: "When do you usually spend the most money?",
      options: [
        { text: "Right after payday (first 5 days)", value: "explorer" },
        { text: "Weekends (Friday to Sunday)", value: "social" },
        { text: "Small daily discretionary buys", value: "builder" },
      ],
    },
    {
      q: "How do you currently track your monthly budgets?",
      options: [
        { text: "I don't really track, just spend cautiously", value: "social" },
        { text: "Mostly mental math and account checks", value: "explorer" },
        { text: "Spreadsheets or dedicated budgeting tools", value: "builder" },
      ],
    },
  ];

  const handleQuizAnswer = (value: string) => {
    const nextAnswers = [...quizAnswers, value];
    setQuizAnswers(nextAnswers);

    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Calculate archetype
      const counts = nextAnswers.reduce((acc: any, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

      let archetype = "The Explorer";
      if ((counts["builder"] || 0) > (counts["explorer"] || 0) && (counts["builder"] || 0) > (counts["social"] || 0)) {
        archetype = "The Builder";
      } else if ((counts["social"] || 0) > (counts["explorer"] || 0)) {
        archetype = "The Maximizer";
      }

      setQuizResult(archetype);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  const handleLandingChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    setChatLoading(true);
    setChatResponse(null);

    // Simulate generic AI advisor response
    setTimeout(() => {
      const q = chatInput.toLowerCase();
      let res = "An emergency fund should ideally cover 3 to 6 months of living expenses. For most professionals, saving KSh 50,000 - 150,000 creates a solid safety cushion before investing.";
      
      if (q.includes("laptop") || q.includes("afford") || q.includes("buy")) {
        res = "To afford a KSh 80,000 laptop, calculate your monthly surplus (Income - Rent - Food). If you save KSh 8,000/mo, you can buy it in 10 months. Connect statement to check if your actual trends support this!";
      } else if (q.includes("rent") || q.includes("earn")) {
        res = "As a rule of thumb, rent should not exceed 30% of your net income. If you earn KSh 40,000, aim for rent below KSh 12,000 to keep space for savings.";
      }
      
      setChatResponse(res);
      setChatLoading(false);
    }, 1500);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    if (authMode === "signup" && authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.");
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === "login") {
        await api.login(authEmail, authPassword);
      } else {
        await api.signup(authName, authEmail, authPassword);
      }
      router.push("/app");
    } catch (err: any) {
      console.error("Auth error:", err);
      setAuthError(err.message || "Authentication failed. Check credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (activeSheet !== "auth") return;
    const initializeGoogleSignIn = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: "120213766332-5aiu0t3t2e0psqjqvji6op0ds00greu2.apps.googleusercontent.com",
          callback: handleGoogleAuthResponse,
        });
        const container = document.getElementById("google-landing-auth-container");
        if (container) {
          (window as any).google.accounts.id.renderButton(
            container,
            { theme: "dark", size: "large", width: container.clientWidth || 320, shape: "pill" }
          );
        }
      }
    };

    const handleGoogleAuthResponse = async (response: any) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        await api.googleLogin(response.credential);
        router.push("/app");
      } catch (err: any) {
        console.error("Google auth error:", err);
        setAuthError(err.message || "Google authentication failed.");
        setAuthLoading(false);
      }
    };

    const id = "google-gsi-client";
    if (!document.getElementById(id)) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = id;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, [activeSheet]);

  return (
    <main
      className="relative h-screen w-full overflow-hidden flex items-center justify-center p-0 md:p-4"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-sky)" }} />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-lilac)" }} />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-mint)" }} />
      </div>

      {/* Background Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none -z-0">
        <Logo size={520} className="text-foreground" />
      </div>

      {/* Floating Centered Container Card */}
      <div className="relative w-full h-full md:h-auto md:max-w-sm md:rounded-[32px] p-6 flex flex-col justify-between md:min-h-[560px] z-10 bg-transparent md:glass md:border md:border-foreground/10 md:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)]">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="glass flex items-center gap-3 rounded-full px-4.5 py-2">
            <Logo size={32} className="text-foreground" />
            <span className="text-[19px] font-bold tracking-tight">Quant</span>
          </div>
          <div className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] text-muted-foreground font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Private
          </div>
        </motion.div>

        {/* Hero */}
        <div className="mt-3">
          <h1 className="text-balance-tight text-[32px] font-semibold leading-[1.08] tracking-tight">
            Meet Your
            <br />
            <span className="italic font-medium" style={{ fontFamily: "var(--font-display)" }}>Personal</span>{" "}
            Quant.
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground font-semibold">
            Did you know you can buy your dream car if you cut ride-hailing by 30%?
          </p>
        </div>

        {/* Interactive Funnel Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          <button
            onClick={() => setActiveSheet("simulator")}
            className="glass flex flex-col items-start gap-1.5 rounded-2xl p-3 text-left active:scale-[0.98] transition-transform hover:bg-foreground/[0.02]"
          >
            <Calculator className="h-5 w-5 text-sky-400" />
            <div>
              <p className="text-[12.5px] font-semibold">Simulator</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Simulate targets & timeline</p>
            </div>
          </button>

          <button
            onClick={() => setActiveSheet("quiz")}
            className="glass flex flex-col items-start gap-1.5 rounded-2xl p-3 text-left active:scale-[0.98] transition-transform hover:bg-foreground/[0.02]"
          >
            <Compass className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-[12.5px] font-semibold">Money Quiz</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Find your saving style</p>
            </div>
          </button>

          <button
            onClick={() => setActiveSheet("chat")}
            className="glass col-span-2 flex items-center justify-between rounded-2xl p-3.5 text-left active:scale-[0.98] transition-transform hover:bg-foreground/[0.02]"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-[13px] font-semibold">Ask Generic Quant</p>
                <p className="text-[10.5px] text-muted-foreground font-semibold">Test drive financial queries</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* CTAs & Demo Trigger */}
        <div className="flex flex-col gap-3">
          <Link
            href="/onboarding"
            className="group flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-[14px] font-bold text-background shadow-md transition-transform active:scale-[0.98] w-full"
          >
            Upload Statement
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setActiveSheet("auth");
            }}
            className="w-full rounded-full border border-foreground/15 hover:bg-foreground/[0.03] text-foreground py-2.5 font-bold text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Sign In / Create Account
          </button>


          <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-muted-foreground font-bold pt-2 border-t border-foreground/5">
            <div className="flex items-center justify-center gap-1"><Lock className="h-3 w-3" />Encrypted</div>
            <div className="flex items-center justify-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Private</div>
            <div className="flex items-center justify-center gap-1"><Trash2 className="h-3 w-3" />Clean Slate</div>
          </div>
        </div>

        {/* Funnel iOS sheets (Bottom Drawers) */}
        <AnimatePresence>
          {activeSheet && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="glass-strong w-full max-w-md rounded-t-[32px] px-6 pt-5 pb-8 border-t border-foreground/[0.08] max-h-[85vh] overflow-y-auto text-foreground"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-foreground/[0.06]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSheet(null)}
                      className="glass p-1.5 rounded-full"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <span className="text-[16px] font-semibold">
                      {activeSheet === "simulator" ? "Decision Simulator" : activeSheet === "quiz" ? "Money Personality Quiz" : activeSheet === "auth" ? "Access Quant" : "Ask Quant"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveSheet(null)}
                    className="glass grid h-8 w-8 place-items-center rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* --- 1. DECISION SIMULATOR TAB --- */}
                {activeSheet === "simulator" && (
                  <div className="mt-5 space-y-4">
                    <form onSubmit={handleSimulate} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Monthly Income</label>
                          <input
                            type="number"
                            value={simIncome}
                            onChange={(e) => setSimIncome(e.target.value)}
                            required
                            className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-[13px] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Rent</label>
                          <input
                            type="number"
                            value={simRent}
                            onChange={(e) => setSimRent(e.target.value)}
                            required
                            className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-[13px] outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Food & Essentials</label>
                          <input
                            type="number"
                            value={simExpenses}
                            onChange={(e) => setSimExpenses(e.target.value)}
                            required
                            className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-[13px] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Goal Cost (KSh)</label>
                          <input
                            type="number"
                            value={simGoalTarget}
                            onChange={(e) => setSimGoalTarget(e.target.value)}
                            required
                            className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-[13px] outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-foreground text-background py-3 rounded-full text-[13px] font-bold mt-2"
                      >
                        Simulate Purchase
                      </button>
                    </form>

                    {simResult && (
                      <div className="mt-4 rounded-2xl bg-foreground/[0.04] p-4.5 border border-foreground/[0.06]">
                        {simResult.error ? (
                          <p className="text-[13px] text-amber-400 font-semibold">{simResult.error}</p>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-muted-foreground font-bold uppercase">Monthly Surplus</span>
                              <span className="text-[16px] font-bold">{currency(simResult.surplus)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-muted-foreground font-bold uppercase">Estimated Timeline</span>
                              <span className="text-[16px] font-bold text-sky-400">{simResult.months} months</span>
                            </div>

                            <div className="rounded-xl bg-sky-500/10 p-3 flex gap-2">
                              <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                              <p className="text-[12px] leading-relaxed text-sky-300 font-semibold">
                                {simResult.tip}
                              </p>
                            </div>

                            <Link
                              href="/onboarding"
                              className="mt-2 block text-center bg-sky-500 text-white py-2.5 rounded-full text-[12.5px] font-bold"
                            >
                              Verify with My Real Statement
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* --- 2. PERSONALITY QUIZ TAB --- */}
                {activeSheet === "quiz" && (
                  <div className="mt-5">
                    {!quizResult ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold uppercase">
                          <span>Question {quizStep + 1} of {quizQuestions.length}</span>
                          <span>Progress {Math.round(((quizStep + 1) / quizQuestions.length) * 100)}%</span>
                        </div>

                        <p className="text-[15px] font-semibold leading-snug">{quizQuestions[quizStep].q}</p>

                        <div className="space-y-2">
                          {quizQuestions[quizStep].options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => handleQuizAnswer(opt.value)}
                              className="w-full text-left rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] px-4 py-3.5 text-[13px] font-medium transition-colors"
                            >
                              {opt.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-center py-4">
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
                          <Check className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold">Your Archetype</p>
                          <h3 className="text-[24px] font-bold mt-1 text-emerald-400">{quizResult}</h3>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-relaxed px-4">
                          {quizResult === "The Builder"
                            ? "You naturally prioritize long-term security. You're careful with recurring bills, but sometimes miss short-term opportunities."
                            : quizResult === "The Maximizer"
                            ? "You spend on experiences and relationships. Your cash flows out quickly on weekends, but you know how to enjoy your surplus."
                            : "You maintain a balanced, curious approach to cash. You investigate your habits but rarely set hard goals."}
                        </p>

                        <div className="pt-4 flex gap-2">
                          <button
                            onClick={resetQuiz}
                            className="flex-1 glass py-3 rounded-full text-[13px] font-bold"
                          >
                            Retake Quiz
                          </button>
                          <Link
                            href="/onboarding"
                            className="flex-1 bg-foreground text-background py-3 rounded-full text-[13px] font-bold flex items-center justify-center"
                          >
                            Sync with M-Pesa
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- 3. LANDING CHAT TAB --- */}
                {activeSheet === "chat" && (
                  <div className="mt-5 space-y-4">
                    <form onSubmit={handleLandingChat} className="relative flex items-center">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="e.g. How much emergency fund do I need?"
                        required
                        className="w-full rounded-2xl bg-foreground/[0.04] px-4 py-3.5 pr-12 text-[13.5px] outline-none"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading}
                        className="absolute right-2 grid h-9 w-9 place-items-center rounded-full bg-foreground text-background disabled:opacity-50"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </form>

                    {chatLoading && (
                      <p className="text-center py-6 text-[12px] text-muted-foreground italic">Quant is computing...</p>
                    )}

                    {chatResponse && (
                      <div className="rounded-2xl bg-foreground/[0.04] p-4.5 border border-foreground/[0.06] space-y-3">
                        <div className="flex gap-2">
                          <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                          <p className="text-[13px] leading-relaxed font-semibold">{chatResponse}</p>
                        </div>
                        <div className="border-t border-foreground/[0.06] pt-3 mt-1 text-center">
                          <p className="text-[11px] text-muted-foreground font-semibold mb-2">Want decisions based on your actual bank statements?</p>
                          <Link
                            href="/onboarding"
                            className="inline-block bg-foreground text-background px-5 py-2 rounded-full text-[12px] font-bold"
                          >
                            Analyze My M-Pesa PDF
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- 4. AUTHENTICATION TAB --- */}
                {activeSheet === "auth" && (
                  <div className="mt-5 space-y-4">
                    {/* Tab Selector */}
                    <div className="flex rounded-full bg-foreground/[0.04] p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("login");
                          setAuthError(null);
                        }}
                        className={`flex-1 rounded-full py-1.5 text-center text-[12.5px] font-bold transition-all ${authMode === "login" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("signup");
                          setAuthError(null);
                        }}
                        className={`flex-1 rounded-full py-1.5 text-center text-[12.5px] font-bold transition-all ${authMode === "signup" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        Create Account
                      </button>
                    </div>

                    {authError && (
                      <div className="rounded-xl bg-rose-500/10 p-3 text-[12px] font-semibold text-rose-400 border border-rose-500/20">
                        {authError}
                      </div>
                    )}

                    <form onSubmit={handleAuthSubmit} className="space-y-3">
                      {authMode === "signup" && (
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Full Name</label>
                          <input
                            type="text"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            required
                            placeholder="e.g. John Doe"
                            className="w-full rounded-xl bg-foreground/[0.04] border border-foreground/5 hover:border-foreground/10 focus:border-foreground/20 px-3.5 py-2.5 text-[13px] outline-none transition-colors"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                          placeholder="name@example.com"
                          className="w-full rounded-xl bg-foreground/[0.04] border border-foreground/5 hover:border-foreground/10 focus:border-foreground/20 px-3.5 py-2.5 text-[13px] outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Password</label>
                        <div className="relative">
                          <input
                            type={showAuthPassword ? "text" : "password"}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full rounded-xl bg-foreground/[0.04] border border-foreground/5 hover:border-foreground/10 focus:border-foreground/20 px-3.5 py-2.5 pr-10 text-[13px] outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAuthPassword(!showAuthPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showAuthPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {authMode === "signup" && (
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Confirm Password</label>
                          <div className="relative">
                            <input
                              type={showAuthPassword ? "text" : "password"}
                              value={authConfirmPassword}
                              onChange={(e) => setAuthConfirmPassword(e.target.value)}
                              required
                              placeholder="••••••••"
                              className="w-full rounded-xl bg-foreground/[0.04] border border-foreground/5 hover:border-foreground/10 focus:border-foreground/20 px-3.5 py-2.5 pr-10 text-[13px] outline-none transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-foreground text-background py-3 rounded-full text-[13px] font-bold mt-2 hover:opacity-90 transition-opacity active:scale-[0.99]"
                      >
                        {authLoading ? "Authenticating..." : authMode === "login" ? "Sign In" : "Create Account"}
                      </button>
                    </form>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-foreground/5"></div>
                      <span className="flex-shrink mx-2 text-[8px] text-muted-foreground font-black uppercase tracking-wider">Or</span>
                      <div className="flex-grow border-t border-foreground/5"></div>
                    </div>

                    <div className="w-full flex justify-center mt-1">
                      <div id="google-landing-auth-container" className="w-full min-h-[40px] flex justify-center" />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
