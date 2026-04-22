import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Database, LayoutDashboard, Upload, ChevronRight } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Upload', icon: Upload },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-[#f4f5f7] font-sans">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#1a1f2e] flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="bg-[#1a56db] rounded-lg p-1.5">
            <Database className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Migration</p>
            <p className="text-[#8b92a5] text-[10px] leading-tight">Playground</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[#8b92a5] text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">Workspace</p>
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to === '/dashboard' && location.pathname.startsWith('/dashboard'));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded text-sm font-medium transition-all group ${
                  active
                    ? 'bg-[#1a56db] text-white'
                    : 'text-[#a8b0c2] hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer brand */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[#8b92a5] text-[10px]">Oracle → PostgreSQL</p>
          <p className="text-[#8b92a5] text-[10px]">Sprint 6 · v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-[#e5e7eb] h-12 flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
            <span className="font-medium text-[#1a1f2e]">Migration Playground</span>
            <ChevronRight className="h-3 w-3" />
            <span>
              {location.pathname === '/' ? 'Upload Schema' : 'Analysis Dashboard'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[#6b7280] bg-[#f4f5f7] px-2.5 py-1 rounded font-medium border border-[#e5e7eb]">
              Oracle → PostgreSQL
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
