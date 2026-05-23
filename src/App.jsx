import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Calendario from './pages/Calendario';
import Dividas from './pages/Dividas';
import Financas from './pages/Financas';
import Config from './pages/Config';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'calendario', element: <Calendario /> },
      { path: 'dividas', element: <Dividas /> },
      { path: 'financas', element: <Financas /> },
      { path: 'config', element: <Config /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
