import * as mock from "./quant-data";

const envType = process.env.NEXT_PUBLIC_ENVIRONMENT || "local";
let API_BASE_URL = "http://localhost:8000";

if (envType === "lan") {
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_LAN || "http://192.168.0.116:8000";
} else if (envType === "prod") {
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_PROD || "https://api.quant.ai";
} else {
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_LOCAL || "http://localhost:8000";
}


async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has("Authorization") && !endpoint.includes("guest")) {
    const token = typeof window !== "undefined" ? localStorage.getItem("quant_token") : null;
    if (token) {
      headers.set("Authorization", `Token ${token}`);
    }
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errMsg = `API error: ${response.status} ${response.statusText}`;
    let errCode = undefined;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errMsg = errJson.error;
      } else if (errJson && errJson.detail) {
        errMsg = errJson.detail;
      }
      if (errJson && errJson.code) {
        errCode = errJson.code;
      }
    } catch (_) {}
    const error = new Error(errMsg) as any;
    error.code = errCode;
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

/** Sync a lightweight presence cookie so Next.js middleware can gate /app/* routes. */
function setAuthCookie() {
  // 30-day expiry, SameSite=Strict, no sensitive value stored
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `quant_auth=1; path=/; expires=${expires}; SameSite=Strict`;
}

function clearAuthCookie() {
  document.cookie = "quant_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
}
export interface DashboardData {
  user_name?: string;
  user_email?: string;
  current_balance: string | number;
  monthly_income_30d: string | number;
  monthly_expenses_30d: string | number;
  active_goals: any[];
  recent_insights: any[];
  behaviour: {
    salary_day?: number;
    weekend_multiplier?: number;
    impulse_score?: number;
    overspend_days?: number;
  };
}

export interface GoalData {
  id?: string;
  title: string;
  target_amount: string | number;
  saved_amount: string | number;
  deadline: string;
  category?: string;
  status?: string;
}

export interface ChatResponse {
  conversation_id: string;
  user_message: {
    id: string;
    role: string;
    content: string;
    created_at: string;
  };
  assistant_message: {
    id: string;
    role: string;
    content: string;
    reasoning?: string;
    created_at: string;
  };
}

export const api = {
  async getDashboard(): Promise<DashboardData> {
    try {
      return await apiFetch<DashboardData>("/dashboard");
    } catch (e) {
      console.warn("Failed to fetch dashboard, falling back to mock data:", e);
      return {
        user_name: mock.user.name,
        user_email: "andrew@quant.ai",
        current_balance: mock.user.cashAvailable,
        monthly_income_30d: mock.user.cashAvailable + mock.user.leftThisMonth,
        monthly_expenses_30d: mock.user.spentToday * 30,
        active_goals: mock.goals.slice(0, 3),
        recent_insights: mock.insights.map((ins, i) => ({ id: String(i), title: "Insight", body: ins })),
        behaviour: {
          salary_day: 28,
          weekend_multiplier: 2.1,
          impulse_score: 78,
          overspend_days: 3,
        },
      };
    }
  },

  async getGoals(): Promise<GoalData[]> {
    try {
      return await apiFetch<GoalData[]>("/goals/");
    } catch (e) {
      console.warn("Failed to fetch goals, falling back to mock data:", e);
      return mock.goals.map((g) => ({
        id: g.id,
        title: g.name,
        target_amount: g.target,
        saved_amount: g.saved,
        deadline: g.eta,
        status: "active",
      }));
    }
  },

  async createGoal(goal: Omit<GoalData, "id">): Promise<GoalData> {
    try {
      return await apiFetch<GoalData>("/goals/", {
        method: "POST",
        body: JSON.stringify(goal),
      });
    } catch (e) {
      console.error("Failed to create goal, falling back to local simulation:", e);
      return {
        ...goal,
        id: Math.random().toString(36).substring(7),
      };
    }
  },

  async updateGoal(id: string, goal: Partial<GoalData>): Promise<GoalData> {
    return await apiFetch<GoalData>(`/goals/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(goal),
    });
  },

  async getFinancialModes() {
    try {
      return await apiFetch<any[]>("/financial-modes/");
    } catch (e) {
      console.warn("Failed to fetch financial modes, falling back to mock data:", e);
      return mock.modes;
    }
  },

  async updateFinancialMode(modeId: string, data: any) {
    try {
      return await apiFetch<any>(`/financial-modes/`, {
        method: "POST",
        body: JSON.stringify({ mode_id: modeId, ...data }),
      });
    } catch (e) {
      console.error("Failed to update financial mode, simulating locally:", e);
      return { success: true, modeId };
    }
  },

  async uploadStatement(file: File, password?: string): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    if (password) {
      formData.append("password", password);
    }

    try {
      return await apiFetch<any>("/statements/upload", {
        method: "POST",
        body: formData,
      });
    } catch (e: any) {
      if (e.message && !e.message.includes("Failed to fetch") && !e.message.includes("NetworkError")) {
        throw e;
      }
      console.warn("Failed to upload statement to API, simulating locally:", e);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return { success: true };
    }
  },

  async getStatements(): Promise<{ statements: Array<{
    id: string;
    provider: string;
    filename: string;
    period_start: string | null;
    period_end: string | null;
    upload_date: string;
    status: string;
    transaction_count: number;
  }> }> {
    try {
      return await apiFetch<any>("/statements/");
    } catch (e) {
      console.warn("Failed to fetch statements:", e);
      return { statements: [] };
    }
  },

  async sendChatMessage(message: string, conversationId?: string): Promise<ChatResponse> {
    try {
      return await apiFetch<ChatResponse>("/quant/chat", {
        method: "POST",
        body: JSON.stringify({ message, conversation_id: conversationId }),
      });
    } catch (e) {
      console.warn("Failed to send chat message to API, simulating locally:", e);
      // Simulate chat reply locally
      await new Promise((resolve) => setTimeout(resolve, 8000));
      
      const queryLower = message.toLowerCase();
      let responseText = `Hello Andrew, I'm Quant. I have analyzed your transactions, habits, and goals. Ask me how to optimize your savings!`;
      
      if (queryLower.includes("goal") || queryLower.includes("afford")) {
        responseText = `Based on your goal, you're on track to afford it in 18 days if you keep your daily budget under KSh 1,400.`;
      } else if (queryLower.includes("roast") || queryLower.includes("spend")) {
        responseText = `You spend 2.1x more on weekends than weekdays, with food-first spending accounting for 34% of your total outflows.`;
      }

      return {
        conversation_id: conversationId || "mock-conversation-id",
        user_message: {
          id: Math.random().toString(36).substring(7),
          role: "user",
          content: message,
          created_at: new Date().toISOString(),
        },
        assistant_message: {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: responseText,
          reasoning: "User query processed using local heuristic fallback model.",
          created_at: new Date().toISOString(),
        },
      };
    }
  },
  
  async getConversations(): Promise<{ conversations: any[] }> {
    try {
      return await apiFetch<{ conversations: any[] }>("/quant/conversations");
    } catch (e) {
      console.warn("Failed to fetch conversations, returning empty list:", e);
      return { conversations: [] };
    }
  },

  async getConversationHistory(conversationId: string): Promise<{ conversation_id: string; messages: any[] }> {
    try {
      return await apiFetch<{ conversation_id: string; messages: any[] }>(`/quant/conversations/${conversationId}/history`);
    } catch (e) {
      console.warn("Failed to fetch conversation history, returning empty list:", e);
      return { conversation_id: conversationId, messages: [] };
    }
  },

  async getRecurringExpenses(): Promise<any[]> {
    try {
      return await apiFetch<any[]>("/transactions/recurring/");
    } catch (e) {
      console.warn("Failed to fetch recurring expenses, falling back to empty list:", e);
      return [];
    }
  },

  async getUniqueMerchants(): Promise<string[]> {
    try {
      const res = await apiFetch<{ merchants: string[] }>("/transactions/unique-merchants/");
      return res.merchants;
    } catch (e) {
      console.warn("Failed to fetch unique merchants, falling back to empty list:", e);
      return [];
    }
  },

  async createRecurringExpense(expense: { merchant_name: string; label?: string; amount: number; frequency: string; next_due?: string }): Promise<any> {
    try {
      return await apiFetch<any>("/transactions/recurring/", {
        method: "POST",
        body: JSON.stringify(expense),
      });
    } catch (e) {
      console.error("Failed to create recurring expense, simulating locally:", e);
      return {
        id: Math.random().toString(36).substring(7),
        merchant_detail: { name: expense.merchant_name },
        label: expense.label || "",
        amount: expense.amount,
        frequency: expense.frequency,
        next_due: expense.next_due || new Date().toISOString().split("T")[0],
      };
    }
  },

  async deleteRecurringExpense(id: string | number): Promise<any> {
    return await apiFetch<any>(`/transactions/recurring/${id}/`, { method: "DELETE" });
  },

  async getSurvivalPack(): Promise<any> {
    try {
      return await apiFetch<any>("/transactions/survival/");
    } catch (e) {
      console.warn("Survival pack fetch failed, returning empty:", e);
      return { survival_pack: [], total_monthly_survival: 0, optimization: null };
    }
  },

  async saveSurvivalPack(items: { label: string; amount: number; frequency?: string }[]): Promise<any> {
    try {
      return await apiFetch<any>("/transactions/survival/", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
    } catch (e) {
      console.warn("Survival pack save failed, simulating locally:", e);
      const total = items.reduce((s, i) => s + i.amount, 0);
      return {
        saved_count: items.length,
        survival_pack: items.map((i, idx) => ({ id: String(idx), label: i.label, amount: i.amount })),
        total_monthly_survival: total,
        optimization: {
          total_declared_survival: total,
          total_actual_spend_30d: total * 1.22,
          discretionary_room: total * 0.22,
          summary: `Survival baseline: KSh ${total.toLocaleString()}/mo. Statement upload will reveal exact savings potential.`,
          overspend_insights: [],
        },
      };
    }
  },

  async getMoneyMap(startDate?: string, endDate?: string): Promise<any> {
    try {
      let url = "/transactions/aliases/";
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      const query = params.toString();
      if (query) url += `?${query}`;
      return await apiFetch<any>(url);
    } catch (e) {
      console.warn("Money map fetch failed:", e);
      return { money_map: null, aliases: [], unresolved_patterns: [] };
    }
  },

  async saveMerchantAlias(alias: {
    raw_pattern: string; label: string; category?: string;
    reason?: string; is_necessary?: boolean;
  }): Promise<any> {
    try {
      return await apiFetch<any>("/transactions/aliases/", {
        method: "POST",
        body: JSON.stringify(alias),
      });
    } catch (e) {
      console.warn("Alias save failed:", e);
      return { id: Math.random().toString(36).substring(7), ...alias };
    }
  },

  async simulateSpendCut(params: { label?: string; category?: string; cut_pct: number }): Promise<any> {
    try {
      return await apiFetch<any>("/transactions/simulate/", {
        method: "POST",
        body: JSON.stringify(params),
      });
    } catch (e) {
      console.warn("Simulation failed, running locally:", e);
      const saving = 3200 * (params.cut_pct / 100);
      return {
        monthly_saving: saving,
        annual_saving: saving * 12,
        verdict: `Cutting by ${params.cut_pct}% saves KSh ${saving.toLocaleString()}/mo. Upload statement for exact figures.`,
        goal_impact: null,
      };
    }
  },

  async getAutoLabels(limit = 15): Promise<any> {
    try {
      return await apiFetch<any>("/transactions/auto-label/", {
        method: "POST",
        body: JSON.stringify({ limit }),
      });
    } catch (e) {
      console.warn("Auto-label failed:", e);
      return {
        suggestions: [
          { raw_pattern: "SAFARICOM*DATA*001", suggested_label: "Mobile Data", suggested_category: "Utilities", is_necessary: true, confidence: "high", source: "heuristic", tx_count: 4, total_30d: 3200, tx_type: "DEBIT" },
          { raw_pattern: "JAVA002NAIROBI", suggested_label: "Restaurant", suggested_category: "Food & Drink", is_necessary: false, confidence: "high", source: "heuristic", tx_count: 6, total_30d: 4800, tx_type: "DEBIT" },
          { raw_pattern: "MPESA RECV JOHN", suggested_label: "M-Pesa Receive", suggested_category: "Income", is_necessary: true, confidence: "medium", source: "ai", tx_count: 3, total_30d: 9000, tx_type: "CREDIT" },
        ],
        total_classified: 3,
        heuristic_count: 2,
        ai_count: 1,
      };
    }
  },

  async getMonthlyAnalysis(): Promise<any> {
    try {
      return await apiFetch<any>("/analytics/monthly/");
    } catch (e) {
      console.warn("Monthly analysis fetch failed:", e);
      return { months: [], overall_summary: "Connect your M-Pesa statement to see monthly breakdowns." };
    }
  },

  async getWeeklyAnalysis(): Promise<any> {
    try {
      return await apiFetch<any>("/analytics/weekly/");
    } catch (e) {
      console.warn("Weekly analysis fetch failed:", e);
      return { weeks: [] };
    }
  },

  async getMe(): Promise<any> {
    return await apiFetch<any>("/auth/me/");
  },

  async signup(name: string, email: string, password: string, phoneNumber?: string): Promise<any> {
    const res = await apiFetch<any>("/auth/signup/", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone_number: phoneNumber }),
    });
    if (res.token) {
      localStorage.setItem("quant_token", res.token);
      setAuthCookie();
    }
    return res;
  },

  async login(email: string, password: string): Promise<any> {
    const res = await apiFetch<any>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem("quant_token", res.token);
      setAuthCookie();
    }
    return res;
  },

  async logout(): Promise<void> {
    localStorage.removeItem("quant_token");
    localStorage.removeItem("quant_dashboard");
    clearAuthCookie();
  },

  async getNotifications(): Promise<any> {
    return await apiFetch<any>("/notifications/");
  },

  async markNotificationsRead(): Promise<void> {
    await apiFetch<any>("/notifications/", { method: "PATCH" });
  },

  async deleteNotification(id: string): Promise<void> {
    await apiFetch<any>(`/notifications/${id}/`, { method: "DELETE" });
  },

  async clearNotifications(): Promise<void> {
    await apiFetch<any>("/notifications/", { method: "DELETE" });
  },

  async subscribePush(subscription: PushSubscription): Promise<void> {
    await apiFetch<any>("/notifications/push-subscribe/", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  },

  async getAdminStats(): Promise<any> {
    return await apiFetch<any>("/auth/admin/stats/");
  },

  async getAdminUserDetails(userId: string): Promise<any> {
    return await apiFetch<any>(`/auth/admin/user-details/${userId}/`);
  },

  async checkoutBilling(phoneNumber: string, amount?: number, packageName?: string): Promise<any> {
    return await apiFetch<any>("/auth/billing/checkout/", {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber, amount, package: packageName }),
    });
  },

  async checkoutBillingStatus(reference: string): Promise<any> {
    return await apiFetch<any>(`/auth/billing/status/${reference}/`);
  },

  async verifyBillingPayment(phoneNumber: string): Promise<any> {
    return await apiFetch<any>("/auth/billing/verify-payment/", {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  },


  async googleLogin(credential: string): Promise<any> {
    const res = await apiFetch<any>("/auth/google-login/", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
    if (res.token) {
      localStorage.setItem("quant_token", res.token);
      localStorage.removeItem("quant_dashboard");
      setAuthCookie();
    }
    return res;
  },
};
