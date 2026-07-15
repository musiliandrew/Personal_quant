"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { modes } from "@/lib/quant-data";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

const currency = (n: number) => `KSh ${n.toLocaleString()}`;

export default function ModesPage() {
  return (
    <div className="px-5 pt-14">
      <div className="flex items-center gap-3">
        <Link href="/app" className="glass grid h-10 w-10 place-items-center rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">Financial Modes</h1>
          <p className="text-[13px] text-muted-foreground font-semibold">Switch lifestyles. Reshape outcomes.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="glass mt-6 rounded-3xl p-4"
      >
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
          <Sparkles className="h-3 w-3 text-emerald-400" /> Quant recommends
        </div>
        <p className="mt-1.5 text-[13px] leading-snug">
          Switching to <b>Survival Mode</b> for 18 days lets you buy your KSh 6,500 bag without
          affecting rent.
        </p>
      </motion.div>

      <div className="mt-6 space-y-4 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
        {modes.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
            className="soft-card overflow-hidden rounded-[28px] p-0"
          >
            <div className="p-5" style={{ background: m.tint }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-foreground/70">Mode</p>
                  <p className="text-[22px] font-semibold tracking-tight">{m.name}</p>
                </div>
                {m.active && (
                  <span className="flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] text-background">
                    <Check className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-xs text-[13px] text-foreground/80">{m.desc}</p>
            </div>

            {m.monthly > 0 ? (
              <div className="grid grid-cols-4 divide-x divide-foreground/10 px-1">
                <Stat label="Monthly" value={currency(m.monthly)} />
                <Stat label="Daily" value={currency(m.daily)} />
                <Stat label="Save" value={`${Math.round(m.savingsRate * 100)}%`} />
                <Stat label="Left" value={currency(m.leftover)} />
              </div>
            ) : (
              <div className="p-5 text-[13px] text-muted-foreground font-semibold">
                Design a mode for a specific season, trip or project.
              </div>
            )}

            {!m.active && (
              <div className="border-t border-foreground/10 p-3">
                <button className="w-full rounded-full bg-foreground py-3 text-[13px] font-medium text-background">
                  Switch to {m.name}
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium tabular-nums">{value}</p>
    </div>
  );
}
