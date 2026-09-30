# Personal Finance Advisor Bot & Wealth Engine

A full-stack Personal Finance Advisor and budgeting web application powered by React, TypeScript, Tailwind CSS, Express, and Google Gemini 3.8.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm or bun

### 1. Installation
Clone or extract the repository, then install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
Optional: Add your Google Gemini API key in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```
*(Note: If no API key is provided, the app uses its built-in deterministic financial advisory reasoning engine for all questions).*

### 3. Run Locally (Development)
Start the combined Express backend and Vite frontend development server:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Production Build
```bash
npm run build
npm start
```

---

## 📁 Source Code Structure (In Order)

```
personal-finance-advisor/
├── index.html                   # HTML Entry point with SEO metadata
├── package.json                 # Project dependencies and run scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration and plugins
├── server.ts                    # Express API server (Gemini AI chat, scenario sync, rates)
├── metadata.json                # AI Studio application metadata and capabilities
├── .env.example                 # Example environment variables
├── README.md                    # Project documentation and setup guide
└── src/                         # Frontend Application Source
    ├── main.tsx                 # React DOM mount point
    ├── App.tsx                  # Root application controller and global state
    ├── index.css                # Tailwind CSS global styles and theme variables
    ├── types.ts                 # Core TypeScript data contracts (Expenses, Incomes, Budgets)
    ├── data/
    │   └── mockData.ts          # Persona scenario definitions, currencies, defaults
    ├── services/
    │   └── api.ts               # Client-side API service connectors
    ├── utils/
    │   └── scenarioAdvisor.ts   # Financial math metrics, runway, and savings calculators
    └── components/
        ├── Header.tsx           # Top navigation, theme switcher, and profile management
        ├── Dashboard.tsx        # Overview dashboard with circular charts & recent transactions
        ├── TransactionsView.tsx # Expense/Income ledger with modify, trim, and CSV export
        ├── TransactionModal.tsx # Add/Modify expense and income modal
        ├── BudgetPlanner.tsx    # 50/30/20 category envelopes with inline edit
        ├── SavingsGoals.tsx     # Milestone tracking, emergency fund progress
        ├── MonthlyReport.tsx    # Financial audit summary & printable report
        ├── MultiCurrencyView.tsx# Real-time multi-currency converter (USD, EUR, GBP, INR, etc.)
        ├── AiAdvisorBot.tsx     # Gemini 3.8 AI Financial Advisor Chatbot
        ├── ResetProfileModal.tsx# Profile reset options (clean slate, baseline, factory)
        ├── SourceExportModal.tsx# Source code file viewer & 1-click ZIP download modal
        ├── CircularCharts.tsx   # SVG Donut and Progress Ring visualization components
        ├── GoalModal.tsx        # Add/edit savings goals modal
        ├── CreateProfileModal.tsx# Custom persona profile creator
        └── DatabaseSchemaView.tsx# Relational database architecture visualizer
```

---

## 💡 Key Features
- **Intelligent Financial Advisor**: Answers all general and specific questions regarding what to buy, how to spend, how to invest, and future family plans.
- **Modify Expenses Everywhere**: 1-click edit for description, amount, category, date, and essential/discretionary classification.
- **Profile Reset Options**: Clean slate (zero mock expenses), baseline restore, custom profile deletion, and factory reset.
- **Theme Switcher**: Instant switching between Dark (Obsidian), Light (Crisp), and Midnight (Navy).
- **100% Client-Side Privacy & Persistent Storage**: Data persists locally and synchronizes seamlessly.
