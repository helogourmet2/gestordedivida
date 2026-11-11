import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import BillingProvider from './components/BillingProvider';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Calendario from './pages/Calendario';
import Dividas from './pages/Dividas';
import AReceber from './pages/AReceber';
import { Navigate } from 'react-router-dom';
import Assistente from './pages/Assistente';
import Config from './pages/Config';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'calendario', element: <Calendario /> },
      { path: 'dividas', element: <Dividas /> },
      { path: 'a-receber', element: <AReceber /> },
      { path: 'financas', element: <Navigate to="/a-receber" replace /> },
      { path: 'assistente', element: <Assistente /> },
      { path: 'config', element: <Config /> },
    ],
  },
]);

export default function App() {
  return <BillingProvider><RouterProvider router={router} /></BillingProvider>;
}
