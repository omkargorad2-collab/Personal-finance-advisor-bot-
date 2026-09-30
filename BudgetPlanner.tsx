import React, { useState } from 'react';
import { BudgetCategory, Expense, PersonaScenario } from '../types';
import { CURRENCY_SYMBOLS, COMMON_CATEGORIES } from '../data/mockData';
import { generateAiBudget } from '../services/api';
import { CircularProgressRing, CircularDonutChart } from './CircularCharts';
import { 
  Layers, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sliders, 
  RotateCcw, 
  TrendingDown, 
  Check, 
  Loader2,
  PieChart,
  Pencil
} from 'lucide-react';

interface BudgetPlannerProps {
  budgets: BudgetCategory[];
  expenses: Expense[];
  monthlyIncome: number;
  scenario: PersonaScenario;
  currency: string;
  onUpdateBudgets: (newBudgets: BudgetCategory[]) => void;
  onAskAdvisor: (question: string) => void;
  onDeleteExpense?: (id: string) => void;
  onEditExpense?: (expense: Expense) => void;
  onOpenAddExpense?: () => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  budgets,
  expenses,
  monthlyIncome,
  scenario,
  currency,
  onUpdateBudgets,
  onAskAdvisor,
  onDeleteExpense,
  onEditExpense,
  onOpenAddExpense,
}) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'50_30_20' | 'zero_based' | 'scenario_tailored'>('scenario_tailored');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newLimitValue, setNewLimitValue] = useState<number>(0);
  const [budgetViewMode, setBudgetViewMode] = useState<'circular' | 'standard'>('circular');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // New category form
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryLimit, setNewCategoryLimit] = useState<number | ''>('');

  // AI Proposal preview state
  const [aiProposal, setAiProposal] = useState<Array<{ category: string; budgetLimit: number; percentage: number; rationale: string }> | null>(null);

  // Calculate actual spending per category
  const categorySpent: Record<string, number> = {};
  for (const exp of expenses) {
    const cat = exp.category || 'Other';
    categorySpent[cat] = (categorySpent[cat] || 0) + Number(exp.amount || 0);
  }

  // Budget calculations
  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.budgetLimit || 0), 0);
  const totalSpent = Object.values(categorySpent).reduce((acc, val) => acc + val, 0);
  const unallocatedIncome = monthlyIncome - totalBudgeted;

  // Overspending categories
  const overspentBudgets = budgets.filter((b) => (categorySpent[b.category] || 0) > b.budgetLimit);

  // Colors for category donut slices
  const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316'];

  // Donut slices for budgeted allocations
  const budgetDonutSlices = budgets.map((b, idx) => ({
    label: b.category,
    value: b.budgetLimit,
    color: b.color || categoryColors[idx % categoryColors.length],
    formattedValue: `${currencySymbol}${b.budgetLimit.toLocaleString()}`,
  }));

  // Trigger AI Budget Generation
  const handleGenerateAiBudget = async () => {
    setIsGeneratingAi(true);
    try {
      const categories = budgets.map((b) => b.category);
      const generated = await generateAiBudget(monthlyIncome, scenario.id, categories, selectedMethod);
      if (generated && generated.length > 0) {
        setAiProposal(generated);
      }
    } catch (e) {
      console.error('Failed to generate AI budget:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Apply AI Generated Plan
  const handleApplyAiProposal = () => {
    if (!aiProposal) return;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#6366f1'];
    const updated: BudgetCategory[] = aiProposal.map((prop, idx) => ({
      id: `b-ai-${idx}-${Date.now()}`,
      category: prop.category,
      budgetLimit: prop.budgetLimit,
      period: 'monthly',
      color: colors[idx % colors.length],
      rationale: prop.rationale,
    }));
    onUpdateBudgets(updated);
    setAiProposal(null);
  };

  // Save manual limit edit
  const handleSaveEdit = (id: string) => {
    const updated = budgets.map((b) => (b.id === id ? { ...b, budgetLimit: Number(newLimitValue) } : b));
    onUpdateBudgets(updated);
    setEditingCategoryId(null);
  };

  // Delete category
  const handleDeleteCategory = (id: string) => {
    const updated = budgets.filter((b) => b.id !== id);
    onUpdateBudgets(updated);
  };

  // Add custom category
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName || !newCategoryLimit || Number(newCategoryLimit) <= 0) return;

    const newCategory: BudgetCategory = {
      id: `b-custom-${Date.now()}`,
      category: newCategoryName,
      budgetLimit: Number(newCategoryLimit),
      period: 'monthly',
      color: '#3b82f6',
    };

    onUpdateBudgets([...budgets, newCategory]);
    setNewCategoryName('');
    setNewCategoryLimit('');
    setShowAddCategory(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Income & Budget Allocation Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Personalized Budget Planner</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                {scenario.personaName} Profile
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Control category thresholds, monitor circular usage dials, and auto-balance with Gemini AI
            </p>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Budget Framework"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="scenario_tailored">Persona-Optimized ({scenario.title.split(':')[1]?.trim()})</option>
              <option value="50_30_20">50/30/20 Standard Rule</option>
              <option value="zero_based">Zero-Based Envelope Method</option>
            </select>

            <button
              onClick={handleGenerateAiBudget}
              disabled={isGeneratingAi}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Auto-Generate Budget</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Dual Layout: Donut Chart of Planned Budget & Linear Summary */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <CircularDonutChart
              slices={budgetDonutSlices}
              size={130}
              thickness={18}
              centerTitle={`${currencySymbol}${totalBudgeted.toLocaleString()}`}
              centerSubtitle="Budgeted"
            />
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block">Total Budget Allocation:</span>
              <div className="text-xl font-bold text-white">
                {currencySymbol}{totalBudgeted.toLocaleString()}
                <span className="text-xs font-normal text-slate-400 ml-1">/ {currencySymbol}{monthlyIncome.toLocaleString()}</span>
              </div>
              <div className="text-[11px]">
                {totalBudgeted > monthlyIncome ? (
                  <span className="text-rose-400 font-semibold">
                    Over-allocated by {currencySymbol}{(totalBudgeted - monthlyIncome).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold">
                    {currencySymbol}{unallocatedIncome.toLocaleString()} unallocated / free cashflow
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-start">
            <div className="text-center md:text-left">
              <span className="text-[11px] text-slate-400 block">Actual Spent</span>
              <span className="text-lg font-bold text-rose-400">{currencySymbol}{totalSpent.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block">To date</span>
            </div>
            <CircularProgressRing
              percentage={monthlyIncome > 0 ? (totalSpent / monthlyIncome) * 100 : 0}
              size={58}
              strokeWidth={5}
              color={totalSpent > totalBudgeted ? '#f43f5e' : '#10b981'}
              sublabel="Spent"
            />
          </div>
        </div>
      </div>

      {/* AI Proposal Modal / Banner */}
      {aiProposal && (
        <div className="bg-indigo-950/40 border border-indigo-700 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <div>
                <h3 className="text-sm font-bold text-white">Gemini AI Personalized Budget Proposal</h3>
                <p className="text-xs text-indigo-300">
                  Calculated based on {scenario.title} income volatility and historical category spending
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiProposal(null)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
              <button
                onClick={handleApplyAiProposal}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply This Budget Plan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiProposal.map((prop, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-indigo-900/60 rounded-xl p-3 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">{prop.category}</span>
                  <span className="text-indigo-300 font-bold">{currencySymbol}{prop.budgetLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{prop.percentage}% of Income</span>
                </div>
                {prop.rationale && (
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800 mt-1">
                    "{prop.rationale}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Category Collapsible Form */}
      {showAddCategory && (
        <form onSubmit={handleAddCategorySubmit} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Add Custom Budget Category</h4>
            <button
              type="button"
              onClick={() => setShowAddCategory(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Pet Care, Vacation Fund, Gym"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Monthly Limit ({currencySymbol})</label>
              <input
                type="number"
                step="1"
                min="1"
                required
                placeholder="0"
                value={newCategoryLimit}
                onChange={(e) => setNewCategoryLimit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Save Category
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Overspending Banner Alert if any */}
      {overspentBudgets.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Budget Overrun:</strong> Spending in <strong>{overspentBudgets.map((b) => b.category).join(', ')}</strong> has exceeded the set limit.
            </span>
          </div>
          <button
            onClick={() => onAskAdvisor(`How can I immediately reduce my overspending in ${overspentBudgets.map((b) => b.category).join(', ')}?`)}
            className="text-rose-400 font-bold hover:underline shrink-0"
          >
            Ask AI for Fix &rarr;
          </button>
        </div>
      )}

      {/* Categories Grid with Circular Progress Dials or Clean Empty State */}
      {budgets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">No Budget Envelopes Created Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              You are in clean canvas mode with zero automatic budgets. Add custom category limits for your actual expenses (like Rent, Groceries, Dining Out, Utilities) with full manual control.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Custom Category</span>
            </button>
            <button
              onClick={() => {
                const inc = monthlyIncome > 0 ? monthlyIncome : 3000;
                onUpdateBudgets([
                  { id: `b-${Date.now()}-1`, category: 'Housing & Rent', budgetLimit: Math.round(inc * 0.35), period: 'monthly', color: '#6366f1' },
                  { id: `b-${Date.now()}-2`, category: 'Food & Groceries', budgetLimit: Math.round(inc * 0.18), period: 'monthly', color: '#10b981' },
                  { id: `b-${Date.now()}-3`, category: 'Transportation', budgetLimit: Math.round(inc * 0.10), period: 'monthly', color: '#f59e0b' },
                  { id: `b-${Date.now()}-4`, category: 'Discretionary / Personal', budgetLimit: Math.round(inc * 0.15), period: 'monthly', color: '#ec4899' },
                ]);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Generate 50/30/20 Suggested Guidelines</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
          const spent = categorySpent[b.category] || 0;
          const remaining = b.budgetLimit - spent;
          const ratio = b.budgetLimit > 0 ? Math.round((spent / b.budgetLimit) * 100) : 0;
          const isOver = spent > b.budgetLimit;
          const isEditing = editingCategoryId === b.id;

          const ringColor = isOver ? '#f43f5e' : ratio >= 85 ? '#f59e0b' : '#10b981';

          return (
            <div
              key={b.id}
              className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition-all ${
                isOver ? 'border-rose-800/80 shadow-rose-950/20 shadow-md' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{b.category}</h4>
                  {b.rationale && (
                    <span className="text-[11px] text-slate-400 block line-clamp-1">
                      {b.rationale}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCategoryId(b.id);
                      setNewLimitValue(b.budgetLimit);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Edit limit"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(b.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                    title="Remove category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Edit Limit Mode */}
              {isEditing ? (
                <div className="bg-slate-850 p-2 rounded-xl flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">{currencySymbol}</span>
                  <input
                    type="number"
                    value={newLimitValue}
                    onChange={(e) => setNewLimitValue(Number(e.target.value))}
                    className="w-full bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(b.id)}
                    className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                /* Stats Row with Circular Ring Gauge */
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Spent / Limit</span>
                    <span className={`text-base font-bold ${isOver ? 'text-rose-400' : 'text-slate-200'}`}>
                      {currencySymbol}{spent.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium block">
                      of {currencySymbol}{b.budgetLimit.toLocaleString()} limit
                    </span>
                    <span className={`text-[11px] font-semibold block mt-1 ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isOver ? `-${currencySymbol}${Math.abs(remaining).toLocaleString()} Over` : `${currencySymbol}${remaining.toLocaleString()} left`}
                    </span>
                  </div>

                  <CircularProgressRing
                    percentage={ratio}
                    size={64}
                    strokeWidth={6}
                    color={ringColor}
                    sublabel="Spent"
                  />
                </div>
              )}

              {/* Linear Progress Track */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ratio)}%`,
                      backgroundColor: ringColor,
                    }}
                  />
                </div>
              </div>

              {/* Over-Budget Scenario Quick Fix Recommendation */}
              {(() => {
                const catExpenses = expenses.filter(
                  (e) => e.category.toLowerCase() === b.category.toLowerCase()
                );
                const highestExp = [...catExpenses].sort((x, y) => y.amount - x.amount)[0];

                return (
                  <div className="space-y-2 pt-1 border-t border-slate-800/80">
                    {isOver && highestExp && onDeleteExpense && (
                      <div className="bg-rose-950/40 border border-rose-800/60 p-2 rounded-xl text-[11px] flex items-center justify-between gap-2">
                        <div>
                          <span className="text-rose-300 font-semibold block">⚠️ Scenario Overrun</span>
                          <span className="text-slate-300 block line-clamp-1">
                            Cut "{highestExp.description}" (-{currencySymbol}{highestExp.amount.toLocaleString()})
                          </span>
                        </div>
                        <button
                          onClick={() => onDeleteExpense(highestExp.id)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                          title="Remove this expense to fix budget"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <button
                        onClick={() =>
                          setExpandedCategoryId(expandedCategoryId === b.id ? null : b.id)
                        }
                        className="hover:text-slate-200 underline"
                      >
                        {expandedCategoryId === b.id
                          ? 'Hide Expenses'
                          : `View Expenses (${catExpenses.length})`}
                      </button>
                      {onOpenAddExpense && (
                        <button
                          onClick={onOpenAddExpense}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          + Add Expense
                        </button>
                      )}
                    </div>

                    {expandedCategoryId === b.id && (
                      <div className="pt-2 space-y-1.5 animate-in fade-in max-h-40 overflow-y-auto pr-1">
                        {catExpenses.length === 0 ? (
                          <span className="text-[11px] text-slate-500 block text-center py-1">
                            No expenses logged in this category.
                          </span>
                        ) : (
                          catExpenses.map((exp) => (
                            <div
                              key={exp.id}
                              className="flex items-center justify-between text-[11px] bg-slate-850 p-2 rounded-lg border border-slate-800"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="text-slate-200 font-medium block truncate">
                                  {exp.description}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{exp.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-rose-400 font-bold pr-0.5">
                                  -{currencySymbol}{exp.amount.toLocaleString()}
                                </span>
                                {onEditExpense && (
                                  <button
                                    onClick={() => onEditExpense(exp)}
                                    className="p-1 text-slate-400 hover:text-indigo-400 rounded"
                                    title="Modify / Edit expense"
                                    aria-label="Modify / Edit expense"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                                {onDeleteExpense && (
                                  <button
                                    onClick={() => onDeleteExpense(exp.id)}
                                    className="p-1 text-slate-500 hover:text-rose-400 rounded"
                                    title="Remove expense"
                                    aria-label="Remove expense"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
