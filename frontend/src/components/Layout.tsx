import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Database, BarChart2, Home as HomeIcon } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Migration Playground</span>
            </div>
            <nav className="flex space-x-8">
              <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600">
                <HomeIcon className="h-4 w-4 mr-1" />
                Home
              </Link>
              <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600">
                <BarChart2 className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          &copy; 2026 Migration Playground - Sprint 4 Persistence & UI
        </div>
      </footer>
    </div>
  );
};

export default Layout;
