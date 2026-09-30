import React, { useState, useEffect } from 'react';
import { CURRENCY_SYMBOLS } from '../data/mockData';
import { CurrencyRateData, Expense } from '../types';
import { fetchCurrencyRates } from '../services/api';
import { 
  Globe, 
  ArrowRightLeft, 
  Send, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  RefreshCw, 
  Layers 
} from 'lucide-react';

interface MultiCurrencyViewProps {
  currentCurrency: string;
  onCurrencyChange: (curr: string) => void;
  expenses: Expense[];
  monthlyIncome: number;
  monthlyExpense: number;
}

export const MultiCurrencyView: React.FC<MultiCurrencyViewProps> = ({
  currentCurrency,
  onCurrencyChange,
  expenses,
  monthlyIncome,
  monthlyExpense,
}) => {
  const [ratesData, setRatesData] = useState<CurrencyRateData | null>(null);
  const [loading, setLoading] = useState(false);

  // Currency Converter Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [fromCurr, setFromCurr] = useState<string>(currentCurrency);
  const [toCurr, setToCurr] = useState<string>('EUR');

  // Remittance log state
  const [remittanceList, setRemittanceList] = useState<Array<{
    id: string;
    beneficiary: string;
    relationship: string;
    country: string;
    amountSent: number;
    currencySent: string;
    amountReceived: number;
    currencyReceived: string;
    date: string;
    purpose: string;
  }>>([
    {
      id: 'rem-1',
      beneficiary: 'Morales Grandparents',
      relationship: 'Elder Parents',
      country: 'Spain (Madrid)',
      amountSent: 650,
      currencySent: 'USD',
      amountReceived: 600,
      currencyReceived: 'EUR',
      date: '2026-09-05',
      purpose: 'Senior Healthcare & Pharmacy Subsidy',
    },
    {
      id: 'rem-2',
      beneficiary: 'Priya Family Education Trust',
      relationship: 'Sibling/Nieces',
      country: 'India (Bangalore)',
      amountSent: 400,
      currencySent: 'USD',
      amountReceived: 33280,
      currencyReceived: 'INR',
      date: '2026-09-12',
      purpose: 'Engineering College Tuition Support',
    },
  ]);

  // New remittance modal form
  const [newBeneficiary, setNewBeneficiary] = useState('');
  const [newCountry, setNewCountry] = useState('Spain');
  const [newSendAmount, setNewSendAmount] = useState<number | ''>(500);
  const [newSendCurrency, setNewSendCurrency] = useState(currentCurrency);
  const [newReceiveCurrency, setNewReceiveCurrency] = useState('EUR');
  const [newPurpose, setNewPurpose] = useState('');

  const loadRates = async (base: string) => {
    setLoading(true);
    const data = await fetchCurrencyRates(base);
    setRatesData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRates(currentCurrency);
    setFromCurr(currentCurrency);
  }, [currentCurrency]);

  const rates = ratesData?.rates || {
    USD: 1.0,
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
  };

  // Convert calculation
  const fromRate = rates[fromCurr] || 1;
  const toRate = rates[toCurr] || 1;
  // Convert from fromCurr to base then to toCurr
  const convertedResult = Number(((calcAmount / fromRate) * toRate).toFixed(2));
  const effectiveRate = Number((toRate / fromRate).toFixed(4));

  // Add remittance
  const handleAddRemittance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeneficiary || !newSendAmount || Number(newSendAmount) <= 0) return;

    const fromR = rates[newSendCurrency] || 1;
    const toR = rates[newReceiveCurrency] || 1;
    const recAmt = Number(((Number(newSendAmount) / fromR) * toR).toFixed(2));

    const newRecord = {
      id: `rem-${Date.now()}`,
      beneficiary: newBeneficiary,
      relationship: 'Family Member',
      country: newCountry,
      amountSent: Number(newSendAmount),
      currencySent: newSendCurrency,
      amountReceived: recAmt,
      currencyReceived: newReceiveCurrency,
      date: new Date().toISOString().split('T')[0],
      purpose: newPurpose || 'Family Living Assistance',
    };

    setRemittanceList([newRecord, ...remittanceList]);
    setNewBeneficiary('');
    setNewPurpose('');
  };

  const currencySymbol = CURRENCY_SYMBOLS[currentCurrency] || currentCurrency;

  return (
    <div className="space-y-6">
      {/* Top Banner: Global Multi-Currency Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Multi-Currency & International Remittance Hub
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Support for cross-border families, multi-region living expenses, and international client invoicing
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Primary App Base:</span>
            <select
              aria-label="Primary Application Currency Base"
              value={currentCurrency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c} ({CURRENCY_SYMBOLS[c]})
                </option>
              ))}
            </select>
            <button
              onClick={() => loadRates(currentCurrency)}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700 transition-colors"
              title="Refresh rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Converted Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">In USD ($)</span>
            <span className="text-sm font-bold text-white">
              ${Number(((monthlyIncome / (rates[currentCurrency] || 1)) * (rates['USD'] || 1)).toFixed(0)).toLocaleString()} /mo
            </span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">In EUR (€)</span>
            <span className="text-sm font-bold text-white">
              €{Number(((monthlyIncome / (rates[currentCurrency] || 1)) * (rates['EUR'] || 0.92)).toFixed(0)).toLocaleString()} /mo
            </span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">In GBP (£)</span>
            <span className="text-sm font-bold text-white">
              £{Number(((monthlyIncome / (rates[currentCurrency] || 1)) * (rates['GBP'] || 0.79)).toFixed(0)).toLocaleString()} /mo
            </span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">In INR (₹)</span>
            <span className="text-sm font-bold text-white">
              ₹{Number(((monthlyIncome / (rates[currentCurrency] || 1)) * (rates['INR'] || 83.2)).toFixed(0)).toLocaleString()} /mo
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Currency Converter & Live Exchange Rates Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Converter Calculator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Instant Currency Converter</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount to Convert</label>
              <input
                type="number"
                min="1"
                step="any"
                value={calcAmount}
                onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">From Currency</label>
                <select
                  aria-label="From Currency"
                  value={fromCurr}
                  onChange={(e) => setFromCurr(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                    <option key={c} value={c}>
                      {c} ({CURRENCY_SYMBOLS[c]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">To Currency</label>
                <select
                  aria-label="To Currency"
                  value={toCurr}
                  onChange={(e) => setToCurr(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                    <option key={c} value={c}>
                      {c} ({CURRENCY_SYMBOLS[c]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-center">
              <span className="text-xs text-slate-400">Converted Value</span>
              <div className="text-2xl font-black text-emerald-400">
                {CURRENCY_SYMBOLS[toCurr] || ''}{convertedResult.toLocaleString()} {toCurr}
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                1 {fromCurr} = {effectiveRate} {toCurr}
              </div>
            </div>
          </div>
        </div>

        {/* Live Rates Matrix Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Live Regional Exchange Rates (Base: {currentCurrency})
            </h3>
            <span className="text-[11px] text-slate-400">Direct FX Parity</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {Object.entries(rates).map(([currCode, rate]) => {
              const sym = CURRENCY_SYMBOLS[currCode] || currCode;
              const isBase = currCode === currentCurrency;

              return (
                <div
                  key={currCode}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isBase
                      ? 'bg-emerald-950/40 border-emerald-800 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{currCode}</span>
                    <span className="text-slate-400 text-[11px]">{sym}</span>
                  </div>
                  <div className="text-sm font-semibold mt-1">
                    {isBase ? '1.0000 (Base)' : rate.toFixed(4)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cross-Border Family Remittances Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              Cross-Border Family Remittances & Support
            </h3>
            <p className="text-xs text-slate-400">
              Track multi-region transfers for elder care, tuition, and family living across Spain, India, and overseas
            </p>
          </div>
        </div>

        {/* Remittance Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Beneficiary</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3 text-right">Amount Sent</th>
                <th className="py-2.5 px-3 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {remittanceList.map((rem) => (
                <tr key={rem.id} className="hover:bg-slate-850">
                  <td className="py-2.5 px-3 text-slate-400">{rem.date}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {rem.beneficiary}
                    <span className="block text-[10px] text-slate-400 font-normal">{rem.relationship}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{rem.country}</td>
                  <td className="py-2.5 px-3 text-slate-400">{rem.purpose}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-rose-400">
                    -{CURRENCY_SYMBOLS[rem.currencySent] || ''}{rem.amountSent.toLocaleString()} {rem.currencySent}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    +{CURRENCY_SYMBOLS[rem.currencyReceived] || ''}{rem.amountReceived.toLocaleString()} {rem.currencyReceived}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Log Remittance Form */}
        <form onSubmit={handleAddRemittance} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Record Cross-Border Transfer</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Beneficiary Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Elena Vance, Grandparents"
                value={newBeneficiary}
                onChange={(e) => setNewBeneficiary(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Destination Country</label>
              <input
                type="text"
                required
                placeholder="e.g. Spain, India, UK, Japan"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Amount to Send ({newSendCurrency})</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={newSendAmount}
                onChange={(e) => setNewSendAmount(parseFloat(e.target.value) || '')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Receive Currency</label>
              <select
                aria-label="Beneficiary Currency"
                value={newReceiveCurrency}
                onChange={(e) => setNewReceiveCurrency(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_SYMBOLS[c]})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <input
              type="text"
              placeholder="Transfer purpose (e.g. Emergency healthcare support, Education tuition fee)"
              value={newPurpose}
              onChange={(e) => setNewPurpose(e.target.value)}
              className="w-full sm:w-2/3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Record Remittance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
