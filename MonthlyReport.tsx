import React, { useState } from 'react';
import { FinancialAuditResult, PersonaScenario, Income, Expense, BudgetCategory, SavingsGoal } from '../types';
import { CURRENCY_SYMBOLS } from '../data/mockData';
import { requestFinancialAnalysis } from '../services/api';
import { 
  FileText, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Calendar, 
  Download, 
  Loader2, 
  Award, 
  ArrowRight 
} from 'lucide-react';

interface MonthlyReportProps {
  scenario: PersonaScenario;
  incomes: Income[];
  expenses: Expense[];
  budgets: BudgetCategory[];
  goals: SavingsGoal[];
  currency: string;
  auditResult: FinancialAuditResult | null;
  onUpdateAudit: (audit: FinancialAuditResult) => void;
  onAskAdvisor: (question: string) => void;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  scenario,
  incomes,
  expenses,
  budgets,
  goals,
  currency,
  auditResult,
  onUpdateAudit,
  onAskAdvisor,
}) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

  // Refresh analysis via Gemini API
  const handleRefreshReport = async () => {
    setIsRefreshing(true);
    try {
      const dataPayload = {
        scenario,
        incomes,
        expenses,
        budgets,
        goals,
        currency,
      };
      const res = await requestFinancialAnalysis(dataPayload);
      onUpdateAudit(res);
    } catch (e) {
      console.error('Audit refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const report = auditResult;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Monthly Financial Summary Report
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive financial audit, income vs. expense performance, savings achieved, and next-month roadmap
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshReport}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating AI Audit...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Regenerate with Gemini 3.8</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Printable Report Paper Document */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-700">
                Official Monthly Statement
              </span>
              <span className="text-slate-500 print:text-slate-400">•</span>
              <span className="text-xs text-slate-400 print:text-slate-600">
                Billing Cycle: September 2026
              </span>
            </div>
            <h1 className="text-2xl font-black text-white print:text-black tracking-tight mt-1">
              Monthly Financial Statement & Analysis
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Prepared for <strong className="text-slate-200 print:text-black">{scenario.personaName}</strong> ({scenario.role})
            </p>
          </div>

          {/* Real Financial Performance Badge */}
          <div className="bg-slate-950/80 print:bg-slate-100 p-3.5 rounded-2xl border border-slate-800 print:border-slate-300 text-center sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 print:text-slate-600 uppercase tracking-wider">
              Net Monthly Cashflow
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${netSavings >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                {netSavings >= 0 ? '+' : ''}{currencySymbol}{netSavings.toLocaleString()}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-300 print:text-slate-600">
              Savings Rate: <strong className={savingsRate >= 20 ? 'text-emerald-400 print:text-emerald-700' : 'text-amber-400'}>{savingsRate}%</strong>
            </span>
          </div>
        </div>

        {/* Executive Summary Paragraph */}
        <div className="bg-slate-950/60 print:bg-slate-50 p-4 rounded-xl border border-slate-800/80 print:border-slate-200">
          <h3 className="text-xs font-bold text-indigo-300 print:text-indigo-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Executive Financial Analysis
          </h3>
          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
            {report?.executiveSummary ||
              `During this monthly period, total income reached ${currencySymbol}${totalIncome.toLocaleString()} with total operational living expenditures of ${currencySymbol}${totalExpense.toLocaleString()}, resulting in an absolute net surplus of ${currencySymbol}${netSavings.toLocaleString()} and a savings rate of ${savingsRate}%. Overall cash flow reflects steady discipline, with key areas identified for discretionary optimization.`}
          </p>
        </div>

        {/* Income vs Expenses Performance Ledger */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
            1. Income vs. Expense Reconciliation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-slate-950/80 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Gross Monthly Income</span>
              <span className="text-xl font-bold text-emerald-400 print:text-emerald-700">
                +{currencySymbol}{totalIncome.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 print:text-slate-600 block mt-0.5">
                {incomes.length} Verified Sources
              </span>
            </div>
            <div className="bg-slate-950/80 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Total Expenses Outflow</span>
              <span className="text-xl font-bold text-rose-400 print:text-rose-700">
                -{currencySymbol}{totalExpense.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 print:text-slate-600 block mt-0.5">
                {expenses.length} Itemized Logs
              </span>
            </div>
            <div className="bg-slate-950/80 print:bg-slate-100 p-4 rounded-xl border border-slate-800 print:border-slate-300">
              <span className="text-[11px] text-slate-400 print:text-slate-600 block">Net Savings Achieved</span>
              <span className={`text-xl font-bold ${netSavings >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                {currencySymbol}{netSavings.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 print:text-slate-600 block mt-0.5">
                {savingsRate}% Savings Ratio
              </span>
            </div>
          </div>
        </div>

        {/* Overspending Audit Section */}
        {report?.overspendingAlerts && report.overspendingAlerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-rose-300 print:text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              2. Overspending Areas & Root Cause Diagnostics
            </h3>
            <div className="space-y-2">
              {report.overspendingAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 print:bg-rose-50 p-3.5 rounded-xl border border-rose-900/40 print:border-rose-300 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-semibold text-rose-200 print:text-rose-900">
                    <span>Category: {alert.category}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-950 print:bg-rose-200 text-rose-400 print:text-rose-800">
                      Severity: {alert.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 print:text-slate-700">{alert.message}</p>
                  <p className="text-slate-400 print:text-slate-600 italic">
                    Recommendation: {alert.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Saving Opportunities */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            3. AI Saving Opportunities & Next Month Goals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(report?.actionableSavingTips || []).map((tip, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 print:bg-slate-100 p-3.5 rounded-xl border border-slate-800 print:border-slate-300 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 print:text-emerald-700 shrink-0 mt-0.5" />
                <span className="text-slate-300 print:text-slate-800 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Goals for Following Month */}
        <div className="bg-slate-950/80 print:bg-slate-100 p-5 rounded-xl border border-slate-800 print:border-slate-300 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-300 print:text-indigo-800 uppercase tracking-wider">
              4. Target Milestones for October 2026
            </h4>
            <span className="text-xs text-slate-400 print:text-slate-600">
              Suggested Monthly Savings: {currencySymbol}{Math.max(100, Math.round(totalIncome * 0.2)).toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map((g) => (
              <div key={g.id} className="bg-slate-900 print:bg-white p-3 rounded-lg border border-slate-800 print:border-slate-200 text-xs">
                <div className="flex justify-between font-semibold text-slate-200 print:text-black">
                  <span>{g.title}</span>
                  <span className="text-emerald-400 print:text-emerald-700">
                    {Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 print:text-slate-600 mt-1">
                  Target Deadline: {g.targetDate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sign-off footer */}
        <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 print:text-slate-600">
          <span>Personal Finance Advisor Bot • AI-Generated Financial Report</span>
          <span>Validated with Gemini 3.8 Flash Financial Reasoning Engine</span>
        </div>
      </div>
    </div>
  );
};
