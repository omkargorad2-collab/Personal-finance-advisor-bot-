import { Income, Expense, BudgetCategory, SavingsGoal, FinancialAuditResult, CurrencyRateData } from '../types';

export async function fetchScenarioState(scenarioId: string) {
  try {
    const res = await fetch(`/api/state/${scenarioId}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.warn('Failed to load server state:', e);
    return null;
  }
}

export async function saveScenarioState(
  scenarioId: string,
  state: {
    incomes: Income[];
    expenses: Expense[];
    budgets: BudgetCategory[];
    goals: SavingsGoal[];
    currency: string;
  }
) {
  try {
    const res = await fetch(`/api/state/${scenarioId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to save server state:', e);
  }
}

export async function resetScenarioState(scenarioId: string) {
  try {
    const res = await fetch(`/api/state/reset/${scenarioId}`, {
      method: 'POST',
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to reset scenario state:', e);
  }
}

export async function fetchCurrencyRates(base: string = 'USD'): Promise<CurrencyRateData | null> {
  try {
    const res = await fetch(`/api/currency/rates?base=${encodeURIComponent(base)}`);
    if (!res.ok) throw new Error('Rates error');
    return await res.json();
  } catch (e) {
    return {
      base,
      rates: { USD: 1.0, EUR: 0.92, GBP: 0.79, INR: 83.2, JPY: 154.5, CAD: 1.36, AUD: 1.51, SGD: 1.35, AED: 3.67, CHF: 0.89, CNY: 7.24, BRL: 5.15 },
      currencies: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'SGD', 'AED', 'CHF', 'CNY', 'BRL'],
    };
  }
}

export async function sendAdvisorChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }>,
  financialContext: any
): Promise<string> {
  try {
    const res = await fetch('/api/advisor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, financialContext }),
    });
    if (!res.ok) throw new Error('Chat API error');
    const data = await res.json();
    return data.reply || 'No response generated.';
  } catch (e: any) {
    return `Advisor connection error: ${e.message}. Please verify server connection.`;
  }
}

export async function requestFinancialAnalysis(financialData: any): Promise<FinancialAuditResult> {
  try {
    const res = await fetch('/api/advisor/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ financialData }),
    });
    if (!res.ok) throw new Error('Analysis API error');
    return await res.json();
  } catch (e: any) {
    throw new Error(e.message || 'Audit failed');
  }
}

export async function generateAiBudget(
  income: number,
  scenarioId: string,
  categories: string[],
  method: string = '50_30_20'
): Promise<Array<{ category: string; budgetLimit: number; percentage: number; rationale: string }>> {
  try {
    const res = await fetch('/api/advisor/generate-budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ income, scenarioId, categories, method }),
    });
    if (!res.ok) throw new Error('Budget generation error');
    const data = await res.json();
    return data.budgets || [];
  } catch (e: any) {
    console.error('Budget generation error:', e);
    return [];
  }
}

export async function fetchPredictiveForecast(
  income: number,
  monthlyExpense: number,
  currentSavings: number,
  targetMonths: number = 6
) {
  try {
    const res = await fetch('/api/advisor/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ income, monthlyExpense, currentSavings, targetMonths }),
    });
    if (!res.ok) throw new Error('Forecast API error');
    return await res.json();
  } catch (e: any) {
    console.error('Forecast error:', e);
    return null;
  }
}

export async function executeSimulatedSql(sql: string, scenarioData: any) {
  try {
    const res = await fetch('/api/sql/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, scenarioData }),
    });
    return await res.json();
  } catch (e: any) {
    return { error: e.message || 'Network error executing SQL' };
  }
}
