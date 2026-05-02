import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('token', res.token);
      navigate('/upload');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const data = err.response?.data;
      const errorMsg = typeof data === 'string' ? data : (data?.message || 'Invalid credentials');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] font-sans selection:bg-white selection:text-black px-4 relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="w-full max-w-sm bg-zinc-900/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2 tracking-tight">Admin Login</h2>
        <p className="text-sm text-center text-zinc-400 mb-8">Authenticate to access the workspace</p>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 flex items-center gap-2 p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-sm text-red-400"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white focus:border-white text-sm text-white placeholder-zinc-600 transition-all"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-white focus:border-white text-sm text-white placeholder-zinc-600 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-black bg-white hover:bg-zinc-200 focus:outline-none disabled:bg-zinc-600 disabled:text-zinc-400 transition-all mt-4"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In to Workspace'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
