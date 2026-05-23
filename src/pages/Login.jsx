import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading, error } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-between px-6 py-12">
      {/* Ícone principal */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-6">
          <img
            src="/icons/icon-512.png"
            alt="Gestor de Dívidas"
            className="w-36 h-36 rounded-3xl shadow-2xl shadow-red-900/40"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-red-500">Gestor</span>
              <span className="text-white"> de Dívidas</span>
            </h1>
            <p className="text-[#6b8ab8] text-sm mt-2">
              Controle suas finanças com facilidade
            </p>
          </div>
        </div>

        {/* Botão Google */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#0a1628] font-semibold text-sm py-3.5 px-6 rounded-2xl shadow-lg hover:bg-neutral-100 active:scale-95 transition-all disabled:opacity-60"
          >
            {/* Google logo SVG */}
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <path d="M47.532 24.552c0-1.636-.132-3.2-.388-4.704H24.48v8.896h12.964c-.56 3.012-2.24 5.564-4.772 7.276v6.044h7.724c4.52-4.164 7.136-10.3 7.136-17.512z" fill="#4285F4"/>
              <path d="M24.48 48c6.48 0 11.916-2.148 15.888-5.836l-7.724-6.044c-2.148 1.44-4.896 2.292-8.164 2.292-6.276 0-11.592-4.236-13.5-9.936H3.016v6.24C6.972 42.98 15.148 48 24.48 48z" fill="#34A853"/>
              <path d="M10.98 28.476A14.4 14.4 0 0 1 10.2 24c0-1.564.268-3.084.78-4.476v-6.24H3.016A23.94 23.94 0 0 0 .48 24c0 3.876.924 7.548 2.536 10.716l7.964-6.24z" fill="#FBBC05"/>
              <path d="M24.48 9.588c3.54 0 6.716 1.216 9.212 3.604l6.904-6.904C36.392 2.392 30.956 0 24.48 0 15.148 0 6.972 5.02 3.016 13.284l7.964 6.24c1.908-5.7 7.224-9.936 13.5-9.936z" fill="#EA4335"/>
            </svg>
            {loading ? 'Entrando...' : 'Entrar com Google'}
          </button>

          {error && (
            <p className="text-red-400 text-xs text-center px-2">{error}</p>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <p className="text-[#3a5278] text-xs text-center">
        Dados armazenados localmente no seu dispositivo
      </p>
    </div>
  );
}
