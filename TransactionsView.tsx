import React, { useState } from 'react';
import { Expense, Income, PersonaScenario, BudgetCategory, SavingsGoal } from '../types';
import { CURRENCY_SYMBOLS } from '../data/mockData';
import { ScenarioExpenseAdvisor } from './ScenarioExpenseAdvisor';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Trash2, 
  ArrowDownRight, 
  ArrowUpRight, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Scissors,
  Sparkles,
  Pencil
} from 'lucide-react';

interface TransactionsViewProps {
  expenses: Expense[];
  incomes: Income[];
  currency: string;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onDeleteExpense: (id: string) => void;
  onDeleteIncome: (id: string) => void;
  scenario?: PersonaScenario;
  budgets?: BudgetCategory[];
  goals?: SavingsGoal[];
  onUpdateExpense?: (updated: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
  onAskAdvisor?: (question: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  expenses,
  incomes,
  currency,
  onOpenAddExpense,
  onOpenAddIncome,
  onDeleteExpense,
  onDeleteIncome,
  scenario,
  budgets = [],
  goals = [],
  onUpdateExpense,
  onEditExpense,
  onAskAdvisor,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'expenses' | 'incomes'>('expenses');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEssentiality, setSelectedEssentiality] = useState<'all' | 'essential' | 'discretionary'>('all');
  const [removalToast, setRemovalToast] = useState<string | null>(null);

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;

    const matchesEssential =
      selectedEssentiality === 'all' ||
      (selectedEssentiality === 'essential' && e.isEssential) ||
      (selectedEssentiality === 'discretionary' && !e.isEssential);

    return matchesSearch && matchesCategory && matchesEssential;
  });

  // Filter incomes
  const filteredIncomes = incomes.filter((i) => {
    const matchesSearch =
      i.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.notes && i.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || i.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Unique categories for the dropdown
  const expenseCategories = Array.from(new Set(expenses.map((e) => e.category)));
  const incomeCategories = Array.from(new Set(incomes.map((i) => i.category)));

  // Calculate totals
  const totalFilteredExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalFilteredIncome = filteredIncomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  // CSV Export utility
  const handleExportCsv = () => {
    const headers = ['Type', 'ID', 'Description/Source', 'Category', 'Amount', 'Currency', 'Date', 'Essential', 'Notes'];
    const rows = [
      ...expenses.map((e) => [
        'Expense',
        e.id,
        `"${e.description.replace(/"/g, '""')}"`,
        e.category,
        e.amount,
        e.currency || currency,
        e.date,
        e.isEssential ? 'Yes (Need)' : 'No (Want)',
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ]),
      ...incomes.map((i) => [
        'Income',
        i.id,
        `"${i.source.replace(/"/g, '""')}"`,
        i.category,
        i.amount,
        i.currency || currency,
        i.date,
        'N/A',
        `"${(i.notes || '').replace(/"/g, '""')}"`,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Removal Alert */}
      {removalToast && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{removalToast}</span>
          </div>
          <button onClick={() => setRemovalToast(null)} className="text-emerald-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Profile Scenario Advisor & Recommendations */}
      {scenario && (
        <ScenarioExpenseAdvisor
          scenario={scenario}
          incomes={incomes}
          expenses={expenses}
          budgets={budgets}
          goals={goals}
          currency={currency}
          onOpenAddExpense={onOpenAddExpense}
          onDeleteExpense={(id) => {
            const exp = expenses.find((e) => e.id === id);
            onDeleteExpense(id);
            setRemovalToast(
              exp
                ? `Removed "${exp.description}" (+${currencySymbol}${exp.amount.toLocaleString()} saved)! Scenario metrics recalculated.`
                : 'Expense removed from ledger.'
            );
            setTimeout(() => setRemovalToast(null), 5000);
          }}
          onUpdateExpense={onUpdateExpense}
          onAskAdvisor={onAskAdvisor || (() => {})}
        />
      )}

      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Income & Expense Transactions</h2>
            <p className="text-xs text-slate-400">
              Complete digital ledger tracking cash flows, essential living costs, and discretionary expenditures
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Export ledger as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenAddExpense}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Expense</span>
            </button>
            <button
              onClick={onOpenAddIncome}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Income</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {/* Sub tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('expenses')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'expenses'
                  ? 'bg-rose-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveSubTab('incomes')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'incomes'
                  ? 'bg-emerald-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Incomes ({incomes.length})
            </button>
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'all'
                  ? 'bg-indigo-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unified Ledger
            </button>
          </div>

          {/* Search & Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {activeSubTab !== 'incomes' &&
                expenseCategories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              {activeSubTab !== 'expenses' &&
                incomeCategories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c} (Income)
                  </option>
                ))}
            </select>

            {/* Essential vs Discretionary (for Expenses) */}
            {activeSubTab !== 'incomes' && (
              <select
                aria-label="Filter by essentiality"
                value={selectedEssentiality}
                onChange={(e) => setSelectedEssentiality(e.target.value as any)}
                className="bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Spend Types</option>
                <option value="essential">Essential (Needs)</option>
                <option value="discretionary">Discretionary (Wants)</option>
              </select>
            )}
          </div>
        </div>

        {/* Filtered Summary strip */}
        <div className="bg-slate-950/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-white">{activeSubTab === 'incomes' ? filteredIncomes.length : activeSubTab === 'expenses' ? filteredExpenses.length : filteredExpenses.length + filteredIncomes.length}</strong> entries
            </span>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedEssentiality('all');
                }}
                className="text-indigo-400 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeSubTab !== 'expenses' && (
              <span className="text-emerald-400 font-semibold">
                Income: +{currencySymbol}{totalFilteredIncome.toLocaleString()}
              </span>
            )}
            {activeSubTab !== 'incomes' && (
              <span className="text-rose-400 font-semibold">
                Expenses: -{currencySymbol}{totalFilteredExpense.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Transactions Tables */}
      <div className="space-y-6">
        {/* Expenses List */}
        {(activeSubTab === 'expenses' || activeSubTab === 'all') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                Expenses Log ({filteredExpenses.length})
              </h3>
              <span className="text-xs font-semibold text-rose-400">
                Total: -{currencySymbol}{totalFilteredExpense.toLocaleString()}
              </span>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-slate-400 text-xs">
                  {expenses.length === 0
                    ? 'No expenses recorded yet. Zero automatic mock data is loaded.'
                    : 'No matching expense records found for this filter.'}
                </p>
                <button
                  onClick={onOpenAddExpense}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Log First Expense</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{exp.date}</td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div>
                            {exp.description}
                            {exp.notes && (
                              <span className="block text-[11px] text-slate-400 font-normal italic mt-0.5">
                                {exp.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] border border-slate-700/60 font-medium">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {exp.isEssential ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/50">
                              <CheckCircle2 className="w-3 h-3 text-blue-400" />
                              Need (Essential)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              Want (Discretionary)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{exp.paymentMethod || 'Credit Card'}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-400 whitespace-nowrap">
                          -{currencySymbol}{exp.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {onEditExpense && (
                              <button
                                onClick={() => onEditExpense(exp)}
                                className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                                title="Modify / Edit expense details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onUpdateExpense && !exp.isEssential && exp.amount > 20 && (
                              <button
                                onClick={() => {
                                  const half = Math.round(exp.amount / 2);
                                  onUpdateExpense({ ...exp, amount: half, notes: `${exp.notes || ''} (Trimmed by 50%)`.trim() });
                                  setRemovalToast(`Trimmed "${exp.description}" by 50% to ${currencySymbol}${half.toLocaleString()}! Reclaimed ${currencySymbol}${(exp.amount - half).toLocaleString()}/mo.`);
                                  setTimeout(() => setRemovalToast(null), 5000);
                                }}
                                className="p-1 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                                title="Trim expense by 50%"
                              >
                                <Scissors className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                onDeleteExpense(exp.id);
                                setRemovalToast(`Removed "${exp.description}" (+${currencySymbol}${exp.amount.toLocaleString()} saved)!`);
                                setTimeout(() => setRemovalToast(null), 5000);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                              title="Remove expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Incomes List */}
        {(activeSubTab === 'incomes' || activeSubTab === 'all') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                Monthly Income Streams ({filteredIncomes.length})
              </h3>
              <span className="text-xs font-semibold text-emerald-400">
                Total: +{currencySymbol}{totalFilteredIncome.toLocaleString()}
              </span>
            </div>

            {filteredIncomes.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-slate-400 text-xs">
                  {incomes.length === 0
                    ? 'No income records found. Add your primary salary, freelance clients, or investments.'
                    : 'No matching income records found.'}
                </p>
                <button
                  onClick={onOpenAddIncome}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Add Income Stream</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Source / Client</th>
                      <th className="py-3 px-4">Classification</th>
                      <th className="py-3 px-4">Cadence</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{inc.date}</td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div>
                            {inc.source}
                            {inc.notes && (
                              <span className="block text-[11px] text-slate-400 font-normal italic mt-0.5">
                                {inc.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded text-[11px] border border-emerald-800/60 font-medium">
                            {inc.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 capitalize">{inc.frequency}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 whitespace-nowrap">
                          +{currencySymbol}{inc.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onDeleteIncome(inc.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Delete income source"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
