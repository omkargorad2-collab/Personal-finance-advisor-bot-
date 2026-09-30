import React, { useState } from 'react';
import { PersonaScenario } from '../types';
import { CURRENCY_SYMBOLS } from '../data/mockData';
import { 
  X, 
  RotateCcw, 
  Eraser, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface ResetProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: PersonaScenario;
  currency: string;
  onResetToCleanSlate: () => void;
  onResetToBaseline: () => void;
  onDeleteProfile?: () => void;
  onFactoryResetAll?: () => void;
}

export const ResetProfileModal: React.FC<ResetProfileModalProps> = ({
  isOpen,
  onClose,
  scenario,
  currency,
  onResetToCleanSlate,
  onResetToBaseline,
  onDeleteProfile,
  onFactoryResetAll,
}) => {
  if (!isOpen) return null;

  const [confirmAction, setConfirmAction] = useState<'clean' | 'baseline' | 'delete' | 'factory' | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const handleExecute = (action: 'clean' | 'baseline' | 'delete' | 'factory') => {
    if (action === 'clean') {
      onResetToCleanSlate();
      setSuccessToast(`Reset "${scenario.personaName}" to a clean slate with zero automatic expenses!`);
    } else if (action === 'baseline') {
      onResetToBaseline();
      setSuccessToast(`Restored baseline scenario records for "${scenario.personaName}".`);
    } else if (action === 'delete') {
      if (onDeleteProfile) {
        onDeleteProfile();
        onClose();
        return;
      }
    } else if (action === 'factory') {
      if (onFactoryResetAll) {
        onFactoryResetAll();
        setSuccessToast('All profiles restored to original factory defaults.');
      }
    }

    setConfirmAction(null);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl shadow-inner">
              {scenario.avatar || '👤'}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Reset Profile Options</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 font-normal">
                  {scenario.personaName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose how you want to reset or clear this financial profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-3.5">
          {/* Option 1: Clean Slate (Zero Expenses / Blank Canvas) */}
          <div className="bg-slate-850/80 border border-slate-700/80 rounded-xl p-4 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
                <Eraser className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Clean Blank Canvas
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    Recommended
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Clear all recorded expenses, incomes, and budgets for <strong>{scenario.personaName}</strong>. Gives you a 100% fresh sheet with zero automatic mock expenses.
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmAction('clean')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer self-start sm:self-center"
            >
              Start Clean Slate
            </button>
          </div>

          {/* Option 2: Restore Scenario Baseline */}
          <div className="bg-slate-850/80 border border-slate-700/80 rounded-xl p-4 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Restore Demo / Seed Baseline
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Reset this scenario back to its initial realistic demo incomes, expenses, envelopes, and savings milestones.
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirmAction('baseline')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer self-start sm:self-center"
            >
              Restore Baseline
            </button>
          </div>

          {/* Option 3: Delete Custom Profile (If custom) */}
          {scenario.isCustom && onDeleteProfile && (
            <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-4 hover:border-rose-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0 mt-0.5">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-200">
                    Delete Custom Profile
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Permanently delete <strong>"{scenario.personaName}"</strong> from your saved profiles and switch back to the default profile.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmAction('delete')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer self-start sm:self-center"
              >
                Delete Profile
              </button>
            </div>
          )}

          {/* Option 4: Factory Reset All Profiles */}
          {onFactoryResetAll && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="text-[11px] text-slate-400">
                <span>Want to reset all custom and pre-built profiles to factory setup?</span>
              </div>
              <button
                onClick={() => setConfirmAction('factory')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer shrink-0 ml-2"
              >
                Factory Reset All
              </button>
            </div>
          )}
        </div>

        {/* Confirmation Modal Overlay if an action is clicked */}
        {confirmAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {confirmAction === 'clean' && 'Confirm Clean Slate?'}
                    {confirmAction === 'baseline' && 'Confirm Restore Baseline?'}
                    {confirmAction === 'delete' && `Delete Profile "${scenario.personaName}"?`}
                    {confirmAction === 'factory' && 'Factory Reset All Profiles?'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {confirmAction === 'clean' && 'This will remove all current expenses, incomes, and budgets for this profile.'}
                    {confirmAction === 'baseline' && 'This will overwrite changes with the default scenario seed data.'}
                    {confirmAction === 'delete' && 'This custom profile will be removed from your browser.'}
                    {confirmAction === 'factory' && 'All profiles will be returned to initial installation state.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleExecute(confirmAction)}
                  className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition-colors cursor-pointer ${
                    confirmAction === 'delete'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : confirmAction === 'clean'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  Confirm &amp; Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
