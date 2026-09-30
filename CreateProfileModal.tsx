import React, { useState } from 'react';
import { PersonaScenario } from '../types';
import { CURRENCY_SYMBOLS } from '../data/mockData';
import { X, UserPlus, Sparkles, DollarSign, Briefcase, Tag, Check, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProfile: (
    profile: PersonaScenario,
    initialData: {
      initialIncome: number;
      incomeSource: string;
      initialSavings: number;
      addStarterBudgets: boolean;
      startingExpenses: Array<{ description: string; amount: number; category: string; isEssential: boolean }>;
    }
  ) => void;
}

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onCreateProfile,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [profileType, setProfileType] = useState('Personal Budget');
  const [avatar, setAvatar] = useState('👤');
  const [currency, setCurrency] = useState('USD');
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [incomeSource, setIncomeSource] = useState('');
  const [emergencySavings, setEmergencySavings] = useState<number | ''>('');
  const [focusArea, setFocusArea] = useState('Discretionary Expense Reduction');
  // Default to clean blank slate with zero automatic data!
  const [dataMode, setDataMode] = useState<'clean_slate' | 'suggested_template'>('clean_slate');

  const emojiAvatars = ['👤', '👩‍💻', '👨‍💼', '👩‍🔬', '👨‍🎓', '👩‍🎨', '👨‍🍳', '🚀', '🌟', '💼', '🏡'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const profileId = `profile-${Date.now()}`;
    const incomeVal = Number(monthlyIncome) || 0;
    const savingsVal = Number(emergencySavings) || 0;

    const newProfile: PersonaScenario = {
      id: profileId,
      title: `${name.trim()}'s Finances`,
      personaName: name.trim(),
      role: role.trim() || 'Personal Planner',
      scenarioSummary: `Custom financial profile for ${name}. Track actual income, manage real-world expenses, and build personalized budgets with full control.`,
      avatar,
      badge: `${profileType}`,
      defaultCurrency: currency,
      keyFocus: [focusArea || 'Expense Tracking', 'Savings Optimization', 'Budget Discipline'],
      recommendedStrategy: incomeVal > 0 
        ? `Track all daily expenses to ensure spending stays below your ${CURRENCY_SYMBOLS[currency] || currency}${incomeVal.toLocaleString()} monthly income.`
        : 'Begin by logging your recurring earnings and daily transactions to uncover your cashflow profile.',
      isCustom: true,
    };

    // ZERO automatic expenses for new profiles - always start with clean ledger
    const startingExpenses: Array<{ description: string; amount: number; category: string; isEssential: boolean }> = [];

    onCreateProfile(newProfile, {
      initialIncome: incomeVal,
      incomeSource: incomeSource.trim() || (incomeVal > 0 ? 'Monthly Primary Earnings' : ''),
      initialSavings: savingsVal,
      addStarterBudgets: dataMode === 'suggested_template',
      startingExpenses,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Your Personal Profile</h3>
              <p className="text-xs text-emerald-400 font-medium">100% User-Friendly • Zero Automatic Fake Data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* User-friendly reassurance banner */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">You Have 100% Control Over Your Data</span>
              <p className="text-[11px] text-emerald-300/90 mt-0.5">
                We will <strong>never add automatic dummy expenses or preset numbers</strong> unless you explicitly choose them. Enter your actual figures below or start with an entirely clean blank canvas.
              </p>
            </div>
          </div>

          {/* Avatar Icon */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Choose Profile Icon</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {emojiAvatars.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setAvatar(em)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                    avatar === em
                      ? 'bg-emerald-950 border-emerald-500 scale-110 shadow-sm ring-1 ring-emerald-500'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Name / Label <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. My Personal Finances, Alex, Sarah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Classification</label>
              <select
                aria-label="Profile Classification"
                value={profileType}
                onChange={(e) => setProfileType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Personal Budget">Personal Budget</option>
                <option value="Salaried Employee">Salaried Employee</option>
                <option value="Freelancer / Contractor">Freelancer / Contractor</option>
                <option value="Student / College">Student / College</option>
                <option value="Household & Family">Household & Family</option>
                <option value="Self-Employed / Small Business">Self-Employed / Small Business</option>
              </select>
            </div>
          </div>

          {/* Currency & Role Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Currency</label>
              <select
                aria-label="Profile Preferred Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
              >
                {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c} ({CURRENCY_SYMBOLS[c]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Occupation / Subtitle (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Engineer, Designer, Freelancer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Monthly Income & Current Savings (Optional & Clean) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Monthly Income ({CURRENCY_SYMBOLS[currency] || currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 3500 (or leave 0)"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Leave empty to add income streams later</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Savings Reserve ({CURRENCY_SYMBOLS[currency] || currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 1500 (or leave 0)"
                value={emergencySavings}
                onChange={(e) => setEmergencySavings(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Your current liquid cash buffer</span>
            </div>
          </div>

          {/* Primary Income Source description (Only if income entered) */}
          {Number(monthlyIncome) > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Income Source Name</label>
              <input
                type="text"
                placeholder="e.g. Primary Salary, Client Retainers, Consulting"
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Primary Financial Focus */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Financial Focus</label>
            <select
              aria-label="Primary Financial Focus"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Daily Expense Tracking & Awareness">Daily Expense Tracking & Awareness</option>
              <option value="Discretionary Expense Reduction">Discretionary Expense Reduction</option>
              <option value="6-Month Emergency Fund Cushion">6-Month Emergency Fund Cushion</option>
              <option value="Debt Payoff & Credit Optimization">Debt Payoff & Credit Optimization</option>
              <option value="Long-Term Index Fund Investing">Long-Term Index Fund Investing</option>
              <option value="Saving for Major Goal / Purchase">Saving for Major Goal / Purchase</option>
            </select>
          </div>

          {/* Mode Selection: Clean Slate (Zero Automatic Data) vs Suggested Template */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-300">Data Setup Preference</label>
            
            {/* Option 1: Clean Slate (Default) */}
            <div
              onClick={() => setDataMode('clean_slate')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                dataMode === 'clean_slate'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                dataMode === 'clean_slate' ? 'border-emerald-400 bg-emerald-500 text-slate-950' : 'border-slate-600'
              }`}>
                {dataMode === 'clean_slate' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  🛡️ 100% Clean Blank Canvas <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-semibold">Recommended</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  <strong>Zero automatic data.</strong> No dummy expenses, no auto-generated preset budgets, and no fake records. You log your actual real transactions.
                </p>
              </div>
            </div>

            {/* Option 2: Suggested Template (Optional) */}
            <div
              onClick={() => setDataMode('suggested_template')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                dataMode === 'suggested_template'
                  ? 'bg-indigo-950/40 border-indigo-500 text-white'
                  : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                dataMode === 'suggested_template' ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-600'
              }`}>
                {dataMode === 'suggested_template' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="text-xs">
                <span className="font-bold text-white">
                  📐 Optional 50/30/20 Starter Envelopes
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Generates standard budget target envelopes (Housing, Groceries, Utilities) scaled to your income to give you an initial framework.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Create My Profile (Clean)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
