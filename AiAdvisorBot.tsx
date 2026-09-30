import React, { useState, useRef, useEffect } from 'react';
import { PersonaScenario, Income, Expense, BudgetCategory, SavingsGoal, AiChatMessage } from '../types';
import { CURRENCY_SYMBOLS } from '../data/mockData';
import { sendAdvisorChat } from '../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Loader2, 
  CornerDownLeft, 
  RotateCcw, 
  Check 
} from 'lucide-react';

interface AiAdvisorBotProps {
  scenario: PersonaScenario;
  incomes: Income[];
  expenses: Expense[];
  budgets: BudgetCategory[];
  goals: SavingsGoal[];
  currency: string;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
}

export const AiAdvisorBot: React.FC<AiAdvisorBotProps> = ({
  scenario,
  incomes,
  expenses,
  budgets,
  goals,
  currency,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0;

  // Detect overspending
  const categorySpent: Record<string, number> = {};
  for (const exp of expenses) {
    categorySpent[exp.category] = (categorySpent[exp.category] || 0) + Number(exp.amount || 0);
  }
  const overspendingCategories = budgets
    .filter((b) => (categorySpent[b.category] || 0) > b.budgetLimit)
    .map((b) => ({
      category: b.category,
      spent: categorySpent[b.category],
      limit: b.budgetLimit,
      overrun: categorySpent[b.category] - b.budgetLimit,
    }));

  const initialMessages: AiChatMessage[] = [
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `Hello ${scenario.personaName}! I am your **Personal Finance Advisor Bot** powered by Gemini 3.8 Flash.\n\nI have evaluated your real financial condition for **${scenario.title}** (${scenario.role}):\n- **Monthly Net Income:** ${currencySymbol}${totalIncome.toLocaleString()}\n- **Monthly Living Expenses:** ${currencySymbol}${totalExpense.toLocaleString()}\n- **Net Monthly Surplus:** ${currencySymbol}${netSavings.toLocaleString()} (${savingsRate}% savings rate)\n${
        overspendingCategories.length > 0
          ? `- ⚠️ **Over-Budget Warning:** Exceeding threshold in **${overspendingCategories.map((c) => c.category).join(', ')}**.`
          : `- ✅ **Budget Status:** Disciplined spending within all set category envelopes.`
      }\n\nYou can ask me **ANY question** about personal finance—such as what you should do right now, what you can buy, how to spend, how to invest, or future plans for your family!`,
      timestamp: 'Just now',
      suggestedPrompts: [
        'What should I do right now with my finances?',
        'What can I afford to buy based on my monthly surplus?',
        'How should I spend my money (50/30/20 breakdown)?',
        'How to invest money for long-term compound wealth?',
        'Future plans for families according to our condition and expenses',
      ],
    },
  ];

  const [messages, setMessages] = useState<AiChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle external prompt if triggered from another tab
  useEffect(() => {
    if (externalPrompt) {
      handleSendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const userQuery = textToSend || inputText;
    if (!userQuery.trim() || isLoading) return;

    const userMessage: AiChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const financialContext = {
        personaName: scenario.personaName,
        scenarioTitle: scenario.title,
        scenarioRole: scenario.role,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        currency,
        topCategories: Object.entries(categorySpent).map(([category, amount]) => ({ category, amount })),
        overspendingCategories,
        goals: goals.map((g) => ({ title: g.title, current: g.currentAmount, target: g.targetAmount })),
        expensesList: expenses.slice(0, 15).map((e) => ({
          description: e.description,
          amount: e.amount,
          category: e.category,
          isEssential: e.isEssential,
        })),
        incomesList: incomes.map((i) => ({ source: i.source, amount: i.amount })),
      };

      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const reply = await sendAdvisorChat(userQuery, history, financialContext);

      const botMessage: AiChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-bot-err-${Date.now()}`,
          role: 'assistant',
          text: `I encountered an error connecting to the financial analysis service. Please try again.`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages(initialMessages);
  };

  // Helper to render bold markdown elements
  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Helper to format basic markdown text into clean, scannable React nodes
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-indigo-300 mt-3 mb-1.5 flex items-center gap-1.5">
            {renderInlineFormatting(trimmed.replace('### ', ''))}
          </h4>
        );
      }
      if (trimmed.startsWith('#### ')) {
        return (
          <h5 key={idx} className="font-semibold text-xs text-emerald-300 mt-2.5 mb-1">
            {renderInlineFormatting(trimmed.replace('#### ', ''))}
          </h5>
        );
      }
      if (trimmed === '---') {
        return <hr key={idx} className="border-slate-700/60 my-2" />;
      }
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (trimmed.includes('---')) return null;
        const cells = trimmed.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
        return (
          <div key={idx} className="grid grid-cols-4 gap-2 text-[11px] py-1 px-2 bg-slate-900/60 rounded border border-slate-800/80 my-0.5">
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className={cIdx === 0 ? 'font-semibold text-slate-200' : 'text-slate-300'}>
                {renderInlineFormatting(cell.trim())}
              </span>
            ))}
          </div>
        );
      }
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-slate-200 text-xs">
            <span className="text-indigo-400 mt-0.5 font-bold shrink-0">•</span>
            <div className="leading-relaxed">
              {renderInlineFormatting(trimmed.replace(/^[•\-*]\s*/, ''))}
            </div>
          </div>
        );
      }
      const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (matchNum) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1.5 text-slate-200 text-xs">
            <span className="w-4 h-4 rounded-full bg-indigo-900/80 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              {matchNum[1]}
            </span>
            <div className="leading-relaxed">
              {renderInlineFormatting(matchNum[2])}
            </div>
          </div>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="my-1 text-slate-200 leading-relaxed text-xs">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar: Financial Snapshot & Context */}
      <div className="lg:col-span-1 space-y-4">
        {/* User Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-slate-800 rounded-xl">{scenario.avatar}</span>
            <div>
              <h3 className="font-bold text-white text-sm">{scenario.personaName}</h3>
              <p className="text-[11px] text-slate-400">{scenario.role}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Monthly Cash In:</span>
              <strong className="text-emerald-400">{currencySymbol}{totalIncome.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monthly Outflow:</span>
              <strong className="text-rose-400">{currencySymbol}{totalExpense.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Net Savings:</span>
              <strong className={netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {currencySymbol}{netSavings.toLocaleString()} ({savingsRate}%)
              </strong>
            </div>
          </div>
        </div>

        {/* Overspending Alerts in Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2 text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] block">
            Budget Health Status
          </span>
          {overspendingCategories.length > 0 ? (
            <div className="space-y-1.5">
              {overspendingCategories.map((item, idx) => (
                <div key={idx} className="bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg text-rose-300">
                  <div className="font-semibold">{item.category}</div>
                  <div className="text-[11px] text-rose-400">
                    +{currencySymbol}{item.overrun.toLocaleString()} over limit
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg text-emerald-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>All categories within target!</span>
            </div>
          )}
        </div>

        {/* Quick Advisor Suggestions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] block">
            Core Financial Questions
          </span>
          <div className="space-y-1.5">
            <button
              onClick={() => handleSendMessage('What should I do right now with my finances?')}
              className="w-full text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors"
            >
              💡 What should I do right now?
            </button>
            <button
              onClick={() => handleSendMessage('What can I afford to buy based on my monthly surplus?')}
              className="w-full text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors"
            >
              🛍️ What can I afford to buy?
            </button>
            <button
              onClick={() => handleSendMessage('How should I spend my money (50/30/20 breakdown)?')}
              className="w-full text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors"
            >
              📊 How should I spend money?
            </button>
            <button
              onClick={() => handleSendMessage('How to invest money for long-term compound wealth?')}
              className="w-full text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors"
            >
              📈 How to invest my surplus?
            </button>
            <button
              onClick={() => handleSendMessage('What are future plans for families according to our finance condition and expenses?')}
              className="w-full text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors"
            >
              👨‍👩‍👧 Future plans for families
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Console */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[640px] overflow-hidden">
        {/* Chat Console Header */}
        <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Financial Planning Advisor
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </h3>
              <p className="text-[11px] text-slate-400">Grounded in your real-time budget, income streams, and goals</p>
            </div>
          </div>

          <button
            onClick={handleResetChat}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none shadow-sm'
                }`}
              >
                {renderFormattedText(msg.text)}

                {/* Prompt suggestions if provided */}
                {msg.suggestedPrompts && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                    {msg.suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p)}
                        className="text-[11px] bg-slate-900/80 hover:bg-slate-900 text-indigo-300 hover:text-indigo-200 px-2.5 py-1 rounded-lg border border-indigo-900/60 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        <span>{p}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span className="block text-[10px] text-slate-400/80 text-right mt-1.5">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Personal Finance Advisor is analyzing your cashflow...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-850 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask anything about ${scenario.personaName}'s budget, savings, or spending cuts...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-40 transition-all cursor-pointer"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
