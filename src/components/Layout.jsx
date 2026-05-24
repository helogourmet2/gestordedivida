import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import FAB from './FAB';
import { useState } from 'react';
import DebtForm from './DebtForm';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const [showForm, setShowForm] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--black)', color: 'var(--white)' }}>

      {/* ── Header ── */}
      <header style={{ background: 'var(--black)', borderBottom: '1px solid var(--border)' }}
        className="sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-black tracking-tight select-none">
            <span style={{ color: 'var(--red)' }}>Gestor</span>
            <span style={{ color: 'var(--white)' }}> de Dívidas</span>
          </h1>
          <div className="flex items-center gap-2">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt="avatar"
                className="w-8 h-8 rounded-full border-2 cursor-pointer"
                style={{ borderColor: 'var(--red)' }}
                onClick={logout}
                title="Sair"
              />
            )}
          </div>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>

      <FAB onClick={() => setShowForm(true)} />
      <BottomNav />

      {showForm && <DebtForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
