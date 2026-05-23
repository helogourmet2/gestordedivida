import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useDebtCategories } from '../hooks/useDebtCategories';

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

export default function DebtCategoryForm({ onClose, category = null }) {
  const { addDebtCategory, updateDebtCategory } = useDebtCategories();
  const isEditing = !!category;

  const [form, setForm] = useState({
    name: category?.name || '',
    color: category?.color || 'bg-neutral-500',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (isEditing) {
        await updateDebtCategory(category.id, { name: form.name.trim(), color: form.color });
      } else {
        await addDebtCategory({ name: form.name.trim(), color: form.color });
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0f2040] rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up border border-[#1a3366]">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Editar' : 'Nova'} Categoria
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#152a55] transition-colors text-[#b8cef0]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-[#b8cef0] mb-1.5">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Financiamento, Saúde, Educação..."
              className="w-full px-4 py-3 rounded-xl bg-[#152a55] border border-[#1a3366] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-base text-white placeholder-[#6b93d6]"
              autoFocus
              required
            />
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-[#b8cef0] mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, color: c.value }))}
                  className={`w-10 h-10 rounded-xl ${c.value} flex items-center justify-center transition-all duration-200 ${
                    form.color === c.value ? 'ring-2 ring-offset-2 ring-offset-[#0f2040] ring-white scale-110' : ''
                  }`}
                  title={c.label}
                >
                  {form.color === c.value && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#152a55] border border-[#1a3366]">
            <span className={`w-3 h-3 rounded-full ${form.color}`} />
            <span className="text-sm font-semibold text-white">
              {form.name || 'Nome da categoria'}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-[#152a55] disabled:text-[#6b93d6] text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]"
          >
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar categoria'}
          </button>
        </form>
      </div>
    </div>
  );
}
