import React, { useState } from 'react';
import { SavingsGoal, PersonaScenario } from '../types';
import { CURRENCY_SYMBOLS } from '../data/mockData';
import { CircularProgressRing, GaugeMeter } from './CircularCharts';
import confetti from 'canvas-confetti';
import { 
  Target, 
  ShieldCheck, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  CheckCircle, 
  Trash2, 
  DollarSign, 
  Clock, 
  Activity,
  Sliders,
  PieChart
} from 'lucide-react';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  monthlyExpense: number;
  monthlyIncome: number;
  scenario: PersonaScenario;
  currency: string;
  onUpdateGoals: (newGoals: SavingsGoal[]) => void;
  onOpenAddGoal: () => void;
  onAskAdvisor: (question: string) => void;
}

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  goals,
  monthlyExpense,
  monthlyIncome,
  scenario,
  currency,
  onUpdateGoals,
  onOpenAddGoal,
  onAskAdvisor,
}) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  // Selected contribution amount for quick deposit modal/input
  const [depositAmount, setDepositAmount] = useState<Record<string, number>>({});
  // Emergency Fund Simulator target months
  const [simulatedMonths, setSimulatedMonths] = useState<number>(6);
  // View mode: circular dials vs linear cards
  const [viewMode, setViewMode] = useState<'circular' | 'standard'>('circular');

  // Total current reserves
  const totalSaved = goals.reduce((acc, g) => acc + Number(g.currentAmount || 0), 0);
  const totalTarget = goals.reduce((acc, g) => acc + Number(g.targetAmount || 0), 0);
  const currentRunway = monthlyExpense > 0 ? Number((totalSaved / monthlyExpense).toFixed(1)) : 0;
  const overallFundedPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // Handle deposit into a specific goal
  const handleQuickDeposit = (goalId: string, customAmount?: number) => {
    const amountToAdd = customAmount || depositAmount[goalId] || 100;
    if (amountToAdd <= 0) return;

    let reachedMilestone = false;

    const updated = goals.map((g) => {
      if (g.id === goalId) {
        const nextAmount = g.currentAmount + amountToAdd;
        if (nextAmount >= g.targetAmount && g.currentAmount < g.targetAmount) {
          reachedMilestone = true;
        }
        return {
          ...g,
          currentAmount: nextAmount,
        };
      }
      return g;
    });

    onUpdateGoals(updated);
    setDepositAmount((prev) => ({ ...prev, [goalId]: 0 }));

    // Trigger celebratory confetti
    confetti({
      particleCount: reachedMilestone ? 120 : 40,
      spread: reachedMilestone ? 80 : 50,
      origin: { y: 0.7 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899'],
    });
  };

  // Delete goal
  const handleDeleteGoal = (id: string) => {
    onUpdateGoals(goals.filter((g) => g.id !== id));
  };

  // Calculate monthly contribution needed to meet target date
  const calculateMonthlyNeeded = (goal: SavingsGoal) => {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    if (remaining === 0) return 0;

    const target = new Date(goal.targetDate).getTime();
    const now = new Date().getTime();
    const diffMonths = Math.max(1, Math.round((target - now) / (1000 * 60 * 60 * 24 * 30)));

    return Math.round(remaining / diffMonths);
  };

  // Target Emergency Fund required for simulated months
  const simulatedTargetFund = Math.round(monthlyExpense * simulatedMonths);
  const emergencyShortfall = Math.max(0, simulatedTargetFund - totalSaved);

  return (
    <div className="space-y-6">
      {/* Top Banner: Emergency Runway Meter with Circular Dial */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Emergency Fund & Goal Simulator</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live financial safety runway, circular goal rings, and 1-tap milestone deposits
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('circular')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'circular'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Circular Rings</span>
              </button>
              <button
                onClick={() => setViewMode('standard')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === 'standard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Standard</span>
              </button>
            </div>

            <button
              onClick={() => onAskAdvisor(`Analyze my emergency fund runway of ${currentRunway} months and tell me how to build resilience faster.`)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Advice</span>
            </button>
            <button
              onClick={onOpenAddGoal}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </button>
          </div>
        </div>

        {/* Emergency Runway Gauge Card Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800 items-center">
          {/* Circular Gauge for Runway */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Liquid Safety Runway</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-emerald-400">{currentRunway}</span>
                <span className="text-xs font-semibold text-slate-400">Months</span>
              </div>
              <span className={`text-[11px] font-bold mt-1 inline-block ${
                currentRunway >= 6
                  ? 'text-emerald-400'
                  : currentRunway >= 3
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {currentRunway >= 6 ? '● Rock Solid (6+ mo)' : currentRunway >= 3 ? '● Normal Baseline' : '● Vulnerable'}
              </span>
            </div>
            <CircularProgressRing
              percentage={Math.min(100, (currentRunway / 6) * 100)}
              size={68}
              strokeWidth={7}
              color={currentRunway >= 6 ? '#10b981' : currentRunway >= 3 ? '#f59e0b' : '#f43f5e'}
              sublabel="6mo Goal"
            />
          </div>

          {/* Overall Capital with Circular Ring */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Total Accumulated</span>
              <div className="text-xl font-bold text-white">
                {currencySymbol}{totalSaved.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Target: {currencySymbol}{totalTarget.toLocaleString()}
              </span>
            </div>
            <CircularProgressRing
              percentage={overallFundedPercent}
              size={68}
              strokeWidth={7}
              color="#6366f1"
              sublabel="Funded"
            />
          </div>

          {/* Target Month Simulation Slider */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Target Coverage</span>
              <span className="text-xs font-bold text-indigo-400">{simulatedMonths} Months</span>
            </div>
            <input
              aria-label="Runway Simulation Target Months"
              type="range"
              min="1"
              max="12"
              step="1"
              value={simulatedMonths}
              onChange={(e) => setSimulatedMonths(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
              <span>Req: {currencySymbol}{simulatedTargetFund.toLocaleString()}</span>
              <span className={emergencyShortfall > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {emergencyShortfall > 0 ? `Short: ${currencySymbol}${emergencyShortfall.toLocaleString()}` : 'Target Met!'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Cards Grid with Circular Rings or Clean Empty State */}
      {goals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No Savings Goals Active</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Zero automatic goals are set. You have complete freedom to define targets for emergency cushion, travel, debt payoff, or long-term investments.
            </p>
          </div>
          <button
            onClick={onOpenAddGoal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 inline-flex items-center gap-1.5 cursor-pointer mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Custom Savings Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          const monthlyReq = calculateMonthlyNeeded(goal);

          return (
            <div
              key={goal.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all relative overflow-hidden ${
                isCompleted
                  ? 'border-emerald-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{goal.title}</span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        Target Achieved!
                      </span>
                    )}
                  </div>
                  {goal.notes && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">
                      "{goal.notes}"
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                  title="Remove goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Numbers + Circular Progress Ring */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Accumulated Balance</span>
                    <span className="text-2xl font-extrabold text-white">
                      {currencySymbol}{goal.currentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Target: <strong className="text-slate-300">{currencySymbol}{goal.targetAmount.toLocaleString()}</strong>
                  </div>
                  {!isCompleted && (
                    <div className="text-[11px] text-slate-500">
                      Remaining: {currencySymbol}{(goal.targetAmount - goal.currentAmount).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Circular Ring */}
                <CircularProgressRing
                  percentage={progress}
                  size={76}
                  strokeWidth={7}
                  color={isCompleted ? '#10b981' : progress >= 75 ? '#14b8a6' : '#6366f1'}
                  sublabel="Funded"
                />
              </div>

              {/* Linear Progress Bar (secondary) */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isCompleted ? 'bg-emerald-400' : progress >= 70 ? 'bg-teal-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Timeline & Monthly Target */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target: <strong className="text-slate-200">{goal.targetDate}</strong></span>
                </div>
                {!isCompleted && monthlyReq > 0 && (
                  <span className="text-indigo-300 font-semibold">
                    ~{currencySymbol}{monthlyReq.toLocaleString()}/mo needed
                  </span>
                )}
              </div>

              {/* Quick Deposit Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => handleQuickDeposit(goal.id, 50)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  +{currencySymbol}50
                </button>
                <button
                  onClick={() => handleQuickDeposit(goal.id, 200)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  +{currencySymbol}200
                </button>
                <button
                  onClick={() => handleQuickDeposit(goal.id, 500)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  +{currencySymbol}500
                </button>

                <div className="flex-1 flex items-center gap-1 justify-end">
                  <input
                    aria-label="Custom Deposit Amount"
                    type="number"
                    min="1"
                    placeholder="Custom"
                    value={depositAmount[goal.id] || ''}
                    onChange={(e) => setDepositAmount({ ...depositAmount, [goal.id]: Number(e.target.value) })}
                    className="w-20 bg-slate-800 text-xs px-2 py-1 rounded-lg border border-slate-700 text-white focus:outline-none"
                  />
                  <button
                    onClick={() => handleQuickDeposit(goal.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Deposit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
