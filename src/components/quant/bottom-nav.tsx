"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Target, MessageCircle, User } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";

type NavItem = { to: "/app" | "/app/goals" | "/app/quant" | "/app/profile" | "/app/analysis"; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/app",           label: "Home",     icon: Home,          exact: true },
  { to: "/app/quant",     label: "Quant",    icon: MessageCircle },
  { to: "/app/analysis",  label: "Analysis", icon: BarChart2 },
  { to: "/app/goals",     label: "Goals",    icon: Target },
  { to: "/app/profile",   label: "Profile",  icon: User },
];


export function BottomNav() {
  const pathname = usePathname() || "/app";
  const [hideNav, setHideNav] = useState(false);

  useEffect(() => {
    const handleDrawerState = (e: Event) => {
      const customEvent = e as CustomEvent;
      setHideNav(!!customEvent.detail?.open);
    };
    window.addEventListener("quant-drawer-state", handleDrawerState);
    return () => window.removeEventListener("quant-drawer-state", handleDrawerState);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),16px)] md:hidden">
      <motion.nav
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: hideNav ? 120 : 0, opacity: hideNav ? 0 : 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full px-2 py-2"
      >
        {items.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[10px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-foreground/5"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.7} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
