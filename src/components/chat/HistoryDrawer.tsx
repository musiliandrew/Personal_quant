"use client";

import { motion } from "motion/react";
import { X, Plus, MessageSquare } from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: any[];
  conversationId: string | null;
  onStartNewChat: () => void;
  onLoadConversation: (id: string) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  conversations,
  conversationId,
  onStartNewChat,
  onLoadConversation,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-sm">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        className="glass-strong w-full max-w-md rounded-t-[28px] px-4 sm:px-5 pt-4 pb-8 border-t border-foreground/[0.08] max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[17px] sm:text-[19px] font-bold tracking-tight">Chat History</h2>
            <p className="text-[10.5px] sm:text-[11px] text-muted-foreground font-semibold">
              Your previous financial consultations
            </p>
          </div>
          <button
            onClick={onClose}
            className="glass grid h-7.5 w-7.5 place-items-center rounded-full hover:bg-foreground/[0.04]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[60vh]">
          <button
            onClick={onStartNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background font-bold text-[11.5px] sm:text-[12px] active:scale-[0.98] transition-transform"
          >
            <Plus className="h-4 w-4" /> Start New Session
          </button>

          <div className="h-px bg-foreground/[0.06] my-2" />

          {conversations.length === 0 ? (
            <p className="text-center py-8 text-[11px] text-muted-foreground font-semibold">
              No past sessions found.
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.conversation_id}
                onClick={() => onLoadConversation(c.conversation_id)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  conversationId === c.conversation_id
                    ? "bg-foreground/[0.08] border border-foreground/[0.1]"
                    : "soft-card hover:bg-foreground/[0.02]"
                }`}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] sm:text-[12px] font-semibold truncate leading-snug">
                    {c.preview}
                  </p>
                  <p className="text-[8.5px] sm:text-[9px] text-muted-foreground font-bold tracking-wider mt-0.5 uppercase">
                    {c.message_count} messages ·{" "}
                    {new Date(c.last_active).toLocaleDateString("en-KE", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
