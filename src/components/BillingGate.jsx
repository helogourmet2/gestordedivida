import { Link, useLocation } from 'react-router-dom';
import { useBilling } from '../hooks/useBilling';
import BillingPanel from './BillingPanel';
import { signOut } from '../lib/firebase';

export default function BillingGate({ children }) {
  const billing = useBilling();
  const { pathname } = useLocation();
  if (!billing?.enabled || pathname === '/config' || billing.status?.allowed) return children;
  return <main className="max-w-lg mx-auto px-4 py-8 space-y-5 text-white">
    <h1 className="text-xl font-black">Gestor de Dívidas</h1>
    <BillingPanel />
    <p className="text-sm text-neutral-400">Seus registros continuam guardados. Você pode acessar Configurações para exportar seus dados.</p>
    <div className="flex justify-between text-sm"><Link className="underline" to="/config">Abrir Configurações</Link><button className="underline" onClick={signOut}>Sair</button></div>
  </main>;
}
