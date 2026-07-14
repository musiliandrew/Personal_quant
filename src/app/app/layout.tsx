"use client";

import React, { useEffect, useState } from "react";
import { BottomNav } from "@/components/quant/bottom-nav";
import { NotificationBell } from "@/components/NotificationBell";
import { usePathname, useRouter } from "next/navigation";

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
    <div className="relative min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-md pb-32 px-4">
        {/* Global Sticky Greeting Header */}
        <div 
          className="sticky top-0 z-30 backdrop-blur-md pt-7 pb-3.5 -mx-4 px-4 border-b border-foreground/[0.04] mb-3"
          style={{ backgroundColor: "color-mix(in oklab, var(--background) 35%, transparent)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-[13px] text-muted-foreground font-semibold">{greeting}</p>
              <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight">{userName}</h1>
            </div>
            <NotificationBell />
          </div>
        </div>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
