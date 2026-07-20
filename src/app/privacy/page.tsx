"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-3xl mt-8 sm:mt-12 mb-20 space-y-8">
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Quant Legal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground font-medium text-sm sm:text-base">
            Your data protection & security details
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-3xl p-6 sm:p-8 space-y-8 text-[14px] sm:text-[15px] leading-relaxed text-muted-foreground"
        >
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3.5">
            <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-400 text-[15px] sm:text-[16px]">Your Financial Data is Sacred</p>
              <p className="text-[13px] sm:text-[14px] text-muted-foreground mt-1">
                We treat your cashflow statements with highest-grade sandboxing. No tracking pixels, no advertising networks, and no data sales.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-foreground text-[16px] sm:text-[18px]">1. Statement Shredding</h2>
            <p>
              When you enable the "Delete statements after processing" toggle, your uploaded M-Pesa statements are deleted from our servers the millisecond the parser finishes mapping your cashflow. We do not store raw files unless you explicitly choose to retain them for historical viewing.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-foreground text-[16px] sm:text-[18px]">2. Encryption & Transit</h2>
            <p>
              All connections are fully secured with industry-standard TLS encryption. Your statement details are read in isolation by a private worker and are never broadcasted or shared with any third-party external APIs without anonymization.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-foreground text-[16px] sm:text-[18px]">3. Aggregated Insights</h2>
            <p>
              We store only the mathematical aggregates (e.g., your total monthly food budget, income milestones, and non-sensitive merchant category labels) to populate your Money Map and chat memory. This structured data cannot be reverse-engineered back to your raw transaction PDF.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-foreground text-[16px] sm:text-[18px]">4. Control Over History</h2>
            <p>
              You have full control. You can use the "Delete All Data" action in the settings to instantly purge your profile, saved AI rules, and chat history. Deletion is instantaneous and permanent.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-bold text-foreground text-[16px] sm:text-[18px]">5. Kenya Data Protection Act (DPA) 2019</h2>
            <p>
              Quant fully complies with the Kenya Data Protection Act 2019. We process your mobile money and statement records strictly in accordance with Section 25 principles (lawful, fair, and transparent processing, data minimization, and robust technical security measures). You hold absolute rights to access, rectify, or request immediate deletion of your financial information.
            </p>
          </div>

        </motion.div>
      </div>
    </main>
  );
}
