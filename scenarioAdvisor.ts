import { PersonaScenario, Income, Expense, BudgetCategory, SavingsGoal } from '../types';
import { CURRENCY_SYMBOLS } from '../data/mockData';

export interface ExpenseRemovalCandidate {
  expense: Expense;
  reason: string;
  impactSavingsBoost: number; // e.g. +3.5%
  annualSavings: number;
  runwayDaysAdded: number;
  badge: 'Highest Discretionary' | 'Over Budget' | 'Recurring Want' | 'Quick Win';
}

export interface ScenarioAdviceItem {
  id: string;
  title: string;
  advice: string;
  category: 'expense_cut' | 'runway' | 'allocation' | 'tactical';
  priority: 'high' | 'medium' | 'info';
  badge: string;
}

export interface ScenarioOverallAssessment {
  scenario: PersonaScenario;
  financialConditionName: string;
  conditionVolatility: string;
  conditionKeyRisk: string;
  conditionTone: 'growth' | 'shield' | 'frugal' | 'balance';
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  needsRatio: number;
  wantsRatio: number;
  savingsRatio: number;
  runwayMonths: number;
  status: 'excellent' | 'good' | 'warning' | 'deficit' | 'clean_slate';
  statusTitle: string;
  statusSummary: string;
  bestAdvice: ScenarioAdviceItem[];
  removalCandidates: ExpenseRemovalCandidate[];
  targetSavingsRate: number;
  recommendedRunwayMonths: number;
  currencySymbol: string;
}

export function evaluateScenarioProfile(
  scenario: PersonaScenario,
  incomes: Income[],
  expenses: Expense[],
  budgets: BudgetCategory[],
  goals: SavingsGoal[],
  currency: string
): ScenarioOverallAssessment {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

  // Essential (Needs) vs Discretionary (Wants)
  const essentialExpenses = expenses
    .filter((e) => e.isEssential)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const discretionaryExpenses = expenses
    .filter((e) => !e.isEssential)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const needsRatio = totalIncome > 0 ? Math.round((essentialExpenses / totalIncome) * 100) : 0;
  const wantsRatio = totalIncome > 0 ? Math.round((discretionaryExpenses / totalIncome) * 100) : 0;
  const savingsRatio = Math.max(0, savingsRate);

  // Liquid savings from goals or estimate
  const liquidSavings = goals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0);
  const runwayMonths = totalExpense > 0 ? Number((liquidSavings / totalExpense).toFixed(1)) : (liquidSavings > 0 ? 12 : 0);

  // Target rates and financial condition based on scenario archetype
  let targetSavingsRate = 20;
  let recommendedRunwayMonths = 3;
  let financialConditionName = 'Fixed Salary · Structured Cashflow Stability';
  let conditionVolatility = 'Low Volatility (Predictable Paycheck)';
  let conditionKeyRisk = 'Lifestyle Creep & Discretionary Dining Spikes';
  let conditionTone: 'growth' | 'shield' | 'frugal' | 'balance' = 'growth';

  const sId = (scenario.id || '').toLowerCase();
  const roleLower = (scenario.role || '').toLowerCase();

  if (sId === 'freelancer' || roleLower.includes('freelance') || roleLower.includes('contract') || roleLower.includes('designer') || roleLower.includes('consultant')) {
    targetSavingsRate = 25;
    recommendedRunwayMonths = 6;
    financialConditionName = 'Variable Inflow · High Cashflow Volatility';
    conditionVolatility = 'High Volatility (Fluctuating Client Invoices)';
    conditionKeyRisk = 'Income Lulls & Under-reserving for Taxes';
    conditionTone = 'shield';
  } else if (sId === 'student' || roleLower.includes('student') || roleLower.includes('intern')) {
    targetSavingsRate = 12;
    recommendedRunwayMonths = 2;
    financialConditionName = 'Tight Allowance · Frugal Living & Cost Cap';
    conditionVolatility = 'Fixed Moderate (Allowance & Campus Job)';
    conditionKeyRisk = 'Impulse Dining Orders & Rapid Buffer Depletion';
    conditionTone = 'frugal';
  } else if (sId === 'household' || roleLower.includes('family') || roleLower.includes('household') || roleLower.includes('parent')) {
    targetSavingsRate = 20;
    recommendedRunwayMonths = 4;
    financialConditionName = 'Multi-Dependent Family · High Fixed Overhead';
    conditionVolatility = 'Moderate (Dual-Income Multi-Stream)';
    conditionKeyRisk = 'Simultaneous Utility, Grocery, & Healthcare Spikes';
    conditionTone = 'balance';
  } else if (scenario.isCustom) {
    targetSavingsRate = 20;
    recommendedRunwayMonths = 3;
    financialConditionName = `Custom Condition · ${scenario.role}`;
    conditionVolatility = 'User-Defined Cashflow';
    conditionKeyRisk = 'Discretionary Wants Ratio Exceeding 30%';
    conditionTone = 'balance';
  }

  // Determine status
  let status: ScenarioOverallAssessment['status'] = 'good';
  let statusTitle = 'Healthy Cashflow Profile';
  let statusSummary = '';

  if (totalIncome === 0 && totalExpense === 0) {
    status = 'clean_slate';
    statusTitle = 'Clean Blank Canvas Ready';
    statusSummary = `Start adding your real income and expenses. The system will customize advice to your role as ${scenario.role}.`;
  } else if (totalExpense > totalIncome && totalIncome > 0) {
    status = 'deficit';
    statusTitle = 'Monthly Cash Deficit Detected';
    statusSummary = `You are spending ${currencySymbol}${(totalExpense - totalIncome).toLocaleString()} more than your monthly earnings. Immediate expense trimming is required to stabilize your scenario.`;
  } else if (savingsRate < (targetSavingsRate * 0.5) && totalIncome > 0) {
    status = 'warning';
    statusTitle = 'Below Recommended Savings Pace';
    statusSummary = `Your ${savingsRate}% savings rate is below the recommended ${targetSavingsRate}% benchmark for ${scenario.role}. Cutting discretionary expenses can close this gap quickly.`;
  } else if (savingsRate >= targetSavingsRate) {
    status = 'excellent';
    statusTitle = 'Optimal Scenario Health';
    statusSummary = `Outstanding discipline! You are exceeding the ${targetSavingsRate}% target with a ${savingsRate}% savings rate. Maintain your runway buffer and invest surplus capital.`;
  } else {
    status = 'good';
    statusTitle = 'Stable Scenario Trajectory';
    statusSummary = `You have a positive monthly surplus of ${currencySymbol}${netSavings.toLocaleString()} (${savingsRate}% rate). Focus on trimming small recurring wants to hit ${targetSavingsRate}%.`;
  }

  // Over-budget categories calculation
  const categorySpent: Record<string, number> = {};
  for (const exp of expenses) {
    categorySpent[exp.category] = (categorySpent[exp.category] || 0) + Number(exp.amount || 0);
  }

  const overBudgetCategories = new Set(
    budgets.filter((b) => (categorySpent[b.category] || 0) > b.budgetLimit).map((b) => b.category)
  );

  // Identify Candidate Expenses to Remove / Trim
  const removalCandidates: ExpenseRemovalCandidate[] = [];

  // Sort candidate expenses:
  // 1. Non-essential expenses in over-budget categories
  // 2. High-dollar non-essential expenses
  // 3. Other non-essential expenses
  const candidatesList = expenses.filter((e) => !e.isEssential || overBudgetCategories.has(e.category));

  // Sort by amount descending
  candidatesList.sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));

  for (const exp of candidatesList.slice(0, 5)) {
    const amt = Number(exp.amount || 0);
    const boost = totalIncome > 0 ? Number(((amt / totalIncome) * 100).toFixed(1)) : 0;
    const annualSavings = amt * 12;
    const dailyExpenseBurn = totalExpense > 0 ? totalExpense / 30 : 1;
    const runwayDaysAdded = Math.round(amt / dailyExpenseBurn);

    let badge: ExpenseRemovalCandidate['badge'] = 'Recurring Want';
    let reason = '';

    if (overBudgetCategories.has(exp.category)) {
      badge = 'Over Budget';
      reason = `This expense is pushing "${exp.category}" past its monthly budget limit. Removing or replacing this frees ${currencySymbol}${amt.toLocaleString()}.`;
    } else if (!exp.isEssential && amt >= (totalExpense * 0.08)) {
      badge = 'Highest Discretionary';
      reason = `Largest non-essential purchase this month. Eliminating this single item boosts your savings rate by +${boost}%.`;
    } else if (amt <= 40) {
      badge = 'Quick Win';
      reason = `Low-hanging fruit: removing this recurring charge saves ${currencySymbol}${annualSavings.toLocaleString()} every year without impacting your lifestyle.`;
    } else {
      badge = 'Recurring Want';
      reason = `Discretionary cost under ${exp.category}. Removing this accelerates your ${scenario.personaName} financial safety buffer.`;
    }

    // Role-specific customized flavor
    if (sId === 'freelancer' || roleLower.includes('freelance')) {
      reason += ` Gives your variable-income buffer +${runwayDaysAdded} days of runway peace-of-mind.`;
    } else if (sId === 'student' || roleLower.includes('student')) {
      reason += ` Protects your tight student monthly allowance from early depletion.`;
    } else if (sId === 'household' || roleLower.includes('family')) {
      reason += ` Reclaims ${currencySymbol}${annualSavings.toLocaleString()}/yr for family safety cushions or college funds.`;
    }

    removalCandidates.push({
      expense: exp,
      reason,
      impactSavingsBoost: boost,
      annualSavings,
      runwayDaysAdded,
      badge,
    });
  }

  // Generate Best Scenario Advice Items
  const bestAdvice: ScenarioAdviceItem[] = [];

  // Advice 1: Profile Scenario Archetype Strategy
  if (sId === 'student' || roleLower.includes('student')) {
    bestAdvice.push({
      id: 'adv-1',
      title: 'Cap Discretionary Meals & Utilize Campus Perks',
      advice: `As a student managing tight allowances, food & leisure represent your biggest risk zone. Prep meals at home 3 days a week to save ~${currencySymbol}${Math.round((discretionaryExpenses || 120) * 0.4)}/mo, and stick to a strict 10% cash buffer.`,
      category: 'expense_cut',
      priority: 'high',
      badge: 'Student Frugality Rule',
    });
  } else if (sId === 'freelancer' || roleLower.includes('freelance') || roleLower.includes('designer')) {
    bestAdvice.push({
      id: 'adv-1',
      title: 'Maintain 6-Month Buffer & Isolate 28% Tax Reserve',
      advice: `Freelance income varies by client cycles. Base your baseline lifestyle strictly on your low-earning months (${currencySymbol}${Math.round(totalIncome * 0.75)}). Sweep all invoice surpluses directly into your tax reserve and liquid emergency buffer.`,
      category: 'runway',
      priority: 'high',
      badge: 'Freelancer Volatility Shield',
    });
  } else if (sId === 'household' || roleLower.includes('family')) {
    bestAdvice.push({
      id: 'adv-1',
      title: 'Bulk Family Grocery Planning & Subscription Audit',
      advice: `For household operations with multi-category dependencies, coordinate a single weekly supermarket trip with a predetermined list. Eliminating duplicate streaming services saves an estimated ${currencySymbol}450 annually.`,
      category: 'expense_cut',
      priority: 'high',
      badge: 'Family Efficiency Rule',
    });
  } else {
    bestAdvice.push({
      id: 'adv-1',
      title: `${scenario.role} 50/30/20 Strategy`,
      advice: `Your current breakdown is ${needsRatio}% Needs, ${wantsRatio}% Wants, and ${savingsRatio}% Savings. Target allocations are 50% Needs, 30% Wants, and 20% Savings to build sustainable long-term wealth.`,
      category: 'allocation',
      priority: 'high',
      badge: 'Core Ratio Framework',
    });
  }

  // Advice 2: Expense Removal & Trimming Recommendation
  if (removalCandidates.length > 0) {
    const topCand = removalCandidates[0];
    bestAdvice.push({
      id: 'adv-2',
      title: `Top Expense to Remove: "${topCand.expense.description}"`,
      advice: `Eliminating this ${currencySymbol}${topCand.expense.amount.toLocaleString()} discretionary expense will immediately boost your savings rate by +${topCand.impactSavingsBoost}% and free up ${currencySymbol}${topCand.annualSavings.toLocaleString()} in annual capital for ${scenario.personaName}.`,
      category: 'expense_cut',
      priority: 'high',
      badge: 'High Impact Cut',
    });
  } else if (totalExpense > 0) {
    bestAdvice.push({
      id: 'adv-2',
      title: 'Lean Expense Base Maintained',
      advice: `No egregious discretionary overspending detected. Keep logging every transaction manually to prevent invisible lifestyle inflation.`,
      category: 'tactical',
      priority: 'info',
      badge: 'Discipline Maintained',
    });
  }

  // Advice 3: Emergency Runway & Savings Goal
  if (runwayMonths < recommendedRunwayMonths && totalExpense > 0) {
    const needed = Math.round((recommendedRunwayMonths - runwayMonths) * totalExpense);
    bestAdvice.push({
      id: 'adv-3',
      title: `Build Your Runway to ${recommendedRunwayMonths} Months`,
      advice: `Your current liquid reserves cover ${runwayMonths} months of living costs. For a ${scenario.role}, target ${recommendedRunwayMonths} months (${currencySymbol}${Math.round(recommendedRunwayMonths * totalExpense).toLocaleString()}). Channel all removed expenses directly into this buffer.`,
      category: 'runway',
      priority: 'medium',
      badge: 'Emergency Cushion',
    });
  } else if (runwayMonths >= recommendedRunwayMonths) {
    bestAdvice.push({
      id: 'adv-3',
      title: `Strong Emergency Buffer: ${runwayMonths} Months Covered`,
      advice: `Your safety cushion is fully funded. Surplus monthly cash above ${currencySymbol}${Math.round(totalExpense * 1.2)} can now be directed into high-yield savings or long-term growth investments.`,
      category: 'tactical',
      priority: 'info',
      badge: 'Capital Surplus',
    });
  }

  // Advice 4: Next Actionable Step
  if (overBudgetCategories.size > 0) {
    const cats = Array.from(overBudgetCategories).join(', ');
    bestAdvice.push({
      id: 'adv-4',
      title: `Freeze Discretionary Spend in: ${cats}`,
      advice: `You have breached limits in ${cats}. Enforce a 48-hour cooling-off rule before purchasing any non-essential item in these categories for the rest of this month.`,
      category: 'tactical',
      priority: 'high',
      badge: 'Budget Re-alignment',
    });
  }

  return {
    scenario,
    financialConditionName,
    conditionVolatility,
    conditionKeyRisk,
    conditionTone,
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    needsRatio,
    wantsRatio,
    savingsRatio,
    runwayMonths,
    status,
    statusTitle,
    statusSummary,
    bestAdvice,
    removalCandidates,
    targetSavingsRate,
    recommendedRunwayMonths,
    currencySymbol,
  };
}
