"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Plus, Sparkles, Target, X, Check } from "lucide-react";
import { api, GoalData } from "@/lib/api";

const currency = (n: number) => `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New goal form state
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [creating, setCreating] = useState(false);

  // Contribution state
  const [isContribOpen, setIsContribOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contribAmount, setContribAmount] = useState("");
  const [updating, setUpdating] = useState(false);
 
  const fetchGoals = () => {
    api.getGoals()
      .then((res) => {
        // Map backend Goal schema to frontend layout
        const mapped = res.map((g: any, i: number) => {
          const target = parseFloat(g.target_amount) || 1000;
          const saved = parseFloat(g.saved_amount) || 0;
          
          const tints = [
            "var(--gradient-sky)",
            "var(--gradient-mint)",
            "var(--gradient-peach)",
            "var(--gradient-lilac)"
          ];
 
          return {
            id: g.id,
            name: g.title,
            target,
            saved,
            eta: g.deadline ? new Date(g.deadline).toLocaleDateString("en-KE", { month: "short", day: "numeric" }) : "Dec 30",
            likelihood: g.likelihood ?? 50,
            tip: g.tip || "Quant recommendation computing...",
            tint: tints[i % tints.length]
          };
        });
        setGoals(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
 
  useEffect(() => {
    fetchGoals();
  }, []);
 
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount || !deadline || creating) return;
 
    setCreating(true);
    try {
      await api.createGoal({
        title,
        target_amount: parseFloat(targetAmount),
        saved_amount: 0,
        deadline,
      });
      // Reset form & reload
      setTitle("");
      setTargetAmount("");
      setDeadline("");
      setIsModalOpen(false);
      fetchGoals();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenContribution = (goal: any) => {
    setSelectedGoal(goal);
    setContribAmount("");
    setIsContribOpen(true);
  };

  const handleLogContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contribAmount || updating) return;

    setUpdating(true);
    try {
      const additional = parseFloat(contribAmount);
      if (!isNaN(additional) && additional > 0) {
        const newSaved = selectedGoal.saved + additional;
        await api.updateGoal(selectedGoal.id, { saved_amount: newSaved });
        setIsContribOpen(false);
        fetchGoals();
      }
    } catch (err) {
      console.error("Failed to log contribution", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight">Goals</h1>
          <p className="mt-0.5 text-[11px] sm:text-[13px] text-muted-foreground font-semibold">
            Every goal has a plan and a likelihood.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="glass grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-full active:scale-[0.95] transition-transform"
        >
          <Plus className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </button>
      </div>

      <div className="mt-4 sm:mt-5 space-y-4 pb-28 md:grid md:grid-cols-2 md:gap-5 md:space-y-0">
        {loading ? (
          <div className="text-center py-12 text-[12px] sm:text-[13px] text-muted-foreground font-medium">
            Loading savings goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 glass rounded-[20px] sm:rounded-[28px] p-5 sm:p-6 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2.5 opacity-40" />
            <p className="text-[13px] sm:text-[14px] font-medium">No savings goals yet</p>
            <p className="text-[11px] mt-0.5">Tap the plus icon to start planning your future.</p>
          </div>
        ) : (
          goals.map((g, i) => {
            const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                className="soft-card overflow-hidden rounded-[20px] sm:rounded-[28px] p-0"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4"
                  style={{ background: g.tint }}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="grid h-8.5 w-8.5 sm:h-10 sm:w-10 place-items-center rounded-xl sm:rounded-2xl bg-background/60 backdrop-blur shrink-0">
                      <Target className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] sm:text-[15px] font-semibold truncate">{g.name}</p>
                      <p className="text-[10.5px] sm:text-[11px] text-foreground/75 font-semibold truncate">
                        {currency(g.saved)} of {currency(g.target)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-foreground/60 font-bold">ETA</p>
                    <p className="text-[11.5px] sm:text-[13px] font-semibold">{g.eta}</p>
                  </div>
                </div>

                <div className="px-4 pt-3.5 pb-4 sm:px-5 sm:pt-4 sm:pb-5">
                  <div className="flex items-center justify-between text-[11px] sm:text-[12px] text-muted-foreground font-semibold">
                    <span>Progress</span>
                    <span className="tabular-nums font-bold">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-foreground/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-foreground"
                    />
                  </div>

                  <div className="mt-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-[9.5px] sm:text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                        Likelihood
                      </span>
                      <span className="text-[12.5px] sm:text-[14px] font-bold tabular-nums">{g.likelihood}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenContribution(g)}
                        className="glass px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-bold text-foreground hover:bg-foreground/5 active:scale-[0.95] transition-transform"
                      >
                        + Add Savings
                      </button>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9.5px] sm:text-[11px] font-bold ${g.likelihood >= 80 ? "bg-emerald-500/10 text-emerald-400" : g.likelihood >= 65 ? "bg-amber-500/10 text-amber-400" : "bg-foreground/5 text-muted-foreground"}`}
                      >
                        {g.likelihood >= 80 ? "On track" : g.likelihood >= 65 ? "Achievable" : "Stretch"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 rounded-xl sm:rounded-2xl bg-foreground/[0.04] p-3">
                    <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                      <Sparkles className="h-3 w-3 text-emerald-400" /> Quant recommends
                    </div>
                    <p className="mt-1 text-[11.5px] sm:text-[13px] leading-snug font-medium text-foreground/80">{g.tip}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Goal creation modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="glass-strong w-full max-w-md rounded-t-[32px] px-6 pt-5 pb-10 border-t border-foreground/[0.08]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight">Create Saving Goal</h2>
                  <p className="text-[11.5px] sm:text-[12px] text-muted-foreground font-semibold mt-0.5">Plan your financial future</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="glass grid h-8 w-8 place-items-center rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="mt-5 space-y-3.5">
                <div>
                  <label className="text-[9.5px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                    Goal Name
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Buy MacBook, Emergency Fund"
                    required
                    className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-[12.5px] sm:text-[13px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-[9.5px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                    Target Amount (KSh)
                  </label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 150000"
                    required
                    className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-[12.5px] sm:text-[13px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
                  />
                </div>

                <div>
                  <label className="text-[9.5px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                    Target Date / Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-[12.5px] sm:text-[13px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20 text-muted-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background py-2.5 sm:py-3 text-[12.5px] sm:text-[13px] font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Save Goal"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contribution modal */}
      <AnimatePresence>
        {isContribOpen && selectedGoal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="glass-strong w-full max-w-md rounded-t-[32px] px-6 pt-5 pb-10 border-t border-foreground/[0.08]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight">Log Savings</h2>
                  <p className="text-[11.5px] sm:text-[12px] text-muted-foreground font-semibold mt-0.5">Add contribution for "{selectedGoal.name}"</p>
                </div>
                <button 
                  onClick={() => setIsContribOpen(false)}
                  className="glass grid h-8 w-8 place-items-center rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleLogContribution} className="mt-5 space-y-3.5">
                <div>
                  <label className="text-[9.5px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">
                    Amount to Add (KSh)
                  </label>
                  <input
                    type="number"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    autoFocus
                    className="w-full rounded-xl bg-foreground/[0.04] px-3.5 py-2.5 text-[12.5px] sm:text-[13px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background py-2.5 sm:py-3 text-[12.5px] sm:text-[13px] font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {updating ? "Logging..." : "Confirm Contribution"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
