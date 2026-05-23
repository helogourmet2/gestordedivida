import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';

const COLOR_OPTIONS = [
  { value: 'bg-red-600',     label: 'Vermelho' },
  { value: 'bg-orange-500',  label: 'Laranja' },
  { value: 'bg-yellow-500',  label: 'Amarelo' },
  { value: 'bg-green-600',   label: 'Verde' },
  { value: 'bg-emerald-500', label: 'Esmeralda' },
  { value: 'bg-blue-500',    label: 'Azul' },
  { value: 'bg-purple-500',  label: 'Roxo' },
  { value: 'bg-pink-500',    label: 'Rosa' },
  { value: 'bg-neutral-500', label: 'Cinza' },
];

export default function CategoryForm({ onClose, category = null }) {
  const { addTransactionCategory, updateTransactionCategory } = useTransactions();
  const isEditing = !!category;

  const [form, setForm] = useState({
    name: category?.name || '',
    type: category?.type || 'despesa',
    color: category?.color || 'bg-neutral-500',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (isEditing) {
        await updateTransactionCategory(category.id, {
          name: form.name.trim(),
          type: form.type,
          color: form.color,
        });
      } else {
        await addTransactionCategory({
          name: form.name.trim(),
          type: form.type,
          color: form.color,
          icon: 'Tag',
        });
      }
      onClose();
    } catch (err) {
      console.error('Erro ao salvar categoria:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Editar' : 'Nova'} Categoria
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Nome
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Freelance, Mercado..."
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-base"
              autoFocus
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['receita', 'despesa'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: t }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                    form.type === t
                      ? t === 'receita'
                        ? 'bg-green-600 text-white border-transparent'
                        : 'bg-red-600 text-white border-transparent'
                      : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Cor
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, color: c.value }))}
                  className={`w-9 h-9 rounded-xl ${c.value} flex items-center justify-center transition-all duration-200 ${
                    form.color === c.value ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white scale-110' : ''
                  }`}
                  title={c.label}
                >
                  {form.color === c.value && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <span className={`w-3 h-3 rounded-full ${form.color}`} />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {form.name || 'Nome da categoria'}
            </span>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full text-white ${
              form.type === 'receita' ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {form.type}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]"
          >
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar categoria'}
          </button>
        </form>
      </div>
    </div>
  );
}
