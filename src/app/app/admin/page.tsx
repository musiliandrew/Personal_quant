"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Coins, 
  ArrowLeft, 
  Lock, 
  RefreshCw, 
  Calculator, 
  X, 
  Globe, 
  Calendar, 
  Smartphone,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserStat {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  file_count: number;
}

interface StatementStat {
  id: number;
  filename: string;
  user_email: string;
  uploaded_at: string;
  tx_count: number;
}

interface AdminData {
  total_users: number;
  total_files: number;
  total_transactions: number;
  total_revenue: number;
  recent_users: UserStat[];
  recent_statements: StatementStat[];
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminData | null>(null);
  const [pricePerFile, setPricePerFile] = useState(150); // Default simulated price
  const [refreshing, setRefreshing] = useState(false);

  // Inspector states
  const [inspectUser, setInspectUser] = useState<any | null>(null);
  const [inspectStatements, setInspectStatements] = useState<any[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Check if current user is admin on mount
  useEffect(() => {
    const token = localStorage.getItem("quant_token");
    if (!token) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
      setIsAdmin(true);
    } catch (err: any) {
      console.warn("Failed to fetch admin stats:", err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail !== "quant@quantiq.co.ke") {
      setLoginError("Access denied. Authorized administrator credentials required.");
      return;
    }

    setLoginError(null);
    setLoginLoading(true);

    try {
      await api.login(loginEmail, loginPassword);
      await fetchStats();
    } catch (err: any) {
      setLoginError(err.message || "Invalid password. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleInspectUser = async (userId: string) => {
    setInspectLoading(true);
    try {
      const data = await api.getAdminUserDetails(userId);
      setInspectUser(data.user);
      setInspectStatements(data.statements);
    } catch (err) {
      console.error("Failed to load user details:", err);
    } finally {
      setInspectLoading(false);
    }
  };

  // Calculate platform revenue dynamically based on pricing slider
  const dynamicRevenue = stats ? stats.total_files * pricePerFile : 0;

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-foreground">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full text-foreground p-4 md:p-8 overflow-y-auto">
      {/* Background ambient orbs */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -top-24 -left-20 h-96 w-96 rounded-full opacity-[0.25] blur-3xl bg-emerald-400" />
        <div className="absolute bottom-10 -right-24 h-96 w-96 rounded-full opacity-[0.25] blur-3xl bg-indigo-400" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        
        {/* Navigation back / Log out */}
        <div className="flex items-center justify-between">
          {isAdmin ? (
            <button
              onClick={async () => {
                await api.logout();
                setIsAdmin(false);
                router.push("/");
              }}
              className="flex items-center gap-2 text-[13px] font-bold text-muted-foreground hover:text-rose-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Log Out Administrator
            </button>
          ) : (
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Site
            </button>
          )}
          
          {isAdmin && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-[12px] font-bold bg-foreground/[0.04] hover:bg-foreground/[0.08] rounded-full px-3 py-1.5 transition-transform active:scale-95"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isAdmin ? (
            /* Admin Authentication Slide */
            <motion.div
              key="auth-gate"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-md mx-auto glass border border-foreground/10 rounded-[32px] p-8 mt-12 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-foreground/[0.03] border border-foreground/10 grid place-items-center text-emerald-400">
                  <Lock className="h-5 w-5" />
                </div>
                <h1 className="text-[22px] font-semibold leading-tight tracking-tight">Admin Terminal</h1>
                <p className="text-[13px] text-muted-foreground font-semibold">
                  Authorised personnel only.
                </p>
              </div>

              {loginError && (
                <div className="rounded-xl bg-destructive/10 p-3 text-[12px] text-destructive font-bold text-center">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="glass rounded-xl flex flex-col px-3 py-1.5 border border-foreground/5">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="quant@quantiq.co.ke"
                    className="bg-transparent text-[13px] font-semibold outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>

                <div className="glass rounded-xl flex flex-col px-3 py-1.5 border border-foreground/5">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Secret Password</label>
                  <div className="flex items-center justify-between">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-transparent text-[13px] font-semibold outline-none py-0.5 text-foreground placeholder:text-muted-foreground/30 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="rounded-full bg-foreground px-6 py-3.5 text-[14.5px] font-bold text-background transition-transform active:scale-[0.98] w-full flex items-center justify-center gap-2"
                >
                  {loginLoading ? "Verifying Keys..." : "Access Control"}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Admin Dashboard Panel */
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-[28px] font-semibold tracking-tight">Quant Analytics</h1>
                <p className="text-[13px] text-muted-foreground font-semibold">
                  Live operational statistics and platform monetization analytics. Click a user to inspect their statements.
                </p>
              </div>

              {/* KPI metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass border border-foreground/5 rounded-[24px] p-5 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 grid place-items-center text-indigo-400">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground font-bold">Total Users</p>
                    <h3 className="text-[24px] font-bold tracking-tight">{stats?.total_users ?? 0}</h3>
                  </div>
                </div>

                <div className="glass border border-foreground/5 rounded-[24px] p-5 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 grid place-items-center text-emerald-400">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground font-bold">Statements Read</p>
                    <h3 className="text-[24px] font-bold tracking-tight">{stats?.total_files ?? 0}</h3>
                  </div>
                </div>

                <div className="glass border border-foreground/5 rounded-[24px] p-5 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 grid place-items-center text-amber-400">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground font-bold">Parsed Tx</p>
                    <h3 className="text-[24px] font-bold tracking-tight">{stats?.total_transactions ?? 0}</h3>
                  </div>
                </div>

                <div className="glass border border-foreground/5 rounded-[24px] p-5 space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-rose-500/10 grid place-items-center text-rose-400">
                    <Coins className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground font-bold">Platform Revenue</p>
                    <h3 className="text-[24px] font-bold tracking-tight text-rose-400">
                      KSh {dynamicRevenue.toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Pricing & Fee Calculator */}
              <div className="glass border border-foreground/10 rounded-[28px] p-6 space-y-4">
                <div className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Calculator className="h-4 w-4 text-rose-400" />
                  Pricing & Revenue Calculator
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <p className="text-[13px] text-muted-foreground font-semibold leading-relaxed">
                      Slide to adjust the pay-per-upload fee. Use this tool to calculate revenue yields and choose the pricing plan for billing integrations.
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-semibold text-muted-foreground">KSh 50</span>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="25"
                        value={pricePerFile}
                        onChange={(e) => setPricePerFile(Number(e.target.value))}
                        className="flex-1 accent-rose-400 h-1 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[12px] font-semibold text-muted-foreground">KSh 500</span>
                    </div>
                  </div>

                  <div className="glass bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-4 text-center shrink-0 min-w-[200px]">
                    <p className="text-[11.5px] text-muted-foreground font-bold uppercase tracking-wider">Plan Fee</p>
                    <h4 className="text-[20px] font-bold text-rose-400 mt-1">KSh {pricePerFile} / upload</h4>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">Yields KSh {dynamicRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Lists / Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Recent Registrations */}
                <div className="glass border border-foreground/5 rounded-[28px] p-5 space-y-4">
                  <h3 className="text-[16px] font-semibold tracking-tight">Recent User Registrations</h3>
                  <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                    {stats?.recent_users && stats.recent_users.length > 0 ? (
                      stats.recent_users.map((u) => (
                        <button 
                          key={u.id} 
                          onClick={() => handleInspectUser(u.id)}
                          className="w-full text-left glass bg-foreground/[0.02] hover:bg-foreground/[0.06] active:scale-[0.99] border border-foreground/5 rounded-2xl p-3 flex justify-between items-center transition-all cursor-pointer"
                        >
                          <div className="space-y-0.5">
                            <p className="text-[13px] font-bold">{u.name}</p>
                            <p className="text-[11.5px] text-muted-foreground/75 font-semibold">{u.email}</p>
                            <p className="text-[10px] text-muted-foreground/50">Phone: {u.phone} • Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className="text-[11px] font-bold bg-indigo-500/10 text-indigo-400 rounded-full px-2.5 py-1">
                            {u.file_count} files
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-[12px] text-muted-foreground text-center py-6">No users registered yet.</p>
                    )}
                  </div>
                </div>

                {/* Recent Uploaded Statements */}
                <div className="glass border border-foreground/5 rounded-[28px] p-5 space-y-4">
                  <h3 className="text-[16px] font-semibold tracking-tight">Recent Uploaded Statements</h3>
                  <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                    {stats?.recent_statements && stats.recent_statements.length > 0 ? (
                      stats.recent_statements.map((s) => (
                        <div key={s.id} className="glass bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-3 flex justify-between items-center transition-colors">
                          <div className="space-y-0.5 max-w-[70%]">
                            <p className="text-[13px] font-bold truncate">{s.filename}</p>
                            <p className="text-[11.5px] text-muted-foreground/75 font-semibold truncate">{s.user_email}</p>
                            <p className="text-[10px] text-muted-foreground/50">Uploaded: {new Date(s.uploaded_at).toLocaleDateString()}</p>
                          </div>
                          <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full px-2.5 py-1 shrink-0">
                            {s.tx_count} txs
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[12px] text-muted-foreground text-center py-6">No statements read yet.</p>
                    )}
                  </div>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inspect User Modal Backdrop Overlay */}
      <AnimatePresence>
        {(inspectUser || inspectLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            {inspectLoading ? (
              <div className="glass border border-foreground/10 rounded-[32px] p-8 max-w-sm w-full text-center space-y-4">
                <RefreshCw className="h-6 w-6 animate-spin text-rose-400 mx-auto" />
                <p className="text-[13px] text-muted-foreground font-semibold">Retrieving statement database logs...</p>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="glass border border-foreground/10 rounded-[32px] max-w-lg w-full p-6 md:p-8 space-y-6 relative overflow-hidden"
              >
                {/* Close Button */}
                <button
                  onClick={() => {
                    setInspectUser(null);
                    setInspectStatements([]);
                  }}
                  className="absolute top-5 right-5 h-8 w-8 rounded-full bg-foreground/[0.04] hover:bg-foreground/[0.08] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Profile Header */}
                <div className="space-y-1 pr-8">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    User Profiler
                  </span>
                  <h2 className="text-[22px] font-bold tracking-tight mt-1.5">{inspectUser.name}</h2>
                  <p className="text-[13px] text-muted-foreground font-semibold">{inspectUser.email}</p>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-2 gap-4 border-y border-foreground/5 py-4">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Phone</p>
                      <p className="text-[12.5px] font-semibold">{inspectUser.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Locale & Currency</p>
                      <p className="text-[12.5px] font-semibold">
                        {inspectUser.country} • {inspectUser.currency}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Joined Date</p>
                      <p className="text-[12.5px] font-semibold">
                        {new Date(inspectUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Statements</p>
                      <p className="text-[12.5px] font-semibold">{inspectStatements.length} Uploads</p>
                    </div>
                  </div>
                </div>

                {/* Statements List */}
                <div className="space-y-3">
                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    Uploaded Statements & Metadata
                  </h4>

                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {inspectStatements.length > 0 ? (
                      inspectStatements.map((stmt) => (
                        <div
                          key={stmt.id}
                          className="glass bg-foreground/[0.01] border border-foreground/5 rounded-xl p-3 flex justify-between items-center"
                        >
                          <div className="space-y-0.5 max-w-[70%]">
                            <p className="text-[12px] font-bold truncate text-foreground/90">{stmt.filename}</p>
                            <p className="text-[10px] text-muted-foreground/60">
                              Uploaded: {new Date(stmt.uploaded_at).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-[10.5px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full px-2.5 py-0.5 shrink-0">
                            {stmt.tx_count} Transactions
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[12px] text-muted-foreground/60 text-center py-6 bg-foreground/[0.01] rounded-2xl border border-dashed border-foreground/5">
                        This user hasn't uploaded any statements yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground/50 text-center font-medium italic">
                  Quant financial intelligence core: Data remains private and secure.
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
