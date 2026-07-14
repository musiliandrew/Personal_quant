"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, FileUp, FileText, Check, Sparkles, X, MessageSquare, Send, CreditCard, Lock, Sparkle, RefreshCw, Eye, EyeOff, ShieldCheck, Zap, Copy, Repeat } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/quant/logo";

const steps = [
  "Reading M-Pesa statement…",
  "Decoding merchant signatures…",
  "Locating spending velocity peaks…",
  "Identifying recurring leaks…",
  "Securing transaction hashes…",
  "Compiling Quant Executive Summary…",
];

interface InsightItem {
  id: string;
  title: string;
  value: string;
  description: string;
}

interface MaskedStats {
  total_transactions: number;
  total_spend: string;
  total_income: string;
  period: string;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // General upload & progress states
  const [processing, setProcessing] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pdfPassword, setPdfPassword] = useState("");
  const [isIncorrectPassword, setIsIncorrectPassword] = useState(false);

  // Guest parser response states
  const [guestInsights, setGuestInsights] = useState<InsightItem[] | null>(null);
  const [maskedStats, setMaskedStats] = useState<MaskedStats | null>(null);
  const [showVolume, setShowVolume] = useState(true);

  // Guest chat states
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      role: "ASSISTANT",
      content: "Hello! I am **Quant**, your personal quant. I've parsed your statement. Ask me any question about your spending habits, recurring outflows, or how to afford your upcoming goals. <<SUGGESTED_QUESTIONS: [\"How much do I spend on subscriptions?\", \"What is my peak consumption day?\"]>>",
      created_at: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"summary" | "sandbox">("summary");

  // Billing & signup checkout states
  const [showPaywall, setShowPaywall] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [selectedTier, setSelectedTier] = useState<49 | 199 | 999>(199);

  // Post-payment signup states
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Sign In states
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoginLoading(true);
    setErrorMsg(null);
    try {
      await api.login(loginEmail, loginPassword);
      router.push("/app");
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Invalid email or password. Please try again.");
      setLoginLoading(false);
    }
  };

  // Load Google Identity Services Script
  useEffect(() => {
    if (!paymentVerified && !isLoggingIn) return;

    const initializeGoogleSignIn = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: "120213766332-5aiu0t3t2e0psqjqvji6op0ds00greu2.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        
        const btnParent = document.getElementById("google-signin-btn-container") || document.getElementById("google-login-btn-container");
        if (btnParent) {
          (window as any).google.accounts.id.renderButton(
            btnParent,
            { theme: "dark", size: "large", width: btnParent.clientWidth || 320, shape: "pill" }
          );
        }
      }
    };

    const handleGoogleCredentialResponse = async (response: any) => {
      setErrorMsg(null);
      setSignupLoading(true);
      try {
        await api.googleLogin(response.credential);
        router.push("/app");
      } catch (err: any) {
        console.error("Google login error:", err);
        setErrorMsg(err.message || "Google authentication failed.");
        setSignupLoading(false);
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
  }, [paymentVerified, isLoggingIn]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Parsing step loop animation
  useEffect(() => {
    if (!processing) return;
    if (current >= steps.length) {
      // Completed steps, parser completes.
      return;
    }
    const t = setTimeout(() => setCurrent((c) => c + 1), 800);
    return () => clearTimeout(t);
  }, [processing, current]);

  const handleFileUpload = async (file: File, password?: string) => {
    setErrorMsg(null);
    setProcessing(true);
    setCurrent(0);
    setPdfFile(file);

    try {
      const response = await api.uploadStatementGuest(file, password);
      if (response && response.error) {
        if (response.code === "PASSWORD_REQUIRED" || response.code === "INVALID_PASSWORD") {
          setShowPasswordPrompt(true);
          setIsIncorrectPassword(response.code === "INVALID_PASSWORD");
          setErrorMsg(null);
        } else {
          setErrorMsg(response.error);
        }
        setProcessing(false);
      } else {
        setShowPasswordPrompt(false);
        setIsIncorrectPassword(false);
        setPdfPassword("");
        // Fast forward animations to end
        setCurrent(steps.length);
        setTimeout(() => {
          setGuestInsights(response.insights);
          setMaskedStats(response.masked_stats);
          setProcessing(false);
        }, 600);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      if (err.message && (err.message.includes("password") || err.message.includes("encrypted") || err.code === "PASSWORD_REQUIRED" || err.code === "INVALID_PASSWORD")) {
        setShowPasswordPrompt(true);
        setIsIncorrectPassword(err.message.includes("Incorrect") || err.code === "INVALID_PASSWORD");
      } else {
        setErrorMsg(err.message || "Failed to upload statement.");
      }
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  const handleSendPrompt = async (e?: React.FormEvent, directPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = directPrompt || chatInput;
    if (!promptToSend.trim() || sendingChat) return;

    if (promptCount >= 1) {
      setShowPaywall(true);
      return;
    }

    const userMsg = promptToSend;
    if (!directPrompt) {
      setChatInput("");
    }
    setSendingChat(true);

    // Optimistic user bubble
    setChatHistory((prev) => [
      ...prev,
      { role: "USER", content: userMsg, created_at: new Date().toISOString() }
    ]);

    try {
      const response = await api.sendChatMessageGuest(userMsg);
      if (response && response.error) {
        setErrorMsg(response.error);
      } else {
        setChatHistory((prev) => [...prev, response.assistant_message]);
        setPromptCount(response.prompt_count);
      }
    } catch (err: any) {
      console.error("Guest chat error:", err);
      const isPaywallErr = err.message?.includes("Free limit") || err.message?.includes("limit reached") || err.message?.includes("Forbidden");
      if (isPaywallErr) {
        setPromptCount(1);
        setShowPaywall(true);
        setChatHistory((prev) => prev.slice(0, -1));
      } else {
        setErrorMsg(err.message || "Chat prompt failed.");
      }
    } finally {
      setSendingChat(false);
    }
  };

  const isValidMpesaNumber = (num: string) => {
    const clean = num.trim();
    if (clean.startsWith("+")) return clean.length === 13;
    if (clean.startsWith("254")) return clean.length === 12;
    if (clean.startsWith("0")) return clean.length === 10;
    return false;
  };

  const handleInitiateSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaPhone || billingLoading) return;

    setErrorMsg(null);
    setBillingLoading(true);

    try {
      const response = await api.checkoutBillingGuest(mpesaPhone, selectedTier);
      if (response && response.status === "PAID") {
        setPaymentVerified(true);
      } else {
        setErrorMsg(response.error || "M-Pesa payment failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to M-Pesa gateway.");
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setErrorMsg("All credentials are required to claim your Quant.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setErrorMsg(null);
    setSignupLoading(true);

    try {
      await api.signup(signupName, signupEmail, signupPassword, mpesaPhone || undefined);
      // Automatically routed to dashboard
      router.push("/app");
    } catch (err: any) {
      console.error("Signup error:", err);
      setErrorMsg(err.message || "Account creation failed. Please check details.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <main
      className="relative h-dvh md:h-auto md:min-h-screen w-full flex flex-col items-center justify-start p-4 md:p-6 overflow-hidden md:overflow-y-auto"
      style={{ background: "var(--gradient-hero)" }}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />

      {/* Ambient decorative orbs */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute top-1/4 -left-32 h-[450px] w-[450px] rounded-full opacity-[0.35] blur-3xl" style={{ background: "var(--gradient-lilac)" }} />
        <div className="absolute bottom-1/4 -right-32 h-[450px] w-[450px] rounded-full opacity-[0.35] blur-3xl" style={{ background: "var(--gradient-mint)" }} />
      </div>

      <div className="relative w-full max-w-4xl z-10 flex flex-col items-center gap-4 md:gap-6 flex-1 min-h-0">
        {/* Brand Logo Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm md:max-w-none flex items-center justify-between px-1"
        >
          <div className="glass flex items-center gap-3 rounded-full px-4.5 py-2 cursor-pointer" onClick={() => router.push("/")}>
            <Logo size={32} className="text-foreground" />
            <span className="text-[19px] font-bold tracking-tight">Quant</span>
          </div>
          <div className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] text-muted-foreground font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Private
          </div>
        </motion.div>

        {/* Step 1: Pre-Upload Screen OR Upload Processing Screen */}
        {!guestInsights && (
          <div className="relative w-full max-w-sm rounded-[32px] p-6 flex flex-col justify-between min-h-[500px] bg-transparent glass border border-foreground/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)]">
            {/* Top Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push("/onboarding")}
                className="rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] grid h-9 w-9 place-items-center transition-transform active:scale-95 shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold bg-foreground/[0.04] rounded-full px-2.5 py-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Secure Anonymizer
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center my-6">
              <AnimatePresence mode="wait">
                {!processing ? (
                  showPasswordPrompt ? (
                    <motion.div
                      key="password-prompt"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col text-center items-center w-full"
                    >
                      <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-foreground">
                        Locked Statement.
                      </h1>
                      <p className="mt-2.5 text-[12.5px] text-muted-foreground font-semibold px-2">
                        This M-Pesa statement is password-protected. Email statements are locked using your National ID, Passport, or Phone Number.
                      </p>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (pdfFile && pdfPassword.trim()) {
                            handleFileUpload(pdfFile, pdfPassword);
                          }
                        }}
                        className="mt-6 w-full space-y-4 text-left"
                      >
                        <div>
                          <input
                            type="password"
                            placeholder="Enter statement password"
                            value={pdfPassword}
                            onChange={(e) => setPdfPassword(e.target.value)}
                            className={`w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 border ${isIncorrectPassword ? "border-destructive/50" : "border-foreground/10"}`}
                            autoFocus
                          />
                          {isIncorrectPassword && (
                            <p className="mt-1.5 text-[11px] text-destructive font-bold pl-1">
                              Incorrect password. Please try again.
                            </p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordPrompt(false);
                              setPdfFile(null);
                              setPdfPassword("");
                              setIsIncorrectPassword(false);
                            }}
                            className="flex-1 rounded-full bg-foreground/[0.05] hover:bg-foreground/[0.08] py-2.5 text-[12px] font-bold text-foreground transition-transform active:scale-95"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 rounded-full bg-foreground py-2.5 text-[12px] font-bold text-background transition-transform active:scale-95"
                            disabled={!pdfPassword.trim()}
                          >
                            Unlock PDF
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="picker"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col text-center items-center"
                    >
                      <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">
                        Sign Your Quant.
                      </h1>
                      <p className="mt-2.5 text-[13px] text-muted-foreground font-semibold px-2">
                        Buy that phone, fund that trip, or grow your savings. We show you exactly how to get there.
                      </p>

                      {errorMsg && (
                        <div className="mt-4 w-full rounded-xl bg-destructive/10 p-3 text-[12px] text-destructive font-bold flex justify-between items-center">
                          <span>{errorMsg}</span>
                          <button onClick={() => setErrorMsg(null)}><X className="h-3.5 w-3.5" /></button>
                        </div>
                      )}

                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className={`glass mt-6 w-full rounded-[24px] p-6 text-center border border-dashed border-foreground/15 transition-all ${dragging ? "scale-[1.02] ring-2 ring-foreground/20" : ""}`}
                      >
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          className="mx-auto grid h-12 w-12 place-items-center rounded-xl text-foreground shrink-0"
                          style={{ background: "var(--gradient-sky)" }}
                        >
                          <FileUp className="h-5 w-5" strokeWidth={1.8} />
                        </motion.div>
                        <p className="mt-3.5 text-[14px] font-bold">Drop M-Pesa PDF</p>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground font-semibold">or</p>
                        <button
                          onClick={triggerPicker}
                          className="mt-2.5 rounded-full bg-foreground px-5 py-2 text-[12px] font-bold text-background active:scale-95 transition-transform"
                        >
                          Select File
                        </button>
                      </div>

                      <div className="mt-5 rounded-2xl bg-foreground/[0.03] p-3 text-[11px] leading-relaxed text-muted-foreground font-semibold flex gap-2.5 items-start text-left">
                        <FileText className="h-4 w-4 text-foreground/65 shrink-0 mt-0.5" />
                        <p>Your data is processed strictly in-memory. Nothing is saved until you pay and secure your retainer.</p>
                      </div>
                    </motion.div>
                  )
                ) : (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col"
                  >
                    <h1 className="text-[24px] font-semibold leading-tight tracking-tight">
                      Analyzing statement…
                    </h1>
                    <p className="mt-1 text-[13px] text-muted-foreground font-semibold">
                      Quant is auditing your cash velocities.
                    </p>

                    <div className="glass mt-5 rounded-2xl p-4 space-y-3 border border-foreground/5">
                      {steps.map((s, i) => {
                        const done = i < current;
                        const active = i === current;
                        return (
                          <motion.div
                            key={s}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: done || active ? 1 : 0.3 }}
                            className="flex items-center gap-2.5"
                          >
                            <span
                              className={`grid h-6 w-6 place-items-center rounded-full transition-colors ${done ? "bg-foreground text-background" : active ? "bg-foreground/10" : "bg-foreground/[0.04]"}`}
                            >
                              {done ? (
                                <Check className="h-3 w-3" />
                              ) : active ? (
                                <motion.span
                                  className="h-1.5 w-1.5 rounded-full bg-foreground"
                                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                                  transition={{ repeat: Infinity, duration: 1.1 }}
                                />
                              ) : (
                                <span className="h-1 w-1 rounded-full bg-foreground/30" />
                              )}
                            </span>
                            <span className={`text-[12.5px] ${done ? "text-muted-foreground line-through font-semibold" : active ? "font-bold" : "text-muted-foreground font-semibold"}`}>
                              {s}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-2" />
          </div>
        )}

        {/* Step 2: Quant Executive Summary (Teaser Dashboard) */}
        {guestInsights && !showPaywall && !paymentVerified && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex-1 flex flex-col min-h-0 z-10"
          >
            {/* Mobile Tab Selector */}
            <div className="flex md:hidden w-full glass rounded-full p-1 border border-foreground/5 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("summary")}
                className={`flex-1 py-2 text-[12px] font-bold rounded-full transition-all ${activeTab === "summary" ? "bg-foreground text-background shadow-md" : "text-muted-foreground"}`}
              >
                Executive Summary
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sandbox")}
                className={`flex-1 py-2 text-[12px] font-bold rounded-full transition-all flex items-center justify-center gap-1.5 ${activeTab === "sandbox" ? "bg-foreground text-background shadow-md" : "text-muted-foreground"}`}
              >
                Quant Sandbox
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full">Free</span>
              </button>
            </div>

            <div className="w-full flex-1 min-h-0 flex flex-col md:grid md:grid-cols-5 gap-6">
              {/* Left Side: 3 Insights and masked stats */}
              <div className={`md:col-span-3 flex-col gap-3.5 md:gap-5 flex-1 min-h-0 ${activeTab === "summary" ? "flex" : "hidden md:flex"}`}>
                <div className="flex flex-col shrink-0">
                  <h1 className="text-[22px] md:text-[28px] font-bold leading-tight">
                    Quant Findings.
                  </h1>
                  <p className="text-[12px] md:text-[13.5px] text-muted-foreground font-medium mt-1">
                    Buy the phone, fund the trip—own your future with every slip.
                  </p>
                </div>

                {/* Masked Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3">
                  <div className="glass rounded-[14px] md:rounded-[20px] p-2.5 md:p-4 border border-foreground/5 flex flex-col justify-between min-h-[62px] md:min-h-[90px]">
                    <span className="text-[7.5px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Statement Period</span>
                    <span className="text-[9.5px] md:text-[12.5px] font-semibold text-foreground truncate mt-1 md:mt-2">{maskedStats?.period}</span>
                  </div>
                  <div className="glass rounded-[14px] md:rounded-[20px] p-2.5 md:p-4 border border-foreground/5 flex flex-col justify-between min-h-[62px] md:min-h-[90px]">
                    <span className="text-[7.5px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Transactions parsed</span>
                    <span className="text-[12px] md:text-[16px] font-bold text-foreground mt-1 md:mt-2">{maskedStats?.total_transactions} items</span>
                  </div>
                  <div className="glass rounded-[14px] md:rounded-[20px] p-2.5 md:p-4 border border-foreground/5 flex flex-col items-center justify-center text-center min-h-[62px] md:min-h-[90px] col-span-2 md:col-span-1 relative">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[7.5px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Volume</span>
                      <button
                        type="button"
                        onClick={() => setShowVolume(!showVolume)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 flex items-center justify-center"
                      >
                        {showVolume ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <span className="text-[12px] md:text-[16px] font-bold text-foreground mt-0.5 md:mt-1">
                      {showVolume ? (maskedStats?.total_income || "KSh 0") : "••••••"}
                    </span>
                  </div>
                </div>

                {/* Insights List */}
                <div className="space-y-2.5 md:space-y-3.5 flex-1 overflow-y-auto min-h-0 pr-1 py-1">
                  {guestInsights.map((insight, idx) => {
                    let iconNode = <Sparkles className="h-4 md:h-4.5 w-4 md:w-4.5 text-emerald-400" />;
                    let iconBg = "bg-emerald-500/10";
                    if (insight.id === "high_spend_day") {
                      iconNode = <Zap className="h-4 md:h-4.5 w-4 md:w-4.5 text-amber-400" />;
                      iconBg = "bg-amber-500/10";
                    } else if (insight.id === "duplicates") {
                      iconNode = <Copy className="h-4 md:h-4.5 w-4 md:w-4.5 text-rose-400" />;
                      iconBg = "bg-rose-500/10";
                    } else if (insight.id === "subscriptions") {
                      iconNode = <Repeat className="h-4 md:h-4.5 w-4 md:w-4.5 text-sky-400" />;
                      iconBg = "bg-sky-500/10";
                    }

                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        key={insight.id}
                        className="glass rounded-[16px] md:rounded-[24px] p-3.5 md:p-5 border border-foreground/5 hover:border-foreground/15 transition-all flex items-start gap-3 md:gap-4"
                      >
                        <div className={`h-8 w-8 md:h-9 md:w-9 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                          {iconNode}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <h4 className="text-[12.5px] md:text-[14px] font-bold text-foreground">{insight.title}</h4>
                            <span className="text-[9.5px] md:text-[11px] bg-foreground/10 text-foreground px-1.5 py-0.5 rounded-md font-bold">{insight.value}</span>
                          </div>
                          <p className="text-[11px] md:text-[12px] text-muted-foreground mt-0.5 md:mt-1 font-semibold leading-relaxed">{insight.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Call to action trigger paywall */}
                <button
                  onClick={() => setShowPaywall(true)}
                  className="mt-1.5 md:mt-2 w-full rounded-full bg-foreground text-background py-3 md:py-4 font-bold text-[13.5px] md:text-[14.5px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shrink-0"
                >
                  <CreditCard className="h-4 w-4" />
                  Sign Your Quant
                </button>
              </div>

              {/* Right Side: Free AI Chat Twin Sandbox */}
              <div className={`md:col-span-2 glass rounded-[24px] md:rounded-[32px] border border-foreground/10 flex-col flex-1 min-h-0 md:min-h-[500px] overflow-hidden shadow-2xl relative ${activeTab === "sandbox" ? "flex" : "hidden md:flex"}`}>
                {/* Chat Header */}
                <div className="p-4 border-b border-foreground/5 flex items-center justify-between bg-foreground/[0.01]">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-emerald-400/10 grid place-items-center">
                      <MessageSquare className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-[12.5px] font-bold">Quant Sandbox</h3>
                      <p className="text-[9.5px] text-muted-foreground font-semibold">Live Statement Analysis</p>
                    </div>
                  </div>
                  <div className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/10 animate-pulse">
                    <span>1 Free Prompt</span>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {chatHistory.map((msg, i) => {
                    const isLastMsg = i === chatHistory.length - 1;
                    const rawContent = msg.content;
                    
                    let displayContent = rawContent;
                    let suggestedQuestions: string[] = [];
                    
                    const match = rawContent.match(/<<SUGGESTED_QUESTIONS:\s*(\[.*?\])\s*>>/);
                    if (match) {
                      try {
                        suggestedQuestions = JSON.parse(match[1]);
                        displayContent = rawContent.replace(/<<SUGGESTED_QUESTIONS:\s*\[.*?\]\s*>>/, "").trim();
                      } catch (e) {
                        console.error("Failed to parse suggested questions:", e);
                      }
                    }

                    return (
                      <div
                        key={i}
                        className={`flex flex-col max-w-[85%] ${msg.role === "USER" ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed font-medium ${msg.role === "USER" ? "bg-foreground text-background rounded-tr-none" : "glass border border-foreground/5 rounded-tl-none text-foreground"}`}
                          dangerouslySetInnerHTML={{
                            __html: displayContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          }}
                        />
                        {msg.role === "ASSISTANT" && isLastMsg && suggestedQuestions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5 w-full justify-start">
                            {suggestedQuestions.map((q, qIdx) => (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={() => handleSendPrompt(undefined, q)}
                                disabled={promptCount >= 1 || sendingChat}
                                className="text-[10px] font-bold bg-foreground/5 hover:bg-foreground/10 active:scale-95 text-foreground px-3 py-1.5 rounded-full border border-foreground/5 transition-all text-left max-w-full"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {sendingChat && (
                    <div className="mr-auto max-w-[80%] flex items-center gap-2 py-2 px-1">
                      <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                      <span className="text-[10.5px] text-muted-foreground font-semibold">Quant is running scenarios…</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Composer */}
                <form
                  onSubmit={handleSendPrompt}
                  onClick={() => {
                    if (promptCount >= 1) {
                      setShowPaywall(true);
                    }
                  }}
                  className={`p-3 border-t border-foreground/5 bg-foreground/[0.01] ${promptCount >= 1 ? "cursor-pointer" : ""}`}
                >
                  <div className={`flex items-center gap-2 glass rounded-2xl border border-foreground/5 px-3 py-1.5 ${promptCount >= 1 ? "hover:border-foreground/20 transition-colors" : ""}`}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={promptCount >= 1 ? "Prompt limit reached. Click to unlock." : "Ask your quant anything…"}
                      disabled={promptCount >= 1 || sendingChat}
                      className={`flex-1 bg-transparent text-[16px] md:text-[14px] font-medium outline-none py-1 text-foreground placeholder:text-muted-foreground/40 disabled:opacity-50 ${promptCount >= 1 ? "cursor-pointer" : ""}`}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || promptCount >= 1 || sendingChat}
                      className="rounded-xl bg-foreground text-background p-1.5 transition-all active:scale-95 disabled:opacity-30 disabled:scale-100"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-[9.5px] text-center text-muted-foreground font-semibold mt-2">
                    {promptCount >= 1 ? (
                      <span className="text-amber-400 font-bold cursor-pointer flex items-center justify-center gap-1.5" onClick={() => setShowPaywall(true)}>
                        <Lock className="h-3.5 w-3.5" /> 1 free prompt used. Click to Sign Your Quant.
                      </span>
                    ) : (
                      "Try 1 free prompt about this statement before signing up."
                    )}
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: M-Pesa Paywall Flow (Pay First) */}
        {showPaywall && !paymentVerified && (
          isLoggingIn ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full max-w-sm rounded-[32px] p-6 flex flex-col justify-between min-h-[460px] bg-transparent glass border border-foreground/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsLoggingIn(false)}
                  className="rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] grid h-9 w-9 place-items-center transition-transform active:scale-95 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold bg-foreground/[0.04] rounded-full px-2.5 py-1">
                  Sign In to Quant
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center my-3">
                <div className="text-center flex flex-col items-center">
                  <h1 className="text-[20px] font-black tracking-tight leading-none text-foreground mb-1">
                    Welcome Back
                  </h1>
                  <p className="text-[11px] text-muted-foreground font-semibold mb-4 px-1">
                    Sign in to claim your uploaded statement and access your dashboard.
                  </p>

                  {errorMsg && (
                    <div className="mb-3 w-full rounded-xl bg-destructive/10 p-2.5 text-[11px] text-destructive font-bold flex justify-between items-center">
                      <span>{errorMsg}</span>
                      <button onClick={() => setErrorMsg(null)}><X className="h-3 w-3" /></button>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="w-full space-y-2.5 text-left">

                    <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                      <label className="text-[8.5px] text-muted-foreground font-bold uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="bg-transparent text-[16px] md:text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30"
                      />
                    </div>

                    <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                      <label className="text-[8.5px] text-muted-foreground font-bold uppercase tracking-wider">Password</label>
                      <div className="flex items-center justify-between">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-transparent text-[16px] md:text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30 flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full rounded-full bg-foreground text-background py-3 font-bold text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    >
                      {loginLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-foreground/5"></div>
                      <span className="flex-shrink mx-2 text-[8px] text-muted-foreground font-black uppercase tracking-wider">Or</span>
                      <div className="flex-grow border-t border-foreground/5"></div>
                    </div>

                    <div className="w-full flex justify-center mt-1">
                      <div id="google-login-btn-container" className="w-full min-h-[40px] flex justify-center" />
                    </div>

                    <p className="text-center text-[10px] text-muted-foreground mt-4 font-semibold">
                      Need an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLoggingIn(false)}
                        className="text-foreground hover:underline font-bold"
                      >
                        Pay & Register
                      </button>
                    </p>
                  </form>
                </div>
              </div>
              <div className="h-2" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full max-w-sm rounded-[32px] p-6 flex flex-col justify-between min-h-[460px] bg-transparent glass border border-foreground/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowPaywall(false)}
                  className="rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] grid h-9 w-9 place-items-center transition-transform active:scale-95 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold bg-foreground/[0.04] rounded-full px-2.5 py-1">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  M-Pesa Checkout
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center my-3">
                <div className="text-center flex flex-col items-center">
                  <h1 className="text-[22px] font-black leading-none">
                    Sign Your Quant
                  </h1>
                  
                  {/* Price Display */}
                  <div className="flex items-baseline justify-center gap-1 mt-3 mb-4">
                    <span className="text-[30px] font-black tracking-tight text-foreground">
                      KSh {selectedTier === 49 ? "49" : selectedTier === 199 ? "199" : "999"}
                    </span>
                    <span className="text-[12.5px] text-muted-foreground font-bold">
                      {selectedTier === 49 ? "/ 7-day pass" : selectedTier === 199 ? "/ month" : "/ year"}
                    </span>
                  </div>

                  {/* Pricing Tier Selector */}
                  <div className="w-full space-y-2 mb-5">
                    {[
                      { val: 49, label: "7-Day Trial Pass", desc: "Full access for 7 days", badge: "Low Risk" },
                      { val: 199, label: "Monthly Retainer", desc: "Unlimited uploads & chat", badge: "Popular" },
                      { val: 999, label: "Yearly Retainer", desc: "Save 60% • Full access", badge: "Best Value" }
                    ].map((tier) => {
                      const isSelected = selectedTier === tier.val;
                      return (
                        <button
                          key={tier.val}
                          type="button"
                          onClick={() => setSelectedTier(tier.val as 49 | 199 | 999)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.99] ${
                            isSelected 
                              ? "border-emerald-500 bg-emerald-500/[0.04] shadow-sm shadow-emerald-500/10" 
                              : "border-foreground/5 bg-foreground/[0.01] hover:bg-foreground/[0.03]"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[11.5px] font-black ${isSelected ? "text-emerald-400" : "text-foreground"}`}>
                                {tier.label}
                              </span>
                              {tier.badge && (
                                <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                  isSelected ? "bg-emerald-500/10 text-emerald-450" : "bg-foreground/5 text-muted-foreground"
                                }`}>
                                  {tier.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] text-muted-foreground font-semibold">
                              {tier.desc}
                            </span>
                          </div>
                          <span className={`text-[13px] font-black ${isSelected ? "text-emerald-400" : "text-foreground"}`}>
                            KSh {tier.val}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {errorMsg && (
                    <div className="mb-4 w-full rounded-xl bg-destructive/10 p-3 text-[12px] text-destructive font-bold flex justify-between items-center">
                      <span>{errorMsg}</span>
                      <button onClick={() => setErrorMsg(null)}><X className="h-3.5 w-3.5" /></button>
                    </div>
                  )}

                  <form onSubmit={handleInitiateSTK} className="w-full space-y-4">
                    <div className="glass rounded-[18px] flex flex-col px-4 py-2.5 border border-foreground/5 text-left focus-within:border-emerald-500/30 transition-colors">
                      <label className="text-[8.5px] text-muted-foreground font-black uppercase tracking-widest">M-Pesa Number</label>
                      <input
                        type="tel"
                        required
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className="bg-transparent text-[16px] md:text-[14px] font-bold outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30 mt-0.5"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={billingLoading || !isValidMpesaNumber(mpesaPhone)}
                      className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-foreground/10 text-white disabled:text-muted-foreground/60 py-4 font-bold text-[13.5px] tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
                    >
                      {billingLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Awaiting PIN prompt...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Authorize Payment
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-4 text-[9.5px] text-muted-foreground font-semibold">
                    STK Push will be sent directly to your handset.
                  </p>

                  <p className="mt-4 text-center text-[10px] text-muted-foreground font-semibold">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsLoggingIn(true)}
                      className="text-foreground hover:underline font-bold"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
              <div className="h-2" />
            </motion.div>
          )
        )}

        {/* Step 4: Account Creation Screen (Sign Up After Payment) */}
        {paymentVerified && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-[32px] p-6 flex flex-col justify-between min-h-[490px] bg-transparent glass border border-foreground/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="h-6 shrink-0" />
              <div className="flex items-center gap-1.5 text-[9.5px] text-emerald-400 font-bold bg-emerald-500/10 rounded-full px-2 py-0.5 border border-emerald-500/10">
                <Check className="h-3 w-3" />
                Payment Confirmed
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center my-3">
              <div className="text-center flex flex-col items-center">
                <h1 className="text-[20px] font-black tracking-tight leading-none text-foreground">
                  Secure Your Quant
                </h1>
                <p className="mt-1 text-[11px] text-muted-foreground font-semibold px-1">
                  Create your login credentials to secure your analysis and access your dashboard.
                </p>

                {errorMsg && (
                  <div className="mt-3 w-full rounded-xl bg-destructive/10 p-2.5 text-[11px] text-destructive font-bold flex justify-between items-center">
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)}><X className="h-3 w-3" /></button>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="w-full mt-4 space-y-2.5 text-left">
                  <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                    <label className="text-[8.5px] text-muted-foreground font-bold uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Andrew Musili"
                      className="bg-transparent text-[16px] md:text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30"
                    />
                  </div>

                  <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                    <label className="text-[8.5px] text-muted-foreground font-bold uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="andrew@quantiq.co.ke"
                      className="bg-transparent text-[16px] md:text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30"
                    />
                  </div>

                  <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                    <label className="text-[8.5px] text-muted-foreground font-bold uppercase tracking-wider">Password</label>
                    <div className="flex items-center justify-between">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-transparent text-[16px] md:text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5" strokeWidth={1.8} />
                        ) : (
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                    <label className="text-[8.5px] text-muted-foreground font-bold uppercase tracking-wider">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-transparent text-[16px] md:text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30"
                    />
                  </div>


                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full rounded-full bg-foreground text-background py-3 font-bold text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                  >
                    {signupLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Configuring Twin...
                      </>
                    ) : (
                      "Claim Your Quant & Go"
                    )}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-foreground/5"></div>
                    <span className="flex-shrink mx-2 text-[8px] text-muted-foreground font-black uppercase tracking-wider">Or</span>
                    <div className="flex-grow border-t border-foreground/5"></div>
                  </div>

                  <div className="w-full flex justify-center mt-1">
                    <div id="google-signin-btn-container" className="w-full min-h-[40px] flex justify-center" />
                  </div>
                </form>
              </div>
            </div>
            <div className="h-2" />
          </motion.div>
        )}

      </div>
    </main>
  );
}
