import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout } from 'lucide-react';

// Placeholders for components
const Home = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">Oracle to PostgreSQL Migration Playground</h1>
    <p className="text-gray-600 mb-6">Upload your Oracle SQL files to start the migration analysis and conversion.</p>
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-48">
      <p className="text-gray-500">Drop your .sql file here or click to browse</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Select File</button>
    </div>
  </div>
);

const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">Migration Analysis Dashboard</h1>
    <p className="text-gray-600">View severity metrics and suggested conversions.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-900">
              <Layout size={24} />
              <span>Migration Playground</span>
            </Link>
            <nav className="flex gap-4">
              <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
          &copy; 2026 Migration Playground - Sprint 4 Persistence & UI Scaffold
        </footer>
      </div>
    </Router>
  );
}

export default App;
