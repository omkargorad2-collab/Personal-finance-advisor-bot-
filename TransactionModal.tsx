import React, { useState, useEffect } from 'react';
import { COMMON_CATEGORIES, CURRENCY_SYMBOLS } from '../data/mockData';
import { Expense, Income, PersonaScenario } from '../types';
import { X, DollarSign, Calendar, Tag, ShieldAlert, FileText, Sparkles, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  type: 'expense' | 'income';
  editingExpense?: Expense | null;
  onClose: () => void;
  onSaveExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense?: (expense: Expense) => void;
  onSaveIncome: (income: Omit<Income, 'id'>) => void;
  currency: string;
  scenario?: PersonaScenario;
  totalIncome?: number;
  totalExpense?: number;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  type,
  editingExpense,
  onClose,
  onSaveExpense,
  onUpdateExpense,
  onSaveIncome,
  currency,
  scenario,
  totalIncome = 0,
  totalExpense = 0,
}) => {
  if (!isOpen) return null;

  // Form states for Expense
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [amount, setAmount] = useState<number | ''>(editingExpense ? editingExpense.amount : '');
  const [category, setCategory] = useState(
    editingExpense?.category || (type === 'expense' ? 'Food & Groceries' : 'Salary')
  );
  const [date, setDate] = useState(editingExpense?.date || new Date().toISOString().split('T')[0]);
  const [isEssential, setIsEssential] = useState(editingExpense ? editingExpense.isEssential : true);
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Cash' | 'Digital Wallet'>(
    (editingExpense?.paymentMethod as any) || 'Credit Card'
  );
  const [notes, setNotes] = useState(editingExpense?.notes || '');

  // Sync state if editingExpense changes while open
  useEffect(() => {
    if (editingExpense && type === 'expense') {
      setDescription(editingExpense.description || '');
      setAmount(editingExpense.amount ?? '');
      setCategory(editingExpense.category || 'Food & Groceries');
      setDate(editingExpense.date || new Date().toISOString().split('T')[0]);
      setIsEssential(editingExpense.isEssential ?? true);
      setPaymentMethod((editingExpense.paymentMethod as any) || 'Credit Card');
      setNotes(editingExpense.notes || '');
    } else if (!editingExpense && type === 'expense') {
      setDescription('');
      setAmount('');
      setCategory('Food & Groceries');
      setDate(new Date().toISOString().split('T')[0]);
      setIsEssential(true);
      setPaymentMethod('Credit Card');
      setNotes('');
    }
  }, [editingExpense, isOpen, type]);

  // Form states for Income
  const [source, setSource] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'bi-weekly' | 'weekly' | 'one-time'>('monthly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    if (type === 'expense') {
      if (editingExpense && onUpdateExpense) {
        onUpdateExpense({
          ...editingExpense,
          description: description || 'Miscellaneous Expense',
          amount: Number(amount),
          category,
          date,
          isEssential,
          paymentMethod,
          currency: editingExpense.currency || currency,
          notes,
        });
      } else {
        onSaveExpense({
          description: description || 'Miscellaneous Expense',
          amount: Number(amount),
          category,
          date,
          isEssential,
          paymentMethod,
          currency,
          notes,
        });
      }
    } else {
      onSaveIncome({
        source: source || 'Income Source',
        amount: Number(amount),
        category: category as any,
        date,
        frequency,
        currency,
        notes,
      });
    }

    onClose();
  };

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${editingExpense ? 'bg-indigo-500' : type === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              {editingExpense ? (
                <span className="flex items-center gap-1.5">
                  <Pencil className="w-4 h-4 text-indigo-400" />
                  Modify Expense
                </span>
              ) : type === 'expense' ? (
                'Log New Expense'
              ) : (
                'Record Monthly Income'
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {editingExpense
                ? 'Update amount, category, date, or essentiality classification'
                : type === 'expense'
                ? 'Track spending across essential and discretionary categories'
                : 'Add earnings from employer, freelance clients, or investments'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title / Description / Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {type === 'expense' ? 'Expense Description' : 'Income Source / Client'}
            </label>
            <input
              type="text"
              required
              placeholder={type === 'expense' ? 'e.g., Trader Joe’s Groceries, Electric Bill, Figma' : 'e.g., Tech Corp Salary, Client Retainer, Allowance'}
              value={type === 'expense' ? description : source}
              onChange={(e) => (type === 'expense' ? setDescription(e.target.value) : setSource(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category & Frequency/Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                aria-label="Transaction Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {type === 'expense' ? (
                  COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))
                ) : (
                  ['Salary', 'Freelance', 'Allowance', 'Side Gig', 'Investment', 'Partner Income', 'Other'].map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {type === 'expense' ? 'Payment Method' : 'Frequency'}
              </label>
              {type === 'expense' ? (
                <select
                  aria-label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer / ACH</option>
                  <option value="Cash">Cash</option>
                  <option value="Digital Wallet">Digital Wallet (Apple/Google)</option>
                </select>
              ) : (
                <select
                  aria-label="Income Frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="monthly">Monthly Recurring</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="weekly">Weekly</option>
                  <option value="one-time">One-Time Project / Milestone</option>
                </select>
              )}
            </div>
          </div>

          {/* Essential vs Discretionary switch for Expense */}
          {type === 'expense' && (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Essential Living Need?</span>
                <span className="text-[11px] text-slate-400 block">
                  Classifies into 50% Needs vs 30% Wants budgeting framework
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEssential(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isEssential ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Essential (Need)
                </button>
                <button
                  type="button"
                  onClick={() => setIsEssential(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    !isEssential ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Discretionary (Want)
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes or Context (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Client milestone 2, 30% tax deductible, split with roommate"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Scenario-Based Expense Advice Preview */}
          {type === 'expense' && scenario && Number(amount) > 0 && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Scenario Advice for {scenario.personaName} ({scenario.role}):</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {totalIncome > 0 ? (
                  <>
                    This expense of <strong>{currencySymbol}{Number(amount).toLocaleString()}</strong> is{' '}
                    <strong>{((Number(amount) / totalIncome) * 100).toFixed(1)}%</strong> of your monthly income.
                    {isEssential ? (
                      ' Essential needs are recommended to stay within 50% of monthly earnings.'
                    ) : (
                      ' Since this is discretionary, verify it fits within your 30% wants limit to protect your emergency buffer.'
                    )}
                  </>
                ) : (
                  `Adding this ${isEssential ? 'essential need' : 'discretionary spend'} under ${category}. The advisor will update your overall runway accordingly.`
                )}
              </p>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-all ${
                editingExpense
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  : type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {editingExpense ? 'Save Changes' : type === 'expense' ? 'Record Expense' : 'Save Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
