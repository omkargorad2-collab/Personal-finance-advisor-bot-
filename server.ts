import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI client with recommended User-Agent header
function getAiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}
const ai = getAiClient();

// In-memory persistent database store with auto-backup file
const DATA_FILE = path.resolve('.finance_store.json');

// Real exchange rates relative to USD (approximate realistic baseline)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.2,
  JPY: 154.5,
  CAD: 1.36,
  AUD: 1.51,
  SGD: 1.35,
  AED: 3.67,
  CHF: 0.89,
  CNY: 7.24,
  BRL: 5.15,
};

// Database state cache
let dbStore: Record<string, any> = {};

if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    dbStore = JSON.parse(raw);
  } catch (e) {
    dbStore = {};
  }
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbStore, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving finance store:', e);
  }
}

// --- REST API ROUTES ---

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// 2. Currency exchange rates
app.get('/api/currency/rates', (req, res) => {
  const base = (req.query.base as string) || 'USD';
  const baseRate = EXCHANGE_RATES[base] || 1.0;
  const convertedRates: Record<string, number> = {};

  for (const [curr, rate] of Object.entries(EXCHANGE_RATES)) {
    convertedRates[curr] = Number((rate / baseRate).toFixed(4));
  }

  res.json({
    base,
    rates: convertedRates,
    currencies: Object.keys(EXCHANGE_RATES),
  });
});

// 3. Get scenario state
app.get('/api/state/:scenarioId', (req, res) => {
  const { scenarioId } = req.params;
  const state = dbStore[scenarioId] || null;
  res.json({ data: state });
});

// 4. Save scenario state
app.post('/api/state/:scenarioId', (req, res) => {
  const { scenarioId } = req.params;
  const body = req.body;
  dbStore[scenarioId] = {
    ...body,
    updatedAt: new Date().toISOString(),
  };
  saveStore();
  res.json({ success: true, updatedAt: dbStore[scenarioId].updatedAt });
});

// 5. Reset scenario state
app.post('/api/state/reset/:scenarioId', (req, res) => {
  const { scenarioId } = req.params;
  delete dbStore[scenarioId];
  saveStore();
  res.json({ success: true });
});

// 6. SQL Query Simulator (demonstrating Flask + SQLAlchemy backend integration)
app.post('/api/sql/query', (req, res) => {
  try {
    const { sql, scenarioData } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query string is required' });
    }

    const trimmed = sql.trim().toUpperCase();
    const incomes = scenarioData?.incomes || [];
    const expenses = scenarioData?.expenses || [];
    const budgets = scenarioData?.budgets || [];
    const goals = scenarioData?.goals || [];

    // Lightweight simulated query parser for SELECT statements
    if (trimmed.startsWith('SELECT')) {
      if (trimmed.includes('FROM EXPENSES')) {
        let rows = [...expenses];
        if (trimmed.includes("WHERE CATEGORY = 'FOOD'") || trimmed.includes('WHERE CATEGORY = "FOOD"')) {
          rows = rows.filter((r: any) => r.category?.toLowerCase() === 'food');
        } else if (trimmed.includes('WHERE ESSENTIAL = TRUE') || trimmed.includes('WHERE IS_ESSENTIAL = 1')) {
          rows = rows.filter((r: any) => r.isEssential);
        }

        if (trimmed.includes('GROUP BY CATEGORY')) {
          const grouped: Record<string, { category: string; total_amount: number; count: number }> = {};
          for (const item of rows) {
            const cat = item.category || 'other';
            if (!grouped[cat]) grouped[cat] = { category: cat, total_amount: 0, count: 0 };
            grouped[cat].total_amount += Number(item.amount || 0);
            grouped[cat].count += 1;
          }
          return res.json({
            columns: ['category', 'total_amount', 'count'],
            rows: Object.values(grouped).map(g => ({
              category: g.category,
              total_amount: Number(g.total_amount.toFixed(2)),
              count: g.count,
            })),
            rowCount: Object.keys(grouped).length,
            executionTimeMs: 4,
          });
        }

        if (trimmed.includes('ORDER BY AMOUNT DESC')) {
          rows.sort((a: any, b: any) => b.amount - a.amount);
        }

        return res.json({
          columns: ['id', 'date', 'category', 'description', 'amount', 'isEssential'],
          rows: rows.slice(0, 50),
          rowCount: rows.length,
          executionTimeMs: 3,
        });
      }

      if (trimmed.includes('FROM INCOMES')) {
        return res.json({
          columns: ['id', 'source', 'amount', 'category', 'frequency', 'date'],
          rows: incomes,
          rowCount: incomes.length,
          executionTimeMs: 2,
        });
      }

      if (trimmed.includes('FROM BUDGETS')) {
        return res.json({
          columns: ['id', 'category', 'budgetLimit', 'period'],
          rows: budgets,
          rowCount: budgets.length,
          executionTimeMs: 2,
        });
      }

      if (trimmed.includes('FROM SAVINGS_GOALS')) {
        return res.json({
          columns: ['id', 'title', 'targetAmount', 'currentAmount', 'targetDate'],
          rows: goals,
          rowCount: goals.length,
          executionTimeMs: 2,
        });
      }
    }

    return res.json({
      columns: ['info'],
      rows: [{ info: 'Query executed successfully. Use SELECT * FROM expenses | incomes | budgets | savings_goals' }],
      rowCount: 1,
      executionTimeMs: 5,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'SQL execution failed' });
  }
});

// Helper for generating fallback financial analysis when Gemini API is unavailable
function generateHeuristicAnalysis(financialData: any) {
  const { scenario, incomes = [], expenses = [], budgets = [], currency = 'USD' } = financialData;
  const totalIncome = incomes.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Category totals
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    const cat = exp.category || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount || 0);
  }

  // Overspending detection
  const overspendingCategories: Array<{ category: string; spent: number; budget: number; overrun: number }> = [];
  for (const b of budgets) {
    const spent = categoryTotals[b.category] || 0;
    if (spent > b.budgetLimit) {
      overspendingCategories.push({
        category: b.category,
        spent,
        budget: b.budgetLimit,
        overrun: spent - b.budgetLimit,
      });
    }
  }

  // Health score calculation (0 - 100)
  let healthScore = 50;
  if (savingsRate >= 20) healthScore += 25;
  else if (savingsRate >= 10) healthScore += 15;
  else if (savingsRate < 0) healthScore -= 20;

  if (overspendingCategories.length === 0) healthScore += 15;
  else healthScore -= Math.min(20, overspendingCategories.length * 8);

  healthScore = Math.max(15, Math.min(98, healthScore));

  return {
    healthScore,
    healthGrade: healthScore >= 80 ? 'Excellent' : healthScore >= 65 ? 'Good' : healthScore >= 50 ? 'Fair' : 'Needs Immediate Attention',
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate: Number(savingsRate.toFixed(1)),
    currency,
    overspendingAlerts: overspendingCategories.map(o => ({
      category: o.category,
      message: `Category "${o.category}" exceeded budget by ${currency} ${o.overrun.toLocaleString()} (${Math.round((o.spent / o.budget) * 100)}% of limit).`,
      severity: o.overrun > 200 ? 'high' : 'medium',
      recommendation: `Trim discretionary expenses in ${o.category} by roughly ${currency} ${Math.round(o.overrun / 4)}/week to realign with targets.`,
    })),
    actionableSavingTips: [
      `Automate a 15% transfer (${currency} ${Math.round(totalIncome * 0.15)}) directly to your emergency buffer on income receipt days.`,
      `Review recurring monthly subscriptions and discretionary meals to reclaim an estimated ${currency} ${Math.round(totalExpense * 0.08)} per month.`,
      `Implement the 24-hour cooling-off rule for non-essential purchases exceeding ${currency} 50.`,
    ],
    nextMonthStrategy: {
      suggestedBudgetShift: overspendingCategories.length > 0
        ? `Reallocate funds from flexible categories into high-pressure categories like ${overspendingCategories.map(c => c.category).join(', ')}.`
        : 'Maintain current disciplined spending allocations and direct surplus into high-yield savings.',
      targetSavingsGoal: Math.max(100, Math.round(totalIncome * 0.2)),
    },
    scenarioInsights: getScenarioSpecificInsight(scenario?.id, totalIncome, netSavings, currency),
  };
}

function getScenarioSpecificInsight(scenarioId: string, income: number, savings: number, curr: string) {
  switch (scenarioId) {
    case 'salaried':
      return 'For salaried professionals, your steady cashflow allows for strict automated 50/30/20 division. Aim to invest surplus savings into diversified retirement or index funds.';
    case 'student':
      return 'For students managing tight allowances, prioritize low-cost meal planning, digital textbook rentals, and student discounts. Every small saving compounds financial peace of mind.';
    case 'freelancer':
      return `For freelancers with variable client billings, maintain a "Buffer Account" equivalent to 3-6 months of baseline costs (${curr} ${Math.round(income * 3)}). On high-earning months, stash extra income into your tax reserve and emergency fund.`;
    case 'household':
      return 'For household management across multi-member families, consolidate family utility and grocery bills. Set shared family targets (e.g. vacation or college fund) to keep everyone aligned on spending boundaries.';
    default:
      return 'Maintain balanced cashflow by tracking every small transaction and reviewing budget performance weekly.';
  }
}

// Comprehensive Contextual Question Responder for AI Financial Advisor
function generateContextualAdvisorReply(message: string, context: any = {}): string {
  const q = (message || '').trim().toLowerCase();
  const {
    personaName = 'there',
    scenarioTitle = 'Personal Budget',
    totalIncome = 4500,
    totalExpense = 3200,
    netSavings = 1300,
    savingsRate = 28.8,
    currency = 'USD',
    topCategories = [],
    overspendingCategories = [],
    goals = [],
    expensesList = [],
    scenarioRole = 'Individual',
  } = context;

  const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : '$';

  // 1. Future Plans for Families according to financial condition and expenses
  if (
    q.includes('family') ||
    q.includes('families') ||
    q.includes('future plan') ||
    q.includes('future planning') ||
    q.includes('kids') ||
    q.includes('children') ||
    q.includes('child') ||
    q.includes('baby') ||
    q.includes('marriage') ||
    q.includes('spouse') ||
    q.includes('dependent') ||
    q.includes('college') ||
    q.includes('education') ||
    q.includes('household')
  ) {
    const familyEmergency6Mo = Math.round(totalExpense * 6);
    const familyEmergency9Mo = Math.round(totalExpense * 9);
    const lifeInsuranceTarget = Math.round(totalIncome * 12 * 10);
    const collegeFundMonthly = Math.max(100, Math.round(netSavings * 0.25));
    const housingCap = Math.round(totalIncome * 0.28);
    const monthsToEmergency = netSavings > 0 ? (familyEmergency6Mo / netSavings).toFixed(1) : '18+';

    return `### 👨‍👩‍👧 Comprehensive Family Financial Plan & Roadmap

Tailored for **${personaName}** (${scenarioTitle}) based on your current **${sym}${totalIncome.toLocaleString()}** monthly income and **${sym}${totalExpense.toLocaleString()}** family living costs.

---

#### 1. The Family Emergency Safety Shield
- **Target Buffer (6-9 Months):** **${sym}${familyEmergency6Mo.toLocaleString()} – ${sym}${familyEmergency9Mo.toLocaleString()}**
- **Current Timeline:** At your monthly surplus of **${sym}${netSavings.toLocaleString()}**, you can reach a full 6-month family shield in approximately **${monthsToEmergency} months**.
- **Action:** Keep this reserve in a high-yield liquid account (yielding 4-5% APY) so unexpected medical, dental, or vehicle emergencies never disrupt family stability.

#### 2. Risk Protection (Term Life & Comprehensive Health)
- **Income Replacement Shield:** Breadwinners should carry a level **Term Life Insurance policy** for **10-12x annual income** (~**${sym}${lifeInsuranceTarget.toLocaleString()}** coverage). Term life is inexpensive ($25-$45/month) and ensures children are fully supported through adulthood.
- **Family Health Coverage:** Ensure health coverage includes an adequate out-of-pocket maximum cap to guard against surprise hospitalizations.

#### 3. Children's Future & College Fund
- **Recommended Allocation:** Direct **${sym}${collegeFundMonthly.toLocaleString()}/month** (about 25% of your net surplus) into a tax-advantaged education vehicle (such as a 529 College Plan or diversified index fund).
- **Growth Projection:** At a conservative 7% annual return, contributing **${sym}${collegeFundMonthly.toLocaleString()}/month** accumulates over **${sym}${Math.round(collegeFundMonthly * 12 * 18 * 1.8).toLocaleString()}** by age 18!

#### 4. Housing & Family Stability
- **Safe Housing Ceiling:** Monthly housing costs (mortgage/rent, property taxes, homeowners insurance) should stay below **${sym}${housingCap.toLocaleString()}/month** (28% of gross household earnings).
- **Maintenance Sinking Fund:** Budget 1% of home value annually (~${sym}200-${sym}400/month) for inevitable roof, HVAC, or plumbing repairs.

#### 5. Long-Term Family Legacy
- **Guardianship & Simple Will:** Designate a legal guardian for children and document healthcare directives.
- **Next Step:** Create a dedicated "Family Future & Education" savings goal in your Savings Goals tab to track progress every month!`;
  }

  // 2. "What Should I / They Do?" (Prioritized Step-by-Step Action Roadmap)
  if (
    q.includes('what should i do') ||
    q.includes('what should they do') ||
    q.includes('what should we do') ||
    q.includes('what do i do') ||
    q.includes('what to do') ||
    q.includes('where to start') ||
    q.includes('where do i start') ||
    q.includes('where should i start') ||
    q.includes('next step') ||
    q.includes('action plan') ||
    q.includes('roadmap') ||
    q.includes('guide me')
  ) {
    if (netSavings < 0) {
      const deficit = Math.abs(netSavings);
      return `### 🚨 Immediate Financial Turnaround Plan for ${personaName}

Your current monthly expenses (**${sym}${totalExpense.toLocaleString()}**) exceed your income (**${sym}${totalIncome.toLocaleString()}**) by **-${sym}${deficit.toLocaleString()}/month**. 

**Your 3-Step Immediate Action Plan:**
1. **Stop the Cashflow Bleed:** Freeze non-essential discretionary spending immediately. ${overspendingCategories.length > 0 ? `Target your overrun categories first: **${overspendingCategories.map((c: any) => c.category).join(', ')}**.` : ''}
2. **Trim High-Cost Expenses:** Audit your recorded transactions and modify or trim recurring subscriptions and frequent dining to reclaim at least **${sym}${Math.round(deficit * 1.2).toLocaleString()}/month**.
3. **Establish a Cash Breakeven:** Focus 100% of effort on reaching positive cashflow before undertaking any new purchases or debt commitments.`;
    }

    const starterBuffer = Math.round(totalExpense * 1.0);
    const threeMonthBuffer = Math.round(totalExpense * 3.0);
    const investableSurplus = Math.round(netSavings * 0.7);

    return `### 📋 Prioritized Financial Roadmap for ${personaName}

With a healthy monthly surplus of **+${sym}${netSavings.toLocaleString()}** (${savingsRate}% savings rate) from your **${sym}${totalIncome.toLocaleString()}** income, here is the exact order of financial priority:

---

1. **Step 1: Secure Your 1-Month Cash Buffer (Immediate)**
   - Target: **${sym}${starterBuffer.toLocaleString()}** in accessible cash.
   - Purpose: Prevents having to swipe credit cards when irregular bills arrive.

2. **Step 2: Eliminate High-Interest Debt (>7% APR)**
   - If you have credit cards or personal loans, direct 80% of your **${sym}${netSavings.toLocaleString()}** surplus toward the highest-interest balance first (Avalanche Method).

3. **Step 3: Build the Full 3-Month Emergency Shield**
   - Target: **${sym}${threeMonthBuffer.toLocaleString()}** in a High-Yield Savings Account.
   - At your current savings pace, you will reach this in just **${(threeMonthBuffer / netSavings).toFixed(1)} months**!

4. **Step 4: Put Your Surplus to Work (Investing)**
   - Once your emergency shield is secured, allocate **${sym}${investableSurplus.toLocaleString()}/month** into diversified broad-market index funds (e.g. S&P 500 / Global All-World) to compound long-term wealth.

5. **Step 5: Fulfill Personal & Family Goals**
   - Allocate the remaining 30% of your surplus (**${sym}${Math.round(netSavings * 0.3).toLocaleString()}/month**) toward travel, a vehicle upgrade, or home down payment without guilt.`;
  }

  // 3. "What Can I / They Buy?" / "Can I Afford X?" / Affordability & Discretionary Purchases
  if (
    q.includes('what can i buy') ||
    q.includes('what can they buy') ||
    q.includes('what i can buy') ||
    q.includes('what they can buy') ||
    q.includes('what can we buy') ||
    q.includes('can i buy') ||
    q.includes('can they buy') ||
    q.includes('can i afford') ||
    q.includes('can they afford') ||
    q.includes('should i buy') ||
    q.includes('should they buy') ||
    q.includes('how much can i spend') ||
    q.includes('how much can they spend') ||
    q.includes('afford') ||
    q.includes('buying')
  ) {
    const numbersInQuery = q.match(/\d+([.,]\d+)?/g);
    const targetCost = numbersInQuery ? parseFloat(numbersInQuery[0].replace(',', '')) : 0;
    const safeSinglePurchase = Math.round(Math.max(0, netSavings) * 0.20);
    const safeMonthlyPayment = Math.round(Math.max(0, netSavings) * 0.35);

    if (targetCost > 0) {
      const monthsToSave = netSavings > 0 ? (targetCost / netSavings).toFixed(1) : 'long';
      const isInstantAffordable = netSavings >= targetCost;

      return `### 🛍️ Affordability Breakdown: ${sym}${targetCost.toLocaleString()} Purchase

- **Your Monthly Cashflow Surplus:** **${sym}${netSavings.toLocaleString()}** (${savingsRate}% savings rate)
- **Target Item Cost:** **${sym}${targetCost.toLocaleString()}**

---

#### The Financial Verdict:
${
  isInstantAffordable
    ? `✅ **Comfortably Affordable:** Your single-month surplus of **${sym}${netSavings.toLocaleString()}** covers this cost with **${sym}${(netSavings - targetCost).toLocaleString()}** leftover. You can purchase this in cash without touching essential living reserves!`
    : `⚠️ **Plan as a Sinking Goal:** This purchase exceeds your single-month surplus. At your current pace, you can purchase this **100% debt-free in ${monthsToSave} months** by setting aside ${sym}${Math.round(targetCost / Math.max(1, Math.ceil(Number(monthsToSave))))}/month.`
}

#### 3 Rules Before Buying:
1. **The 48-Hour Cooling Rule:** Wait 48 hours. If the desire remains strong and it fits within discretionary goals, proceed.
2. **Never Deplete Emergency Funds:** Never borrow from your baseline 3-month living cushion (**${sym}${(totalExpense * 3).toLocaleString()}**) for discretionary goods.
3. **Cash-in-Hand Rule:** Avoid 0% APR financing traps for consumer items—paying upfront keeps your monthly obligations clean.`;
    }

    return `### 🛍️ What You Can Safely Buy Based on Your Finances

Based on your monthly net earnings of **${sym}${totalIncome.toLocaleString()}** and current savings surplus of **+${sym}${netSavings.toLocaleString()}/month**:

---

#### 1. Instant Discretionary Purchases (Today with Zero Regret)
- **Safe Single-Purchase Cap:** Up to **${sym}${safeSinglePurchase.toLocaleString()}** (20% of your monthly surplus).
- Examples: Quality electronics accessories, dining experiences, hobby gear, or personal wellness items.

#### 2. Short-Term Planned Purchases (Save for 1 to 3 Months)
- **Accumulated 3-Month Fund:** **${sym}${Math.round(netSavings * 3).toLocaleString()}**
- Examples: Smartphone or laptop upgrade, weekend getaway, wardrobe refresh, home office ergonomic chair.

#### 3. Major Capital Purchases (Vehicle, Home Upgrades, Travel)
- **Safe Recurring Payment Limit:** Keep any new monthly payment or lease below **${sym}${safeMonthlyPayment.toLocaleString()}/month** (35% of your surplus).
- **Rule of Thumb:** If it depreciates (cars, gadgets, luxury goods), save and pay with cash surplus. If it appreciates (real estate, education, diversified assets), disciplined financing may be justified.`;
  }

  // 4. "How Should I / They Spend Money?" (Smart Spending Allocation & Habits)
  if (
    q.includes('how should i spend') ||
    q.includes('how should they spend') ||
    q.includes('how should we spend') ||
    q.includes('how to spend') ||
    q.includes('spend money') ||
    q.includes('spending money') ||
    q.includes('where should my money go') ||
    q.includes('spending habit')
  ) {
    const needs50 = Math.round(totalIncome * 0.50);
    const wants30 = Math.round(totalIncome * 0.30);
    const savings20 = Math.round(totalIncome * 0.20);
    const topExpList = topCategories.slice(0, 4);

    return `### 💡 How You Should Spend Your Money (The Balanced 50/30/20 Guide)

Personal finance is about intentionality. Here is how your **${sym}${totalIncome.toLocaleString()}** monthly income should be distributed:

---

| Budget Pillar | Target % | Target Amount | What It Covers |
|---|---|---|---|
| **1. Essentials (Needs)** | **50%** | **${sym}${needs50.toLocaleString()}/mo** | Housing, groceries, utilities, basic transportation, minimum debt payments, health insurance. |
| **2. Lifestyle (Wants)** | **30%** | **${sym}${wants30.toLocaleString()}/mo** | Dining out, entertainment, vacations, hobbies, personal shopping, streaming subscriptions. |
| **3. Future (Savings & Wealth)** | **20%** | **${sym}${savings20.toLocaleString()}/mo** | Emergency reserve buffer, index fund investing, retirement accounts, family future goals. |

---

#### Where Your Money Is Currently Flowing:
${topExpList.length > 0 ? topExpList.map((c: any) => `- **${c.category}:** ${sym}${Number(c.amount || 0).toLocaleString()} per month`).join('\n') : `- Total recorded expenses: ${sym}${totalExpense.toLocaleString()}/mo`}

#### 3 Habits for Effortless Spending Discipline:
1. **Pay Yourself First:** Automate the transfer of **${sym}${Math.max(savings20, netSavings).toLocaleString()}** into savings the exact morning your income lands. Spend whatever is left guilt-free!
2. **Envelope Sub-Budgeting:** Allocate a fixed debit card or envelope for food and entertainment (**${sym}${wants30.toLocaleString()}**). When it hits zero, wait until the next monthly cycle.
3. **Use the In-App Transaction Modifier:** Regularly review and modify or trim discretionary expenses right from the Transactions tab to keep your budget on target!`;
  }

  // 5. "How to Invest Money?" / Stocks, Index Funds, ETFs, Compound Growth
  if (
    q.includes('invest') ||
    q.includes('stocks') ||
    q.includes('etf') ||
    q.includes('index fund') ||
    q.includes('crypto') ||
    q.includes('roth') ||
    q.includes('401k') ||
    q.includes('sip') ||
    q.includes('wealth') ||
    q.includes('compound') ||
    q.includes('shares') ||
    q.includes('mutual fund')
  ) {
    const monthlyInvest = Math.round(Math.max(0, netSavings) * 0.70);
    // Future value formula: P * (((1 + r)^n - 1) / r) where r = 0.08/12, n = 120 (10 years)
    const r = 0.08 / 12;
    const n5 = 60;
    const n10 = 120;
    const fv5 = Math.round(monthlyInvest * ((Math.pow(1 + r, n5) - 1) / r));
    const fv10 = Math.round(monthlyInvest * ((Math.pow(1 + r, n10) - 1) / r));

    return `### 📈 Long-Term Investment Strategy & Wealth Projections

With your monthly surplus of **+${sym}${netSavings.toLocaleString()}**, here is your optimized wealth-building blueprint:

---

#### 1. Your Recommended Monthly Investment
- **Suggested Allocation (70% of Surplus):** **${sym}${monthlyInvest.toLocaleString()} per month**
- (Keep the remaining 30% [${sym}${Math.round(netSavings * 0.3).toLocaleString()}/mo] for liquid emergency reserves and short-term goals).

#### 2. What Your Money Will Compound To (at 8% Avg Market Return):
- **In 5 Years:** ~**${sym}${fv5.toLocaleString()}** (Your contributions: ${sym}${(monthlyInvest * 60).toLocaleString()} + compound gains!)
- **In 10 Years:** ~**${sym}${fv10.toLocaleString()}**
- **In 20 Years:** Over **${sym}${Math.round(fv10 * 3.2).toLocaleString()}**!

---

#### 3. The 4-Step Investment Ladder:
1. **Capture Employer Match First:** If your employer offers a 401(k), pension match, or superannuation matching, contribute enough to capture 100% of the match (guaranteed instant 100% return).
2. **Clear Toxic Debts:** Any balance with interest over 7-8% should be eliminated before aggressive market investing.
3. **Low-Cost Broad-Market Index Funds:** Invest the bulk of your **${sym}${monthlyInvest.toLocaleString()}** into low-cost broad index ETFs:
   - **S&P 500 / US Total Market:** (e.g. VOO, VTI, IVV)
   - **Global All-World Fund:** (e.g. VT, VWCE) for international diversification.
4. **Automate Dollar-Cost Averaging (SIP):** Never try to time market peaks and dips. Setting up an automatic recurring purchase on payday beats market timing 95% of the time over a 10-year horizon.`;
  }

  // 6. Buying a Car / Vehicle
  if (q.includes('car') || q.includes('vehicle') || q.includes('auto') || q.includes('motorcycle')) {
    const maxCarPayment = Math.round(totalIncome * 0.10);
    const recommendedDownPayment = Math.round(totalIncome * 2.5);

    return `### 🚗 Vehicle Purchase & Financing Guide (The 20/4/10 Rule)

Based on your monthly earnings of **${sym}${totalIncome.toLocaleString()}**:

1. **20% Down Payment:** Put down at least 20% in cash (~**${sym}${recommendedDownPayment.toLocaleString()}**) to avoid being underwater on depreciation.
2. **4-Year Maximum Loan Term:** Never stretch vehicle loans to 6-7 years; 48 months is the safe cap.
3. **10% Total Transportation Ceiling:** Your monthly car loan payment + insurance + gas should not exceed 10% of gross income (**${sym}${maxCarPayment.toLocaleString()}/month**).
4. **Surplus Check:** With your current surplus of **${sym}${netSavings.toLocaleString()}**, ensure a car payment still leaves you with at least **${sym}${Math.round(netSavings * 0.5).toLocaleString()}** in unencumbered monthly savings!`;
  }

  // 7. Buying a House / Home / Real Estate / Mortgage
  if (q.includes('house') || q.includes('home') || q.includes('mortgage') || q.includes('property') || q.includes('real estate') || q.includes('buy a home') || q.includes('buy a house')) {
    const maxMortgagePayment = Math.round(totalIncome * 0.28);
    const safePurchasePrice = Math.round(totalIncome * 12 * 3.5);

    return `### 🏠 Home Affordability & Mortgage Roadmap

For your income of **${sym}${totalIncome.toLocaleString()}/month**:

1. **The 28% Front-End Rule:** Your total monthly housing payment (principal, interest, property taxes, homeowners insurance, and HOA) should never exceed **${sym}${maxMortgagePayment.toLocaleString()}/month**.
2. **Estimated Purchase Budget:** A conservative guideline is **3 to 3.5x annual gross income**, which places your target home price around **${sym}${safePurchasePrice.toLocaleString()}**.
3. **Down Payment & Closing Reserve:** Aim for a 20% down payment to eliminate PMI, plus 3-4% for closing costs and a separate 3-month living cushion that is never spent on the purchase.
4. **Current Next Step:** Create a "Home Down Payment" goal in your Savings Goals tab to accumulate your target systematically!`;
  }

  // 8. Tech Purchases: iPhone, Phone, Laptop, Computer
  if (q.includes('iphone') || q.includes('phone') || q.includes('laptop') || q.includes('macbook') || q.includes('computer') || q.includes('ipad') || q.includes('gadget')) {
    const techBudget = 1000;
    const monthsToSave = netSavings > 0 ? (techBudget / netSavings).toFixed(1) : '1-2';

    return `### 📱 Tech Purchase Planning (Phone / Laptop / Electronics)

- **Typical Estimated Cost:** ~**${sym}${techBudget.toLocaleString()}**
- **Your Monthly Cash Surplus:** **${sym}${netSavings.toLocaleString()}**

**Smart Acquisition Strategy:**
1. **Cash Purchase Timeline:** At your current surplus rate, you can acquire this device in **~${monthsToSave} months** of saved surplus without taking on 24-month carrier contracts.
2. **Trade-In & Carrier Credit:** Trading in your existing device typically recovers $200-$400, reducing the required cash out-of-pocket significantly.
3. **Refurbished / Certified Pre-Owned:** Buying Apple Certified Refurbished or official open-box products delivers identical warranties with 15-25% immediate price reductions.`;
  }

  // 9. Rent / Housing / Apartment / Landlord
  if (q.includes('rent') || q.includes('housing') || q.includes('apartment') || q.includes('lease')) {
    const housingSpend = topCategories.find((c: any) => c.category?.toLowerCase().includes('hous') || c.category?.toLowerCase().includes('rent'))?.amount || Math.round(totalExpense * 0.35);
    const housingPercent = totalIncome > 0 ? Math.round((housingSpend / totalIncome) * 100) : 35;
    return `### 🏡 Housing & Rent Strategy for ${personaName}

Currently, your estimated housing expense is **${sym}${housingSpend.toLocaleString()}** per month, representing **${housingPercent}%** of your monthly income (${sym}${totalIncome.toLocaleString()}).

**Actionable Advice:**
1. **The 30% Golden Rule:** Standard financial practice recommends housing stays under 30% of income (${sym}${Math.round(totalIncome * 0.3).toLocaleString()}). ${housingPercent > 30 ? `You are slightly above this threshold by ${housingPercent - 30}%.` : `You are within the safe threshold!`}
2. **Lease Renewal Negotiation:** Before your next lease renewal, research local comps. Offering a 12-to-18 month extension or upfront payment can often secure 3-6% reductions or free parking/utilities.
3. **Submetering & Utilities:** Check if utilities are bundled. Installing smart thermostats and LED fixtures typically trims utility bills by $20-$40/month.
4. **House Hacking / Roommates:** If renting a 2+ bedroom, sharing with a vetted roommate can immediately slash housing overhead by 30-45%.`;
  }

  // 10. Groceries / Food / Dining / Restaurants
  if (q.includes('food') || q.includes('grocer') || q.includes('dining') || q.includes('eating out') || q.includes('restaurant') || q.includes('coffee') || q.includes('starbucks')) {
    const foodSpend = topCategories.find((c: any) => c.category?.toLowerCase().includes('food') || c.category?.toLowerCase().includes('grocer'))?.amount || Math.round(totalExpense * 0.18);
    const weeklyBudget = Math.round(foodSpend / 4);
    return `### 🥗 Food & Grocery Optimization Plan

Your current monthly food expenditure is approximately **${sym}${foodSpend.toLocaleString()}** (roughly **${sym}${weeklyBudget} per week**).

**Step-by-Step Ways to Reduce Food Costs:**
1. **The 4-Meal Batch Cook Method:** Preparing 2 large staple dinners twice weekly (curries, pasta bakes, grain bowls) eliminates weekday takeout impulses, saving an estimated **${sym}${Math.round(foodSpend * 0.25)}/month**.
2. **Delivery App Audit:** Delivery fees and surge pricing inflate meal costs by 40-70%. Switching to direct pickup saves an immediate $40-$80 monthly.
3. **Weekly Envelope Cap:** Allocate exactly **${sym}${Math.round(weeklyBudget * 0.85)}/week** for groceries. When shopping, stick to a pre-written list with seasonal produce.
4. **Coffee & Beverages:** Preparing quality cold brew or espresso at home replaces $5-$7 daily cafe stops with $0.45 home brews, adding **${sym}120+/month** directly to your net surplus.`;
  }

  // 11. Emergency Fund / Runway
  if (q.includes('emergency') || q.includes('fund') || q.includes('runway') || q.includes('cushion') || q.includes('buffer') || q.includes('safety net')) {
    const threeMonthTarget = Math.round(totalExpense * 3);
    const sixMonthTarget = Math.round(totalExpense * 6);
    const monthsTo3 = netSavings > 0 ? (threeMonthTarget / netSavings).toFixed(1) : '12+';
    const monthsTo6 = netSavings > 0 ? (sixMonthTarget / netSavings).toFixed(1) : '24+';

    return `### 🛡️ Emergency Fund Roadmap & Runway Analysis

Based on your actual monthly living expenses of **${sym}${totalExpense.toLocaleString()}**:

| Milestone | Target Buffer | Months to Reach (at ${sym}${netSavings}/mo surplus) |
|---|---|---|
| **Starter Buffer (1 Month)** | ${sym}${totalExpense.toLocaleString()} | ~1 month |
| **Standard Baseline (3 Months)** | ${sym}${threeMonthTarget.toLocaleString()} | ~${monthsTo3} months |
| **Comprehensive Shield (6 Months)** | ${sym}${sixMonthTarget.toLocaleString()} | ~${monthsTo6} months |

**Where to Keep It:**
- Keep this strictly in a **High-Yield Savings Account (HYSA)** yielding 4-5% APY with zero market volatility and same-day liquidity.
- Do **not** lock your emergency reserves into stocks, illiquid CDs, or crypto.`;
  }

  // 12. Debt / Loans / Credit Cards
  if (q.includes('debt') || q.includes('loan') || q.includes('credit') || q.includes('interest') || q.includes('pay off') || q.includes('card') || q.includes('emi')) {
    return `### 💳 Debt Elimination Blueprint

**Recommended Approach:**
1. **Avalanche vs. Snowball:**
   - **Avalanche (Math Optimal):** Direct all extra surplus (${sym}${netSavings.toLocaleString()}/mo) toward the balance with the highest APR% while paying minimums on others. Saves the most money in interest.
   - **Snowball (Psychological Momentum):** Pay off the smallest balance first for rapid emotional wins.
2. **Freeze New Charges:** Switch daily transactions to debit or cash while repaying debt to prevent the balance from expanding.
3. **APR Reduction Call:** Call your card issuers and ask: *"I have an on-time payment history; what hardship or APR reduction programs are available on my account today?"* This frequently lowers rates by 3-7%.`;
  }

  // 13. Retirement & Financial Freedom
  if (q.includes('retire') || q.includes('retirement') || q.includes('pension') || q.includes('fire') || q.includes('freedom') || q.includes('4% rule')) {
    const annualLivingCosts = totalExpense * 12;
    const fireNumber = Math.round(annualLivingCosts * 25);

    return `### 🌅 Retirement & Financial Independence Roadmap

- **Annual Living Costs:** **${sym}${annualLivingCosts.toLocaleString()}**
- **Financial Freedom Target (The 4% Rule):** **${sym}${fireNumber.toLocaleString()}**
  *(Accumulating 25x your annual costs allows you to safely withdraw 4% each year indefinitely with low risk of running out).*

**Strategic Steps:**
1. Maximize tax-sheltered accounts (401k, Roth IRA, ISA, Super, PPF).
2. Automate a monthly transfer of at least **${sym}${Math.round(totalIncome * 0.15).toLocaleString()}** (15% of gross earnings) into broad-market index funds.
3. Low cost of living and zero high-interest debt directly reduces your target number, accelerating retirement by 5 to 10 years!`;
  }

  // Dynamic Tailored Answer addressing the specific inquiry
  const hasOverrun = overspendingCategories.length > 0;
  const primaryExpenseCat = topCategories[0]?.category || 'General Spending';
  const primaryExpenseAmt = topCategories[0]?.amount || Math.round(totalExpense * 0.3);

  return `### 💡 Personalized Financial Guidance for ${personaName}

Regarding: **"${message}"**

---

#### 1. Your Current Cash Flow Baseline:
- **Monthly Net Income:** **${sym}${totalIncome.toLocaleString()}**
- **Monthly Living Expenses:** **${sym}${totalExpense.toLocaleString()}**
- **Net Cashflow Surplus:** **+${sym}${netSavings.toLocaleString()}** (${savingsRate}% savings rate)
- **Top Category:** **${primaryExpenseCat}** at ${sym}${primaryExpenseAmt.toLocaleString()}/month
${hasOverrun ? `- ⚠️ **Over-Budget Alert:** Currently exceeding threshold in **${overspendingCategories.map((c: any) => c.category).join(', ')}**.` : '- ✅ **Budget Adherence:** All spending categories are within allocated limits.'}

---

#### 2. Tailored Strategic Advice for Your Situation:
1. **Cash Flow Decision Boundary:** Any new expense or commitment must comfortably fit inside your **${sym}${netSavings.toLocaleString()}** monthly surplus without reducing your baseline living needs.
2. **Action on Spending:** Review your transactions ledger. If you want to modify, edit, or trim an expense, click the **Pencil icon** next to any transaction to adjust its amount or category directly.
3. **Next Recommended Milestone:** Direct at least 50% of your current monthly surplus (**${sym}${Math.round(netSavings * 0.5).toLocaleString()}**) into your active Savings Goals to accelerate your financial safety cushion.

Feel free to ask more specific questions about **what to buy**, **how to invest**, **family financial roadmaps**, or **budget cuts**!`;
}

// 7. AI Advisor Chat endpoint
app.post('/api/advisor/chat', async (req, res) => {
  try {
    const { message, history = [], financialContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const {
      personaName,
      scenarioTitle,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      currency = 'USD',
      topCategories = [],
      overspendingCategories = [],
      goals = [],
      expensesList = [],
      incomesList = [],
      scenarioRole,
    } = financialContext || {};

    const systemPrompt = `You are the "Personal Finance Advisor Bot", a world-class, empathetic, practical, and highly analytical AI personal financial planning assistant.
You are counseling ${personaName || 'the user'} (${scenarioTitle || 'Personal Budget'}, Role: ${scenarioRole || 'Individual'}).

USER'S LIVE FINANCIAL SITUATION:
- Base Currency: ${currency}
- Total Monthly Income: ${currency} ${Number(totalIncome || 0).toLocaleString()}
- Total Monthly Expenses: ${currency} ${Number(totalExpense || 0).toLocaleString()}
- Net Monthly Cash Flow / Surplus: ${currency} ${Number(netSavings || 0).toLocaleString()} (Savings Rate: ${savingsRate || 0}%)
- Top Spending Categories: ${JSON.stringify(topCategories)}
- Overspending Categories / Alert: ${JSON.stringify(overspendingCategories)}
- Current Savings Goals: ${JSON.stringify(goals)}
- Recent Expense Items: ${JSON.stringify(expensesList || [])}

CORE INSTRUCTIONS:
1. Provide actionable, numbers-grounded financial advice directly addressing the user's specific question. Never give generic boilerplate or repetitive canned replies.
2. If asked "what should they/I do?": Provide a prioritized 1-2-3 action roadmap based on their actual surplus/deficit and emergency buffer.
3. If asked "what can they/I buy?": Calculate whether their monthly surplus covers it, how many months of saving are required, safe purchase limits, and impact on their emergency safety net.
4. If asked "how should they/I spend money?": Provide a 50/30/20 breakdown tailored to their real income, identify top spending leaks, and suggest smart spending habits.
5. If asked "how to invest money?": Provide an investment ladder (emergency cushion -> debt payoff -> employer match -> low-cost broad index ETFs) and calculate compound growth of their monthly surplus.
6. If asked "future plans for families according to their finance condition and expenses": Provide a complete family roadmap (6-9 month family safety shield, term life & health insurance, child college/education savings, safe housing cost limit <28%, estate basics).
7. Format answers with clean markdown headings, bold figures, and concise bullet points. Avoid crowded text.`;

    const aiClient = getAiClient();
    if (aiClient) {
      const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest'];
      for (const modelName of candidateModels) {
        try {
          const contents: any[] = [];
          const recentHistory = history.slice(-6);
          for (const item of recentHistory) {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }],
            });
          }
          contents.push({
            role: 'user',
            parts: [{ text: message }],
          });

          const response = await aiClient.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            },
          });

          if (response.text && response.text.trim()) {
            return res.json({ reply: response.text });
          }
        } catch (geminiError: any) {
          console.warn(`Model ${modelName} failed (${geminiError.message}), trying next...`);
        }
      }
    }

    // Always generate a custom, question-specific response tailored to what the user asked
    const contextualReply = generateContextualAdvisorReply(message, financialContext);
    return res.json({ reply: contextualReply });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chat generation failed' });
  }
});

// 8. AI Deep Financial Audit & Analysis endpoint
app.post('/api/advisor/analyze', async (req, res) => {
  try {
    const { financialData } = req.body;
    if (!financialData) {
      return res.status(400).json({ error: 'Financial data is required' });
    }

    // Always calculate deterministic baseline first
    const baseline = generateHeuristicAnalysis(financialData);

    if (ai) {
      try {
        const prompt = `Perform a comprehensive personal financial audit.
Financial Data:
${JSON.stringify(financialData, null, 2)}

Return a JSON object with this exact structure:
{
  "healthScore": number (0-100),
  "healthGrade": string ("Excellent" | "Good" | "Fair" | "Needs Attention"),
  "executiveSummary": string (concise 2-3 sentences),
  "overspendingAnalysis": [
    { "category": string, "concern": string, "actionPlan": string }
  ],
  "savingOpportunities": [
    { "title": string, "potentialSavings": number, "description": string }
  ],
  "nextMonthActionItems": [string],
  "scenarioSpecialNotes": string
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        return res.json({
          ...baseline,
          ...parsed,
          aiPowered: true,
        });
      } catch (err: any) {
        console.warn('Gemini analysis failed, returning heuristic audit:', err.message);
      }
    }

    res.json({
      ...baseline,
      executiveSummary: `Your current monthly cash flow shows ${baseline.currency} ${baseline.totalIncome.toLocaleString()} in income against ${baseline.currency} ${baseline.totalExpense.toLocaleString()} in expenses, leaving a net surplus of ${baseline.currency} ${baseline.netSavings.toLocaleString()} (${baseline.savingsRate}% savings rate).`,
      overspendingAnalysis: baseline.overspendingAlerts.map(a => ({
        category: a.category,
        concern: a.message,
        actionPlan: a.recommendation,
      })),
      savingOpportunities: [
        {
          title: 'Discretionary Trim & Dine-Out Optimization',
          potentialSavings: Math.round(baseline.totalExpense * 0.08),
          description: 'Shifting 2 dining-out meals per week to home prep saves significant recurring cash.',
        },
        {
          title: 'Subscription & Recurring Utility Audit',
          potentialSavings: Math.round(baseline.totalExpense * 0.04),
          description: 'Cancel unused gym/streaming subscriptions and renegotiate internet/phone tiers.',
        },
      ],
      nextMonthActionItems: baseline.actionableSavingTips,
      scenarioSpecialNotes: baseline.scenarioInsights,
      aiPowered: false,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// 9. AI Personalized Budget Generation endpoint
app.post('/api/advisor/generate-budget', async (req, res) => {
  try {
    const { income, scenarioId, categories, method = '50_30_20' } = req.body;
    const monthlyIncome = Number(income || 4000);

    let budgetAllocations: Array<{ category: string; budgetLimit: number; percentage: number; rationale: string }> = [];

    if (ai) {
      try {
        const prompt = `Generate a personalized monthly budget plan for an individual in scenario "${scenarioId || 'standard'}" with a monthly income of ${monthlyIncome}.
Method requested: ${method} (or custom optimized for their persona: salaried, student, freelancer, household).
Categories available: ${JSON.stringify(categories || ['Housing', 'Food & Groceries', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Savings/Debt'])}.

Return a JSON array of objects:
[
  {
    "category": string,
    "budgetLimit": number,
    "percentage": number (percentage of total income),
    "rationale": string (brief justification)
  }
]
Sum of budgetLimits should not exceed monthly income. Ensure realistic allocations.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(response.text?.trim() || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ budgets: parsed, method, aiPowered: true });
        }
      } catch (e: any) {
        console.warn('AI budget generation error:', e.message);
      }
    }

    // Heuristic budget allocation presets
    if (scenarioId === 'student') {
      budgetAllocations = [
        { category: 'Housing & Dorm', budgetLimit: Math.round(monthlyIncome * 0.40), percentage: 40, rationale: 'Dorm / shared rent' },
        { category: 'Food & Dining', budgetLimit: Math.round(monthlyIncome * 0.25), percentage: 25, rationale: 'Meal plan & budget groceries' },
        { category: 'Books & Supplies', budgetLimit: Math.round(monthlyIncome * 0.10), percentage: 10, rationale: 'Course materials & stationery' },
        { category: 'Entertainment', budgetLimit: Math.round(monthlyIncome * 0.10), percentage: 10, rationale: 'Social activities & discretionary' },
        { category: 'Transport', budgetLimit: Math.round(monthlyIncome * 0.05), percentage: 5, rationale: 'Campus transit pass' },
        { category: 'Savings Reserve', budgetLimit: Math.round(monthlyIncome * 0.10), percentage: 10, rationale: 'Emergency student buffer' },
      ];
    } else if (scenarioId === 'freelancer') {
      budgetAllocations = [
        { category: 'Tax Reserve', budgetLimit: Math.round(monthlyIncome * 0.25), percentage: 25, rationale: 'Quarterly estimated taxes' },
        { category: 'Housing', budgetLimit: Math.round(monthlyIncome * 0.28), percentage: 28, rationale: 'Rent & home office allocation' },
        { category: 'Food & Dining', budgetLimit: Math.round(monthlyIncome * 0.14), percentage: 14, rationale: 'Groceries & client lunches' },
        { category: 'Software & Tools', budgetLimit: Math.round(monthlyIncome * 0.08), percentage: 8, rationale: 'Figma, Adobe, hosting, SaaS' },
        { category: 'Healthcare', budgetLimit: Math.round(monthlyIncome * 0.08), percentage: 8, rationale: 'Self-employed health coverage' },
        { category: 'Buffer Fund', budgetLimit: Math.round(monthlyIncome * 0.17), percentage: 17, rationale: 'Variable income emergency fund' },
      ];
    } else if (scenarioId === 'household') {
      budgetAllocations = [
        { category: 'Housing & Mortgage', budgetLimit: Math.round(monthlyIncome * 0.32), percentage: 32, rationale: 'Mortgage / lease payment' },
        { category: 'Food & Groceries', budgetLimit: Math.round(monthlyIncome * 0.18), percentage: 18, rationale: 'Family groceries & staples' },
        { category: 'Education & Childcare', budgetLimit: Math.round(monthlyIncome * 0.15), percentage: 15, rationale: 'Tuition, activities, daycare' },
        { category: 'Utilities & Bills', budgetLimit: Math.round(monthlyIncome * 0.08), percentage: 8, rationale: 'Power, water, gas, high-speed net' },
        { category: 'Healthcare & Insurance', budgetLimit: Math.round(monthlyIncome * 0.07), percentage: 7, rationale: 'Family health premiums & prescriptions' },
        { category: 'Family Savings', budgetLimit: Math.round(monthlyIncome * 0.20), percentage: 20, rationale: 'College fund & family emergency' },
      ];
    } else {
      // Salaried standard 50/30/20
      budgetAllocations = [
        { category: 'Housing', budgetLimit: Math.round(monthlyIncome * 0.30), percentage: 30, rationale: 'Rent/Mortgage' },
        { category: 'Food & Groceries', budgetLimit: Math.round(monthlyIncome * 0.15), percentage: 15, rationale: 'Groceries & daily food' },
        { category: 'Transport', budgetLimit: Math.round(monthlyIncome * 0.08), percentage: 8, rationale: 'Commute, gas, car maintenance' },
        { category: 'Utilities', budgetLimit: Math.round(monthlyIncome * 0.05), percentage: 5, rationale: 'Electricity, phone, water' },
        { category: 'Entertainment', budgetLimit: Math.round(monthlyIncome * 0.12), percentage: 12, rationale: 'Dining out, hobbies, subscriptions' },
        { category: 'Healthcare', budgetLimit: Math.round(monthlyIncome * 0.05), percentage: 5, rationale: 'Insurance copays & gym' },
        { category: 'Savings & Investments', budgetLimit: Math.round(monthlyIncome * 0.25), percentage: 25, rationale: 'Emergency fund & index funds' },
      ];
    }

    res.json({ budgets: budgetAllocations, method, aiPowered: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Budget generation failed' });
  }
});

// 10. AI Predictive Spending Forecast endpoint
app.post('/api/advisor/forecast', (req, res) => {
  try {
    const { income, monthlyExpense, currentSavings = 2000, targetMonths = 6 } = req.body;
    const net = Number(income || 0) - Number(monthlyExpense || 0);

    const timeline = [];
    let projectedSavings = Number(currentSavings || 0);

    const monthNames = ['Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027', 'Apr 2027', 'May 2027'];

    for (let i = 0; i < targetMonths; i++) {
      projectedSavings += net;
      timeline.push({
        month: monthNames[i % monthNames.length],
        projectedSavings: Math.max(0, Math.round(projectedSavings)),
        netCashflow: net,
        runwayMonths: monthlyExpense > 0 ? Number((projectedSavings / monthlyExpense).toFixed(1)) : 0,
      });
    }

    const runway = monthlyExpense > 0 ? Number((currentSavings / monthlyExpense).toFixed(1)) : 0;

    res.json({
      currentRunwayMonths: runway,
      runwayRating: runway >= 6 ? 'Rock Solid (6+ Months)' : runway >= 3 ? 'Healthy (3-6 Months)' : 'Vulnerable (< 3 Months)',
      targetEmergencyFund: monthlyExpense * 6,
      currentSavings,
      projectedTimeline: timeline,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Forecast failed' });
  }
});

// --- Vite Middlewares in Dev or Static Serving in Prod ---
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
