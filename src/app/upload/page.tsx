"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, FileUp, FileText, Check, Sparkles, X, RefreshCw, Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";
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

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Authentication & Session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");

  // Upload state
  const [processing, setProcessing] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pdfPassword, setPdfPassword] = useState("");
  const [isIncorrectPassword, setIsIncorrectPassword] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("quant_token") : null;
    setIsAuthenticated(!!token);
  }, []);

  // Load Google Identity Services Script
  useEffect(() => {
    if (isAuthenticated !== false) return;

    const initializeGoogleSignIn = () => {
      if (typeof window !== "undefined" && (window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: "120213766332-5aiu0t3t2e0psqjqvji6op0ds00greu2.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        
        const btnParent = document.getElementById("google-signin-btn-container");
        if (btnParent) {
          (window as any).google.accounts.id.renderButton(
            btnParent,
            { theme: "dark", size: "large", width: btnParent.clientWidth || 320, shape: "pill" }
          );
        }
      }
    };

    const handleGoogleCredentialResponse = async (response: any) => {
      setAuthError(null);
      setAuthLoading(true);
      try {
        await api.googleLogin(response.credential);
        setIsAuthenticated(true);
      } catch (err: any) {
        console.error("Google auth error:", err);
        setAuthError(err.message || "Google authentication failed.");
      } finally {
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
  }, [isAuthenticated, authMode]);

  // Parsing step loop animation
  useEffect(() => {
    if (!processing) return;
    if (current >= steps.length) return;
    const t = setTimeout(() => setCurrent((c) => c + 1), 800);
    return () => clearTimeout(t);
  }, [processing, current]);

  // Auth Form Handlers
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
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error("Auth error:", err);
      setAuthError(err.message || "Authentication failed. Check your details.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Authenticated Upload Handler
  const handleFileUpload = async (file: File, password?: string) => {
    setErrorMsg(null);
    setProcessing(true);
    setCurrent(0);
    setPdfFile(file);

    try {
      const response = await api.uploadStatement(file, password);
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
          setProcessing(false);
          router.push("/app");
        }, 1200);
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

  if (isAuthenticated === null) {
    return (
      <main className="relative min-h-screen w-full flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
          <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-purple-400 animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 md:p-6 overflow-y-auto"
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
        <div className="absolute top-1/4 -left-32 h-[400px] w-[400px] rounded-full opacity-[0.25] blur-3xl" style={{ background: "var(--gradient-lilac)" }} />
        <div className="absolute bottom-1/4 -right-32 h-[400px] w-[400px] rounded-full opacity-[0.25] blur-3xl" style={{ background: "var(--gradient-mint)" }} />
      </div>

      <div className="relative w-full max-w-sm z-10 flex flex-col items-center gap-6 mt-4 md:mt-10">
        {/* Brand Logo Header */}
        <div className="w-full flex items-center justify-between px-1">
          <div className="glass flex items-center gap-2.5 rounded-full px-4 py-2 cursor-pointer" onClick={() => router.push("/")}>
            <Logo size={28} className="text-foreground" />
            <span className="text-[17px] font-bold tracking-tight">Quant</span>
          </div>
          <div className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] text-muted-foreground font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Secure Vault
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* 1. AUTHENTICATION SECTION (User must log in/register first) */}
          {!isAuthenticated ? (
            <motion.div
              key="auth-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="relative w-full rounded-[32px] p-6 bg-transparent glass border border-foreground/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)]"
            >
              <div className="text-center flex flex-col items-center">
                <h1 className="text-[20px] font-black tracking-tight leading-none text-foreground">
                  {authMode === "signup" ? "Create Secure Account" : "Welcome Back"}
                </h1>
                <p className="mt-1.5 text-[11px] text-muted-foreground font-semibold px-2">
                  {authMode === "signup" 
                    ? "Set up your credentials to claim your private financial twin." 
                    : "Sign in to access your secure statement upload vault."}
                </p>

                {authError && (
                  <div className="mt-3 w-full rounded-xl bg-destructive/10 p-2.5 text-[11px] text-destructive font-bold flex justify-between items-center text-left">
                    <span>{authError}</span>
                    <button onClick={() => setAuthError(null)}><X className="h-3 w-3" /></button>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="w-full mt-4 space-y-2.5 text-left">
                  {authMode === "signup" && (
                    <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                      <label className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Andrew Musili"
                        className="bg-transparent text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30"
                      />
                    </div>
                  )}

                  <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                    <label className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="bg-transparent text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30"
                    />
                  </div>

                  <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                    <label className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Password</label>
                    <div className="flex items-center justify-between">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-transparent text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30 flex-1"
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

                  {authMode === "signup" && (
                    <div className="glass rounded-xl flex flex-col px-3 py-1 border border-foreground/5">
                      <label className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-transparent text-[14px] font-medium outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-full bg-foreground text-background py-3 font-bold text-[13px] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      authMode === "signup" ? "Create Account & Continue" : "Sign In & Continue"
                    )}
                  </button>
                </form>

                <div className="relative flex py-2 items-center w-full">
                  <div className="flex-grow border-t border-foreground/5"></div>
                  <span className="flex-shrink mx-2 text-[8px] text-muted-foreground font-black uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-foreground/5"></div>
                </div>

                <div className="w-full flex justify-center mt-1">
                  <div id="google-signin-btn-container" className="w-full min-h-[40px] flex justify-center" />
                </div>

                <div className="mt-4 text-[12px] text-muted-foreground font-semibold">
                  {authMode === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <button onClick={() => { setAuthMode("login"); setAuthError(null); }} className="text-foreground hover:underline font-bold">
                        Sign In
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button onClick={() => { setAuthMode("signup"); setAuthError(null); }} className="text-foreground hover:underline font-bold">
                        Create Account
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* 2. FILE UPLOADER SECTION */
            <motion.div
              key="upload-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="relative w-full rounded-[32px] p-6 bg-transparent glass border border-foreground/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)]"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-foreground/[0.05] pb-3 mb-4">
                <button
                  onClick={() => setIsAuthenticated(false)}
                  className="rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] grid h-9 w-9 place-items-center transition-transform active:scale-95 shrink-0"
                  aria-label="Logout/Switch Account"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold bg-foreground/[0.04] rounded-full px-2.5 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  Secure Anonymizer
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!processing ? (
                  showPasswordPrompt ? (
                    <motion.div
                      key="password-prompt"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col text-center items-center w-full"
                    >
                      <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
                        Locked Statement
                      </h1>
                      <p className="mt-2 text-[12px] text-muted-foreground font-semibold px-2">
                        This statement is password-protected. Email statements are locked using your National ID, Passport, or Phone Number.
                      </p>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (pdfFile && pdfPassword.trim()) {
                            handleFileUpload(pdfFile, pdfPassword);
                          }
                        }}
                        className="mt-5 w-full space-y-3.5 text-left"
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
                      className="flex flex-col text-center items-center"
                    >
                      <h1 className="text-[24px] font-bold leading-tight tracking-tight text-foreground">
                        Sign Your Quant
                      </h1>
                      <p className="mt-2 text-[12.5px] text-muted-foreground font-semibold px-2">
                        Upload your M-Pesa statement PDF to generate your private financial twin and start goal optimization.
                      </p>

                      {errorMsg && (
                        <div className="mt-4 w-full rounded-xl bg-destructive/10 p-3 text-[12px] text-destructive font-bold flex justify-between items-center text-left">
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
                        <p className="mt-3.5 text-[13.5px] font-bold">Drop M-Pesa PDF</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground font-semibold">or</p>
                        <button
                          onClick={triggerPicker}
                          className="mt-2.5 rounded-full bg-foreground px-5 py-2 text-[11.5px] font-bold text-background active:scale-95 transition-transform"
                        >
                          Select File
                        </button>
                      </div>

                      <div className="mt-5 rounded-2xl bg-foreground/[0.03] p-3 text-[10.5px] leading-relaxed text-muted-foreground font-semibold flex gap-2.5 items-start text-left">
                        <FileText className="h-4 w-4 text-foreground/65 shrink-0 mt-0.5" />
                        <p>Your M-Pesa statements are parsed securely. Quant maps income, rent, savings, and goals automatically.</p>
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
                    <h1 className="text-[20px] font-semibold leading-tight tracking-tight text-center">
                      Analyzing statement…
                    </h1>
                    <p className="mt-1 text-[12px] text-muted-foreground font-semibold text-center">
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
                            <span className={`text-[12px] ${done ? "text-muted-foreground line-through font-semibold" : active ? "font-bold" : "text-muted-foreground font-semibold"}`}>
                              {s}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
