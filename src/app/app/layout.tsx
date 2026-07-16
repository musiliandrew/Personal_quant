"use client";

import React, { useEffect, useState } from "react";
import { BottomNav } from "@/components/quant/bottom-nav";
import { NotificationBell } from "@/components/NotificationBell";
import { usePathname, useRouter } from "next/navigation";
import { Home, BarChart2, Target, MessageCircle, User, Upload, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Logo } from "@/components/quant/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { api } from "@/lib/api";
import { UploadModal } from "@/components/quant/upload-modal";

type NavItem = { to: "/app" | "/app/goals" | "/app/quant" | "/app/profile" | "/app/analysis"; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/app",           label: "Home",     icon: Home,          exact: true },
  { to: "/app/quant",     label: "Quant",    icon: MessageCircle },
  { to: "/app/analysis",  label: "Analysis", icon: BarChart2 },
  { to: "/app/goals",     label: "Goals",    icon: Target },
  { to: "/app/profile",   label: "Profile",  icon: User },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Late night grind";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname.startsWith("/app/admin");
  const [userName, setUserName] = React.useState<string>("User");
  const [greeting, setGreeting] = useState(getGreeting());
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [statements, setStatements] = useState<Array<{
    id: string; provider: string; filename: string;
    period_start: string | null; period_end: string | null;
    upload_date: string; status: string; transaction_count: number;
  }>>([]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchStatements = () => {
    api.getStatements().then((res) => {
      setStatements(res.statements || []);
      // Notify other components (like dashboard /app page) that a new statement was uploaded
      window.dispatchEvent(new CustomEvent("quant-statements-updated"));
    }).catch(() => {});
  };

  useEffect(() => {
    // ── Auth guard (client-side, second layer after middleware) ──
    const token = localStorage.getItem("quant_token");
    if (!token && !isAdmin) {
      const redirectPath = pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/${redirectPath}`);
      return;
    }

    // Bootstrap cookie for existing sessions that pre-date middleware
    if (token && !document.cookie.includes("quant_auth")) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `quant_auth=1; path=/; expires=${expires}; SameSite=Strict`;
    }

    if (!isAdmin) {
      const cached = localStorage.getItem("quant_dashboard");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.user_email === "quant@quantiq.co.ke") {
            router.push("/app/admin");
          }
          if (parsed.user_name) {
            setUserName(parsed.user_name);
          }
        } catch (_) {}
      }
      // Fetch status + statements
      api.getMe().then((user) => {
        setIsPro(user.is_pro_active ?? user.is_pro);
      }).catch(() => {});
      fetchStatements();
    }
    // Recompute greeting every minute
    setGreeting(getGreeting());
    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, [pathname, isAdmin, router]);

  // Handle upload query parameter check and custom events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("upload") === "true") {
        setIsUploadOpen(true);
        // Clean URL query params without reloading
        const newUrl = window.location.pathname;
        window.history.replaceState({ ...window.history.state }, "", newUrl);
      }
    }

    const handleOpenUpload = () => setIsUploadOpen(true);
    window.addEventListener("open-upload-modal", handleOpenUpload);
    return () => window.removeEventListener("open-upload-modal", handleOpenUpload);
  }, [pathname]);

  if (isAdmin) {
    return (
      <div className="relative min-h-screen" style={{ background: "var(--gradient-hero)" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row" style={{ background: "var(--gradient-hero)" }}>
      {/* Sleek Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col justify-between p-6 border-r border-foreground/[0.06] sticky top-0 h-screen bg-background/10 backdrop-blur-2xl z-30">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <Logo size={32} className="text-foreground" />
            <span className="text-[20px] font-black tracking-tight text-foreground">Quant</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {items.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all duration-200",
                    active 
                      ? "bg-foreground/5 text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.02]"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.7} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Statements Section ────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <p className="text-[9.5px] font-black uppercase tracking-widest text-muted-foreground">Statements</p>
              {statements.length > 0 && (
                <span className="text-[8.5px] font-bold text-muted-foreground">{statements.length} uploaded</span>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-dashed border-foreground/[0.12] text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all text-[12.5px] font-bold group w-full text-left"
            >
              <Upload className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Upload Statement
            </button>

            {/* Statement List */}
            {statements.length > 0 && (
              <div className="space-y-1.5 max-h-52 overflow-y-auto [scrollbar-width:thin] pr-0.5">
                {statements.map((s) => {
                  const fmt = (d: string | null) =>
                    d ? new Date(d).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "2-digit" }) : "?";
                  const statusIcon = s.status === "COMPLETED"
                    ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    : s.status === "FAILED"
                    ? <AlertCircle className="h-3 w-3 text-rose-400 shrink-0" />
                    : <Clock className="h-3 w-3 text-amber-400 shrink-0 animate-pulse" />;

                  return (
                    <div
                      key={s.id}
                      className="flex items-start gap-2 px-3 py-2 rounded-xl bg-foreground/[0.02] border border-foreground/[0.04] hover:bg-foreground/[0.04] transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {statusIcon}
                          <p className="text-[10.5px] font-bold text-foreground truncate">
                            {fmt(s.period_start)} → {fmt(s.period_end)}
                          </p>
                        </div>
                        <p className="text-[8.5px] text-muted-foreground font-semibold mt-0.5">
                          {s.transaction_count > 0 ? `${s.transaction_count} txns · ` : ""}
                          {new Date(s.upload_date).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {statements.length === 0 && (
              <p className="text-[10px] text-muted-foreground font-semibold px-2 py-1">
                No statements yet — upload your first M-Pesa PDF.
              </p>
            )}
          </div>
        </div>

        {/* Profile Card & Info in Sidebar Footer */}
        <div className="border-t border-foreground/[0.06] pt-5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-full bg-foreground/[0.04] flex items-center justify-center font-bold text-[14px] uppercase border border-foreground/[0.08]">
              {userName.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-[14px] font-bold truncate text-foreground">{userName}</p>
                {isPro !== null && (
                  <span className={cn(
                    "text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                    isPro 
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                      : "bg-foreground/10 text-muted-foreground"
                  )}>
                    {isPro ? "Pro" : "Free"}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-muted-foreground truncate">{greeting}</p>
            </div>
            <NotificationBell />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {/* Mobile Sticky Header (Hidden on Desktop) */}
        <div 
          className="sticky top-0 z-30 backdrop-blur-md pt-7 pb-3.5 px-4 border-b border-foreground/[0.04] mb-3 md:hidden"
          style={{ backgroundColor: "color-mix(in oklab, var(--background) 35%, transparent)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-[13px] text-muted-foreground font-semibold">{greeting}</p>
              <div className="flex items-center gap-2">
                <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight">{userName}</h1>
                {isPro !== null && (
                  <span className={cn(
                    "text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-1",
                    isPro 
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                      : "bg-foreground/10 text-muted-foreground"
                  )}>
                    {isPro ? "Pro" : "Free"}
                  </span>
                )}
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* Dynamic Responsive wrapper for page content */}
        <div className={cn(
          "w-full",
          pathname === "/app/quant"
            ? "mx-auto max-w-md md:max-w-5xl px-4 py-4 pb-32 md:px-6 md:py-6 md:pb-6"
            : "mx-auto max-w-md md:max-w-4xl lg:max-w-5xl px-4 py-4 md:px-8 md:py-10 pb-32 md:pb-16"
        )}>
          {/* Desktop header greeting — hidden on quant chat page */}
          {pathname !== "/app/quant" && (
            <div className="hidden md:flex flex-col gap-0.5 mb-8">
              <p className="text-[12px] lg:text-[13px] text-muted-foreground font-semibold uppercase tracking-wider">{greeting}</p>
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] lg:text-[34px] font-black tracking-tight text-foreground">{userName}</h1>
                {isPro !== null && (
                  <span className={cn(
                    "text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shrink-0 mt-1",
                    isPro
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      : "bg-foreground/10 text-muted-foreground"
                  )}>
                    {isPro ? "Pro" : "Free"}
                  </span>
                )}
              </div>
            </div>
          )}

          {children}
        </div>
      </main>
      
      <BottomNav />
      
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={fetchStatements} 
      />
    </div>
  );
}
