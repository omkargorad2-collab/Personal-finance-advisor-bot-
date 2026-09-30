import React, { useState } from 'react';
import { PersonaScenario, Income, Expense, BudgetCategory, SavingsGoal } from '../types';
import { CURRENCY_SYMBOLS } from '../data/mockData';
import { CircularDonutChart, CircularProgressRing } from './CircularCharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  PieChart, 
  Tag, 
  Bot, 
  PlusCircle,
  HelpCircle,
  Zap,
  Sliders,
  Trash2,
  Pencil,
  RotateCcw
} from 'lucide-react';

interface DashboardProps {
  scenario: PersonaScenario;
  incomes: Income[];
  expenses: Expense[];
  budgets: BudgetCategory[];
  goals: SavingsGoal[];
  currency: string;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenAiAudit: () => void;
  onNavigateToTab: (tab: string) => void;
  onAskAdvisor: (question: string) => void;
  onDeleteExpense?: (id: string) => void;
  onUpdateExpense?: (updated: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
  onQuickLogExpense?: (description: string, amount: number, category: string, isEssential: boolean) => void;
  onOpenCreateProfile?: () => void;
  onOpenResetProfile?: () => void;
  onClearData?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  scenario,
  incomes,
  expenses,
  budgets,
  goals,
  currency,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenAiAudit,
  onNavigateToTab,
  onAskAdvisor,
  onDeleteExpense,
  onUpdateExpense,
  onEditExpense,
  onQuickLogExpense,
  onOpenCreateProfile,
  onOpenResetProfile,
  onClearData,
}) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  // Chart view mode toggle: circular donut vs bars
  const [chartMode, setChartMode] = useState<'circular' | 'bars'>('circular');
  // Simple view vs detailed mode
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [quickLogSuccess, setQuickLogSuccess] = useState<string | null>(null);
  const [recentActionNotice, setRecentActionNotice] = useState<string | null>(null);

  // Totals calculations
  const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

  // Essential vs Discretionary
  const essentialExpenses = expenses
    .filter((e) => e.isEssential)
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const discretionaryExpenses = totalExpense - essentialExpenses;
  const essentialPercent = totalIncome > 0 ? Math.round((essentialExpenses / totalIncome) * 100) : 0;
  const discretionaryPercent = totalIncome > 0 ? Math.round((discretionaryExpenses / totalIncome) * 100) : 0;

  // Category totals
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    const cat = exp.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount || 0);
  }

  // Color palette for circular donut slices
  const sliceColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
  ];

  // Sorted categories
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt], idx) => ({
      category: cat,
      amount: amt,
      percentage: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0,
      color: sliceColors[idx % sliceColors.length],
    }));

  // Slices formatted for CircularDonutChart
  const donutSlices = sortedCategories.map((item) => ({
    label: item.category,
    value: item.amount,
    color: item.color,
    formattedValue: `${currencySymbol}${item.amount.toLocaleString()}`,
  }));

  // Overspending detection against budgets
  const overspendingCategories = budgets
    .map((b) => {
      const spent = categoryTotals[b.category] || 0;
      const overrun = spent - b.budgetLimit;
      const pct = b.budgetLimit > 0 ? Math.round((spent / b.budgetLimit) * 100) : 0;
      return {
        category: b.category,
        budgetLimit: b.budgetLimit,
        spent,
        overrun,
        percentage: pct,
        isOver: overrun > 0,
        isWarning: pct >= 85 && overrun <= 0,
      };
    })
    .filter((b) => b.isOver || b.isWarning)
    .sort((a, b) => b.overrun - a.overrun);

  // Emergency runway calculation
  const totalSavedSoFar = goals.reduce((acc, g) => acc + Number(g.currentAmount || 0), 0);
  const runwayMonths = totalExpense > 0 ? Number((totalSavedSoFar / totalExpense).toFixed(1)) : 0;

  // Simple safe to spend daily allowance
  const daysInMonth = 30;
  const currentDay = Math.min(27, new Date().getDate());
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const remainingBudget = Math.max(0, netSavings);
  const safeDailySpend = Math.round(remainingBudget / daysRemaining);

  return (
    <div className="space-y-6">
      {/* Clean Dashboard Executive Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
            {scenario.avatar || '👤'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                {scenario.personaName}
              </h2>
              <span className="text-xs text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded font-semibold border border-indigo-800/60">
                {scenario.role}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                netSavings >= 0 ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-rose-950/80 text-rose-400 border-rose-800'
              }`}>
                {netSavings >= 0 ? `+${currencySymbol}${netSavings.toLocaleString()} / mo Surplus` : `-${currencySymbol}${Math.abs(netSavings).toLocaleString()} / mo Deficit`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal cashflow, spending breakdown, and emergency reserves.
            </p>
          </div>
        </div>

        {/* Clean Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddExpense}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
          <button
            onClick={onOpenAddIncome}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Income</span>
          </button>
          <button
            onClick={() => onAskAdvisor(`Review my current financial condition with income of ${currencySymbol}${totalIncome} and expenses of ${currencySymbol}${totalExpense}. What should I focus on?`)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Ask AI</span>
          </button>

          {onOpenResetProfile && (
            <button
              onClick={onOpenResetProfile}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700/80 shadow-xs transition-colors cursor-pointer"
              title="Reset profile data, clean slate, or restore baseline"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reset Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Core Financial Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Monthly Income */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Monthly Income</span>
              <span className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-900/50">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {currencySymbol}{totalIncome.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>{incomes.length} Active Stream{incomes.length !== 1 ? 's' : ''}</span>
            <button onClick={onOpenAddIncome} className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">
              + Add
            </button>
          </div>
        </div>

        {/* Card 2: Total Monthly Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Monthly Expenses</span>
              <span className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-900/50">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {currencySymbol}{totalExpense.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>{essentialPercent}% Needs • {discretionaryPercent}% Wants</span>
            <button onClick={onOpenAddExpense} className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer">
              + Log
            </button>
          </div>
        </div>

        {/* Card 3: Net Cashflow (Surplus/Deficit) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Net Monthly Cashflow</span>
              <span className={`p-1.5 rounded-lg border ${
                netSavings >= 0 ? 'bg-emerald-950/80 text-emerald-400 border-emerald-900/50' : 'bg-rose-950/80 text-rose-400 border-rose-900/50'
              }`}>
                {netSavings >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </span>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netSavings >= 0 ? '+' : ''}{currencySymbol}{netSavings.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Savings Rate:</span>
            <span className={`font-bold ${savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {savingsRate}%
            </span>
          </div>
        </div>

        {/* Card 4: Emergency Cushion & Runway */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Emergency Buffer</span>
              <span className="p-1.5 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-900/50">
                <HelpCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {runwayMonths} <span className="text-sm font-normal text-slate-400">Months</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Buffer: {currencySymbol}{totalSavedSoFar.toLocaleString()}</span>
            <span className="text-indigo-400 font-semibold">{safeDailySpend > 0 ? `${currencySymbol}${safeDailySpend}/day` : ''}</span>
          </div>
        </div>
      </div>

      {/* Overspending Alerts Section */}
      {overspendingCategories.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-900/60 rounded-2xl p-4 shadow-md">
          <div className="flex items-start sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <h3 className="text-sm font-bold text-rose-200">
                Overspending Alerts Detected ({overspendingCategories.length} Categories)
              </h3>
            </div>
            <button
              onClick={() =>
                onAskAdvisor(
                  `I am overspending in ${overspendingCategories.map((c) => c.category).join(', ')}. What are concrete adjustments I can make to get back on track?`
                )
              }
              className="text-xs font-semibold text-rose-300 bg-rose-900/50 hover:bg-rose-900/80 px-3 py-1 rounded-lg border border-rose-700/60 flex items-center gap-1.5 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              Ask AI Advisor for Fix
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overspendingCategories.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-rose-900/40 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">{item.category}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      item.isOver ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {item.percentage}% of Budget
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Spent: <span className="text-slate-200 font-medium">{currencySymbol}{item.spent.toLocaleString()}</span> / Limit: {currencySymbol}{item.budgetLimit.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  {item.isOver ? (
                    <span className="text-xs font-bold text-rose-400 block">
                      +{currencySymbol}{item.overrun.toLocaleString()} Over
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-400 block">
                      Near Limit
                    </span>
                  )}
                  <button
                    onClick={() => onNavigateToTab('budget')}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 underline mt-0.5"
                  >
                    Adjust Budget
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Visual Section: Circular Spending Donut Chart & Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category Spending with Circular Donut or Bar Toggle */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                Category Spending Distribution
              </h3>
              <p className="text-xs text-slate-400">Circular breakdown of where your money went this month</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartMode('circular')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartMode === 'circular' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                Circular Donut
              </button>
              <button
                onClick={() => setChartMode('bars')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  chartMode === 'bars' ? 'bg-slate-800 text-indigo-400 border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                Progress Bars
              </button>
            </div>
          </div>

          {/* Circular Donut View or Clean Empty State */}
          {sortedCategories.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-3 bg-slate-850/60 rounded-xl border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400">
                <PieChart className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No Expenses Recorded Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Clean canvas active with zero automatic mock data. Log your first expense or tap a Quick Log button below to populate your circular category chart.
              </p>
              <button
                onClick={onOpenAddExpense}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Log First Expense</span>
              </button>
            </div>
          ) : chartMode === 'circular' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Center Donut */}
              <div className="flex flex-col items-center justify-center p-2">
                <CircularDonutChart
                  slices={donutSlices}
                  size={210}
                  thickness={26}
                  centerTitle={`${currencySymbol}${totalExpense.toLocaleString()}`}
                  centerSubtitle="Total Expenses"
                />
                <span className="text-[11px] text-slate-400 mt-2">
                  Hover slices for details
                </span>
              </div>

              {/* Category Legend & Mini Circular Progress Rings */}
              <div className="space-y-2.5">
                {sortedCategories.slice(0, 5).map((item, idx) => {
                  const matchingBudget = budgets.find((b) => b.category === item.category);
                  const limit = matchingBudget?.budgetLimit || item.amount;
                  const ratio = Math.min(100, Math.round((item.amount / limit) * 100));
                  const isOver = item.amount > limit;

                  return (
                    <div
                      key={idx}
                      className="bg-slate-850 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <span className="text-xs font-semibold text-white block">{item.category}</span>
                          <span className="text-[11px] text-slate-400">
                            {currencySymbol}{item.amount.toLocaleString()} ({item.percentage}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CircularProgressRing
                          percentage={ratio}
                          size={40}
                          strokeWidth={4}
                          color={isOver ? '#f43f5e' : item.color}
                        />
                        <div className="text-right text-[11px]">
                          <span className={isOver ? 'text-rose-400 font-bold block' : 'text-slate-400 block'}>
                            {ratio}%
                          </span>
                          <span className="text-[10px] text-slate-500">of budget</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Bar view alternative */
            <div className="space-y-3">
              {sortedCategories.slice(0, 6).map((item, idx) => {
                const matchingBudget = budgets.find((b) => b.category === item.category);
                const budgetLimit = matchingBudget?.budgetLimit || item.amount;
                const ratio = Math.min(100, Math.round((item.amount / budgetLimit) * 100));
                const isOver = item.amount > budgetLimit;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">
                          {currencySymbol}{item.amount.toLocaleString()} ({item.percentage}%)
                        </span>
                        {matchingBudget && (
                          <span className={`text-[11px] font-semibold ${isOver ? 'text-rose-400' : 'text-slate-500'}`}>
                            / {currencySymbol}{matchingBudget.budgetLimit.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${ratio}%`,
                          backgroundColor: isOver ? '#f43f5e' : item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 50 / 30 / 20 Rule Analysis with 3 Circular Rings! */}
          <div className="border-t border-slate-800 pt-4 mt-4">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-semibold text-slate-300">50/30/20 Financial Health Framework:</span>
              <span className="text-slate-400">Needs vs. Wants vs. Savings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Needs Ring */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex items-center gap-3">
                <CircularProgressRing
                  percentage={essentialPercent}
                  size={64}
                  strokeWidth={6}
                  color="#3b82f6"
                  sublabel="Needs"
                />
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Essential Needs</span>
                  <span className="text-sm font-bold text-white block">
                    {currencySymbol}{essentialExpenses.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-blue-400 block mt-0.5">
                    Target: ≤ 50% ({essentialPercent}%)
                  </span>
                </div>
              </div>

              {/* Wants Ring */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex items-center gap-3">
                <CircularProgressRing
                  percentage={discretionaryPercent}
                  size={64}
                  strokeWidth={6}
                  color="#8b5cf6"
                  sublabel="Wants"
                />
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Discretionary</span>
                  <span className="text-sm font-bold text-white block">
                    {currencySymbol}{discretionaryExpenses.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-purple-400 block mt-0.5">
                    Target: ≤ 30% ({discretionaryPercent}%)
                  </span>
                </div>
              </div>

              {/* Savings Ring */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex items-center gap-3">
                <CircularProgressRing
                  percentage={savingsRate}
                  size={64}
                  strokeWidth={6}
                  color="#10b981"
                  sublabel="Save"
                />
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Net Savings</span>
                  <span className={`text-sm font-bold block ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currencySymbol}{netSavings.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    Target: ≥ 20% ({savingsRate}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Strategy & Goal Circular Trackers */}
        <div className="space-y-4">
          {/* AI Recommended Strategy Card */}
          <div className="bg-gradient-to-b from-indigo-950/70 to-slate-900 border border-indigo-800/60 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-300">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">AI Advice for {scenario.personaName}</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-indigo-900/40">
              "{scenario.recommendedStrategy}"
            </p>
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick AI Questions:
              </span>
              <button
                onClick={() => onAskAdvisor(`Analyze my ${scenario.title} spending pattern and give me 3 specific ways to save $250 more this month.`)}
                className="w-full text-left text-xs bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-700/80 transition-colors flex items-center justify-between"
              >
                <span>💡 How can I save $250 more this month?</span>
                <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
              </button>
              <button
                onClick={() => onAskAdvisor(`Given my monthly income of ${currencySymbol}${totalIncome}, how should I rebalance my budget limits?`)}
                className="w-full text-left text-xs bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-slate-700/80 transition-colors flex items-center justify-between"
              >
                <span>📊 Optimal budget distribution for my income</span>
                <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
              </button>
            </div>
          </div>

          {/* Active Savings Goals with Circular Progress Rings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Priority Savings Goals
              </h4>
              <button
                onClick={() => onNavigateToTab('savings')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                View All &rarr;
              </button>
            </div>
            <div className="space-y-2.5">
              {goals.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-850/60 rounded-xl border border-slate-800 space-y-2">
                  <p>No active savings goals.</p>
                  <button
                    onClick={() => onNavigateToTab('savings')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    + Add a goal &rarr;
                  </button>
                </div>
              ) : (
                goals.slice(0, 2).map((goal) => {
                  const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  return (
                    <div key={goal.id} className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-200 text-xs block">{goal.title}</span>
                        <span className="text-[11px] text-slate-400">
                          {currencySymbol}{goal.currentAmount.toLocaleString()} / {currencySymbol}{goal.targetAmount.toLocaleString()}
                        </span>
                      </div>
                      <CircularProgressRing
                        percentage={pct}
                        size={46}
                        strokeWidth={4.5}
                        color="#10b981"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Snippet */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {recentActionNotice && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between">
            <span>{recentActionNotice}</span>
            <button onClick={() => setRecentActionNotice(null)} className="text-emerald-400 hover:text-white">&times;</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Add, track, and remove expenses across your scenario</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenAddExpense}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Expense</span>
            </button>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Open Transaction Manager &rarr;
            </button>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-850/50 rounded-xl border border-slate-800">
            No expenses logged yet. Tap <strong>"+ Add Expense"</strong> above to record your spending with zero automatic mock data.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 overflow-x-auto">
            {expenses.slice(0, 6).map((exp) => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between gap-4 text-xs group">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-medium shrink-0">
                    {exp.category.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-200">{exp.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{exp.date}</span>
                      <span>•</span>
                      <span>{exp.category}</span>
                      <span>•</span>
                      <span className={exp.isEssential ? 'text-blue-400 font-medium' : 'text-amber-400 font-medium'}>
                        {exp.isEssential ? 'Essential Need' : 'Discretionary'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-bold text-rose-400 text-sm whitespace-nowrap pr-1">
                    -{currencySymbol}{exp.amount.toLocaleString()}
                  </span>
                  {onEditExpense && (
                    <button
                      onClick={() => onEditExpense(exp)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title="Modify / Edit this expense"
                      aria-label="Modify / Edit this expense"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteExpense && (
                    <button
                      onClick={() => {
                        onDeleteExpense(exp.id);
                        setRecentActionNotice(`Removed "${exp.description}"! Reclaimed ${currencySymbol}${exp.amount.toLocaleString()} in your ${scenario.personaName} scenario.`);
                        setTimeout(() => setRecentActionNotice(null), 5000);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Remove this expense"
                      aria-label="Remove this expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
