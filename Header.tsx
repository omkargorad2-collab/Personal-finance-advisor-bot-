import React from 'react';
import { PersonaScenario } from '../types';
import { CURRENCY_SYMBOLS } from '../data/mockData';
import { 
  Bot, 
  Sparkles, 
  PlusCircle, 
  RotateCcw, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Globe, 
  Layers, 
  PieChart, 
  Wallet, 
  Target, 
  FileText, 
  Database,
  UserPlus,
  Eraser,
  Check,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  currentScenario: PersonaScenario;
  scenarios: PersonaScenario[];
  onSelectScenario: (scenario: PersonaScenario) => void;
  currency: string;
  onCurrencyChange: (curr: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onResetData: () => void;
  onClearData: () => void;
  onOpenAiAudit: () => void;
  onOpenCreateProfile: () => void;
  onOpenResetProfile?: () => void;
  netSavings: number;
  savingsRate: number;
  theme?: 'dark' | 'light' | 'midnight';
  onThemeChange?: (theme: 'dark' | 'light' | 'midnight') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenario,
  scenarios,
  onSelectScenario,
  currency,
  onCurrencyChange,
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenAddIncome,
  onResetData,
  onClearData,
  onOpenAiAudit,
  onOpenCreateProfile,
  onOpenResetProfile,
  netSavings,
  savingsRate,
  theme = 'dark',
  onThemeChange,
}) => {
  const [showDataOptions, setShowDataOptions] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'transactions', label: 'Income & Expenses', icon: Wallet },
    { id: 'budget', label: 'Budget Planner', icon: Layers },
    { id: 'savings', label: 'Savings & Runway', icon: Target },
    { id: 'currency', label: 'Multi-Currency Hub', icon: Globe },
    { id: 'reports', label: 'Monthly Report', icon: FileText },
    { id: 'advisor', label: 'AI Advisor Bot', icon: Bot, isAi: true },
    { id: 'architecture', label: 'SQL Architecture', icon: Database },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Banner: Scenario Context & Quick Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Logo & Persona Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Personal Finance Advisor Bot
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <Sparkles className="w-3 h-3 mr-1 text-emerald-400 animate-pulse" />
                  Gemini 3.8 AI
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="hover:scale-110 transition-transform">{currentScenario.avatar}</span>
                  <span>{currentScenario.personaName}</span>
                  <span className="text-slate-400 font-normal">({currentScenario.role})</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-semibold">Live Condition Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Scenario Selector */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Net Savings Pill */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
              <TrendingUp className={`w-3.5 h-3.5 ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="text-slate-400">Net Surplus:</span>
              <span className={`font-semibold ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currencySymbol}{netSavings.toLocaleString()}
              </span>
              <span className="text-slate-500">({savingsRate}%)</span>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg px-2 py-1 text-xs">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <select
                aria-label="Currency"
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="bg-transparent text-slate-200 font-medium text-xs focus:outline-none cursor-pointer"
              >
                {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                  <option key={c} value={c} className="bg-slate-800 text-white">
                    {c} ({CURRENCY_SYMBOLS[c]})
                  </option>
                ))}
              </select>
            </div>

            {/* Direct 1-Click Theme Changing Toggle */}
            {onThemeChange && (
              <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl p-0.5 text-xs shadow-xs" title="Change Theme (Dark / Light / Midnight)">
                <button
                  type="button"
                  onClick={() => onThemeChange('dark')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-slate-950 text-white shadow-xs border border-slate-700/60' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dark Theme"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => onThemeChange('light')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    theme === 'light' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Light Theme"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => onThemeChange('midnight')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    theme === 'midnight' ? 'bg-indigo-950 text-cyan-300 border border-indigo-700/60 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Midnight Navy Theme"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden md:inline">Midnight</span>
                </button>
              </div>
            )}

            {/* Scenario Switcher Dropdown */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg px-2 py-1 text-xs">
              <Users className="w-3.5 h-3.5 text-indigo-400 mr-1.5 shrink-0" />
              <select
                aria-label="Select Scenario or Profile"
                value={currentScenario.id}
                onChange={(e) => {
                  if (e.target.value === '__create_new__') {
                    onOpenCreateProfile();
                    return;
                  }
                  if (e.target.value === '__reset_profile__') {
                    if (onOpenResetProfile) onOpenResetProfile();
                    return;
                  }
                  const target = scenarios.find((s) => s.id === e.target.value);
                  if (target) onSelectScenario(target);
                }}
                className="bg-transparent text-indigo-200 font-medium text-xs focus:outline-none cursor-pointer max-w-[130px] sm:max-w-none truncate"
              >
                <optgroup label="Default Pre-Built Scenarios" className="bg-slate-900 text-slate-400 font-semibold text-[11px]">
                  {scenarios.filter(s => !s.isCustom).map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white font-normal">
                      {s.avatar} {s.title}
                    </option>
                  ))}
                </optgroup>
                {scenarios.some(s => s.isCustom) && (
                  <optgroup label="Your Custom Profiles" className="bg-slate-900 text-emerald-400 font-semibold text-[11px]">
                    {scenarios.filter(s => s.isCustom).map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white font-normal">
                        {s.avatar} {s.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="__create_new__" className="bg-slate-900 text-emerald-400 font-semibold">
                  ➕ + Create New Profile...
                </option>
                <option value="__reset_profile__" className="bg-slate-900 text-indigo-300 font-semibold">
                  🔄 Reset Profile Options...
                </option>
              </select>
            </div>

            {/* + New Profile Button */}
            <button
              onClick={onOpenCreateProfile}
              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              title="Create your own profile with custom income and expenses"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Profile</span>
            </button>

            {/* Reset Profile Button */}
            {onOpenResetProfile && (
              <button
                onClick={onOpenResetProfile}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700/80 shadow-xs transition-colors cursor-pointer"
                title="Reset active profile data, clean slate, or restore baseline"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Reset Profile</span>
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenAddExpense}
                className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                title="Log an expense"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expense</span>
              </button>

              <button
                onClick={onOpenAddIncome}
                className="px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                title="Log income"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Income</span>
              </button>

              <button
                onClick={onOpenAiAudit}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                title="Run Gemini Financial Health Audit"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Audit</span>
              </button>

              {/* Data Management Menu: Clear Data (Clean Canvas) or Restore Demo Data */}
              <div className="relative">
                <button
                  onClick={() => setShowDataOptions(!showDataOptions)}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700/80 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Data Controls: Start Clean or Restore Demo"
                >
                  <Eraser className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Data</span>
                </button>

                {showDataOptions && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Data Control
                    </div>
                    <button
                      onClick={() => {
                        setShowDataOptions(false);
                        setShowClearConfirm(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Eraser className="w-3.5 h-3.5 text-rose-400" />
                      <div>
                        <span className="font-semibold block text-rose-200">Start Clean Blank Canvas</span>
                        <span className="text-[10px] text-slate-400 block">Clear all mock/sample data</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowDataOptions(false);
                        onResetData();
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                      <div>
                        <span className="font-semibold block text-slate-200">Load Scenario Sample Data</span>
                        <span className="text-[10px] text-slate-400 block">Restore pre-built demo records</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Clean Slate */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center shrink-0">
                <Eraser className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Start With a Clean Sheet?</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Wipe all sample income, expense, and budget records so you can track your real finances with zero automatic data.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearData();
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Yes, Clear All Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 py-2" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.isAi && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
