"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  FileText,
  Trash2,
  ShieldCheck,
  Download,
  Moon,
  Bell,
  Palette,
  Calendar,
  Plus,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";
import UpgradeModal from "@/components/UpgradeModal";

const currency = (n: number) => `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export default function ProfilePage() {
  const { isDark: dark, setDark } = useTheme();
  const [isBillsOpen, setIsBillsOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [bills, setBills] = useState<any[]>([]);
  const [loadingBills, setLoadingBills] = useState(true);
  
  // Legal terms & Privacy states
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalType, setLegalType] = useState<"terms" | "privacy" | null>(null);
  
  // Settings state
  const [deleteAfterProcess, setDeleteAfterProcess] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("delete_after_process");
      return stored !== "false";
    }
    return true;
  });

  const handleToggleDelete = (val: boolean) => {
    setDeleteAfterProcess(val);
    localStorage.setItem("delete_after_process", String(val));
  };
  
  // Form states for new bills
  const [merchantName, setMerchantName] = useState("");
  const [billLabel, setBillLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [nextDue, setNextDue] = useState("");
  const [creating, setCreating] = useState(false);
  const [allMerchants, setAllMerchants] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = allMerchants
    .filter((m) => m.toLowerCase().includes(merchantName.toLowerCase()))
    .slice(0, 8);

  const fetchBills = () => {
    setLoadingBills(true);
    api.getRecurringExpenses()
      .then((res) => {
        setBills(res);
        setLoadingBills(false);
      })
      .catch(() => setLoadingBills(false));
  };

  const [userProfile, setUserProfile] = useState<{ name?: string; email?: string; isPro?: boolean } | null>(null);
  const [behaviour, setBehaviour] = useState<any>(null);

  useEffect(() => {
    fetchBills();
    api.getUniqueMerchants().then((res) => {
      setAllMerchants(res);
    }).catch(() => {});

    const cached = localStorage.getItem("quant_dashboard");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUserProfile({
          name: parsed.user_name,
          email: parsed.user_email,
        });
        setBehaviour(parsed.behaviour);
      } catch (_) {}
    }

    api.getDashboard().then((res) => {
      setUserProfile((prev) => ({
        ...prev,
        name: res.user_name,
        email: res.user_email,
      }));
      setBehaviour(res.behaviour);
      localStorage.setItem("quant_dashboard", JSON.stringify(res));
    }).catch(() => {});

    api.getMe().then((res) => {
      setUserProfile((prev) => ({
        ...prev,
        isPro: res.is_pro,
      }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const open = isLegalOpen || isBillsOpen;
    const event = new CustomEvent("quant-drawer-state", { detail: { open } });
    window.dispatchEvent(event);
  }, [isLegalOpen, isBillsOpen]);

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName || !amount || creating) return;

    setCreating(true);
    try {
      await api.createRecurringExpense({
        merchant_name: merchantName,
        label: billLabel || undefined,
        amount: parseFloat(amount),
        frequency,
        next_due: nextDue || undefined,
      });
      setMerchantName("");
      setBillLabel("");
      setAmount("");
      setNextDue("");
      fetchBills();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const totalBillsAmount = bills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-5 pt-2 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass flex items-center gap-3.5 sm:gap-4 rounded-[22px] sm:rounded-3xl p-4 sm:p-5"
      >
        <span
          className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full text-base sm:text-lg font-bold shrink-0"
          style={{ background: "var(--gradient-lilac)" }}
        >
          {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[16px] sm:text-[18px] font-bold truncate">{userProfile?.name || "User"}</p>
            {userProfile?.isPro !== undefined && (
              userProfile.isPro ? (
                <span className="inline-flex items-center text-[9px] font-extrabold bg-gradient-to-r from-purple-400 to-indigo-500 text-background px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 select-none">
                  Pro
                </span>
              ) : (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="inline-flex items-center text-[9px] font-extrabold bg-foreground/10 text-foreground hover:bg-foreground/15 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 transition-colors"
                >
                  Free • Upgrade
                </button>
              )
            )}
          </div>
          <p className="text-[11.5px] sm:text-[12px] text-muted-foreground font-semibold truncate">{userProfile?.email || "Member since 2024"}</p>
        </div>
        <Link href="/" className="text-[11px] sm:text-[12px] text-muted-foreground font-bold shrink-0">
          Sign out
        </Link>
      </motion.div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} onSuccess={() => { setShowUpgrade(false); window.location.reload(); }} />

      {/* Quant Financial Persona (Wrapped / develops over time) */}
      <Section title="Quant Financial Persona">
        {(!behaviour || !behaviour.impulse_score) ? (
          <div className="p-4 sm:p-5 text-center">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-foreground/[0.04] text-[10px] sm:text-[11px] text-muted-foreground font-semibold mb-1.5">
              Developing...
            </span>
            <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed px-4">
              Your financial archetype is being calculated. Upload more transaction statements to unlock your profile.
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
              <span className="text-[9.5px] sm:text-[11px] uppercase tracking-wider bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded-full">
                Archetype Unlocked
              </span>
              <span className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold">
                Impulse Score: {behaviour.impulse_score}%
              </span>
            </div>
            
            <div className="space-y-3">
              {behaviour.overspend_days?.includes("Thursday") ? (
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/5 border border-amber-500/10">
                  <h4 className="text-[13px] sm:text-[14px] font-bold text-amber-400 mb-0.5">🦖 Thursday Devourer</h4>
                  <p className="text-[11.5px] sm:text-[12.5px] leading-relaxed text-muted-foreground">
                    Your spending spikes heavily on Thursdays. **Recommendation:** Try staying home on Thursdays and keep your wallet locked.
                  </p>
                </div>
              ) : behaviour.weekend_multiplier > 1.5 ? (
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-purple-500/5 border border-purple-500/10">
                  <h4 className="text-[13px] sm:text-[14px] font-bold text-purple-400 mb-0.5">🎉 Weekend Warrior</h4>
                  <p className="text-[11.5px] sm:text-[12.5px] leading-relaxed text-muted-foreground">
                    You spend {behaviour.weekend_multiplier.toFixed(1)}x more on weekends than weekdays. Give your M-Pesa account a rest on Sundays.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <h4 className="text-[13px] sm:text-[14px] font-bold text-emerald-400 mb-0.5">⚖️ Calculated Optimizer</h4>
                  <p className="text-[11.5px] sm:text-[12.5px] leading-relaxed text-muted-foreground">
                    Your spending remains highly consistent across all days. Watch out for recurring micro-payments.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pt-0.5">
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-foreground/[0.03]">
                  <p className="text-[9.5px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Weekend Flow</p>
                  <p className="text-[13.5px] sm:text-[15px] font-bold tabular-nums">
                    {behaviour.weekend_multiplier?.toFixed(1)}x weekday
                  </p>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-foreground/[0.03]">
                  <p className="text-[9.5px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Danger Days</p>
                  <p className="text-[13.5px] sm:text-[15px] font-bold truncate">
                    {behaviour.overspend_days && behaviour.overspend_days.length > 0
                      ? behaviour.overspend_days.map((day: string) => {
                          const d = day.toLowerCase();
                          if (d.startsWith("mon")) return "Mon";
                          if (d.startsWith("tue")) return "Tue";
                          if (d.startsWith("wed")) return "Wed";
                          if (d.startsWith("thu")) return "Thu";
                          if (d.startsWith("fri")) return "Fri";
                          if (d.startsWith("sat")) return "Sat";
                          if (d.startsWith("sun")) return "Sun";
                          return day;
                        }).join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Fixed Bills Section */}
      <Section title="Fixed Bills & Commitments">
        <button
          onClick={() => setIsBillsOpen(true)}
          className="flex w-full items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-4 text-left hover:bg-foreground/[0.02] transition-colors"
        >
          <span className="grid h-8.5 w-8.5 sm:h-9 sm:w-9 place-items-center rounded-xl sm:rounded-2xl bg-foreground/[0.05] shrink-0">
            <Calendar className="h-4.5 w-4.5 text-primary" strokeWidth={1.8} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-[14px] font-semibold">Manage Fixed Bills</p>
            <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-bold truncate">
              {loadingBills ? "Loading bills..." : `${bills.length} bills active · Total ${currency(totalBillsAmount)}/mo`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </Section>

      <Section title="Data">
        <Row icon={FileText} label="Connected Statements" hint="2 files · last 90 days" />
        <Row icon={Download} label="Export Financial Report" hint="PDF" />
        <Row icon={Trash2} label="Delete All Data" hint="Everything, one tap" danger />
      </Section>

      <Section title="Privacy & Legal">
        <button 
          onClick={() => { setLegalType("terms"); setIsLegalOpen(true); }}
          className="flex w-full items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 text-left active:bg-foreground/[0.02]"
        >
          <span className="grid h-8.5 w-8.5 sm:h-9 sm:w-9 place-items-center rounded-xl sm:rounded-2xl bg-foreground/[0.05] shrink-0">
            <FileText className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-[14px] font-medium truncate">Terms of Service</p>
            <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-semibold truncate">Agreement & usage guidelines</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>

        <button 
          onClick={() => { setLegalType("privacy"); setIsLegalOpen(true); }}
          className="flex w-full items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 text-left active:bg-foreground/[0.02]"
        >
          <span className="grid h-8.5 w-8.5 sm:h-9 sm:w-9 place-items-center rounded-xl sm:rounded-2xl bg-foreground/[0.05] shrink-0">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-[14px] font-medium truncate">Privacy Policy</p>
            <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-semibold truncate">Statement data & encryption details</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>

        <ToggleRow
          label="Delete statements after processing"
          hint="Keep only the derived insights"
          value={deleteAfterProcess}
          onChange={handleToggleDelete}
        />
      </Section>

      <Section title="Appearance">
        <ToggleRow
          label="Dark Mode"
          hint="Match your evening"
          value={dark}
          onChange={setDark}
          icon={Moon}
        />
        <Row icon={Palette} label="Theme" hint="Calm · Default" />
      </Section>

      <Section title="Notifications">
        <Row icon={Bell} label="Daily Insight" hint="Every morning at 8:00" />
        <Row icon={Bell} label="Budget Alerts" hint="When you're near a limit" />
      </Section>


      {/* Fixed Bills Drawer/Modal */}
      <AnimatePresence>
        {isBillsOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="glass-strong w-full max-w-md rounded-t-[32px] px-6 pt-5 pb-24 border-t border-foreground/[0.08] max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight">Fixed Bills</h2>
                  <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold">Recurring monthly commitments</p>
                </div>
                <button
                  onClick={() => setIsBillsOpen(false)}
                  className="glass grid h-8 w-8 place-items-center rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* List of active bills */}
              <div className="mt-4 sm:mt-5 space-y-2.5">
                {loadingBills ? (
                  <p className="text-center py-6 text-[11px] sm:text-[12px] text-muted-foreground">Loading bills...</p>
                ) : bills.length === 0 ? (
                  <p className="text-center py-6 text-[11px] sm:text-[12px] text-muted-foreground">No recurring bills added yet.</p>
                ) : (
                  bills.map((b) => (
                    <div key={b.id} className="soft-card flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3">
                      <div>
                        <p className="text-[13px] sm:text-[14px] font-semibold">{b.label || b.merchant_detail?.name || "Fixed Bill"}</p>
                        <p className="text-[9.5px] sm:text-[10px] text-muted-foreground font-bold tracking-wider uppercase">
                          {b.label && b.merchant_detail?.name ? `${b.merchant_detail.name} · ` : ""}
                          {b.frequency} {b.next_due ? `· Due ${new Date(b.next_due).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}` : ""}
                        </p>
                      </div>
                      <span className="text-[13px] sm:text-[14px] font-bold tabular-nums">
                        {currency(parseFloat(b.amount) || 0)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Add bill form */}
              <div className="mt-5 border-t border-foreground/[0.08] pt-4.5">
                <h3 className="text-[11px] sm:text-[12px] uppercase tracking-widest text-muted-foreground font-bold mb-2.5">Add Commitment</h3>
                <form onSubmit={handleAddBill} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="relative">
                      <label className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Merchant / Payee</label>
                      <input
                        value={merchantName}
                        onChange={(e) => {
                          setMerchantName(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        placeholder="e.g. Safaricom, KPLC"
                        required
                        className="w-full rounded-lg bg-foreground/[0.04] px-3 py-2 text-[12.5px] sm:text-[13px] outline-none placeholder:text-muted-foreground"
                      />
                      {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 max-h-36 overflow-y-auto rounded-lg border border-foreground/10 bg-background/95 backdrop-blur-md shadow-lg z-50 py-1">
                          {filteredSuggestions.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setMerchantName(name);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] sm:text-[12px] hover:bg-foreground/[0.04] font-medium transition-colors"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Bill Label (Optional)</label>
                      <input
                        value={billLabel}
                        onChange={(e) => setBillLabel(e.target.value)}
                        placeholder="e.g. Rent, Internet"
                        className="w-full rounded-lg bg-foreground/[0.04] px-3 py-2 text-[12.5px] sm:text-[13px] outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Amount (KSh)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 12000"
                        required
                        className="w-full rounded-lg bg-foreground/[0.04] px-3 py-2 text-[12.5px] sm:text-[13px] outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Frequency</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full rounded-lg bg-foreground/[0.04] px-3 py-2 text-[12.5px] sm:text-[13px] outline-none text-muted-foreground w-full"
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="YEARLY">Yearly</option>
                        <option value="DAILY">Daily</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Next Due Date</label>
                    <input
                      type="date"
                      value={nextDue}
                      onChange={(e) => setNextDue(e.target.value)}
                      className="w-full rounded-lg bg-foreground/[0.04] px-3 py-2 text-[12.5px] sm:text-[13px] outline-none text-muted-foreground"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background py-2.5 sm:py-3 text-[12px] sm:text-[13px] font-bold active:scale-[0.98] transition-transform mt-2"
                  >
                    <Plus className="h-4 w-4" /> {creating ? "Adding..." : "Add Bill"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms & Privacy Drawer */}
      <AnimatePresence>
        {isLegalOpen && legalType && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="glass-strong w-full max-w-md rounded-t-[32px] px-6 pt-5 pb-10 border-t border-foreground/[0.08] max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-tight">
                    {legalType === "terms" ? "Terms of Service" : "Privacy Policy"}
                  </h2>
                  <p className="text-[11px] sm:text-[12px] text-muted-foreground font-semibold">
                    {legalType === "terms" ? "Quant Legal Agreement" : "Your data protection & security details"}
                  </p>
                </div>
                <button
                  onClick={() => setIsLegalOpen(false)}
                  className="glass grid h-8 w-8 place-items-center rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-muted-foreground text-[12.5px] sm:text-[13px] leading-relaxed pb-4">
                {legalType === "terms" ? (
                  <>
                    <div className="space-y-1">
                      <p className="font-bold text-foreground text-[13px] sm:text-[14px]">1. Nature of Analytics</p>
                      <p>
                        Quant is a personal finance tool designed to parse and structure your transaction statement data. It delivers automatic categorization, behavioral profiling, and interactive simulation. Quant does not offer official investment, tax, or legal advice.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-foreground text-[13px] sm:text-[14px]">2. Upload Ownership</p>
                      <p>
                        You retain full ownership of all statement files (M-Pesa PDFs or raw inputs) uploaded to Quant. You grant us a temporary permission to parse the document to extract totals, frequencies, and merchant labels.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-foreground text-[13px] sm:text-[14px]">3. Safe Conduct</p>
                      <p>
                        You agree to upload only your own financial statements. Attempting to exploit, reverse engineer, or inject malicious payloads into our backend statement engine is strictly prohibited.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-foreground text-[13px] sm:text-[14px]">4. Changes to Terms</p>
                      <p>
                        We may update these terms to support new bank integrations or local compliance updates. Continued use of Quant implies acceptance of updated terms.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 sm:mt-6">
      <p className="mb-1.5 px-2.5 text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="soft-card divide-y divide-foreground/[0.06] rounded-[20px] sm:rounded-3xl p-0">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  danger,
}: {
  icon: typeof FileText;
  label: string;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <button className="flex w-full items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 text-left active:bg-foreground/[0.02]">
      <span
        className={`grid h-8.5 w-8.5 sm:h-9 sm:w-9 place-items-center rounded-xl sm:rounded-2xl shrink-0 ${danger ? "bg-destructive/10 text-destructive" : "bg-foreground/[0.05]"}`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] sm:text-[14px] font-medium truncate ${danger ? "text-destructive font-bold" : ""}`}>{label}</p>
        {hint && <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-semibold truncate">{hint}</p>}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  icon: Icon = ShieldCheck,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: typeof ShieldCheck;
}) {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5">
      <span className="grid h-8.5 w-8.5 sm:h-9 sm:w-9 place-items-center rounded-xl sm:rounded-2xl bg-foreground/[0.05] shrink-0">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] sm:text-[14px] font-medium truncate">{label}</p>
        {hint && <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-semibold truncate">{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6.5 w-11 rounded-full transition-colors shrink-0 ${value ? "bg-foreground" : "bg-foreground/15"}`}
        aria-pressed={value}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 h-5.5 w-5.5 rounded-full bg-background shadow ${value ? "left-[20px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
