import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import FAB from './FAB';
import { useState } from 'react';
import DebtForm from './DebtForm';

export default function Layout() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-red-600">Gestor</span> de Dívidas
          </h1>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* FAB */}
      <FAB onClick={() => setShowForm(true)} />

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Modal de formulário */}
      {showForm && <DebtForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
