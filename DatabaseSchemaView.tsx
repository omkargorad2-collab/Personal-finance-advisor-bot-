import React, { useState } from 'react';
import { executeSimulatedSql } from '../services/api';
import { Database, Play, Code2, Server, Table, Layers, CheckCircle2, Clock } from 'lucide-react';

interface DatabaseSchemaViewProps {
  scenarioData: any;
}

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = ({ scenarioData }) => {
  const [sqlInput, setSqlInput] = useState<string>(
    "SELECT category, SUM(amount) AS total_amount, count(*) as count FROM expenses GROUP BY category;"
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<{
    columns?: string[];
    rows?: any[];
    rowCount?: number;
    executionTimeMs?: number;
    error?: string;
  } | null>(null);

  const sampleQueries = [
    {
      title: 'Category Aggregate Breakdown',
      sql: 'SELECT category, SUM(amount) AS total_amount FROM expenses GROUP BY category;',
    },
    {
      title: 'Top Essential Needs Expenses',
      sql: 'SELECT * FROM expenses WHERE essential = true ORDER BY amount DESC;',
    },
    {
      title: 'Active Income Streams',
      sql: 'SELECT * FROM incomes;',
    },
    {
      title: 'Current Budget Allocations',
      sql: 'SELECT * FROM budgets;',
    },
    {
      title: 'Target Savings Goals',
      sql: 'SELECT * FROM savings_goals;',
    },
  ];

  const handleRunQuery = async () => {
    setIsRunning(true);
    try {
      const res = await executeSimulatedSql(sqlInput, scenarioData);
      setQueryResult(res);
    } catch (e: any) {
      setQueryResult({ error: e.message || 'Execution failed' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Scalable Backend Architecture & Relational Schema
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-grade relational data modeling inspired by Flask, SQLAlchemy ORM, and SQLite/PostgreSQL
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>SQLAlchemy Models Active</span>
            </span>
          </div>
        </div>

        {/* Schema Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
              <Table className="w-3.5 h-3.5 text-blue-400" />
              <span>incomes (1:N)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              id, user_id, source, amount, category, frequency, currency, date
            </p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
              <Table className="w-3.5 h-3.5 text-rose-400" />
              <span>expenses (1:N)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              id, user_id, description, amount, category, is_essential, method
            </p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
              <Table className="w-3.5 h-3.5 text-amber-400" />
              <span>budgets (1:N)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              id, user_id, category, budget_limit, period, rationale
            </p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              <span>savings_goals (1:N)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              id, user_id, title, target_amount, current_amount, target_date
            </p>
          </div>
        </div>
      </div>

      {/* Interactive SQL Query Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Interactive SQL Query Sandbox</h3>
          </div>
          <span className="text-[11px] text-slate-400">Directly query the active persona's relational store</span>
        </div>

        {/* Quick query chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Pre-canned:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setSqlInput(q.sql)}
              className="text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
            >
              {q.title}
            </button>
          ))}
        </div>

        {/* SQL Editor Area */}
        <div className="relative">
          <textarea
            aria-label="SQL Query Input"
            rows={3}
            value={sqlInput}
            onChange={(e) => setSqlInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-emerald-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
            placeholder="Write your SQL statement..."
          />
          <button
            onClick={handleRunQuery}
            disabled={isRunning || !sqlInput.trim()}
            className="absolute right-3 bottom-4 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>

        {/* Results Window */}
        {queryResult && (
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden space-y-2 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Returned {queryResult.rowCount ?? queryResult.rows?.length ?? 0} rows</span>
              </span>
              {queryResult.executionTimeMs && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{queryResult.executionTimeMs} ms execution</span>
                </span>
              )}
            </div>

            {queryResult.error ? (
              <div className="p-3 bg-rose-950/40 border border-rose-900 rounded-lg text-xs text-rose-300 font-mono">
                Error: {queryResult.error}
              </div>
            ) : queryResult.rows && queryResult.rows.length > 0 ? (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                    <tr>
                      {queryResult.columns?.map((col) => (
                        <th key={col} className="py-2 px-3">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {queryResult.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/60">
                        {queryResult.columns?.map((col) => (
                          <td key={col} className="py-2 px-3 text-slate-300 whitespace-nowrap">
                            {typeof row[col] === 'boolean'
                              ? row[col] ? 'TRUE' : 'FALSE'
                              : row[col] ?? 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">Query returned 0 rows.</div>
            )}
          </div>
        )}
      </div>

      {/* SQLAlchemy Model Code Snippet Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          SQLAlchemy ORM Backend Entity Definition (Python / Flask)
        </h4>
        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    persona_type = db.Column(db.String(30), default='salaried')
    base_currency = db.Column(db.String(5), default='USD')
    expenses = db.relationship('Expense', backref='user', lazy=True)
    incomes = db.relationship('Income', backref='user', lazy=True)
    budgets = db.relationship('Budget', backref='user', lazy=True)

class Expense(db.Model):
    __tablename__ = 'expenses'
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    is_essential = db.Column(db.Boolean, default=True)
    date = db.Column(db.Date, default=datetime.utcnow)
    payment_method = db.Column(db.String(50))

class Budget(db.Model):
    __tablename__ = 'budgets'
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    budget_limit = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), default='monthly')`}
        </pre>
      </div>
    </div>
  );
};
