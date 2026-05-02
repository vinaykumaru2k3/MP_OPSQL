import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight,
  Shield, Zap, FileOutput, Database, Server, Eye, EyeOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { migrationApi } from '../api/migrationApi';
import type { MigrationRun } from '../types';

const steps = [
  { icon: Upload,     number: '01', title: 'Upload Schema',     desc: 'Drop your Oracle DDL scripts — tables, sequences, views, and indexes.' },
  { icon: Shield,     number: '02', title: 'Compatibility Scan', desc: 'Detect 50+ Oracle-specific constructs and flag migration risks by severity.' },
  { icon: Zap,        number: '03', title: 'Auto Convert',       desc: 'Get a PostgreSQL-compatible script with automated syntax transformations.' },
  { icon: FileOutput, number: '04', title: 'Export Report',      desc: 'Download a full PDF or JSON migration report for review and audit.' },
];

type ActiveTab = 'file' | 'live';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  // ── shared ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('file');
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<MigrationRun | null>(null);

  // ── file upload ──
  const [file, setFile]         = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── live DB ──
  const [host, setHost]               = useState('');
  const [port, setPort]               = useState('1521');
  const [serviceName, setServiceName] = useState('');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [schema, setSchema]           = useState('');
  const [connecting, setConnecting]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── dropzone ──
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setSuccess(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/x-sql': ['.sql'], 'application/sql': ['.sql'] },
    multiple: false,
  });

  // ── handlers ──
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await migrationApi.upload(file);
      setSuccess(result);
      setTimeout(() => navigate(`/dashboard?runId=${result.id}`), 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload and parse SQL file.');
    } finally {
      setUploading(false);
    }
  };

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
      setSuccess(result);
      setTimeout(() => navigate(`/dashboard?runId=${result.id}`), 1500);
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

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
  };

  // ── input class helper ──
  const inputCls =
    'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-colors';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Import Oracle Schema</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Upload a SQL file or connect directly to a live Oracle database to begin analysis.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.2)] overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-white/10 bg-black/20">
          <button
            onClick={() => switchTab('file')}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold tracking-wide border-b-2 transition-colors ${
              activeTab === 'file'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            File Upload
          </button>
          <button
            onClick={() => switchTab('live')}
            className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold tracking-wide border-b-2 transition-colors ${
              activeTab === 'live'
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Live Database
            <span className="ml-1 text-[9px] font-bold tracking-widest uppercase bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded border border-white/10">
              Sprint 9
            </span>
          </button>
        </div>

        {/* ── FILE tab ─────────────────────────────────────────── */}
        {activeTab === 'file' && (
          <div className="p-6 md:p-8">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-white bg-white/5'
                  : file
                  ? 'border-white/20 bg-black/20'
                  : 'border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <input {...getInputProps()} />
              <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isDragActive ? 'bg-white text-black' : file ? 'bg-white/10 text-white' : 'bg-white/5 text-zinc-400'
              }`}>
                {file ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              </div>
              {file ? (
                <div>
                  <p className="text-sm font-semibold text-white">{file.name}</p>
                  <p className="text-xs text-zinc-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    {isDragActive ? 'Release to upload' : 'Drag & drop your .sql file here'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">or click to browse · Max 10MB</p>
                </div>
              )}
            </div>

            {/* Feedback */}
            {error && (
              <div className="mt-5 flex items-start gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-200 leading-relaxed">{error}</p>
              </div>
            )}
            {success && (
              <div className="mt-5 flex items-start gap-3 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-300">Upload successful</p>
                  <p className="text-xs text-emerald-400/70 mt-1">
                    Detected {success.tableCount} tables, {success.columnCount} columns. Redirecting…
                  </p>
                </div>
              </div>
            )}

            {/* Action */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-zinc-500">Supported format: <code className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">.sql</code></p>
              <button
                onClick={handleUpload}
                disabled={!file || uploading || !!success}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full transition-all ${
                  !file || uploading || !!success
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                }`}
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                ) : (
                  <>Analyze Schema <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── LIVE DB tab ───────────────────────────────────────── */}
        {activeTab === 'live' && (
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-3 mb-6 p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl">
              <Server className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-300">Live Oracle Connection</p>
                <p className="text-xs text-blue-400/70 mt-0.5 leading-relaxed">
                  SchemaForge will connect to your Oracle instance, scan the data dictionary, and import
                  the full schema (tables, views, sequences, indexes, stored procedures) for analysis.
                  Credentials are never stored.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Host */}
              <div className="sm:col-span-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Host</label>
                  <input
                    type="text"
                    value={host}
                    onChange={e => setHost(e.target.value)}
                    placeholder="oracle-db.example.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    placeholder="1521"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Service name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Service Name</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  placeholder="ORCLPDB1"
                  className={inputCls}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="SCOTT"
                  className={inputCls}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Schema override */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Schema <span className="normal-case text-zinc-600 font-normal">(optional — defaults to username)</span>
                </label>
                <input
                  type="text"
                  value={schema}
                  onChange={e => setSchema(e.target.value)}
                  placeholder="SCOTT"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <div className="mt-5 flex items-start gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-200 leading-relaxed">{error}</p>
              </div>
            )}
            {success && (
              <div className="mt-5 flex items-start gap-3 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-300">Connection successful</p>
                  <p className="text-xs text-emerald-400/70 mt-1">
                    Extracted {success.tableCount} tables, {success.columnCount} columns from live DB. Redirecting…
                  </p>
                </div>
              </div>
            )}

            {/* Action */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-zinc-500">Connection is ephemeral — credentials are zeroed after extraction.</p>
              <button
                onClick={handleConnect}
                disabled={connecting || !!success}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full transition-all ${
                  connecting || !!success
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                }`}
              >
                {connecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
                ) : (
                  <><Database className="h-4 w-4" /> Extract Schema</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.2)] overflow-hidden">
        <div className="border-b border-white/5 px-6 py-4 bg-black/20">
          <span className="text-sm font-semibold text-white tracking-tight">How It Works</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
          {steps.map(({ icon: Icon, number, title, desc }) => (
            <div key={number} className="p-6 transition-colors hover:bg-white/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] font-bold text-zinc-600 tracking-widest">{number}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 tracking-tight">{title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
