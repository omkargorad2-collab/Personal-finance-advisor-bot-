export interface Income {
  id: string;
  source: string;
  amount: number;
  category: 'Salary' | 'Freelance' | 'Allowance' | 'Side Gig' | 'Investment' | 'Partner Income' | 'Other';
  date: string;
  frequency: 'monthly' | 'bi-weekly' | 'weekly' | 'one-time';
  currency: string;
  notes?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  isEssential: boolean;
  paymentMethod: 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Cash' | 'Digital Wallet';
  currency: string;
  notes?: string;
  tags?: string[];
}

export interface BudgetCategory {
  id: string;
  category: string;
  budgetLimit: number;
  period: 'monthly';
  color?: string;
  rationale?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'emergency' | 'education' | 'debt' | 'vacation' | 'housing' | 'equipment' | 'other';
  notes?: string;
}

export interface PersonaScenario {
  id: string;
  title: string;
  personaName: string;
  role: string;
  scenarioSummary: string;
  avatar: string;
  badge: string;
  defaultCurrency: string;
  keyFocus: string[];
  recommendedStrategy: string;
  isCustom?: boolean;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
}

export interface FinancialAuditResult {
  healthScore: number;
  healthGrade: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  currency: string;
  executiveSummary?: string;
  overspendingAlerts: Array<{
    category: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  actionableSavingTips: string[];
  nextMonthStrategy?: {
    suggestedBudgetShift: string;
    targetSavingsGoal: number;
  };
  scenarioInsights?: string;
  aiPowered?: boolean;
}

export interface CurrencyRateData {
  base: string;
  rates: Record<string, number>;
  currencies: string[];
}
