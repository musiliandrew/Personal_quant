"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Copy, Check, Mail, Sparkles, ArrowRight, ShieldCheck, Zap, Lock } from "lucide-react";

interface AutoForwardGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AutoForwardGuideModal({ isOpen, onClose }: AutoForwardGuideModalProps) {
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [copiedSafaricom, setCopiedSafaricom] = useState(false);
  const [activeTab, setActiveTab] = useState<"gmail" | "direct" | "manual">("gmail");

  const copyText = (text: string, type: "audit" | "safaricom") => {
    navigator.clipboard.writeText(text);
    if (type === "audit") {
      setCopiedAudit(true);
      setTimeout(() => setCopiedAudit(false), 2000);
    } else {
      setCopiedSafaricom(true);
      setTimeout(() => setCopiedSafaricom(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal / Mobile Drawer */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden rounded-t-[28px] sm:rounded-[32px] p-4 sm:p-6 glass-strong border-t sm:border border-purple-500/25 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6)] z-10 max-h-[92vh] sm:max-h-[85vh] flex flex-col"
          >
            {/* Ambient Background Orbs */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 right-0 h-[180px] w-[180px] rounded-full opacity-[0.2] blur-3xl bg-purple-500" />
              <div className="absolute bottom-0 left-0 h-[180px] w-[180px] rounded-full opacity-[0.15] blur-3xl bg-indigo-500" />
            </div>

            {/* Drag Pill for Mobile */}
            <div className="sm:hidden w-12 h-1 bg-foreground/20 rounded-full mx-auto mb-3" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-foreground/[0.06] pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] sm:text-[17px] font-black text-foreground tracking-tight truncate">Auto-Ingest Statement Setup</h2>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold truncate">Zero-friction automated auditing</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] grid h-7 w-7 sm:h-8 sm:w-8 place-items-center transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-3 [scrollbar-width:none]">
              {/* Quick Addresses */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-purple-500/5 border border-purple-500/15 space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-purple-400 block">Quant Ingest Address</span>
                  <div className="flex items-center justify-between gap-1">
                    <code className="text-[11px] sm:text-[11.5px] font-bold text-foreground truncate">audit@quantiq.co.ke</code>
                    <button
                      onClick={() => copyText("audit@quantiq.co.ke", "audit")}
                      className="p-1 sm:p-1.5 rounded-lg bg-purple-500 text-white hover:opacity-90 active:scale-95 transition-all shrink-0"
                      title="Copy Address"
                    >
                      {copiedAudit ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06] space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground block">Safaricom Sender Email</span>
                  <div className="flex items-center justify-between gap-1">
                    <code className="text-[10px] sm:text-[10.5px] font-bold text-foreground truncate">m-pesastatements@safaricom.co.ke</code>
                    <button
                      onClick={() => copyText("m-pesastatements@safaricom.co.ke", "safaricom")}
                      className="p-1 sm:p-1.5 rounded-lg bg-foreground/10 text-foreground hover:bg-foreground/20 active:scale-95 transition-all shrink-0"
                      title="Copy Safaricom Address"
                    >
                      {copiedSafaricom ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Method Switcher Tabs */}
              <div className="flex p-1 rounded-2xl bg-foreground/[0.04] border border-foreground/[0.05] gap-1 overflow-x-auto [scrollbar-width:none]">
                <button
                  onClick={() => setActiveTab("gmail")}
                  className={`flex-1 min-w-max px-2.5 py-1.5 sm:py-2 text-[10.5px] sm:text-[11px] font-bold rounded-xl transition-all whitespace-nowrap text-center ${
                    activeTab === "gmail"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ⚡ Gmail Rule (Guaranteed)
                </button>
                <button
                  onClick={() => setActiveTab("direct")}
                  className={`flex-1 min-w-max px-2.5 py-1.5 sm:py-2 text-[10.5px] sm:text-[11px] font-bold rounded-xl transition-all whitespace-nowrap text-center ${
                    activeTab === "direct"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ✨ Direct Google Sync
                </button>
                <button
                  onClick={() => setActiveTab("manual")}
                  className={`flex-1 min-w-max px-2.5 py-1.5 sm:py-2 text-[10.5px] sm:text-[11px] font-bold rounded-xl transition-all whitespace-nowrap text-center ${
                    activeTab === "manual"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📩 Manual
                </button>
              </div>

              {/* Tab 1: Gmail Auto Rule */}
              {activeTab === "gmail" && (
                <div className="space-y-2 pt-0.5">
                  <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold leading-relaxed">
                    <strong>100% Guaranteed & Unblockable:</strong> Set this up once in Gmail. Safaricom e-statements will sync with Quant automatically:
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-2.5 p-2.5 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-5 w-5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                      <div className="text-[11.5px] font-semibold text-foreground leading-relaxed">
                        Open <strong className="text-purple-400">Gmail Settings</strong> ⚙️ ➔ <span className="underline">Filters</span> ➔ <strong className="text-foreground">Create a new filter</strong>.
                      </div>
                    </div>

                    <div className="flex gap-2.5 p-2.5 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-5 w-5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                      <div className="text-[11.5px] font-semibold text-foreground leading-relaxed">
                        In <strong>From:</strong> paste:
                        <div className="mt-0.5 flex items-center gap-2">
                          <code className="text-[10.5px] font-bold text-purple-400 bg-background px-2 py-0.5 rounded-lg border border-foreground/10 select-all">m-pesastatements@safaricom.co.ke</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 p-2.5 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-5 w-5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                      <div className="text-[11.5px] font-semibold text-foreground leading-relaxed">
                        Click <strong>Create filter</strong> ➔ check <strong>Forward it to:</strong> select <code className="text-purple-400 font-bold select-all">audit@quantiq.co.ke</code>.
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-[10.5px] text-emerald-400 font-bold flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Done! Quant audits your statements automatically on the 1st of every month.</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Direct Google Account Sync */}
              {activeTab === "direct" && (
                <div className="space-y-2 pt-0.5">
                  <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold leading-relaxed">
                    Connect your Gmail account so Quant automatically detects M-Pesa statements the second Safaricom sends them:
                  </p>

                  <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/15 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-[11.5px] font-extrabold text-foreground">Automatic Google Account Integration</span>
                    </div>

                    <p className="text-[10.5px] text-muted-foreground font-medium leading-relaxed">
                      Instant zero-touch ingestion whenever a new e-statement arrives in your primary inbox.
                    </p>

                    <button
                      onClick={async () => {
                        try {
                          const host = window.location.hostname;
                          let apiBase = "http://localhost:8000";
                          if (host.includes("quantiq.co.ke") || host.includes("vercel.app")) {
                            apiBase = "https://api.quantiq.co.ke";
                          } else if (host !== "localhost") {
                            apiBase = `http://${host}:8000`;
                          }
                          
                          const res = await fetch(`${apiBase}/api/notifications/gmail/auth/`);
                          if (res.redirected) {
                            window.location.href = res.url;
                            return;
                          }
                          const data = await res.json();
                          if (data.status === "config_required") {
                            alert(data.message);
                            setActiveTab("gmail");
                          } else {
                            window.location.href = `${apiBase}/api/notifications/gmail/auth/`;
                          }
                        } catch (e) {
                          setActiveTab("gmail");
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-[11.5px] hover:bg-purple-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Lock className="h-3.5 w-3.5" /> Connect Gmail Account
                    </button>
                  </div>

                  <div className="p-2 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-[10px] text-amber-400 font-semibold leading-normal">
                    💡 If Google displays an "Unverified App" warning during login, use the <strong>Gmail Rule</strong> tab — 0 permissions needed & 100% unblockable!
                  </div>
                </div>
              )}

              {/* Tab 3: Manual 1-Tap Forward */}
              {activeTab === "manual" && (
                <div className="space-y-2 pt-0.5">
                  <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold leading-relaxed">
                    If you receive your e-statement PDF in your email inbox, you can forward it manually anytime:
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-2.5 p-2.5 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                      <div className="text-[11.5px] font-semibold text-foreground leading-relaxed">
                        Open the email from Safaricom containing your e-statement PDF.
                      </div>
                    </div>

                    <div className="flex gap-2.5 p-2.5 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                      <div className="text-[11.5px] font-semibold text-foreground leading-relaxed">
                        Tap <strong>Forward</strong> ➔ enter recipient <code className="text-purple-400 font-bold select-all">audit@quantiq.co.ke</code>.
                      </div>
                    </div>

                    <div className="flex gap-2.5 p-2.5 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                      <div className="text-[11.5px] font-semibold text-foreground leading-relaxed">
                        Hit <strong>Send</strong>. Quant ingests your statement in under 5 seconds!
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Close Button */}
            <div className="border-t border-foreground/[0.06] pt-3 mt-2 shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 sm:py-3 rounded-full bg-foreground text-background text-[12px] sm:text-[12.5px] font-bold active:scale-[0.98] transition-transform"
              >
                Got It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
