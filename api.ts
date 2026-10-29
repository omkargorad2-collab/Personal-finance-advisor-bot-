
import {
  Income,
  Expense,
  BudgetCategory,
  SavingsGoal,
  FinancialAuditResult,
  CurrencyRateData,
} from './types';

// Vercel frontend can connect to the Render backend using this variable.
// If both frontend and backend run on the same server, leave it empty.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ''
).replace(/\/+$/, '');

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed: HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchScenarioState(scenarioId: string) {
  try {
    const response = await fetch(
      apiUrl(`/api/state/${encodeURIComponent(scenarioId)}`)
    );
    const json = await readJson<{ data: any }>(response);
    return json.data ?? null;
  } catch (error) {
    console.warn('Failed to load scenario state:', error);
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
    const response = await fetch(
      apiUrl(`/api/state/${encodeURIComponent(scenarioId)}`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      }
    );

    return await readJson<any>(response);
  } catch (error) {
    console.error('Failed to save scenario state:', error);
    return null;
  }
}

export async function resetScenarioState(scenarioId: string) {
  try {
    const response = await fetch(
      apiUrl(`/api/state/reset/${encodeURIComponent(scenarioId)}`),
      { method: 'POST' }
    );

    return await readJson<any>(response);
  } catch (error) {
    console.error('Failed to reset scenario state:', error);
    return null;
  }
}

export async function fetchCurrencyRates(
  base: string = 'USD'
): Promise<CurrencyRateData | null> {
  try {
    const response = await fetch(
      apiUrl(`/api/currency/rates?base=${encodeURIComponent(base)}`)
    );

    return await readJson<CurrencyRateData>(response);
  } catch (error) {
    console.warn('Using fallback currency rates:', error);

    return {
      base,
      rates: {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        INR: 83.2,
        JPY: 154.5,
        CAD: 1.36,
        AUD: 1.51,
        SGD: 1.35,
        AED: 3.67,
        CHF: 0.89,
        CNY: 7.24,
        BRL: 5.15,
      },
      currencies: [
        'USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD',
        'AUD', 'SGD', 'AED', 'CHF', 'CNY', 'BRL',
      ],
    };
  }
}

export async function sendAdvisorChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }>,
  financialContext: any
): Promise<string> {
  try {
    const response = await fetch(apiUrl('/api/advisor/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, financialContext }),
    });

    const data = await readJson<{ reply?: string }>(response);
    return data.reply || 'No response generated.';
  } catch (error) {
    console.error('Advisor chat error:', error);
    return 'Unable to connect to the advisor. Please check the backend connection.';
  }
}

export async function requestFinancialAnalysis(
  financialData: any
): Promise<FinancialAuditResult> {
  const response = await fetch(apiUrl('/api/advisor/analyze'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ financialData }),
  });

  return readJson<FinancialAuditResult>(response);
}

export async function generateAiBudget(
  income: number,
  scenarioId: string,
  categories: string[],
  method: string = '50_30_20'
): Promise<
  Array<{
    category: string;
    budgetLimit: number;
    percentage: number;
    rationale: string;
  }>
> {
  try {
    const response = await fetch(
      apiUrl('/api/advisor/generate-budget'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ income, scenarioId, categories, method }),
      }
    );

    const data = await readJson<{ budgets?: any[] }>(response);
    return data.budgets || [];
  } catch (error) {
    console.error('Budget generation error:', error);
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
    const response = await fetch(apiUrl('/api/advisor/forecast'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        income,
        monthlyExpense,
        currentSavings,
        targetMonths,
      }),
    });

    return await readJson<any>(response);
  } catch (error) {
    console.error('Forecast error:', error);
    return null;
  }
}

export async function executeSimulatedSql(
  sql: string,
  scenarioData: any
) {
  try {
    const response = await fetch(apiUrl('/api/sql/query'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, scenarioData }),
    });

    return await readJson<any>(response);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Network error executing SQL',
    };
  }
      }
  
