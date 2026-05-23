import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, List, Settings, ArrowLeftRight } from 'lucide-react';

const navItems = [
  { to: '/',          icon: LayoutDashboard,  label: 'Início' },
  { to: '/calendario',icon: Calendar,          label: 'Calendário' },
  { to: '/dividas',   icon: List,              label: 'Dívidas' },
  { to: '/financas',  icon: ArrowLeftRight,    label: 'Finanças' },
  { to: '/config',    icon: Settings,          label: 'Config' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-red-600 dark:text-red-500'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`
            }
          >
            <Icon size={22} strokeWidth={isActive => isActive ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
