"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Terminal, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-24 h-24 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center shadow-2xl backdrop-blur-xl"
          >
            <AlertCircle className="w-12 h-12 text-red-500/80" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight text-zinc-100">404</h1>
            <h2 className="text-xl font-medium text-zinc-400">Signal Lost</h2>
          </div>

          <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm w-full text-left">
            <div className="flex items-center space-x-2 text-zinc-500 mb-2">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-mono uppercase tracking-wider">System Diagnostic</span>
            </div>
            <p className="text-sm font-mono text-zinc-400">
              <span className="text-red-400">ERR:</span> The requested node could not be located in the current workspace. The route may have been relocated or terminated.
            </p>
          </div>

          <Link href="/app" className="w-full mt-8 group">
            <div className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white text-black font-semibold transition-all hover:bg-zinc-200 hover:scale-[1.02] active:scale-95">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Return to Dashboard</span>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Grid pattern background for a technical feel */}
      <div 
        className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
