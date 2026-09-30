import React, { useState } from 'react';
import { PersonaScenario, Income, Expense, BudgetCategory, SavingsGoal } from '../types';
import { evaluateScenarioProfile, ExpenseRemovalCandidate } from '../utils/scenarioAdvisor';
import { 
  Sparkles, 
  Trash2, 
  Scissors, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  HelpCircle, 
  Zap, 
  ChevronRight,
  Info
} from 'lucide-react';

interface ScenarioExpenseAdvisorProps {
  scenario: PersonaScenario;
  incomes: Income[];
  expenses: Expense[];
  budgets: BudgetCategory[];
  goals: SavingsGoal[];
  currency: string;
  onOpenAddExpense: () => void;
  onDeleteExpense: (id: string) => void;
  onUpdateExpense?: (updated: Expense) => void;
  onAskAdvisor: (question: string) => void;
  className?: string;
}

export const ScenarioExpenseAdvisor: React.FC<ScenarioExpenseAdvisorProps> = ({
  scenario,
  incomes,
  expenses,
  budgets,
  goals,
  currency,
  onOpenAddExpense,
  onDeleteExpense,
  onUpdateExpense,
  onAskAdvisor,
  className = '',
}) => {
  const [removedNotification, setRemovedNotification] = useState<string | null>(null);

  const assessment = evaluateScenarioProfile(scenario, incomes, expenses, budgets, goals, currency);
  const {
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
    financialConditionName,
    conditionVolatility,
    conditionKeyRisk,
    conditionTone,
  } = assessment;

  // Handle direct expense removal with instant feedback
  const handleRemoveCandidate = (candidate: ExpenseRemovalCandidate) => {
    onDeleteExpense(candidate.expense.id);
    const newNet = netSavings + candidate.expense.amount;
    const newRate = totalIncome > 0 ? ((newNet / totalIncome) * 100).toFixed(1) : '0';
    setRemovedNotification(
      `Removed "${candidate.expense.description}"! Reclaimed ${currencySymbol}${candidate.expense.amount.toLocaleString()}/mo. Scenario savings rate increased to ${newRate}%.`
    );
    setTimeout(() => {
      setRemovedNotification(null);
    }, 6000);
  };

  // Handle trimming an expense by 50%
  const handleTrimHalf = (candidate: ExpenseRemovalCandidate) => {
    if (!onUpdateExpense) {
      // Fallback if not provided: delete and let user add half
      handleRemoveCandidate(candidate);
      return;
    }
    const newAmount = Math.round(candidate.expense.amount / 2);
    const updated: Expense = {
      ...candidate.expense,
      amount: newAmount,
      notes: `${candidate.expense.notes || ''} (Trimmed by 50% based on ${scenario.personaName} scenario advice)`.trim(),
    };
    onUpdateExpense(updated);
    setRemovedNotification(
      `Trimmed "${candidate.expense.description}" by 50% to ${currencySymbol}${newAmount.toLocaleString()}! Reclaimed ${currencySymbol}${(candidate.expense.amount - newAmount).toLocaleString()}/mo.`
    );
    setTimeout(() => {
      setRemovedNotification(null);
    }, 6000);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'excellent':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'good':
        return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'warning':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'deficit':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      default:
        return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
    }
  };

  return (
    <div className={`bg-gradient-to-b from-slate-900 to-slate-925 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5 ${className}`}>
      {/* Dynamic Removal Notification Alert */}
      {removedNotification && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-top-2 shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{removedNotification}</span>
          </div>
          <button
            onClick={() => setRemovedNotification(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs px-2 py-0.5"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header with Persona & Health Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0 hover:scale-105 transition-transform">
            {scenario.avatar || '👤'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                {scenario.personaName} Scenario Advisor
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {scenario.role}
              </span>
              {scenario.isCustom && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Custom Profile
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized expense advice, removal recommendations, and live cashflow optimization
            </p>
          </div>
        </div>

        {/* Top Actions: Add Expense & Health Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-xl font-semibold border flex items-center gap-1.5 transition-all shadow-xs ${getStatusColor()}`}>
            {status === 'excellent' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {status === 'good' && <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />}
            {status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
            {status === 'deficit' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
            {status === 'clean_slate' && <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />}
            <span>{statusTitle}</span>
          </span>

          <button
            onClick={onOpenAddExpense}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all hover:scale-102 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Live Financial Condition Monitor Card (Animated) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-4 shadow-inner">
        {/* Subtle decorative glowing animated orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: '3s' }} />
        <div className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-2xl pointer-events-none animate-pulse ${netSavings >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`} style={{ animationDuration: '4s' }} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Live pulsing radar beacon */}
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  netSavings >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  netSavings >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                Financial Condition Analysis
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[11px] font-medium text-slate-400">
                {conditionVolatility}
              </span>
            </div>

            <h4 className="text-sm font-extrabold text-white flex items-center gap-2 tracking-tight">
              <span>{financialConditionName}</span>
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {scenario.scenarioSummary}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5 flex-wrap">
              <span className="font-semibold text-slate-300">Primary Stress Factor:</span>
              <span className="text-amber-400 font-medium">{conditionKeyRisk}</span>
              <span className="text-slate-600">·</span>
              <span>Target Runway: <strong className="text-white">{recommendedRunwayMonths} months</strong></span>
            </div>
          </div>

          {/* Animated Cashflow Momentum Indicator */}
          <div className="shrink-0 self-start md:self-center">
            <div className={`p-3 rounded-xl border flex items-center gap-3 backdrop-blur-xs transition-all ${
              netSavings >= 0
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20 shadow-sm'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300 shadow-rose-950/20 shadow-sm'
            }`}>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-700/60 shrink-0">
                {netSavings >= 0 ? (
                  <span className="text-emerald-400 font-bold text-sm animate-bounce">↑</span>
                ) : (
                  <span className="text-rose-400 font-bold text-sm animate-bounce">↓</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Live Cash Momentum
                </span>
                <span className="text-xs font-bold whitespace-nowrap">
                  {netSavings >= 0 ? (
                    <span className="text-emerald-400">+{currencySymbol}{netSavings.toLocaleString()} / mo surplus</span>
                  ) : (
                    <span className="text-rose-400">-{currencySymbol}{Math.abs(netSavings).toLocaleString()} / mo deficit</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Health & Key Ratios Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-850/80 p-3.5 rounded-xl border border-slate-800">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Monthly Cashflow</span>
          <span className={`text-sm font-bold ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netSavings >= 0 ? '+' : ''}{currencySymbol}{netSavings.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {currencySymbol}{totalIncome.toLocaleString()} inc / {currencySymbol}{totalExpense.toLocaleString()} exp
          </span>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Savings Rate</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${savingsRate >= targetSavingsRate ? 'text-emerald-400' : savingsRate > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {savingsRate}%
            </span>
            <span className="text-[10px] text-slate-400">
              (Target: {targetSavingsRate}%)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {scenario.role} benchmark
          </span>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Emergency Runway</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${runwayMonths >= recommendedRunwayMonths ? 'text-emerald-400' : runwayMonths >= 1 ? 'text-amber-400' : 'text-rose-400'}`}>
              {runwayMonths} mos
            </span>
            <span className="text-[10px] text-slate-400">
              (Target: {recommendedRunwayMonths}m)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Buffer for {scenario.personaName}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-400 block">50 / 30 / 20 Ratio</span>
          <span className="text-xs font-semibold text-slate-200">
            {needsRatio}% N / {wantsRatio}% W / {savingsRatio}% S
          </span>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden flex">
            <div style={{ width: `${Math.min(100, needsRatio)}%` }} className="bg-blue-500" title={`Needs: ${needsRatio}%`} />
            <div style={{ width: `${Math.min(100, wantsRatio)}%` }} className="bg-amber-500" title={`Wants: ${wantsRatio}%`} />
            <div style={{ width: `${Math.min(100, savingsRatio)}%` }} className="bg-emerald-500" title={`Savings: ${savingsRatio}%`} />
          </div>
        </div>
      </div>

      {/* Scenario Summary */}
      {statusSummary && (
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          💡 <strong className="text-white">Profile Context:</strong> {statusSummary}
        </p>
      )}

      {/* Section: Recommended Expenses to Remove / Trim */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Recommended Expenses to Remove / Trim for this Scenario
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Tailored to optimize {scenario.personaName}’s savings
          </span>
        </div>

        {removalCandidates.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-850/50 border border-slate-800 text-center text-xs text-slate-400">
            {expenses.length === 0 ? (
              <span>No expenses logged yet. Tap <strong>"+ Add Expense"</strong> to log your spending and receive scenario trimming recommendations.</span>
            ) : (
              <span>🎉 Excellent expense control! No high-risk discretionary or over-budget items identified for your {scenario.role} scenario.</span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {removalCandidates.slice(0, 4).map((candidate) => (
              <div
                key={candidate.expense.id}
                className="bg-slate-850/90 border border-slate-800 hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-lg p-3.5 rounded-xl flex flex-col justify-between gap-3 transition-all duration-200 shadow-xs group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Animated attention ping for candidate to cut */}
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                        </span>
                        <span className="font-semibold text-white text-xs">
                          {candidate.expense.description}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                          {candidate.expense.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Log date: {candidate.expense.date} • {candidate.expense.paymentMethod}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-rose-400 block">
                        -{currencySymbol}{candidate.expense.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400">
                        +{candidate.impactSavingsBoost}% savings boost
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800 leading-relaxed">
                    🎯 {candidate.reason}
                  </p>
                </div>

                {/* Direct Action Buttons: Remove & Trim */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Saves {currencySymbol}{candidate.annualSavings.toLocaleString()}/yr
                  </span>

                  <div className="flex items-center gap-1.5">
                    {onUpdateExpense && (
                      <button
                        onClick={() => handleTrimHalf(candidate)}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-amber-500/30 transition-all cursor-pointer"
                        title="Cut this expense in half"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Trim 50%</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveCandidate(candidate)}
                      className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 active:scale-95 text-rose-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-rose-500/30 transition-all cursor-pointer"
                      title="Remove this expense completely"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Remove Expense</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Best Advice for Overall Scenario */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Best Advice for your Overall Profile Scenario
            </h4>
          </div>
          <button
            onClick={() => onAskAdvisor(`Based on my overall profile as ${scenario.role} with income ${currencySymbol}${totalIncome} and expenses ${currencySymbol}${totalExpense}, what are the best ways to optimize my cash flow and savings?`)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Ask AI Advisor</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bestAdvice.map((item) => (
            <div
              key={item.id}
              className="bg-slate-850/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {item.title}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.advice}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
