"use client";

import React, { useState, useEffect } from "react";
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PendingStatement {
  id: string;
  provider: string;
  filename: string;
  upload_date: string;
  status: string;
}

export function PendingPasswordBanner() {
  const [pendingStatements, setPendingStatements] = useState<PendingStatement[]>([]);
  const [passcodes, setPasscodes] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [successMap, setSuccessMap] = useState<Record<string, boolean>>({});

  const checkPendingStatements = async () => {
    try {
      const res = await api.getStatements();
      const pending = (res.statements || []).filter(
        (s) => s.status === "PENDING_PASSWORD"
      );
      setPendingStatements(pending);
    } catch (e) {
      console.warn("Failed to fetch pending statements:", e);
    }
  };

  useEffect(() => {
    checkPendingStatements();

    const handleUpdate = () => checkPendingStatements();
    window.addEventListener("quant-statements-updated", handleUpdate);
    return () => window.removeEventListener("quant-statements-updated", handleUpdate);
  }, []);

  if (pendingStatements.length === 0) return null;

  const handleUnlock = async (stmtId: string) => {
    const code = passcodes[stmtId]?.trim();
    if (!code) {
      setErrorMap((prev) => ({ ...prev, [stmtId]: "Please enter your Safaricom passcode." }));
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [stmtId]: true }));
    setErrorMap((prev) => ({ ...prev, [stmtId]: "" }));

    try {
      await api.unlockStatement(stmtId, code);
      setSuccessMap((prev) => ({ ...prev, [stmtId]: true }));
      setTimeout(() => {
        setPendingStatements((prev) => prev.filter((s) => s.id !== stmtId));
        window.dispatchEvent(new Event("quant-statements-updated"));
      }, 1200);
    } catch (err: any) {
      setErrorMap((prev) => ({
        ...prev,
        [stmtId]: err.message || "Incorrect passcode. Please verify the code Safaricom sent to your phone/email.",
      }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [stmtId]: false }));
    }
  };

  return (
    <div className="w-full space-y-3 mb-4">
      {pendingStatements.map((stmt) => {
        const isSuccess = successMap[stmt.id];
        const isLoading = loadingMap[stmt.id];
        const error = errorMap[stmt.id];

        return (
          <div
            key={stmt.id}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all shadow-xl backdrop-blur-xl",
              isSuccess
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-200"
            )}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl border mt-0.5",
                    isSuccess
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                  )}
                >
                  {isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] sm:text-[15px] font-black tracking-tight text-foreground">
                      {isSuccess ? "Statement Unlocked!" : "🔒 Safaricom Passcode Required"}
                    </h4>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      Action Required
                    </span>
                  </div>

                  <p className="text-[11.5px] sm:text-[12.5px] text-muted-foreground mt-0.5 font-medium leading-snug">
                    {isSuccess
                      ? "Your statement is unlocked and transactions are being processed into your dashboard."
                      : `Safaricom sent a passcode for ${stmt.filename}. Enter it below to unlock your insights.`}
                  </p>
                </div>
              </div>

              {!isSuccess && (
                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <div className="relative flex-1 sm:w-48">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Passcode / Password"
                      value={passcodes[stmt.id] || ""}
                      onChange={(e) => setPasscodes({ ...passcodes, [stmt.id]: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleUnlock(stmt.id)}
                      className="w-full pl-8 pr-3 py-2 text-[12px] font-bold rounded-xl border border-foreground/15 bg-background/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>

                  <button
                    onClick={() => handleUnlock(stmt.id)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 transition-all shadow-md shrink-0 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Unlock</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
