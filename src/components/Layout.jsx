import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import FAB from './FAB';
import { useState, useEffect } from 'react';
import DebtForm from './DebtForm';
import { useAuth } from '../hooks/useAuth';
import { usePin } from '../hooks/usePin';
import { LogOut, Lock } from 'lucide-react';

export default function Layout() {
  const [showForm, setShowForm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { pinEnabled, lockApp } = usePin();
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
          <div className="flex items-center gap-2">
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

            {/* Avatar do usuário */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-red-600 hover:border-red-400 transition-colors"
                  aria-label="Menu do usuário"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className={`text-xs font-bold ${isDark ? 'text-white bg-[#152a55]' : 'text-[#0a1628] bg-neutral-200'} w-full h-full flex items-center justify-center`}>
                      {user.displayName?.[0] ?? '?'}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className={`absolute right-0 top-10 z-50 w-52 rounded-2xl shadow-xl border overflow-hidden ${
                      isDark ? 'bg-[#0f1f3d] border-[#1a3366]' : 'bg-white border-neutral-200'
                    }`}>
                      {/* Info do usuário */}
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-[#1a3366]' : 'border-neutral-100'}`}>
                        <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#0a1628]'}`}>
                          {user.displayName}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                      </div>

                      {/* Bloquear com PIN */}
                      {pinEnabled && (
                        <button
                          onClick={() => { lockApp(); setShowUserMenu(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                            isDark ? 'text-[#b8cef0] hover:bg-[#152a55]' : 'text-[#0a1628] hover:bg-neutral-50'
                          }`}
                        >
                          <Lock size={15} />
                          Bloquear app
                        </button>
                      )}

                      {/* Sair */}
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <LogOut size={15} />
                        Sair da conta
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
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
