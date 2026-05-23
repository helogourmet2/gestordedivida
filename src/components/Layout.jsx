import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import FAB from './FAB';
import { useState, useEffect } from 'react';
import DebtForm from './DebtForm';

export default function Layout() {
  const [showForm, setShowForm] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // Padrão: dark (azul marinho)
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className={`min-h-screen pb-20 ${
      isDark
        ? 'bg-[#0a1628] text-white'
        : 'bg-white text-[#0a1628]'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${
        isDark
          ? 'bg-[#0a1628]/90 border-[#1a3366]'
          : 'bg-white/90 border-neutral-200'
      }`}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-red-600">Gestor</span>
            <span className={isDark ? ' text-white' : ' text-[#0a1628]'}> de Dívidas</span>
          </h1>
          {/* Toggle tema */}
          <button
            onClick={() => setIsDark(v => !v)}
            className={`p-2 rounded-xl transition-colors text-lg ${
              isDark
                ? 'hover:bg-[#152a55] text-[#b8cef0]'
                : 'hover:bg-neutral-100 text-neutral-500'
            }`}
            aria-label="Alternar tema"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* FAB */}
      <FAB onClick={() => setShowForm(true)} />

      {/* Bottom Navigation */}
      <BottomNav isDark={isDark} />

      {/* Modal de formulário */}
      {showForm && <DebtForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
