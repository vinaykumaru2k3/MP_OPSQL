import React, { useState } from 'react';
import {
  Database, Server, Eye, EyeOff, AlertCircle, CheckCircle2,
  Loader2, ArrowRight, Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { migrationApi } from '../api/migrationApi';

const card = 'bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-[0_0_20px_rgba(0,0,0,0.2)]';

const LiveDbPage: React.FC = () => {
  const navigate = useNavigate();

  const [host, setHost]               = useState('');
  const [port, setPort]               = useState('1521');
  const [serviceName, setServiceName] = useState('');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [schema, setSchema]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<{ tableCount: number; columnCount: number; id: string } | null>(null);

  const inputCls =
    'w-full bg-zinc-50 dark:bg-black/30 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white/30 focus:border-zinc-900 dark:focus:border-white/30 transition-colors';

  const handleConnect = async () => {
    if (!host || !serviceName || !username || !password) {
      setError('Host, Service Name, Username and Password are required.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const result = await migrationApi.connectToDb({
        host,
        port: parseInt(port, 10) || 1521,
        serviceName,
        username,
        password,
        schema: schema || undefined,
      });
      setSuccess({ tableCount: result.tableCount ?? 0, columnCount: result.columnCount ?? 0, id: result.id });
      localStorage.setItem('lastRunId', result.id);
      setTimeout(() => navigate(`/dashboard?runId=${result.id}`), 1600);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to connect to Oracle database. Check your credentials and network.'
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
          <Database className="h-6 w-6 text-zinc-700 dark:text-white" />
          Live Database Connection
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Connect directly to a live Oracle instance — SchemaForge extracts the full schema without storing your credentials.
        </p>
      </div>

      {/* Info banner */}
      <div className={`${card} flex items-start gap-3 p-4 rounded-xl`}>
        <Server className="h-4 w-4 text-zinc-500 dark:text-zinc-300 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">What gets extracted</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 leading-relaxed">
            Tables · Columns · PK / FK / UNIQUE constraints · Indexes · Views · Sequences · Stored procedures &amp; triggers.
            All objects in the specified schema owner are imported and run through the full analysis pipeline.
          </p>
        </div>
      </div>

      {/* Connection form */}
      <div className={`${card} rounded-2xl overflow-hidden`}>
        <div className="border-b border-zinc-100 dark:border-white/5 px-6 py-4 flex items-center gap-2 bg-zinc-50 dark:bg-black/20">
          <Database className="h-4 w-4 text-zinc-700 dark:text-white" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">Oracle Connection</span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Host */}
          <div className="sm:col-span-2 sm:grid sm:grid-cols-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Host</label>
              <input type="text" value={host} onChange={e => setHost(e.target.value)} placeholder="oracle-db.example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Port</label>
              <input type="number" value={port} onChange={e => setPort(e.target.value)} placeholder="1521" className={inputCls} />
            </div>
          </div>

          {/* Service Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Service Name</label>
            <input type="text" value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="ORCLPDB1" className={inputCls} />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="SCOTT" className={inputCls} />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Schema override */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
              Schema <span className="normal-case text-zinc-400 dark:text-zinc-600 font-normal">(optional — defaults to username)</span>
            </label>
            <input type="text" value={schema} onChange={e => setSchema(e.target.value)} placeholder="SCOTT" className={inputCls} />
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mx-6 mb-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-200 leading-relaxed">{error}</p>
          </div>
        )}
        {success && (
          <div className="mx-6 mb-4 flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Connection successful</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400/70 mt-1">
                Extracted {success.tableCount} tables, {success.columnCount} columns. Redirecting to dashboard…
              </p>
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <Shield className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600" />
            Credentials are zeroed from memory immediately after extraction.
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting || !!success}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full transition-all ${
              connecting || !!success
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-200 shadow-[0_0_15px_rgba(0,0,0,0.15)]'
            }`}
          >
            {connecting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
            ) : (
              <><Database className="h-4 w-4" /> Extract Schema <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveDbPage;
