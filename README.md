# Quant — Financial Intelligence Interface

Quant is a premium, AI-powered financial intelligence and cashflow optimization dashboard. Designed as a private "financial twin," it parses structured transaction data (such as M-Pesa statements) to map your cashflow velocity, track fixed bills, and help you simulate spending decisions in real-time.

---

## ✨ Features

- **📊 Money Map:** Visual, structured insights displaying income sources, fixed obligations, and discretionary spend.
- **🤖 Your Quant (AI Assistant):** A private conversational financial analyst that evaluates your last 90 days of transaction statements.
- **✂️ Cut Simulator:** Interactive tool to visualize the exact savings impact of cutting back discretionary spending (e.g., eating out, entertainment).
- **🛡️ Statement Shredding & Privacy:** On-device preference to immediately purge raw statement files after processing, retaining only derived math.
- **📅 Fixed Commitments:** Automatic recognition and management of recurring bills, internet subscriptions, utilities, and rent.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **UI Logic:** React & TypeScript
- **Styling:** Tailwind CSS (Curated color system & glass-morphism overlays)
- **Animations:** Framer Motion (Micro-interactions, sliding drawers, and fading navigation)
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18.x or later recommended).

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in a `.env` file (see `.env.example` or use local backend URL):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to explore your Quant dashboard.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for details.
