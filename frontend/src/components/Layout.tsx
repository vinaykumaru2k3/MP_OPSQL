import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Database, LayoutDashboard, Upload, ChevronRight, Server, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/live-db', label: 'Live Database', icon: Server },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isAuthPage = location.pathname === '/' || location.pathname === '/login';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#09090b] font-sans selection:bg-white selection:text-black transition-colors duration-200">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-white font-sans selection:bg-white selection:text-black transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white/80 dark:bg-black/50 flex flex-col border-r border-zinc-200 dark:border-white/10 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-200 dark:border-white/10">
          <div className="bg-zinc-900 dark:bg-white rounded-lg p-1.5 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
            <Database className="h-4 w-4 text-white dark:text-black" />
          </div>
          <div>
            <p className="text-zinc-900 dark:text-white text-sm font-bold tracking-tight leading-tight">Schema</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] leading-tight font-medium uppercase tracking-wider mt-0.5">Forge</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-zinc-400 dark:text-zinc-600 text-[10px] font-bold uppercase tracking-widest px-2 mb-3">Workspace</p>
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to ||
              (to === '/dashboard' && location.pathname.startsWith('/dashboard')) ||
              (to === '/live-db' && location.pathname.startsWith('/live-db'));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer brand */}
        <div className="px-5 py-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20">
          <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-medium tracking-wide">Oracle → PostgreSQL</p>
          <p className="text-zinc-300 dark:text-zinc-600 text-[10px]">Sprint 10 · v2.1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white/60 dark:bg-black/20 border-b border-zinc-200 dark:border-white/10 backdrop-blur-md h-14 flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight">SchemaForge</span>
            <ChevronRight className="h-3 w-3 text-zinc-400 dark:text-zinc-600" />
            <span className="font-medium text-zinc-500 dark:text-zinc-400">
              {location.pathname === '/upload'
                ? 'Upload Schema'
                : location.pathname === '/live-db'
                ? 'Live Database'
                : 'Analysis Dashboard'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/10">
              Oracle → PG
            </span>

            {/* ── Theme toggle ── */}
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark'
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/';
              }}
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
