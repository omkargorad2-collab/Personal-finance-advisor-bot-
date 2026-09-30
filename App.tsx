import React, { useState, useEffect } from 'react';
import { PersonaScenario, Income, Expense, BudgetCategory, SavingsGoal, FinancialAuditResult } from './types';
import { PERSONA_SCENARIOS, INITIAL_SCENARIO_DATA } from './data/mockData';
import { fetchScenarioState, saveScenarioState, resetScenarioState, requestFinancialAnalysis } from './services/api';

import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TransactionsView } from './components/TransactionsView';
import { BudgetPlanner } from './components/BudgetPlanner';
import { SavingsGoals } from './components/SavingsGoals';
import { MonthlyReport } from './components/MonthlyReport';
import { MultiCurrencyView } from './components/MultiCurrencyView';
import { AiAdvisorBot } from './components/AiAdvisorBot';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { TransactionModal } from './components/TransactionModal';
import { GoalModal } from './components/GoalModal';
import { CreateProfileModal } from './components/CreateProfileModal';
import { ResetProfileModal } from './components/ResetProfileModal';

import { Bot, Sparkles, X, ChevronUp, ChevronDown, Check } from 'lucide-react';

export default function App() {
  const [scenarios, setScenarios] = useState<PersonaScenario[]>(() => {
    try {
      const saved = localStorage.getItem('finance_advisor_profiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not parse saved profiles:', e);
    }
    return PERSONA_SCENARIOS;
  });

  const [currentScenario, setCurrentScenario] = useState<PersonaScenario>(() => {
    try {
      const savedActive = localStorage.getItem('finance_advisor_active_profile_id');
      if (savedActive) {
        const savedList = localStorage.getItem('finance_advisor_profiles');
        const list: PersonaScenario[] = savedList ? JSON.parse(savedList) : PERSONA_SCENARIOS;
        const found = list.find((s) => s.id === savedActive);
        if (found) return found;
      }
    } catch (e) {}
    return PERSONA_SCENARIOS[0];
  });

  const [currency, setCurrency] = useState<string>(currentScenario.defaultCurrency || 'USD');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // App color theme: 'dark' | 'light' | 'midnight'
  const [theme, setTheme] = useState<'dark' | 'light' | 'midnight'>(() => {
    try {
      const saved = localStorage.getItem('finance_advisor_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'midnight') return saved;
    } catch (e) {}
    return 'dark';
  });

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'midnight') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('finance_advisor_theme', newTheme);
    } catch (e) {}
  };

  // Core Financial Data
  const [incomes, setIncomes] = useState<Income[]>(() => {
    const seed = INITIAL_SCENARIO_DATA[currentScenario.id] || INITIAL_SCENARIO_DATA['salaried'];
    return seed.incomes;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const seed = INITIAL_SCENARIO_DATA[currentScenario.id] || INITIAL_SCENARIO_DATA['salaried'];
    return seed.expenses;
  });
  const [budgets, setBudgets] = useState<BudgetCategory[]>(() => {
    const seed = INITIAL_SCENARIO_DATA[currentScenario.id] || INITIAL_SCENARIO_DATA['salaried'];
    return seed.budgets;
  });
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const seed = INITIAL_SCENARIO_DATA[currentScenario.id] || INITIAL_SCENARIO_DATA['salaried'];
    return seed.goals;
  });

  // AI Financial Audit
  const [auditResult, setAuditResult] = useState<FinancialAuditResult | null>(null);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [isResetProfileOpen, setIsResetProfileOpen] = useState(false);

  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditExpenseOpen(true);
  };

  // Advisor routing
  const [advisorExternalPrompt, setAdvisorExternalPrompt] = useState<string | null>(null);
  const [isFloatingBotOpen, setIsFloatingBotOpen] = useState(false);

  // Totals calculations
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

  // Load Scenario Data (from server cache or default seed)
  const loadScenario = async (scenario: PersonaScenario) => {
    setCurrentScenario(scenario);
    try {
      localStorage.setItem('finance_advisor_active_profile_id', scenario.id);
    } catch (e) {}

    try {
      const serverState = await fetchScenarioState(scenario.id);
      if (serverState) {
        setIncomes(serverState.incomes || []);
        setExpenses(serverState.expenses || []);
        setBudgets(serverState.budgets || []);
        setGoals(serverState.goals || []);
        setCurrency(serverState.currency || scenario.defaultCurrency);
      } else {
        const seed = INITIAL_SCENARIO_DATA[scenario.id] || INITIAL_SCENARIO_DATA['salaried'];
        setIncomes(seed.incomes || []);
        setExpenses(seed.expenses || []);
        setBudgets(seed.budgets || []);
        setGoals(seed.goals || []);
        setCurrency(seed.currency || scenario.defaultCurrency);
      }
    } catch (e) {
      const seed = INITIAL_SCENARIO_DATA[scenario.id] || INITIAL_SCENARIO_DATA['salaried'];
      setIncomes(seed.incomes || []);
      setExpenses(seed.expenses || []);
      setBudgets(seed.budgets || []);
      setGoals(seed.goals || []);
      setCurrency(seed.currency || scenario.defaultCurrency);
    }
  };

  // Sync to backend store whenever financial data changes
  useEffect(() => {
    saveScenarioState(currentScenario.id, {
      incomes,
      expenses,
      budgets,
      goals,
      currency,
    });
  }, [incomes, expenses, budgets, goals, currency, currentScenario.id]);

  // Initial audit calculation
  useEffect(() => {
    const runInitialAudit = async () => {
      try {
        const res = await requestFinancialAnalysis({
          scenario: currentScenario,
          incomes,
          expenses,
          budgets,
          goals,
          currency,
        });
        setAuditResult(res);
      } catch (e) {
        console.warn('Initial audit warning:', e);
      }
    };
    runInitialAudit();
  }, [currentScenario.id]);

  // Reset active profile to default scenario seed
  const handleResetData = async () => {
    await resetScenarioState(currentScenario.id);
    const seed = INITIAL_SCENARIO_DATA[currentScenario.id] || INITIAL_SCENARIO_DATA['salaried'];
    setIncomes([...(seed.incomes || [])]);
    setExpenses([...(seed.expenses || [])]);
    setBudgets([...(seed.budgets || [])]);
    setGoals([...(seed.goals || [])]);
    setCurrency(seed.currency || currentScenario.defaultCurrency || 'USD');
  };

  // Clear all data (Clean blank canvas with ZERO automatic mock data)
  const handleClearAllData = async () => {
    setIncomes([]);
    setExpenses([]);
    setBudgets([]);
    setGoals([]);
    await saveScenarioState(currentScenario.id, {
      incomes: [],
      expenses: [],
      budgets: [],
      goals: [],
      currency,
    });
  };

  // Profile Reset: Clean Slate
  const handleResetToCleanSlate = async () => {
    await handleClearAllData();
  };

  // Profile Reset: Baseline
  const handleResetToBaseline = async () => {
    await handleResetData();
  };

  // Profile Reset: Delete Custom Profile & switch back to default
  const handleDeleteCurrentProfile = async () => {
    if (!currentScenario.isCustom) return;
    const remaining = scenarios.filter((s) => s.id !== currentScenario.id);
    const fallback = remaining.length > 0 ? remaining[0] : PERSONA_SCENARIOS[0];
    setScenarios(remaining);
    try {
      localStorage.setItem('finance_advisor_profiles', JSON.stringify(remaining));
      localStorage.setItem('finance_advisor_active_profile_id', fallback.id);
    } catch (e) {
      console.warn('Could not update profile list:', e);
    }
    await resetScenarioState(currentScenario.id);
    await loadScenario(fallback);
  };

  // Profile Reset: Factory Reset All Profiles
  const handleFactoryResetAll = async () => {
    try {
      localStorage.removeItem('finance_advisor_profiles');
      localStorage.removeItem('finance_advisor_active_profile_id');
    } catch (e) {}
    setScenarios(PERSONA_SCENARIOS);
    const defaultProfile = PERSONA_SCENARIOS[0];
    await resetScenarioState(defaultProfile.id);
    await loadScenario(defaultProfile);
  };

  // Create New Profile & Add Custom Data
  const handleCreateProfile = (
    newProfile: PersonaScenario,
    initialData: {
      initialIncome: number;
      incomeSource: string;
      initialSavings: number;
      addStarterBudgets?: boolean;
      startingExpenses: Array<{ description: string; amount: number; category: string; isEssential: boolean }>;
    }
  ) => {
    const updatedScenarios = [...scenarios, newProfile];
    setScenarios(updatedScenarios);
    try {
      localStorage.setItem('finance_advisor_profiles', JSON.stringify(updatedScenarios));
      localStorage.setItem('finance_advisor_active_profile_id', newProfile.id);
    } catch (e) {
      console.warn('Could not persist profile:', e);
    }

    const dateToday = new Date().toISOString().split('T')[0];
    
    // Only add income if user entered one > 0
    const newIncomes: Income[] = initialData.initialIncome > 0
      ? [
          {
            id: `inc-${Date.now()}-1`,
            source: initialData.incomeSource || 'Monthly Primary Earnings',
            amount: initialData.initialIncome,
            category: 'Salary',
            date: dateToday,
            frequency: 'monthly',
            currency: newProfile.defaultCurrency,
          },
        ]
      : [];

    // ZERO automatic expenses for new users/profiles - 100% clean sheet
    const newExpenses: Expense[] = [];

    // Zero automatic budgets unless user explicitly opted for the starter envelopes
    const inc = initialData.initialIncome > 0 ? initialData.initialIncome : 0;
    const newBudgets: BudgetCategory[] = (initialData.addStarterBudgets && inc > 0)
      ? [
          { id: `b-${Date.now()}-1`, category: 'Housing & Rent', budgetLimit: Math.round(inc * 0.35), period: 'monthly', color: '#6366f1' },
          { id: `b-${Date.now()}-2`, category: 'Food & Groceries', budgetLimit: Math.round(inc * 0.18), period: 'monthly', color: '#10b981' },
          { id: `b-${Date.now()}-3`, category: 'Transport', budgetLimit: Math.round(inc * 0.10), period: 'monthly', color: '#f59e0b' },
          { id: `b-${Date.now()}-4`, category: 'Utilities', budgetLimit: Math.round(inc * 0.08), period: 'monthly', color: '#06b6d4' },
          { id: `b-${Date.now()}-5`, category: 'Entertainment & Dining', budgetLimit: Math.round(inc * 0.12), period: 'monthly', color: '#ec4899' },
          { id: `b-${Date.now()}-6`, category: 'Healthcare & Personal', budgetLimit: Math.round(inc * 0.07), period: 'monthly', color: '#8b5cf6' },
        ]
      : [];

    // Zero automatic goals unless user explicitly entered savings > 0
    const newGoals: SavingsGoal[] = initialData.initialSavings > 0
      ? [
          {
            id: `g-${Date.now()}-1`,
            title: 'Emergency Cushion Reserve',
            currentAmount: initialData.initialSavings,
            targetAmount: Math.max(initialData.initialSavings, inc > 0 ? Math.round(inc * 3) : initialData.initialSavings * 2),
            targetDate: '2027-12-31',
            category: 'emergency',
            notes: 'Current liquid reserve buffer',
          },
        ]
      : [];

    setCurrentScenario(newProfile);
    setCurrency(newProfile.defaultCurrency);
    setIncomes(newIncomes);
    setExpenses(newExpenses);
    setBudgets(newBudgets);
    setGoals(newGoals);
    setActiveTab('dashboard');

    saveScenarioState(newProfile.id, {
      incomes: newIncomes,
      expenses: newExpenses,
      budgets: newBudgets,
      goals: newGoals,
      currency: newProfile.defaultCurrency,
    });
  };

  // Add Expense
  const handleSaveExpense = (newExp: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExp,
      id: `exp-${Date.now()}`,
    };
    setExpenses([created, ...expenses]);
  };

  // Add Income
  const handleSaveIncome = (newInc: Omit<Income, 'id'>) => {
    const created: Income = {
      ...newInc,
      id: `inc-${Date.now()}`,
    };
    setIncomes([created, ...incomes]);
  };

  // Add Goal
  const handleSaveGoal = (newGoal: Omit<SavingsGoal, 'id'>) => {
    const created: SavingsGoal = {
      ...newGoal,
      id: `g-${Date.now()}`,
    };
    setGoals([...goals, created]);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // Update Expense (e.g. for trimming)
  const handleUpdateExpense = (updated: Expense) => {
    setExpenses(expenses.map((e) => (e.id === updated.id ? updated : e)));
  };

  // Delete Income
  const handleDeleteIncome = (id: string) => {
    setIncomes(incomes.filter((i) => i.id !== id));
  };

  // Quick Log Expense (usable by anyone with 1 tap)
  const handleQuickLogExpense = (description: string, amount: number, category: string, isEssential: boolean) => {
    const created: Expense = {
      id: `exp-${Date.now()}`,
      description,
      amount,
      category,
      date: new Date().toISOString().split('T')[0],
      isEssential,
      paymentMethod: 'Debit Card',
      currency,
    };
    setExpenses([created, ...expenses]);
  };

  // Route question to AI Advisor
  const handleAskAdvisor = (question: string) => {
    setAdvisorExternalPrompt(question);
    setActiveTab('advisor');
  };

  return (
    <div className={`min-h-screen theme-${theme} bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 transition-colors duration-200`}>
      {/* Global Navigation Header */}
      <Header
        currentScenario={currentScenario}
        scenarios={scenarios}
        onSelectScenario={loadScenario}
        currency={currency}
        onCurrencyChange={setCurrency}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenAddIncome={() => setIsAddIncomeOpen(true)}
        onResetData={handleResetData}
        onClearData={handleClearAllData}
        onOpenAiAudit={() => setActiveTab('reports')}
        onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
        onOpenResetProfile={() => setIsResetProfileOpen(true)}
        netSavings={netSavings}
        savingsRate={savingsRate}
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            scenario={currentScenario}
            incomes={incomes}
            expenses={expenses}
            budgets={budgets}
            goals={goals}
            currency={currency}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenAddIncome={() => setIsAddIncomeOpen(true)}
            onOpenAiAudit={() => setActiveTab('reports')}
            onNavigateToTab={setActiveTab}
            onAskAdvisor={handleAskAdvisor}
            onQuickLogExpense={handleQuickLogExpense}
            onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
            onOpenResetProfile={() => setIsResetProfileOpen(true)}
            onClearData={handleClearAllData}
            onDeleteExpense={handleDeleteExpense}
            onUpdateExpense={handleUpdateExpense}
            onEditExpense={handleOpenEditExpense}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            expenses={expenses}
            incomes={incomes}
            currency={currency}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenAddIncome={() => setIsAddIncomeOpen(true)}
            onDeleteExpense={handleDeleteExpense}
            onDeleteIncome={handleDeleteIncome}
            scenario={currentScenario}
            budgets={budgets}
            goals={goals}
            onUpdateExpense={handleUpdateExpense}
            onEditExpense={handleOpenEditExpense}
            onAskAdvisor={handleAskAdvisor}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetPlanner
            budgets={budgets}
            expenses={expenses}
            monthlyIncome={totalIncome}
            scenario={currentScenario}
            currency={currency}
            onUpdateBudgets={setBudgets}
            onAskAdvisor={handleAskAdvisor}
            onDeleteExpense={handleDeleteExpense}
            onEditExpense={handleOpenEditExpense}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsGoals
            goals={goals}
            monthlyExpense={totalExpense}
            monthlyIncome={totalIncome}
            scenario={currentScenario}
            currency={currency}
            onUpdateGoals={setGoals}
            onOpenAddGoal={() => setIsAddGoalOpen(true)}
            onAskAdvisor={handleAskAdvisor}
          />
        )}

        {activeTab === 'currency' && (
          <MultiCurrencyView
            currentCurrency={currency}
            onCurrencyChange={setCurrency}
            expenses={expenses}
            monthlyIncome={totalIncome}
            monthlyExpense={totalExpense}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReport
            scenario={currentScenario}
            incomes={incomes}
            expenses={expenses}
            budgets={budgets}
            goals={goals}
            currency={currency}
            auditResult={auditResult}
            onUpdateAudit={setAuditResult}
            onAskAdvisor={handleAskAdvisor}
          />
        )}

        {activeTab === 'advisor' && (
          <AiAdvisorBot
            scenario={currentScenario}
            incomes={incomes}
            expenses={expenses}
            budgets={budgets}
            goals={goals}
            currency={currency}
            externalPrompt={advisorExternalPrompt}
            onClearExternalPrompt={() => setAdvisorExternalPrompt(null)}
          />
        )}

        {activeTab === 'architecture' && (
          <DatabaseSchemaView
            scenarioData={{
              incomes,
              expenses,
              budgets,
              goals,
              scenario: currentScenario,
            }}
          />
        )}
      </main>

      {/* Floating AI Advisor Quick Drawer (available in non-advisor tabs) */}
      {activeTab !== 'advisor' && (
        <div className="fixed bottom-6 right-6 z-40 print:hidden">
          {isFloatingBotOpen ? (
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-80 sm:w-96 shadow-2xl overflow-hidden flex flex-col h-[460px] animate-in slide-in-from-bottom-5 duration-200">
              <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Advisor Quick Assistant</h4>
                    <span className="text-[10px] text-emerald-400">Gemini 3.8 Active</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsFloatingBotOpen(false);
                      setActiveTab('advisor');
                    }}
                    className="text-[10px] text-indigo-400 hover:underline px-1"
                  >
                    Full Screen &rarr;
                  </button>
                  <button
                    onClick={() => setIsFloatingBotOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat embed */}
              <div className="flex-1 overflow-hidden p-2">
                <AiAdvisorBot
                  scenario={currentScenario}
                  incomes={incomes}
                  expenses={expenses}
                  budgets={budgets}
                  goals={goals}
                  currency={currency}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsFloatingBotOpen(true)}
              className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white p-3.5 rounded-full shadow-xl shadow-indigo-600/30 flex items-center gap-2 group transition-all cursor-pointer hover:scale-105"
              title="Open Personal Finance Advisor Bot"
            >
              <Bot className="w-5 h-5 text-white" />
              <span className="hidden sm:inline text-xs font-bold pr-1">Ask AI Advisor</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <TransactionModal
        isOpen={isAddExpenseOpen}
        type="expense"
        onClose={() => setIsAddExpenseOpen(false)}
        onSaveExpense={handleSaveExpense}
        onSaveIncome={handleSaveIncome}
        currency={currency}
        scenario={currentScenario}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      {/* Modify / Edit Expense Modal */}
      <TransactionModal
        isOpen={isEditExpenseOpen}
        type="expense"
        editingExpense={editingExpense}
        onClose={() => {
          setIsEditExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSaveExpense={handleSaveExpense}
        onUpdateExpense={handleUpdateExpense}
        onSaveIncome={handleSaveIncome}
        currency={currency}
        scenario={currentScenario}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      <TransactionModal
        isOpen={isAddIncomeOpen}
        type="income"
        onClose={() => setIsAddIncomeOpen(false)}
        onSaveExpense={handleSaveExpense}
        onSaveIncome={handleSaveIncome}
        currency={currency}
        scenario={currentScenario}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      <GoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onSaveGoal={handleSaveGoal}
        currency={currency}
      />

      <CreateProfileModal
        isOpen={isCreateProfileOpen}
        onClose={() => setIsCreateProfileOpen(false)}
        onCreateProfile={handleCreateProfile}
      />

      <ResetProfileModal
        isOpen={isResetProfileOpen}
        onClose={() => setIsResetProfileOpen(false)}
        scenario={currentScenario}
        currency={currency}
        onResetToCleanSlate={handleResetToCleanSlate}
        onResetToBaseline={handleResetToBaseline}
        onDeleteProfile={currentScenario.isCustom ? handleDeleteCurrentProfile : undefined}
        onFactoryResetAll={handleFactoryResetAll}
      />
    </div>
  );
}
