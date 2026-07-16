"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  X, 
  Crown, 
  MessageSquare, 
  Activity, 
  Zap, 
  CreditCard, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpgradeModal({ isOpen, onClose, onSuccess }: UpgradeModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "waiting" | "success">("form");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<49 | 199 | 999>(199);

  // Fetch current user's phone if available on mount
  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setErrorMsg(null);
      setLoading(false);
      const fetchUser = async () => {
        try {
          const user = await api.getMe();
          if (user && user.phone_number) {
            setPhoneNumber(user.phone_number);
          }
        } catch (e) {
          // ignore
        }
      };
      fetchUser();
    }
  }, [isOpen]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setErrorMsg("M-Pesa phone number is required.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setStep("waiting");

    try {
      // Step 1: Initiate STK push — backend returns immediately with a reference
      const initRes = await api.checkoutBilling(phoneNumber, selectedTier);

      // Mock / instant success (no PayHero credentials)
      if (initRes?.status === "SUCCESS" && initRes?.user) {
        setStep("success");
        setTimeout(() => { onSuccess(); onClose(); }, 1500);
        return;
      }

      const reference = initRes?.reference;
      if (!reference) throw new Error("Payment initiation failed. Please try again.");

      // Step 2: Poll /billing/status/<ref>/ every 3 s for up to 90 s
      const maxAttempts = 30; // 30 × 3s = 90 s
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const statusRes = await api.checkoutBillingStatus(reference);

        if (statusRes?.status === "SUCCESS") {
          setStep("success");
          setTimeout(() => { onSuccess(); onClose(); }, 1500);
          return;
        }
        if (statusRes?.status === "FAILED") {
          throw new Error("Payment was declined or cancelled. Please try again.");
        }
        // PENDING → keep polling
      }

      throw new Error("Payment timed out. If you paid, please refresh — your account will be upgraded.");
    } catch (err: any) {
      console.error("Billing error:", err);
      setErrorMsg(err.message || "M-Pesa transaction failed. Please try again.");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4.5 z-50 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 12 }}
          className="glass border border-foreground/10 rounded-[24px] xs:rounded-[32px] max-w-[380px] xs:max-w-md w-full p-4.5 xs:p-6 sm:p-7 space-y-4.5 sm:space-y-6 relative overflow-hidden"
        >
          {/* Close button */}
          {step !== "waiting" && (
            <button
              onClick={onClose}
              className="absolute top-4.5 right-4.5 h-7.5 w-7.5 rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] flex items-center justify-center transition-transform active:scale-95 cursor-pointer z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {step === "form" && (
            <>
              {/* Pro presentation header */}
              <div className="text-center space-y-1.5 mt-1.5">
                <div className="mx-auto h-10 w-10 xs:h-12 xs:w-12 rounded-xl xs:rounded-2xl bg-purple-500/10 border border-purple-500/20 grid place-items-center text-purple-400">
                  <Crown className="h-4.5 w-4.5 xs:h-5 xs:w-5" />
                </div>
                <h2 className="text-[19px] xs:text-[23px] font-bold tracking-tight">Unlock Quant Pro</h2>
                <p className="text-[12px] xs:text-[13px] text-muted-foreground font-semibold">
                  Get full unrestricted access to your private financial twin.
                </p>
              </div>

              {/* Bullet features */}
              <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-foreground/5 text-center">
                <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/[0.08]">
                  <MessageSquare className="h-4.5 w-4.5 text-indigo-400 mb-1" />
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-foreground/90 leading-tight">Unlimited Twin</span>
                </div>
                <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/[0.08]">
                  <Activity className="h-4.5 w-4.5 text-emerald-400 mb-1" />
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-foreground/90 leading-tight">Cut Simulator</span>
                </div>
                <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/[0.08]">
                  <Zap className="h-4.5 w-4.5 text-amber-400 mb-1" />
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-foreground/90 leading-tight">Unlimited Uploads</span>
                </div>
              </div>

              {/* Package selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTier(49)}
                  className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all text-center ${
                    selectedTier === 49
                      ? "bg-purple-500/10 border-purple-500/40 shadow-sm"
                      : "bg-foreground/[0.02] border-foreground/5 opacity-60 hover:opacity-85"
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">7-Day</span>
                  <p className="text-[12.5px] font-bold mt-1">KSh 49</p>
                  <span className="text-[8.5px] text-muted-foreground mt-0.5">/ pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTier(199)}
                  className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all text-center relative overflow-hidden ${
                    selectedTier === 199
                      ? "bg-purple-500/15 border-purple-500 shadow-md ring-1 ring-purple-500/30"
                      : "bg-foreground/[0.02] border-foreground/5 opacity-70 hover:opacity-90"
                  }`}
                >
                  <div className="absolute top-0 right-0 left-0 bg-purple-500 text-white text-[7px] font-extrabold uppercase py-0.5 tracking-widest text-center shrink-0">
                    Main
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-400 mt-2">Premium</span>
                  <p className="text-[14.5px] font-black mt-0.5">KSh 199</p>
                  <span className="text-[8.5px] font-bold text-purple-300/80 mt-0.5">/ month</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTier(999)}
                  className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all text-center ${
                    selectedTier === 999
                      ? "bg-purple-500/10 border-purple-500/40 shadow-sm"
                      : "bg-foreground/[0.02] border-foreground/5 opacity-60 hover:opacity-85"
                  }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Annual</span>
                  <p className="text-[12.5px] font-bold mt-1">KSh 999</p>
                  <span className="text-[8.5px] text-muted-foreground mt-0.5">/ year</span>
                </button>
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-[11.5px] xs:text-[12px] text-red-200 font-semibold flex items-start gap-2.5 text-left leading-relaxed">
                  <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-red-400 mb-0.5">Transaction Unsuccessful</span>
                    {errorMsg}
                  </div>
                </div>
              )}

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-3.5 xs:space-y-4">
                <div className="glass rounded-xl flex flex-col px-3 py-1 xs:py-1.5 border border-foreground/5">
                  <label className="text-[9px] xs:text-[10px] text-muted-foreground font-bold uppercase tracking-wider">M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="bg-transparent text-[12px] xs:text-[13px] font-semibold outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 xs:py-3.5 text-[13px] xs:text-[14.5px] font-bold transition-transform active:scale-[0.98] w-full flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  <CreditCard className="h-4.5 w-4.5" />
                  Initiate M-Pesa Payment
                </button>
              </form>
            </>
          )}

          {step === "waiting" && (
            <div className="text-center py-8 xs:py-10 space-y-4.5 xs:space-y-6">
              <RefreshCw className="h-9 w-9 xs:h-10 xs:w-10 animate-spin text-purple-400 mx-auto" />
              <div className="space-y-1.5">
                <h3 className="text-[16px] xs:text-[18px] font-bold">Sending M-Pesa STK Push...</h3>
                <p className="text-[12px] xs:text-[13px] text-muted-foreground font-semibold max-w-xs mx-auto leading-relaxed">
                  A pop-up check prompt has been sent to <span className="text-foreground font-bold">{phoneNumber}</span>. 
                  Please enter your M-Pesa PIN on your phone to validate.
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8 xs:py-10 space-y-3.5 xs:space-y-4">
              <CheckCircle2 className="h-10 w-10 xs:h-12 xs:w-12 text-emerald-400 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-[17px] xs:text-[19px] font-bold text-emerald-400">Payment Confirmed!</h3>
                <p className="text-[12px] xs:text-[13px] text-muted-foreground font-semibold">
                  Quant Pro has been successfully activated on your account.
                </p>
              </div>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
