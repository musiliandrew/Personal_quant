"use client";

import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsOfService() {
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
            <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight">Terms of Service</h2>
            <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold">
              Quant Auditor Usage Terms & Service Guidelines
            </p>
          </div>

          <div className="space-y-5 text-muted-foreground text-[12.5px] sm:text-[13px] leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-start gap-3">
              <FileText className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-purple-400 text-[13px]">Financial Intelligence Service</p>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  By using Quant Auditor, you agree to these service terms regarding financial statement processing, data analysis, and automated insights.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground text-[13px] sm:text-[14px]">1. Service Scope</p>
              <p>
                Quant Auditor provides automated parsing, categorizing, and AI-driven analysis of user-uploaded M-Pesa financial e-statements. Insights are calculated strictly from your historical transaction baselines.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground text-[13px] sm:text-[14px]">2. Financial Advisory Disclaimer</p>
              <p>
                Quant Auditor provides mathematical cashflow analysis, budget tracking, and spending suggestions. The service does not constitute certified legal, tax, or investment advice.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground text-[13px] sm:text-[14px]">3. User Ownership & Security</p>
              <p>
                You maintain complete ownership of your uploaded statements and financial records. You may request total data deletion at any time through your profile settings.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground text-[13px] sm:text-[14px]">4. Service Availability</p>
              <p>
                We strive for continuous service availability and real-time email statement sync. Quant reserves the right to make technical enhancements and infrastructure updates.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
