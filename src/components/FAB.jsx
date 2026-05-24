import { Plus } from 'lucide-react';

export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-90"
      style={{
        background: 'var(--red)',
        boxShadow: '0 4px 24px rgba(229,0,0,0.45)',
      }}
      aria-label="Adicionar dívida"
    >
      <Plus size={28} strokeWidth={2.5} color="#fff" />
    </button>
  );
}
