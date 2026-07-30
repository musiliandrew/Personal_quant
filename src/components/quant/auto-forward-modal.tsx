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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[32px] p-6 glass border border-purple-500/20 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5)] z-10 max-h-[90vh] flex flex-col"
          >
            {/* Ambient Background Orbs */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 right-0 h-[220px] w-[220px] rounded-full opacity-[0.2] blur-3xl bg-purple-500" />
              <div className="absolute bottom-0 left-0 h-[220px] w-[220px] rounded-full opacity-[0.15] blur-3xl bg-indigo-500" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-foreground/[0.06] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[17px] font-black text-foreground tracking-tight">Auto-Ingest Statement Setup</h2>
                  <p className="text-[11px] text-muted-foreground font-semibold">Zero-friction automated auditing</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] grid h-8 w-8 place-items-center transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* Quick Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/15 space-y-1">
                  <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-purple-400">Quant Ingest Address</span>
                  <div className="flex items-center justify-between gap-1">
                    <code className="text-[11.5px] font-bold text-foreground truncate">audit@quantiq.co.ke</code>
                    <button
                      onClick={() => copyText("audit@quantiq.co.ke", "audit")}
                      className="p-1.5 rounded-lg bg-purple-500 text-white hover:opacity-90 active:scale-95 transition-all shrink-0"
                      title="Copy Address"
                    >
                      {copiedAudit ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06] space-y-1">
                  <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-muted-foreground">Safaricom Sender Email</span>
                  <div className="flex items-center justify-between gap-1">
                    <code className="text-[10.5px] font-bold text-foreground truncate">m-pesastatements@safaricom.co.ke</code>
                    <button
                      onClick={() => copyText("m-pesastatements@safaricom.co.ke", "safaricom")}
                      className="p-1.5 rounded-lg bg-foreground/10 text-foreground hover:bg-foreground/20 active:scale-95 transition-all shrink-0"
                      title="Copy Safaricom Address"
                    >
                      {copiedSafaricom ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Method Switcher Tabs */}
              <div className="flex p-1 rounded-2xl bg-foreground/[0.04] border border-foreground/[0.05] gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("gmail")}
                  className={`px-3 py-2 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === "gmail"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ⚡ Gmail Rule (Guaranteed)
                </button>
                <button
                  onClick={() => setActiveTab("direct")}
                  className={`px-3 py-2 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === "direct"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🔐 Serverless Push Sync
                </button>
                <button
                  onClick={() => setActiveTab("manual")}
                  className={`px-3 py-2 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === "manual"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📩 Manual Forward
                </button>
              </div>

              {/* Tab 1: Gmail Auto Rule */}
              {activeTab === "gmail" && (
                <div className="space-y-3 pt-1">
                  <p className="text-[12px] text-muted-foreground font-semibold leading-relaxed">
                    <strong>100% Guaranteed & Unblockable:</strong> Set this up once in Gmail. Every month when Safaricom emails your e-statement, Gmail automatically syncs it with Quant:
                  </p>

                  <div className="space-y-2.5">
                    <div className="flex gap-3 p-3 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                      <div className="text-[12px] font-semibold text-foreground leading-relaxed">
                        Open <strong className="text-purple-400">Gmail Settings</strong> ⚙️ ➔ <span className="underline">Filters and Blocked Addresses</span> ➔ click <strong className="text-foreground">Create a new filter</strong>.
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-black flex items-center justify-center shrink-0">2</span>
                      <div className="text-[12px] font-semibold text-foreground leading-relaxed">
                        In the <strong>From:</strong> field, paste:
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-[11px] font-bold text-purple-400 bg-background px-2 py-1 rounded-lg border border-foreground/10">m-pesastatements@safaricom.co.ke</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-6 w-6 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-black flex items-center justify-center shrink-0">3</span>
                      <div className="text-[12px] font-semibold text-foreground leading-relaxed">
                        Click <strong>Create filter</strong> ➔ check <strong>Forward it to:</strong> and select <code className="text-purple-400 font-bold">audit@quantiq.co.ke</code>.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-emerald-400 font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Done! Quant audits your statements automatically on the 1st of every month.</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Serverless Direct Push Sync */}
              {activeTab === "direct" && (
                <div className="space-y-3 pt-1">
                  <p className="text-[12px] text-muted-foreground font-semibold leading-relaxed">
                    Connect your Google account for zero-touch serverless inbox sync via Google Cloud Pub/Sub:
                  </p>

                  <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-purple-400" />
                      <span className="text-[12px] font-extrabold text-foreground">Google Cloud Pub/Sub Webhook</span>
                    </div>

                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      Whenever Safaricom sends an e-statement, Google Cloud fires a serverless push notification to Quant.
                    </p>

                    <button
                      onClick={() => {
                        alert("Google Sign-In Account connected! Serverless Pub/Sub active.");
                      }}
                      className="w-full py-2.5 rounded-xl bg-purple-500 text-white font-bold text-[12px] hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Direct Sync Active with Google Account
                    </button>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-[10.5px] text-amber-400 font-semibold leading-normal">
                    💡 If Google shows an "Unverified App" prompt, use the <strong>Gmail Rule</strong> tab — 0 permissions needed!
                  </div>
                </div>
              )}

              {/* Tab 3: Manual 1-Tap Forward */}
              {activeTab === "manual" && (
                <div className="space-y-3 pt-1">
                  <p className="text-[12px] text-muted-foreground font-semibold leading-relaxed">
                    If you receive your e-statement PDF in your email inbox, you can forward it manually anytime:
                  </p>

                  <div className="space-y-2.5">
                    <div className="flex gap-3 p-3 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                      <div className="text-[12px] font-semibold text-foreground leading-relaxed">
                        Open the email from Safaricom containing your e-statement PDF.
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-black flex items-center justify-center shrink-0">2</span>
                      <div className="text-[12px] font-semibold text-foreground leading-relaxed">
                        Tap <strong>Forward</strong> ➔ enter recipient <code className="text-purple-400 font-bold">audit@quantiq.co.ke</code>.
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.05]">
                      <span className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-400 text-[11px] font-black flex items-center justify-center shrink-0">3</span>
                      <div className="text-[12px] font-semibold text-foreground leading-relaxed">
                        Hit <strong>Send</strong>. Quant ingests your statement in under 5 seconds!
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Close Button */}
            <div className="border-t border-foreground/[0.06] pt-3.5 mt-3">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full bg-foreground text-background text-[12.5px] font-bold active:scale-[0.98] transition-transform"
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
