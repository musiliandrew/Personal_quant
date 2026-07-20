"use client";

import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, FileUp, FileText, Check, Sparkles, ShieldCheck, Lock } from "lucide-react";
import { api } from "@/lib/api";

const steps = [
  "Reading M-Pesa statement…",
  "Decoding merchant signatures…",
  "Locating spending velocity peaks…",
  "Identifying recurring leaks…",
  "Securing transaction hashes…",
  "Compiling Quant Executive Summary…",
];

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [processing, setProcessing] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pdfPassword, setPdfPassword] = useState("");
  const [isIncorrectPassword, setIsIncorrectPassword] = useState(false);

  // Parsing step loop animation
  useEffect(() => {
    if (!processing) return;
    if (current >= steps.length) return;
    const t = setTimeout(() => setCurrent((c) => c + 1), 850);
    return () => clearTimeout(t);
  }, [processing, current]);

  // Handle ESC key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processing) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, processing, onClose]);

  // Reset modal state when opened/closed
  useEffect(() => {
    if (!isOpen) {
      setProcessing(false);
      setCurrent(0);
      setDragging(false);
      setErrorMsg(null);
      setPdfFile(null);
      setShowPasswordPrompt(false);
      setPdfPassword("");
      setIsIncorrectPassword(false);
    }
  }, [isOpen]);

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
          onSuccess?.();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      if (err.message && (
        err.message.includes("password") || 
        err.message.includes("encrypted") || 
        err.code === "PASSWORD_REQUIRED" || 
        err.code === "INVALID_PASSWORD"
      )) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/50 backdrop-blur-md"
            onClick={() => {
              if (!processing) onClose();
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] p-6 glass border border-foreground/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5)] z-10"
          >
            {/* Ambient decorative orbs inside modal */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 left-0 h-[250px] w-[250px] rounded-full opacity-[0.15] blur-3xl" style={{ background: "var(--gradient-lilac)" }} />
              <div className="absolute bottom-0 right-0 h-[250px] w-[250px] rounded-full opacity-[0.15] blur-3xl" style={{ background: "var(--gradient-mint)" }} />
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-foreground/[0.05] pb-3 mb-5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold bg-foreground/[0.04] rounded-full px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Secure Ingestion
              </div>

              {!processing && (
                <button
                  onClick={onClose}
                  className="rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] grid h-7 w-7 place-items-center transition-colors active:scale-95 shrink-0"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Content Switcher */}
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
                    <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-3">
                      <Lock className="h-5 w-5 text-amber-400" />
                    </div>
                    <h2 className="text-[20px] font-bold leading-tight tracking-tight text-foreground">
                      Locked Statement
                    </h2>
                    <p className="mt-2 text-[12px] text-muted-foreground font-semibold px-2 leading-relaxed">
                      This statement is password-protected. Safaricom now locks M-Pesa statements with an SMS One-Time Password (OTP) sent to your phone.
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

                      <div className="flex gap-3 pt-1">
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
                    <h2 className="text-[22px] font-black leading-tight tracking-tight text-foreground">
                      Sign Your Quant
                    </h2>
                    <p className="mt-1.5 text-[12.5px] text-muted-foreground font-semibold px-2 leading-relaxed">
                      Upload your Safaricom M-Pesa statement PDF to generate your private financial twin and start goal optimization.
                    </p>

                    {errorMsg && (
                      <div className="mt-4 w-full rounded-xl bg-destructive/10 p-3 text-[12px] text-destructive font-bold flex justify-between items-center text-left border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <span>{errorMsg}</span>
                        <button onClick={() => setErrorMsg(null)} className="hover:opacity-80"><X className="h-3.5 w-3.5" /></button>
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
                      className={`glass mt-5 w-full rounded-[24px] p-6 text-center border border-dashed border-foreground/15 transition-all ${dragging ? "scale-[1.02] ring-2 ring-foreground/20" : ""}`}
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

                    <div className="mt-5 rounded-2xl bg-foreground/[0.02] p-3 border border-foreground/[0.04] text-[10.5px] leading-relaxed text-muted-foreground font-semibold flex gap-2.5 items-start text-left">
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
                  <h2 className="text-[18px] font-bold leading-tight tracking-tight text-center">
                    Analyzing statement…
                  </h2>
                  <p className="mt-1 text-[12px] text-muted-foreground font-semibold text-center">
                    Quant is auditing your cash velocities.
                  </p>

                  <div className="glass mt-5 rounded-2xl p-4 space-y-2.5 border border-foreground/5 max-h-60 overflow-y-auto">
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
                          <span className={`text-[12px] ${done ? "text-muted-foreground line-through font-semibold" : active ? "font-bold animate-pulse" : "text-muted-foreground font-semibold"}`}>
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
        </div>
      )}
    </AnimatePresence>
  );
}
