"use client";

import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl mt-4 sm:mt-12 mb-20 space-y-6">
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Quant
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-[32px] px-6 pt-8 pb-10 border border-foreground/[0.08]"
        >
          <div className="mb-6">
            <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight">Privacy Policy</h2>
            <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold">
              Your data protection & security details
            </p>
          </div>

          <div className="space-y-5 text-muted-foreground text-[12.5px] sm:text-[13px] leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-400 text-[13px]">Your Financial Data is Sacred</p>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  We treat your cashflow statements with highest-grade sandboxing. No tracking pixels, no advertising networks, and no data sales.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground text-[13px] sm:text-[14px]">1. Statement Shredding</p>
              <p>
                When you enable the *"Delete statements after processing"* toggle, your uploaded M-Pesa statements are deleted from our servers the millisecond the parser finishes mapping your cashflow. We do not store raw files.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground text-[13px] sm:text-[14px]">2. Encryption & Transit</p>
              <p>
                All connections are fully secured with industry-standard TLS encryption. Your statement details are read in isolation by a private worker and are never broadcasted.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground text-[13px] sm:text-[14px]">3. Aggregated Insights</p>
              <p>
                We store only the mathematical aggregates (e.g., your total monthly food budget, income milestones, and non-sensitive merchant category labels) to populate your Money Map and chat memory.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground text-[13px] sm:text-[14px]">4. Control Over History</p>
              <p>
                You have full control. You can use the "Delete All Data" action in the settings to instantly purge your profile, saved AI rules, and chat history.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground text-[13px] sm:text-[14px]">5. Kenya Data Protection Act (DPA) 2019</p>
              <p>
                Quant fully complies with the Kenya Data Protection Act 2019. We process your mobile money and statement records strictly in accordance with Section 25 principles (lawful, fair, and transparent processing, data minimization, and robust technical security measures). You hold absolute rights to access, rectify, or request immediate deletion of your financial information.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
