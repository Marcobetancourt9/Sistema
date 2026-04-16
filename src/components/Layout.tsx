import { NavLink, Outlet } from 'react-router-dom';
import { Users, BarChart3, ChefHat } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Reportes de Gestión', icon: BarChart3, end: true },
  { to: '/registro', label: 'Registro de Comensales', icon: Users, end: false },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-white/5 border-r border-white/10 backdrop-blur-xl flex-shrink-0">

        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <ChefHat size={18} className="text-blue-400" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ComedorAdmin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-slate-600 text-xs">© 2025 ComedorAdmin</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}