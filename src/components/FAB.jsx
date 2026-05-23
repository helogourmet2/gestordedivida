import { Plus } from 'lucide-react';

export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full shadow-lg shadow-red-600/30 flex items-center justify-center transition-all duration-200"
      aria-label="Adicionar dívida"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}
