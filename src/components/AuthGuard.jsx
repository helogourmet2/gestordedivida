import { useAuth } from '../hooks/useAuth';
import { usePin } from '../hooks/usePin';
import Login from '../pages/Login';
import PinScreen from './PinScreen';

// Tela de carregamento inicial
function Splash() {
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center gap-6">
      <img
        src="/icons/icon-512.png"
        alt="Gestor de Dívidas"
        className="w-28 h-28 rounded-3xl shadow-2xl shadow-red-900/40 animate-pulse"
      />
      <div className="flex gap-1.5">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const { pinEnabled, pinVerified, verifyPin } = usePin();

  // 1. Carregando estado do Firebase Auth
  if (loading) return <Splash />;

  // 2. Não autenticado → tela de login
  if (!user) return <Login />;

  // 3. Autenticado mas PIN ativo e ainda não verificado nesta sessão
  if (pinEnabled && !pinVerified) {
    return (
      <PinScreen
        onSuccess={(digits) => verifyPin(digits)}
      />
    );
  }

  // 4. Tudo ok → renderiza o app
  return children;
}
