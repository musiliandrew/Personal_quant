"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/profile");
  }, [router]);

  return (
    <div className="py-20 text-center space-y-3">
      <div className="h-6 w-6 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin mx-auto" />
      <p className="text-[11px] text-muted-foreground font-semibold">Opening Profile...</p>
    </div>
  );
}
