import { useState } from 'react';
import { Plus, Settings2, TrendingUp, TrendingDown, Wallet, Clock, ArrowUpRight } from 'lucide-react';
import { useTransactions, useMonthSummary } from '../hooks/useTransactions';
import { formatCurrency, formatDate } from '../utils/formatters';
import { MONTHS } from '../utils/constants';
import TransactionForm from '../components/TransactionForm';
import CategoryForm from '../components/CategoryForm';
import TransactionCard from '../components/TransactionCard';
import EmptyState from '../components/EmptyState';

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'receita', label: 'Receitas' },
  { id: 'despesa', label: 'Despesas' },
  { id: 'pendente', label: 'Pendentes' },
];

export default function Financas() {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [filter, setFilter] = useState('todas');
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [initialType, setInitialType] = useState('despesa');

  const { allTransactions, categories, deleteTransaction, markTransactionAsPaid, markTransactionAsUnpaid, deleteTransactionCategory } = useTransactions();
  const summary = useMonthSummary(viewYear, viewMonth);

  // Filtrar por mês selecionado
  const monthStart = new Date(viewYear, viewMonth, 1);
  const monthEnd = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59);

  const monthTransactions = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d >= monthStart && d <= monthEnd;
  });

  const filtered = monthTransactions.filter(t => {
    if (filter === 'receita') return t.type === 'receita';
    if (filter === 'despesa') return t.type === 'despesa';
    if (filter === 'pendente') return !t.isPaid;
    return true;
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const openAdd = (type) => { setInitialType(type); setEditingTransaction(null); setShowForm(true); };
  const openEdit = (t) => { setEditingTransaction(t); setShowForm(true); };

  return (
    <div className="space-y-4">

      {/* Header mês */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-95 text-lg font-bold">‹</button>
        <h2 className="text-base font-bold">{MONTHS[viewMonth]} {viewYear}</h2>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-95 text-lg font-bold">›</button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        {/* Receitas */}
        <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl p-4 border-2 border-green-300 dark:border-green-900">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-green-200 dark:bg-green-900 flex items-center justify-center">
              <TrendingUp size={14} className="text-green-700 dark:text-green-400" />
            </div>
            <span className="text-xs font-bold text-green-800 dark:text-green-400 uppercase tracking-wider">Receitas</span>
          </div>
          <p className="text-xl font-extrabold font-mono text-green-700 dark:text-green-400">
            {formatCurrency(summary.totalReceitas)}
          </p>
          {summary.totalAReceber > 0 && (
            <p className="text-xs font-semibold text-green-600 dark:text-green-500 mt-0.5">
              + {formatCurrency(summary.totalAReceber)} a receber
            </p>
          )}
        </div>

        {/* Despesas */}
        <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-4 border-2 border-red-300 dark:border-red-900">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-red-200 dark:bg-red-900 flex items-center justify-center">
              <TrendingDown size={14} className="text-red-700 dark:text-red-400" />
            </div>
            <span className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">Despesas</span>
          </div>
          <p className="text-xl font-extrabold font-mono text-red-700 dark:text-red-400">
            {formatCurrency(summary.totalDespesas)}
          </p>
          {summary.totalPendente > 0 && (
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
              + {formatCurrency(summary.totalPendente)} pendente
            </p>
          )}
        </div>

        {/* Saldo */}
        <div className={`col-span-2 rounded-2xl p-4 border-2 ${
          summary.saldo >= 0
            ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-900'
            : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                <Wallet size={14} className="text-neutral-600 dark:text-neutral-400" />
              </div>
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Saldo do mês</span>
            </div>
            {summary.totalPendente > 0 && (
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-bold">
                <Clock size={11} />
                {formatCurrency(summary.totalPendente)} pendente
              </div>
            )}
          </div>
          <p className={`text-2xl font-extrabold font-mono mt-2 ${
            summary.saldo >= 0
              ? 'text-green-700 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {summary.saldo >= 0 ? '+' : ''}{formatCurrency(summary.saldo)}
          </p>
        </div>
      </div>

      {/* Botões de ação rápida */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => openAdd('receita')}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all active:scale-95"
        >
          <Plus size={16} /> Receita
        </button>
        <button
          onClick={() => openAdd('despesa')}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all active:scale-95"
        >
          <Plus size={16} /> Despesa
        </button>
        <button
          onClick={() => setShowCats(v => !v)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold transition-all active:scale-95"
        >
          <Settings2 size={16} /> Categorias
        </button>
      </div>

      {/* Gerenciar categorias */}
      {showCats && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-sm font-semibold">Categorias</span>
            <button
              onClick={() => { setEditingCategory(null); setShowCatForm(true); }}
              className="flex items-center gap-1 text-xs text-red-600 font-semibold"
            >
              <Plus size={14} /> Nova
            </button>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-64 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-6">Nenhuma categoria</p>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{cat.name}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white ${
                      cat.type === 'receita' ? 'bg-green-600' : 'bg-red-600'
                    }`}>{cat.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingCategory(cat); setShowCatForm(true); }}
                      className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                    >
                      Editar
                    </button>
                    {!cat.isDefault && (
                      <button
                        onClick={() => deleteTransactionCategory(cat.id)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              filter === f.id
                ? 'bg-red-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de transações */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(t => (
            <TransactionCard
              key={t.id}
              transaction={t}
              category={categories.find(c => c.id === t.categoryId)}
              onEdit={() => openEdit(t)}
              onDelete={() => deleteTransaction(t.id)}
              onMarkPaid={() => markTransactionAsPaid(t.id)}
              onMarkUnpaid={() => markTransactionAsUnpaid(t.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum lançamento"
          description="Toque em + Receita ou + Despesa para registrar."
        />
      )}

      {/* Modais */}
      {showForm && (
        <TransactionForm
          onClose={() => { setShowForm(false); setEditingTransaction(null); }}
          initialType={initialType}
          transaction={editingTransaction}
        />
      )}
      {showCatForm && (
        <CategoryForm
          onClose={() => { setShowCatForm(false); setEditingCategory(null); }}
          category={editingCategory}
        />
      )}
    </div>
  );
}
