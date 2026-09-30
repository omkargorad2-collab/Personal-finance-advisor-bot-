import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FolderArchive, 
  FileCode, 
  Check, 
  Copy, 
  Terminal, 
  ExternalLink, 
  Layers, 
  Sparkles,
  FileText,
  Package
} from 'lucide-react';

interface SourceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourceExportModal: React.FC<SourceExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleDownloadZip = () => {
    // Direct link to the generated zip file
    const link = document.createElement('a');
    link.href = '/personal-finance-advisor-source.zip';
    link.download = 'personal-finance-advisor-source.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sourceFilesList = [
    { name: 'README.md', category: 'Documentation', desc: 'Setup, run instructions, and architecture breakdown' },
    { name: 'package.json', category: 'Configuration', desc: 'Dependencies (React, Tailwind, Express, GenAI SDK)' },
    { name: 'tsconfig.json', category: 'Configuration', desc: 'TypeScript compiler configuration' },
    { name: 'vite.config.ts', category: 'Build Tool', desc: 'Vite build and dev server configuration' },
    { name: 'server.ts', category: 'Backend Server', desc: 'Express API server with Gemini 3.8 advisor and rates' },
    { name: 'index.html', category: 'HTML Entry', desc: 'Single-page application HTML shell with SEO meta' },
    { name: '.env.example', category: 'Environment', desc: 'Template for GEMINI_API_KEY and PORT' },
    { name: 'metadata.json', category: 'Configuration', desc: 'AI Studio app metadata and capabilities' },
    { name: 'src/main.tsx', category: 'Frontend Root', desc: 'React 18 DOM mount entrypoint' },
    { name: 'src/App.tsx', category: 'Core App', desc: 'Central controller, state managers, and navigation' },
    { name: 'src/index.css', category: 'Styles', desc: 'Tailwind CSS imports, Dark, Light & Midnight themes' },
    { name: 'src/types.ts', category: 'Data Models', desc: 'TypeScript interfaces for Expenses, Incomes, Budgets' },
    { name: 'src/data/mockData.ts', category: 'Data Seed', desc: 'Persona scenarios, categories, and currency definitions' },
    { name: 'src/services/api.ts', category: 'API Client', desc: 'REST client methods for advisor chat & data sync' },
    { name: 'src/utils/scenarioAdvisor.ts', category: 'Financial Math', desc: 'Runway, savings ratios, and budget algorithms' },
    { name: 'src/components/Header.tsx', category: 'UI Component', desc: 'Global header, theme changer, profile switcher' },
    { name: 'src/components/Dashboard.tsx', category: 'UI Component', desc: 'Executive financial dashboard & quick actions' },
    { name: 'src/components/TransactionsView.tsx', category: 'UI Component', desc: 'Transactions table with 1-click edit, trim, CSV' },
    { name: 'src/components/TransactionModal.tsx', category: 'UI Component', desc: 'Log & modify expenses/incomes form modal' },
    { name: 'src/components/BudgetPlanner.tsx', category: 'UI Component', desc: '50/30/20 category budget envelopes & edit' },
    { name: 'src/components/SavingsGoals.tsx', category: 'UI Component', desc: 'Financial goals, milestones & emergency fund track' },
    { name: 'src/components/MonthlyReport.tsx', category: 'UI Component', desc: 'Comprehensive financial audit & printable summary' },
    { name: 'src/components/MultiCurrencyView.tsx', category: 'UI Component', desc: 'Multi-currency converter for global personas' },
    { name: 'src/components/AiAdvisorBot.tsx', category: 'UI Component', desc: 'Gemini 3.8 AI Financial Advisor chatbot' },
    { name: 'src/components/ResetProfileModal.tsx', category: 'UI Component', desc: 'Clean slate, baseline restore, & profile reset' },
    { name: 'src/components/CircularCharts.tsx', category: 'UI Component', desc: 'SVG Donut and progress ring charts' },
    { name: 'src/components/GoalModal.tsx', category: 'UI Component', desc: 'Savings milestone creation modal' },
    { name: 'src/components/CreateProfileModal.tsx', category: 'UI Component', desc: 'Custom profile creator with blank canvas' },
    { name: 'src/components/DatabaseSchemaView.tsx', category: 'UI Component', desc: 'Relational database architecture visualizer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Application Source Code ZIP</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Full Project
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Complete, clean codebase in orderly structure ready to run locally
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Download CTA Card */}
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 rounded-2xl p-5 shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Ready for Instant Download
              </span>
              <h4 className="text-base font-bold text-white">
                personal-finance-advisor-source.zip
              </h4>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                Contains the complete frontend, backend server, Tailwind styles, components, and documentation without bloat (clean of node_modules and builds).
              </p>
            </div>
            <button
              onClick={handleDownloadZip}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download ZIP Now</span>
            </button>
          </div>

          {/* How to Run Locally */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              How to Run Locally After Extracting
            </h4>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] flex items-center justify-between text-slate-300">
                <span>npm install &amp;&amp; npm run dev</span>
                <button
                  onClick={() => handleCopy('npm install && npm run dev', 'run')}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title="Copy command"
                >
                  {copiedCmd === 'run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Runs the application at <strong className="text-white">http://localhost:3000</strong> with hot reloading and Express backend.
              </p>
            </div>
          </div>

          {/* Complete Ordered File Index */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Files Included in Order ({sourceFilesList.length} files)
              </h4>
              <span className="text-[11px] text-slate-400">Excludes node_modules &amp; builds</span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 max-h-60 overflow-y-auto">
              {sourceFilesList.map((file, i) => (
                <div key={file.name} className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs bg-slate-900/60 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] text-slate-500 font-mono w-5 shrink-0 text-right">{i + 1}.</span>
                    <span className="font-mono text-indigo-300 font-medium truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[11px]">
                    <span className="text-slate-400 hidden sm:inline">{file.desc}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {file.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            ZIP archive is packaged and served directly from your app.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ZIP</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
