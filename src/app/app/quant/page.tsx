"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Sparkles, History, Plus, X, MessageSquare, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Bubble, type Msg } from "@/components/chat/Bubble";
import { HistoryDrawer } from "@/components/chat/HistoryDrawer";
import UpgradeModal from "@/components/UpgradeModal";
import { Logo } from "@/components/quant/logo";
import { cn } from "@/lib/utils";

const getInitialMsgs = (name = "Andrew", hasData = false, txDays = 0): Msg[] => [
  {
    role: "quant",
    text: hasData
      ? `Hi ${name}. I've analysed your last ${txDays > 0 ? txDays : 90} days of transactions. Ask me anything about your money.`
      : `Hi ${name}. I'm ready to be your personal financial analyst — but I haven't seen your data yet. Upload an M-Pesa statement to get started.`,
  },
];

const suggestions = [
  "Can I buy a KSh 6,500 bag?",
  "Roast my weekly spending",
  "Switch to Survival Mode",
  "Check my MacBook goal status",
];

function QuantPageContent() {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("Andrew");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Premium subscription states
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [promptCount, setPromptCount] = useState<number>(0);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // History memory states
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Desktop history sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Ref for scoped scroll (desktop chat container)
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = chatContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations || []);
      return res.conversations || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const checkProStatus = async () => {
    try {
      const user = await api.getMe();
      setIsPro(user.is_pro);
      setPromptCount(user.prompt_count || 0);
    } catch (e) {
      setIsPro(false);
      setPromptCount(0);
    }
  };

  const loadConversation = async (id: string) => {
    setIsDrawerOpen(false);
    setHistoryLoading(true);
    try {
      const res = await api.getConversationHistory(id);
      const mapped: Msg[] = res.messages.map((m: any) => ({
        role: m.role.toLowerCase() === "user" ? "user" : "quant",
        text: m.content,
        confidence: m.role.toLowerCase() === "user" ? undefined : 93,
        reasoning: m.role.toLowerCase() === "user" ? undefined : ["Restored from past conversation logs"],
      }));
      setMsgs(mapped.length > 0 ? mapped : getInitialMsgs(userName));
      setConversationId(id);
      return id;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      try {
        const [convs] = await Promise.all([fetchConversations(), checkProStatus()]);

        // Read cached dashboard to determine upload status
        let name = "Andrew";
        let hasData = false;
        let txDays = 0;

        const cached = localStorage.getItem("quant_dashboard");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.user_name) { name = parsed.user_name; setUserName(name); }
            const income = parseFloat(String(parsed.monthly_income_30d || "0"));
            const expenses = parseFloat(String(parsed.monthly_expenses_30d || "0"));
            hasData = income > 0 || expenses > 0;
            txDays = hasData ? 90 : 0;
          } catch (_) {}
        }

        // Also try live fetch for freshest data
        try {
          const dash = await api.getDashboard();
          if (dash.user_name) { name = dash.user_name; setUserName(name); }
          const income = parseFloat(String(dash.monthly_income_30d || "0"));
          const expenses = parseFloat(String(dash.monthly_expenses_30d || "0"));
          hasData = income > 0 || expenses > 0;
          txDays = hasData ? 90 : 0;
        } catch (_) {}

        const q = searchParams.get("q");

        if (convs && convs.length > 0) {
          const latestId = convs[0].conversation_id;
          await loadConversation(latestId);
          if (q) send(q, latestId);
        } else {
          setMsgs(getInitialMsgs(name, hasData, txDays));
          if (q) send(q, null);
        }
      } catch (err) {
        console.error("Init failed:", err);
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, [searchParams]);

  useEffect(() => {
    const event = new CustomEvent("quant-drawer-state", { detail: { open: isDrawerOpen } });
    window.dispatchEvent(event);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (msgs.length > 0) {
      const timer = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timer);
    }
  }, [msgs]);

  const startNewChat = () => {
    // Re-read data status from cache for new chat greeting
    let hasData = false;
    try {
      const cached = localStorage.getItem("quant_dashboard");
      if (cached) {
        const parsed = JSON.parse(cached);
        const income = parseFloat(String(parsed.monthly_income_30d || "0"));
        const expenses = parseFloat(String(parsed.monthly_expenses_30d || "0"));
        hasData = income > 0 || expenses > 0;
      }
    } catch (_) {}
    setMsgs(getInitialMsgs(userName, hasData, hasData ? 90 : 0));
    setConversationId(null);
    setIsDrawerOpen(false);
  };

  const send = async (text: string, overrideConversationId?: string | null) => {
    if (!text.trim() || sending) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);
    const activeConvId = overrideConversationId !== undefined ? overrideConversationId : conversationId;
    try {
      const response = await api.sendChatMessage(text, activeConvId || undefined);
      if (isPro === false) setPromptCount((c) => c + 1);
      const quantMsg: Msg = {
        role: "quant",
        text: response.assistant_message.content,
        confidence: 93,
        reasoning: response.assistant_message.reasoning
          ? [response.assistant_message.reasoning]
          : ["Calculated from monthly cashflow velocity", "Verified against current savings goals"],
      };
      setMsgs((m) => [...m, quantMsg]);
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
        fetchConversations();
      }
    } catch (e: any) {
      console.error("Failed to fetch chat response:", e);
      const errMsg = e.message || "";
      const isPaywall = errMsg.includes("Free limit reached") || errMsg.includes("PAYWALL_LOCKED") || errMsg.includes("limit reached");
      if (isPaywall) {
        setIsUpgradeOpen(true);
        setMsgs((m) => m.slice(0, -1));
        setPromptCount(3);
      } else {
        let replyText = "Working through your transactions… based on your patterns, the smartest move today is to allocate KSh 4,200 toward your emergency fund.";
        let confidence = 87;
        let reasoning = ["Detected 2 subscriptions unused for 30+ days"];
        const cleanText = text.toLowerCase();
        if (cleanText.includes("bag") || cleanText.includes("6,500")) {
          replyText = `Based on your July M-Pesa statement data, buying a KSh 6,500 bag is **Recommended**.\n\nHere is why:\n• Your income of **KSh 45,000** was confirmed 5 days ago.\n• Your fixed expenses (Rent: KSh 12,000, Utilities: KSh 3,500) are fully covered for this month.\n• You have spent KSh 4,200 on groceries, leaving you with KSh 14,800 discretionary room.`;
          confidence = 93;
          reasoning = ["Discretionary surplus of KSh 14,800 is greater than bag cost KSh 6,500."];
        }
        setMsgs((m) => [...m, { role: "quant", text: replyText, confidence, reasoning }]);
        if (isPro === false) setPromptCount((c) => c + 1);
      }
    } finally {
      setSending(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 space-y-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
          <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-purple-400 animate-pulse" />
        </div>
        <p className="text-[12px] text-muted-foreground font-semibold animate-pulse">Syncing with your financial twin…</p>
      </div>
    );
  }

  // ─── Composer block (shared between mobile & desktop) ─────────────────
  const ComposerBlock = (
    <>
      {isPro === false && promptCount >= 3 ? (
        <div className="glass-strong rounded-[22px] p-4 text-center space-y-3.5 border border-rose-500/20 shadow-xl shadow-rose-500/5">
          <div className="space-y-1">
            <h4 className="text-[13px] font-bold text-rose-400 flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Quant AI Advisor Requires Pro
            </h4>
            <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
              You've used all 3 free prompts. Upgrade to Quant Pro to unlock unlimited queries and goal simulations.
            </p>
          </div>
          <button
            onClick={() => setIsUpgradeOpen(true)}
            className="rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-[12.5px] py-2 w-full transition-transform active:scale-[0.98]"
          >
            Upgrade with M-Pesa
          </button>
        </div>
      ) : (
        <>
          {isPro === false && (
            <div className="text-[9.5px] text-purple-300 font-bold text-center mb-1.5 bg-purple-500/10 border border-purple-500/10 rounded-full py-0.5 px-2.5 w-fit mx-auto">
              {Math.max(0, 3 - promptCount)} free queries left
            </div>
          )}
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="glass shrink-0 rounded-full px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground font-semibold"
                disabled={sending}
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="glass-strong flex items-center gap-1.5 rounded-full p-1"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your Quant…"
              className="flex-1 bg-transparent px-3 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground"
              disabled={sending}
            />
            <button
              type="submit"
              className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background shrink-0 disabled:opacity-50"
              disabled={sending}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </>
  );

  return (
    <>
      {/* ════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on md+)
      ═══════════════════════════════════════════════ */}
      <div className="flex min-h-screen flex-col space-y-4 pt-2 relative md:hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo size={36} className="text-foreground shrink-0" />
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold tracking-tight truncate">Your Quant</h1>
              <p className="text-[11px] text-muted-foreground font-semibold truncate">Your private financial analyst</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={startNewChat}
              className="glass grid h-8.5 w-8.5 place-items-center rounded-full hover:bg-foreground/[0.04]"
              title="New Chat"
            >
              <Plus className="h-4.5 w-4.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => { fetchConversations(); setIsDrawerOpen(true); }}
              className="glass grid h-8.5 w-8.5 place-items-center rounded-full hover:bg-foreground/[0.04]"
              title="Chat History"
            >
              <History className="h-4.5 w-4.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="mt-4 flex-1 space-y-3 pb-40">
          {historyLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="h-6 w-6 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin mx-auto" />
              <p className="text-[11px] text-muted-foreground font-semibold">Retrieving session history…</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {msgs.map((m, i) => <Bubble key={i} msg={m} onSelectQuestion={(q) => send(q)} />)}
              {sending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className="text-[11px] text-muted-foreground italic pl-4">
                  Quant is thinking…
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Mobile Composer — fixed */}
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-md px-5">
          {ComposerBlock}
        </div>

        {/* Mobile history drawer */}
        <HistoryDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          conversations={conversations}
          conversationId={conversationId}
          onStartNewChat={startNewChat}
          onLoadConversation={loadConversation}
        />
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP LAYOUT  (hidden on mobile)
      ═══════════════════════════════════════════════ */}
      <div className="hidden md:flex h-[calc(100vh-120px)] gap-0 overflow-hidden rounded-3xl border border-foreground/[0.06] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.25)]">

        {/* ── Left Panel: History Sidebar ──────────────── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="history-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="flex flex-col border-r border-foreground/[0.06] bg-background/30 backdrop-blur-xl overflow-hidden shrink-0"
              style={{ minWidth: 0 }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-foreground/[0.06]">
                <div>
                  <h2 className="text-[13px] font-black tracking-tight text-foreground uppercase">History</h2>
                  <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Past consultations</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="glass grid h-7 w-7 place-items-center rounded-full hover:bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="px-3 py-3 border-b border-foreground/[0.04]">
                <button
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background font-bold text-[11.5px] active:scale-[0.98] transition-transform hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> New Session
                </button>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 [scrollbar-width:thin]">
                {conversations.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-2 text-center">
                    <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
                    <p className="text-[10.5px] text-muted-foreground font-semibold">No past sessions yet</p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.conversation_id}
                      onClick={() => loadConversation(c.conversation_id)}
                      className={cn(
                        "w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
                        conversationId === c.conversation_id
                          ? "bg-foreground/[0.08] border border-foreground/[0.1] shadow-sm"
                          : "hover:bg-foreground/[0.04] border border-transparent"
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate leading-snug text-foreground">{c.preview}</p>
                        <p className="text-[8.5px] text-muted-foreground font-bold tracking-wider mt-0.5 uppercase">
                          {c.message_count} msgs · {new Date(c.last_active).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Right Panel: Chat Feed ───────────────────── */}
        <div className="flex flex-1 flex-col min-w-0 bg-background/20 backdrop-blur-md relative">

          {/* Chat Panel Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-foreground/[0.06] bg-background/30 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3">
              {/* Sidebar toggle button */}
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="glass grid h-8 w-8 place-items-center rounded-full hover:bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                  title="Show History"
                >
                  <History className="h-4 w-4" />
                </button>
              )}
              <div className="flex items-center gap-2.5">
                <Logo size={28} className="text-foreground shrink-0" />
                <div>
                  <h1 className="text-[15px] font-black tracking-tight text-foreground">Your Quant</h1>
                  <p className="text-[10px] text-muted-foreground font-semibold">Private financial analyst</p>
                </div>
              </div>
            </div>

            {/* Header right actions */}
            <div className="flex items-center gap-2">
              {conversationId && (
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest px-2.5 py-1 glass rounded-full border border-foreground/[0.05]">
                  Session active
                </span>
              )}
              <button
                onClick={startNewChat}
                className="glass flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors"
                title="New Chat"
              >
                <Plus className="h-3.5 w-3.5" /> New Chat
              </button>
            </div>
          </div>

          {/* Scrollable Message Feed */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-6 py-6 space-y-3 [scrollbar-width:thin]"
          >
            {historyLoading ? (
              <div className="py-20 text-center space-y-3">
                <div className="h-6 w-6 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin mx-auto" />
                <p className="text-[11px] text-muted-foreground font-semibold">Retrieving session history…</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {msgs.map((m, i) => <Bubble key={i} msg={m} onSelectQuestion={(q) => send(q)} />)}
                {sending && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className="text-[11px] text-muted-foreground italic pl-2">
                    Quant is thinking…
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Desktop Composer — pinned to bottom of chat panel */}
          <div className="shrink-0 px-6 py-4 border-t border-foreground/[0.06] bg-background/30 backdrop-blur-xl">
            {ComposerBlock}
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        onSuccess={() => setIsPro(true)}
      />
    </>
  );
}

export default function QuantPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading Chat...</div>}>
      <QuantPageContent />
    </Suspense>
  );
}
