"use client";

import React, { useEffect, useState } from "react";
import { BottomNav } from "@/components/quant/bottom-nav";
import { NotificationBell } from "@/components/NotificationBell";
import { usePathname, useRouter } from "next/navigation";
import { Home, BarChart2, Target, MessageCircle, User } from "lucide-react";
import { Logo } from "@/components/quant/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { api } from "@/lib/api";

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

  useEffect(() => {
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
      // Fetch status
      api.getMe().then((user) => {
        setIsPro(user.is_pro);
      }).catch(() => {});
    }
    // Recompute greeting every minute
    setGreeting(getGreeting());
    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, [pathname, isAdmin, router]);

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
          // Quant chat page: full bleed on desktop, normal mobile padding
          pathname === "/app/quant"
            ? "px-4 py-4 pb-32 md:px-4 md:py-4 md:pb-4"
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
    </div>
  );
}
