import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Database, LayoutDashboard, Upload, ChevronRight } from 'lucide-react';

const navItems = [
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const Layout: React.FC = () => {
  const location = useLocation();

  const isAuthPage = location.pathname === '/' || location.pathname === '/login';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#09090b] font-sans selection:bg-white selection:text-black">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white font-sans selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-black/50 flex flex-col border-r border-white/10 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="bg-white rounded-lg p-1.5 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            <Database className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-tight leading-tight">Migration</p>
            <p className="text-zinc-500 text-[10px] leading-tight font-medium uppercase tracking-wider mt-0.5">Playground</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest px-2 mb-3">Workspace</p>
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to === '/dashboard' && location.pathname.startsWith('/dashboard'));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? 'bg-white/10 text-white border border-white/5 shadow-sm'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3 w-3 text-zinc-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer brand */}
        <div className="px-5 py-4 border-t border-white/10 bg-black/20">
          <p className="text-zinc-500 text-[10px] font-medium tracking-wide">Oracle → PostgreSQL</p>
          <p className="text-zinc-600 text-[10px]">Sprint 8 · v2.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-black/20 border-b border-white/10 backdrop-blur-md h-14 flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-300 tracking-tight">SchemaForge</span>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
            <span className="font-medium text-zinc-400">
              {location.pathname === '/upload' ? 'Upload Schema' : 'Analysis Dashboard'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              Oracle → PG
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 transition-colors"
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
