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
  EyeOff,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  DollarSign,
  BarChart2,
  Mail,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const PRESET_TEMPLATES: Record<string, { subject: string, body: string }> = {
  UPLOAD_FAILED: {
    subject: "We fixed your statement upload",
    body: `Hi {{FirstName}},

Thank you for trying Quant Personal Accountant.

We noticed that your statement couldn't be processed because of an issue on our side. We've identified the problem and deployed improvements to make uploads significantly more reliable.

As a thank-you for your patience, we've activated 3 days of Quant Pro on your account at no cost.

Please upload your statement again and let us know how it goes.

If you experience any issue at all, simply reply to this email. You'll be talking directly to our team.

Thank you for helping us build something better.

— Andrew
Founder, Quant

---
Your privacy comes first.
Your financial statements are processed securely using encrypted infrastructure. We never sell your personal financial data, and you remain in control of your information. Learn more in our Privacy Policy:
https://accountant.quantiq.co.ke/privacy`
  },
  NO_UPLOAD: {
    subject: "Your free 3-day Quant Pro access is waiting",
    body: `Hi {{FirstName}},

Thanks for creating your Quant account.

We noticed you haven't analyzed your first statement yet.

To help you explore everything the platform offers, we've unlocked 3 days of Quant Pro completely free.

Upload your statement and discover:
• Spending insights
• Saving opportunities
• Merchant breakdowns
• Cash-flow analysis
• Personalized financial recommendations

If anything isn't clear, reply to this email and we'll help personally.

We'd love to hear what you think.

— Andrew
Founder, Quant

---
Your privacy comes first.
Your financial statements are processed securely using encrypted infrastructure. We never sell your personal financial data, and you remain in control of your information. Learn more in our Privacy Policy:
https://accountant.quantiq.co.ke/privacy`
  },
  SUCCESSFUL_FREE: {
    subject: "Thank you for trying Quant",
    body: `Hi {{FirstName}},

Thank you for trying Quant Personal Accountant.

You're one of the first people helping shape the future of AI-powered financial intelligence.

To say thanks, we've unlocked 3 days of Quant Pro for your account.

If you have ideas, feedback, or something you'd love Quant to do, we'd genuinely like to hear it. Every suggestion helps us improve.

Thank you for being an early supporter.

— Andrew
Founder, Quant

---
Your privacy comes first.
Your financial statements are processed securely using encrypted infrastructure. We never sell your personal financial data, and you remain in control of your information. Learn more in our Privacy Policy:
https://accountant.quantiq.co.ke/privacy`
  },
  PAID_USERS: {
    subject: "Thank you for supporting Quant ❤️",
    body: `Hi {{FirstName}},

Thank you for becoming one of Quant's very first Pro customers.

Your support isn't just a purchase—it directly helps us improve the product and build the future of personal financial intelligence.

As a token of appreciation, we've extended your account with an additional 3 free days of Quant Pro.

If you ever encounter an issue or have an idea, you'll always receive priority support. We're building Quant together with our earliest users.

Thank you for believing in us.

— Andrew
Founder, Quant

---
Your privacy comes first.
Your financial statements are processed securely using encrypted infrastructure. We never sell your personal financial data, and you remain in control of your information. Learn more in our Privacy Policy:
https://accountant.quantiq.co.ke/privacy`
  }
};


interface UserStat {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  last_active?: string;
  file_count: number;
}

interface StatementStat {
  id: number;
  filename: string;
  user_email: string;
  uploaded_at: string;
  tx_count: number;
}

interface GrowthData {
  date: string;
  new_users: number;
  statements: number;
  revenue: number;
  ai_requests: number;
}

interface ActivityItem {
  type: string;
  message: string;
  time: string;
}

interface AdminData {
  total_users: number;
  total_files: number;
  total_transactions: number;
  total_revenue: number;
  recent_users: UserStat[];
  recent_statements: StatementStat[];
  growth_data: GrowthData[];
  activity_feed: ActivityItem[];
  errors: {
    failed_parses: number;
    gemini_failures: number;
    timeouts: number;
    invalid_statements: number;
  };
  unit_economics: {
    avg_parsing_time: number;
    ai_cost_per_statement: number;
    arpu: number;
    avg_tx_per_statement: number;
  };
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
  const [refreshing, setRefreshing] = useState(false);

  // Inspector states
  const [inspectUser, setInspectUser] = useState<any | null>(null);
  const [inspectStatements, setInspectStatements] = useState<any[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Email Campaigns state
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignSegment, setCampaignSegment] = useState("ALL");
  const [campaignGrantPro, setCampaignGrantPro] = useState(false);

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
      
      // Also fetch email templates
      try {
        const tpls = await api.getAdminEmailTemplates();
        setTemplates(tpls);
      } catch(e) {
        console.warn("Failed to load templates:", e);
      }
    } catch (err: any) {
      console.warn("Failed to fetch admin stats:", err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject || !campaignBody) return;
    
    setCampaignSending(true);
    setCampaignMessage("");
    try {
      // If segment is ALL, we just use "all" array.
      const recipients = campaignSegment === "ALL" ? ["all"] : [];
      const segmentStr = campaignSegment === "ALL" ? undefined : campaignSegment;
      
      const res = await api.sendAdminEmailCampaign(
        campaignSubject, 
        campaignBody, 
        recipients, 
        undefined, 
        segmentStr, 
        campaignGrantPro
      );
      setCampaignMessage(`Successfully sent emails to ${res.sent_count} users!${res.pro_granted ? " (Granted 3 Days Pro)" : ""}`);
      setCampaignSubject("");
      setCampaignBody("");
    } catch(err: any) {
      setCampaignMessage(`Failed to send: ${err.message}`);
    } finally {
      setCampaignSending(false);
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
                      KSh {(stats?.total_revenue || 0).toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>
              {/* Unit Economics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass border border-foreground/5 rounded-[20px] p-4">
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5"><Clock className="h-3 w-3" /> Avg Parse Time</p>
                  <p className="text-[18px] font-bold mt-1">{stats?.unit_economics?.avg_parsing_time || 0}s</p>
                </div>
                <div className="glass border border-foreground/5 rounded-[20px] p-4">
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5"><Zap className="h-3 w-3 text-amber-400" /> Avg AI Cost</p>
                  <p className="text-[18px] font-bold mt-1">${stats?.unit_economics?.ai_cost_per_statement || 0.05}</p>
                </div>
                <div className="glass border border-foreground/5 rounded-[20px] p-4">
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="h-3 w-3 text-rose-400" /> ARPU</p>
                  <p className="text-[18px] font-bold mt-1">KSh {stats?.unit_economics?.arpu || 0}</p>
                </div>
                <div className="glass border border-foreground/5 rounded-[20px] p-4">
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Avg Tx/Upload</p>
                  <p className="text-[18px] font-bold mt-1">{stats?.unit_economics?.avg_tx_per_statement || 0}</p>
                </div>
              </div>

              {/* Error Monitoring & Growth / Feed */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Live Activity Feed */}
                <div className="md:col-span-1 glass border border-foreground/5 rounded-[28px] p-5 space-y-4">
                  <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-indigo-400" />
                    Live Activity
                  </h3>
                  <div className="space-y-4 overflow-y-auto max-h-[350px] pr-1 relative before:absolute before:inset-y-0 before:left-2.5 before:w-px before:bg-foreground/10">
                    {stats?.activity_feed && stats.activity_feed.length > 0 ? (
                      stats.activity_feed.map((act, i) => {
                        const time = new Date(act.time);
                        const isError = act.type.includes("FAILED");
                        const isMoney = act.type === "PAYMENT";
                        const isSuccess = act.type === "STATEMENT_SUCCESS";
                        return (
                          <div key={i} className="relative pl-8">
                            <div className={`absolute left-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-background z-10 ${
                              isError ? "bg-rose-500" : isMoney ? "bg-emerald-500" : isSuccess ? "bg-indigo-500" : "bg-foreground/20"
                            }`} />
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-bold text-muted-foreground">
                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className={`text-[13px] font-semibold ${isError ? 'text-rose-400' : 'text-foreground/90'}`}>
                                {act.message}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[12px] text-muted-foreground text-center py-6">No recent activity.</p>
                    )}
                  </div>
                </div>

                {/* Growth Charts & Errors */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Growth Chart (Simulated with Bars) */}
                  <div className="glass border border-foreground/5 rounded-[28px] p-5 space-y-4">
                    <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
                      <BarChart2 className="h-4.5 w-4.5 text-emerald-400" />
                      7-Day Growth Trends
                    </h3>
                    <div className="flex items-end justify-between gap-2 h-[150px] pt-4">
                      {stats?.growth_data?.map((day, i) => {
                        // Max expected for height scaling
                        const maxStmts = Math.max(...(stats?.growth_data?.map(d => d.statements) || [1])) || 1;
                        const heightPct = Math.max(10, (day.statements / maxStmts) * 100);
                        return (
                          <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-14 bg-foreground text-background text-[10px] p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap font-bold flex flex-col items-center">
                              <span>{day.statements} Uploads</span>
                              <span className="text-emerald-400">KSh {day.revenue}</span>
                            </div>
                            
                            <div className="w-full max-w-[32px] bg-foreground/10 rounded-t-sm relative flex items-end justify-center transition-all group-hover:bg-foreground/20" style={{ height: '100%' }}>
                              <div className="w-full bg-emerald-400/80 rounded-t-sm transition-all" style={{ height: `${heightPct}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold tracking-tighter truncate w-full text-center">{day.date}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Error Monitoring */}
                  <div className="glass border border-rose-500/20 rounded-[28px] p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <AlertTriangle className="h-24 w-24 text-rose-500" />
                    </div>
                    <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2 text-rose-400 relative z-10">
                      <AlertTriangle className="h-4.5 w-4.5" />
                      System Health & Errors
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                      <div>
                        <p className="text-[11px] text-rose-400/70 font-bold uppercase tracking-wider">Failed Parses</p>
                        <p className="text-[20px] font-bold text-rose-400">{stats?.errors?.failed_parses || 0}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-rose-400/70 font-bold uppercase tracking-wider">Gemini Fails</p>
                        <p className="text-[20px] font-bold text-rose-400">{stats?.errors?.gemini_failures || 0}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-rose-400/70 font-bold uppercase tracking-wider">Timeouts</p>
                        <p className="text-[20px] font-bold text-rose-400">{stats?.errors?.timeouts || 0}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-rose-400/70 font-bold uppercase tracking-wider">Invalid Docs</p>
                        <p className="text-[20px] font-bold text-rose-400">{stats?.errors?.invalid_statements || 0}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Mass Email Campaign Section */}
              <div className="glass border border-foreground/5 rounded-[28px] p-5 space-y-4">
                <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
                  <Mail className="h-4.5 w-4.5 text-indigo-400" />
                  Email Communications & Segments
                </h3>
                <form onSubmit={handleSendCampaign} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="glass rounded-xl flex flex-col px-3 py-1.5 border border-foreground/5">
                        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Target Segment</label>
                        <select 
                          className="bg-transparent text-[13px] font-semibold outline-none py-1 text-foreground"
                          value={campaignSegment}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCampaignSegment(val);
                            if (PRESET_TEMPLATES[val]) {
                              setCampaignSubject(PRESET_TEMPLATES[val].subject);
                              setCampaignBody(PRESET_TEMPLATES[val].body);
                              setCampaignGrantPro(true);
                            }
                          }}
                        >
                          <option value="ALL">All Active Users</option>
                          <option value="UPLOAD_FAILED">Segment 1: Upload Failed</option>
                          <option value="NO_UPLOAD">Segment 2: Signed Up, No Upload</option>
                          <option value="SUCCESSFUL_FREE">Segment 3: Successfully Used (Free)</option>
                          <option value="PAID_USERS">Segment 4: Paid Users</option>
                        </select>
                      </div>
                      
                      <div className="glass rounded-xl flex flex-col px-3 py-1.5 border border-foreground/5">
                        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Subject</label>
                        <input
                          type="text"
                          required
                          value={campaignSubject}
                          onChange={(e) => setCampaignSubject(e.target.value)}
                          placeholder="Subject line..."
                          className="bg-transparent text-[13px] font-semibold outline-none py-1 text-foreground placeholder:text-muted-foreground/30"
                        />
                      </div>
                      
                      <div className="glass rounded-xl flex flex-col px-3 py-1.5 border border-foreground/5">
                        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={campaignGrantPro}
                            onChange={(e) => setCampaignGrantPro(e.target.checked)}
                          /> 
                          <span className="text-emerald-400">Grant 3 Days Pro Access</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="glass rounded-xl flex flex-col px-3 py-1.5 border border-foreground/5 relative">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex justify-between">
                        <span>Message Body</span>
                        <span className="text-indigo-400 lowercase">Use {'{{FirstName}}'}</span>
                      </label>
                      <textarea
                        required
                        value={campaignBody}
                        onChange={(e) => setCampaignBody(e.target.value)}
                        placeholder="Type your message here..."
                        className="bg-transparent text-[13px] font-semibold outline-none py-1 text-foreground placeholder:text-muted-foreground/30 flex-1 resize-none min-h-[150px]"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-indigo-400 font-bold">{campaignMessage}</p>
                    <button
                      type="submit"
                      disabled={campaignSending || !campaignSubject || !campaignBody}
                      className="rounded-full bg-foreground px-6 py-2.5 text-[13px] font-bold text-background transition-transform active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                    >
                      {campaignSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {campaignSending ? "Sending Segment..." : "Send Campaign"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Comprehensive User Directory Table */}
              <div className="glass border border-foreground/5 rounded-[28px] p-5 space-y-4">
                <h3 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-indigo-400" />
                  User Directory
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-foreground/5">
                        <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contact</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Statements</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Joined Date</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Last Active</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/5">
                      {stats?.recent_users && stats.recent_users.length > 0 ? (
                        stats.recent_users.map((u) => (
                          <tr key={u.id} className="hover:bg-foreground/[0.02] transition-colors group">
                            <td className="py-3 px-4">
                              <p className="text-[13px] font-bold text-foreground/90">{u.name}</p>
                              <p className="text-[11px] text-muted-foreground">{u.email}</p>
                            </td>
                            <td className="py-3 px-4 text-[12px] font-semibold text-foreground/80">{u.phone}</td>
                            <td className="py-3 px-4">
                              <span className="text-[11px] font-bold bg-indigo-500/10 text-indigo-400 rounded-full px-2.5 py-1">
                                {u.file_count} files
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[12px] text-muted-foreground">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-[12px] font-bold text-emerald-400">
                              {u.last_active ? (
                                (() => {
                                  const now = new Date();
                                  const active = new Date(u.last_active);
                                  const diffMins = Math.floor((now.getTime() - active.getTime()) / 60000);
                                  if (diffMins < 5) return 'Just now';
                                  if (diffMins < 60) return `${diffMins}m ago`;
                                  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
                                  return active.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                })()
                              ) : "Never"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleInspectUser(u.id)}
                                className="text-[11px] font-bold bg-foreground/10 hover:bg-foreground/20 text-foreground px-3 py-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[12px] text-muted-foreground">No users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
                          <span className={`text-[10.5px] font-bold rounded-full px-2.5 py-0.5 shrink-0 ${
                            stmt.tx_count === 0 
                              ? "bg-rose-500/10 text-rose-400" 
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {stmt.tx_count === 0 ? "FAILED (0 tx)" : `${stmt.tx_count} Transactions`}
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
