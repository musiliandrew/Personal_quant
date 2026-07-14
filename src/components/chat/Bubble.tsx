"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ChevronDown } from "lucide-react";

export type Msg = {
  role: "user" | "quant";
  text: string;
  confidence?: number;
  reasoning?: string[];
};

function parseMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  
  return lines.map((line, idx) => {
    const isH3 = line.startsWith("### ");
    const isH2 = !isH3 && line.startsWith("## ");
    const isH1 = !isH3 && !isH2 && line.startsWith("# ");
    const isListItem = line.startsWith("- ") || line.startsWith("• ");

    let content = line;
    if (isH3) content = line.substring(4);
    else if (isH2) content = line.substring(3);
    else if (isH1) content = line.substring(2);
    else if (isListItem) content = line.substring(2);

    const parts = content.split(/\*\*([\s\S]*?)\*\*/g);
    const elements = parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-foreground">{part}</strong>;
      }
      return part;
    });

    if (isH3) {
      return (
        <h3 key={idx} className="text-[13.5px] sm:text-[14px] font-bold text-foreground mt-2.5 mb-1">
          {elements}
        </h3>
      );
    }
    if (isH2) {
      return (
        <h2 key={idx} className="text-[14.5px] sm:text-[15px] font-bold text-foreground mt-3 mb-1.5">
          {elements}
        </h2>
      );
    }
    if (isH1) {
      return (
        <h1 key={idx} className="text-[16px] sm:text-[17px] font-extrabold text-foreground mt-3.5 mb-2">
          {elements}
        </h1>
      );
    }
    if (isListItem) {
      return (
        <li key={idx} className="ml-4 list-disc pl-0.5 my-0.5 text-[13px] sm:text-[13.5px] leading-relaxed text-foreground/80">
          {elements}
        </li>
      );
    }

    return (
      <p key={idx} className="my-0.5 text-[13px] sm:text-[13.5px] leading-relaxed text-foreground/85 min-h-[1.1em]">
        {elements}
      </p>
    );
  });
}

export function Bubble({ msg, onSelectQuestion }: { msg: Msg; onSelectQuestion?: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  
  if (msg.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] sm:max-w-[75%] rounded-[20px] rounded-br-[4px] bg-foreground px-3.5 py-2 text-[13px] sm:text-[13.5px] text-background font-medium">
          {msg.text}
        </div>
      </motion.div>
    );
  }

  // Parse out suggested questions
  let cleanText = msg.text;
  let suggestedQuestions: string[] = [];
  const match = msg.text.match(/<<SUGGESTED_QUESTIONS:\s*([\s\S]*?)>>/i);
  if (match) {
    try {
      suggestedQuestions = JSON.parse(match[1]);
      cleanText = msg.text.replace(match[0], "").trim();
    } catch (e) {
      console.warn("Failed to parse suggested questions:", e);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[90%] sm:max-w-[80%] space-y-2"
    >
      <div className="glass rounded-[20px] rounded-bl-[4px] p-3.5 sm:p-4 border border-foreground/[0.04]">
        <div className="leading-relaxed space-y-1">
          {parseMarkdown(cleanText)}
        </div>
        {msg.confidence != null && (
          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-foreground/[0.03] px-2.5 py-1.5 border border-foreground/[0.02]">
            <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider text-muted-foreground font-bold">
              <Sparkles className="h-3 w-3 text-emerald-400" /> Confidence
            </div>
            <span className="text-[11.5px] font-bold tabular-nums text-foreground/80">{msg.confidence}%</span>
          </div>
        )}

      </div>

      {suggestedQuestions.length > 0 && onSelectQuestion && (
        <div className="flex flex-wrap gap-2 pl-1.5 pt-0.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSelectQuestion(q)}
              className="glass rounded-xl px-3 py-1.5 text-[11px] sm:text-[11.5px] text-purple-400 hover:text-purple-300 font-semibold text-left transition-transform active:scale-[0.98] border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
