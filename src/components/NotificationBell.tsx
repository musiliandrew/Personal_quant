"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "@/lib/api";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function typeColor(type: string) {
  if (type.includes("DANGER")) return "bg-rose-500/10 border-rose-500/20";
  if (type.includes("BRIEF")) return "bg-sky-500/10 border-sky-500/20";
  if (type.includes("GOAL")) return "bg-emerald-500/10 border-emerald-500/20";
  if (type.includes("BILL")) return "bg-amber-500/10 border-amber-500/20";
  if (type.includes("STREAK")) return "bg-purple-500/10 border-purple-500/20";
  return "bg-foreground/[0.03] border-foreground/5";
}

function typeDot(type: string) {
  if (type.includes("DANGER")) return "bg-rose-400";
  if (type.includes("BRIEF")) return "bg-sky-400";
  if (type.includes("GOAL")) return "bg-emerald-400";
  if (type.includes("BILL")) return "bg-amber-400";
  if (type.includes("STREAK")) return "bg-purple-400";
  return "bg-muted-foreground";
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifs(res.notifications || []);
      setUnread(res.unread_count || 0);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetch();
    // Poll for new notifications every 5 minutes
    const interval = setInterval(fetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      // Mark read optimistically
      setUnread(0);
      setNotifs((n) => n.map((x) => ({ ...x, is_read: true })));
      try { await api.markNotificationsRead(); } catch (_) {}
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic delete
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.deleteNotification(id);
    } catch (_) {}
  };

  const handleClearAll = async () => {
    // Optimistic clear
    setNotifs([]);
    setUnread(0);
    try {
      await api.clearNotifications();
    } catch (_) {}
  };

  const handleSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert("Push notifications are not supported by your browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Permission denied for push notifications.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
         console.error("VAPID public key not set in environment.");
         return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      const subData = subscription.toJSON();
      await api.subscribePush(subData as any);
      alert("Successfully subscribed to push notifications!");
    } catch (e) {
      console.error("Error subscribing to push notifications:", e);
      alert("Failed to subscribe to push notifications.");
    }
  };

  const hasPushPermission = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="glass grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full relative transition-all active:scale-95"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={1.8} />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-[9px] text-white font-bold"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 z-50 w-[320px] sm:w-[360px] glass-strong rounded-[22px] p-3 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Notifications</p>
              <div className="flex items-center gap-2">
                {!hasPushPermission && (
                  <button
                    onClick={handleSubscribePush}
                    className="text-[10px] text-sky-500 hover:text-sky-600 font-bold transition-colors mr-2"
                  >
                    Enable Push
                  </button>
                )}
                {notifs.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition-colors mr-1"
                  >
                    Clear All
                  </button>
                )}
                {loading && (
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-[10px] text-muted-foreground font-bold"
                  >
                    Updating…
                  </motion.span>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto [scrollbar-width:none]">
              <AnimatePresence initial={false}>
                {notifs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <p className="text-[13px] font-semibold text-muted-foreground">All clear for now.</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Quant will alert you when something matters.</p>
                  </motion.div>
                ) : (
                  notifs.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-xl border p-3 relative group ${typeColor(n.type)} ${!n.is_read ? "opacity-100" : "opacity-60"}`}
                    >
                      <div className="flex items-start gap-2.5 pr-6">
                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${typeDot(n.type)}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-bold leading-tight">{n.title}</p>
                          <p className="text-[11.5px] text-muted-foreground leading-relaxed mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground font-bold mt-1.5">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(n.id, e)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-foreground/[0.05]"
                        aria-label="Delete notification"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
