export const currency = (n: number) =>
  `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export const user = {
  name: "Andrew",
  healthScore: 92,
  cashAvailable: 84200,
  leftThisMonth: 42150,
  mode: "Comfortable",
  dailyBudget: 1400,
  spentToday: 1080,
  emergencyFund: { current: 92000, target: 150000 },
  investmentCapacity: 18500,
};

export const insights = [
  "You are KSh 320 under your daily budget.",
  "You are on track to buy your laptop in 18 days.",
  "You spent 18% less than last week.",
];

export const modes = [
  {
    id: "survival",
    name: "Survival",
    desc: "Only essentials — food, rent, transport, utilities.",
    monthly: 28000,
    daily: 940,
    savingsRate: 0.62,
    leftover: 46200,
    tint: "var(--gradient-mint)",
  },
  {
    id: "comfortable",
    name: "Comfortable",
    desc: "Your normal lifestyle with occasional treats.",
    monthly: 42000,
    daily: 1400,
    savingsRate: 0.38,
    leftover: 25800,
    tint: "var(--gradient-sky)",
    active: true,
  },
  {
    id: "luxury",
    name: "Luxury",
    desc: "Higher spending, dining, travel and lifestyle.",
    monthly: 68000,
    daily: 2260,
    savingsRate: 0.12,
    leftover: 8200,
    tint: "var(--gradient-peach)",
  },
  {
    id: "custom",
    name: "Custom",
    desc: "Design a mode that fits a specific season.",
    monthly: 0,
    daily: 0,
    savingsRate: 0,
    leftover: 0,
    tint: "var(--gradient-lilac)",
  },
];

export const goals = [
  {
    id: "macbook",
    name: "Buy MacBook",
    target: 180000,
    saved: 112000,
    eta: "Nov 24",
    likelihood: 88,
    tip: "Reduce restaurant spending by KSh 300/week to arrive 6 days earlier.",
    tint: "var(--gradient-sky)",
  },
  {
    id: "shoes",
    name: "Buy Shoes",
    target: 8000,
    saved: 5200,
    eta: "Aug 12",
    likelihood: 96,
    tip: "You're on track. Skip two Bolt rides this week to finish early.",
    tint: "var(--gradient-peach)",
  },
  {
    id: "emergency",
    name: "Emergency Fund",
    target: 150000,
    saved: 92000,
    eta: "Feb 03",
    likelihood: 74,
    tip: "Pause 2 unused subscriptions (KSh 1,450/mo) to accelerate 3 weeks.",
    tint: "var(--gradient-mint)",
  },
  {
    id: "vacation",
    name: "Vacation",
    target: 50000,
    saved: 14500,
    eta: "Dec 20",
    likelihood: 61,
    tip: "Switch to Survival mode for 10 days to boost likelihood to 82%.",
    tint: "var(--gradient-lilac)",
  },
];

export const stories = [
  { title: "Weekend spender", body: "You spend 2.1× more on weekends than weekdays." },
  { title: "Food-first", body: "Food is your largest category — 34% of monthly outflow." },
  { title: "Post-salary drift", body: "You tend to overspend for 3 days after salary lands." },
  { title: "Friday cash", body: "You withdraw cash 2.4× more often on Fridays." },
  { title: "Impulse zone", body: "You're most likely to impulse-buy under KSh 500." },
];

export const opportunity = {
  items: [
    { label: "Snacks", value: 2400 },
    { label: "Bolt", value: 1800 },
    { label: "Impulse buys", value: 2300 },
  ],
  total: 6500,
  message: "This would have completely funded the bag you wanted.",
};
