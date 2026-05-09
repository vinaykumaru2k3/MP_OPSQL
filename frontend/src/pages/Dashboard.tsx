import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import {
  AlertTriangle, CheckCircle2, Info,
  Download, Play, FileCode, Loader2, AlertCircle,
  BarChart2, Search, Database, ArrowRight, RefreshCw, History,
} from 'lucide-react';
import { migrationApi } from '../api/migrationApi';
import type { AnalysisReport, ConvertedScript, ValidationResult, MigrationRun } from '../types';

/* ─── Reusable sub-components ───────────────────────────────────── */

const StatCard = ({
  label, value, accent,
}: { label: string; value: string | number; accent?: string }) => (
  <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-xl px-6 py-5 shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-colors">
    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-3xl font-extrabold ${accent ?? 'text-zinc-900 dark:text-white'}`}>{value}</p>
  </div>
);

const SeverityBadge = ({ severity }: { severity: string }) => {
  const map: Record<string, string> = {
    HIGH: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
    MEDIUM: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50',
    LOW: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:border-white/20',
  };
  return (
    <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border tracking-wider transition-colors ${map[severity] ?? ''}`}>
      {severity}
    </span>
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */

const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Prefer URL param; fall back to the last known runId persisted in localStorage
  const urlRunId = searchParams.get('runId');
  const runId = urlRunId ?? localStorage.getItem('lastRunId');

  // Keep the URL in sync if we restored from localStorage
  React.useEffect(() => {
    if (!urlRunId && runId) {
      setSearchParams({ runId }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'analysis' | 'script' | 'validation' | 'history'>('analysis');
  const [filter, setFilter] = useState('ALL');
  const [convertingScreen, setConvertingScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch current run details (to get fileName)
  const { data: currentRun } = useQuery<MigrationRun>({
    queryKey: ['run', runId],
    queryFn: () => migrationApi.getRun(runId!),
    enabled: !!runId,
  });

  // 2. Fetch analysis report
  const { data: report, error: reportError } = useQuery<AnalysisReport>({
    queryKey: ['analysis', runId],
    queryFn: async () => {
      try { return await migrationApi.getAnalysis(runId!); }
      catch { return await migrationApi.analyze(runId!); }
    },
    enabled: !!runId,
    retry: 1,
  });

  React.useEffect(() => {
    if (reportError) {
      const err = reportError as Error & { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Analysis failed.');
    }
  }, [reportError]);

  // 3. Fetch validation
  const { data: validation, refetch: refetchValidation } = useQuery<ValidationResult>({
    queryKey: ['validation', runId],
    queryFn: () => migrationApi.getValidation(runId!),
    enabled: !!runId,
    retry: false,
  });

  // 4. Fetch script
  const { data: script, refetch: refetchScript } = useQuery<ConvertedScript>({
    queryKey: ['script', runId],
    queryFn: () => migrationApi.getConvertedScript(runId!),
    enabled: !!runId,
    retry: false,
  });

  // 5. Fetch history (global)
  const { data: history } = useQuery<MigrationRun[]>({
    queryKey: ['history'],
    queryFn: () => migrationApi.getHistory(),
  });

  // Mutations
  const convertMutation = useMutation({
    mutationFn: () => migrationApi.convert(runId!),
    onMutate: () => {
      setConvertingScreen(true);
      setActiveTab('script');
      setError(null);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['script', runId], data);
      setTimeout(() => setConvertingScreen(false), 2000);
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setConvertingScreen(false);
      setError(err.response?.data?.message || 'Conversion failed.');
    }
  });

  const validateMutation = useMutation({
    mutationFn: () => migrationApi.validate(runId!),
    onMutate: () => {
      setError(null);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['validation', runId], data);
      setActiveTab('validation');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Validation failed.');
    }
  });

  const handleConvert = () => convertMutation.mutate();
  const handleValidate = () => validateMutation.mutate();

  const handleExport = (type: 'pdf' | 'json') => {
    if (!runId) return;
    window.location.href = type === 'pdf'
      ? migrationApi.exportPdfUrl(runId)
      : migrationApi.exportJsonUrl(runId);
  };

  /* ── No run selected ── */
  if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-white dark:bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-white/10 text-center px-6 shadow-sm dark:shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center mb-5 border border-zinc-200 dark:border-white/10 shadow-inner">
          <AlertCircle className="h-6 w-6 text-zinc-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">No migration selected</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Upload a SQL file first to open the analysis dashboard.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-semibold rounded-full hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.15)] dark:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          Go to Upload
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const chartData = report ? [
    { name: 'High', value: report.highSeverityCount, color: '#dc2626' },
    { name: 'Medium', value: report.mediumSeverityCount, color: '#d97706' },
    { name: 'Low', value: report.lowSeverityCount, color: '#1a56db' },
  ] : [];

  const total = report
    ? report.highSeverityCount + report.mediumSeverityCount + report.lowSeverityCount
    : 0;

  const filteredIssues = (report?.issues ?? []).filter(
    i => filter === 'ALL' || i.severity === filter
  );

  /* ── Tabs config ── */
  const tabs = [
    { id: 'analysis', label: 'Issue Report', icon: AlertTriangle, locked: false },
    { id: 'script', label: 'SQL Comparison', icon: FileCode, locked: !script },
    { id: 'validation', label: 'Validation', icon: Database, locked: !validation },
    { id: 'history', label: 'History Diff', icon: History, locked: false },
  ] as const;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
            <BarChart2 className="h-6 w-6 text-zinc-700 dark:text-white" />
            Analysis Dashboard
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono tracking-wider">Run: {runId}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => { queryClient.invalidateQueries({ queryKey: ['analysis'] }); refetchValidation(); refetchScript(); }}
            className="p-2.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {/* Exports */}
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white text-sm font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
          >
            <Download className="h-4 w-4" />
            JSON
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white text-sm font-semibold rounded-lg hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          {/* Convert */}
          <button
            onClick={handleConvert}
            disabled={!!script || convertMutation.isPending}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              script || convertMutation.isPending
                ? 'bg-zinc-100 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-200 dark:border-white/5'
                : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-200 shadow-[0_0_15px_rgba(0,0,0,0.15)] dark:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
            }`}
          >
            {convertMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Converting…</>
              : <><Play className="h-4 w-4" />{script ? 'Converted' : 'Convert'}</>}
          </button>
          {/* Validate */}
          <button
            onClick={handleValidate}
            disabled={!!validation || validateMutation.isPending}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              validation || validateMutation.isPending
                ? 'bg-zinc-100 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-zinc-200 dark:border-white/5'
                : 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white border border-zinc-300 dark:border-white/20 hover:bg-zinc-50 dark:hover:bg-white/20'
            }`}
          >
            {validateMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>
              : <><Search className="h-4 w-4" />{validation ? 'Validated' : 'Validate'}</>}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl transition-colors">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold">Dismiss</button>
        </div>
      )}

      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Issues" value={report ? total : '—'} />
        <StatCard label="High Severity" value={report?.highSeverityCount ?? '—'} accent="text-[#dc2626]" />
        <StatCard label="Medium Severity" value={report?.mediumSeverityCount ?? '—'} accent="text-[#d97706]" />
        <StatCard label="Low Severity" value={report?.lowSeverityCount ?? '—'} accent="text-[#1a56db]" />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Chart card */}
        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-colors">
          <div className="border-b border-zinc-100 dark:border-white/10 px-5 py-4 bg-zinc-50 dark:bg-black/20">
            <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Severity Breakdown</p>
          </div>
          <div className="p-5">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={68}
                    paddingAngle={3} dataKey="value"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: '1px solid rgba(161,161,170,0.2)', borderRadius: 8, backgroundColor: 'var(--tw-prose-body, #fff)', color: 'var(--tw-prose-headings, #18181b)' }}
                    itemStyle={{ color: 'inherit', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {chartData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-zinc-500 dark:text-zinc-400">{d.name}</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab panel */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] flex flex-col transition-colors">
          {/* Tabs */}
          <div className="flex border-b border-zinc-100 dark:border-white/10 bg-zinc-50 dark:bg-black/20">
            {tabs.map(({ id, label, icon: Icon, locked }) => (
              <button
                key={id}
                onClick={() => !locked && setActiveTab(id)}
                disabled={locked}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold tracking-wide border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5'
                    : locked
                    ? 'border-transparent text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-5 max-h-[520px]">

            {/* ─── Analysis Tab ─── */}
            {activeTab === 'analysis' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">Detected Incompatibilities</h3>
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-black/40 rounded-lg p-1 border border-zinc-200 dark:border-white/5 transition-colors">
                    {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setFilter(lvl)}
                        className={`px-3 py-1.5 text-[10px] font-bold tracking-wider rounded-md transition-all ${
                          filter === lvl
                            ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm border border-zinc-300 dark:border-white/10'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {!report ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 text-zinc-900 dark:text-white animate-spin mb-3" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Analyzing schema…</p>
                  </div>
                ) : filteredIssues.length > 0 ? (
                  <div className="space-y-2">
                    {filteredIssues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-4 px-5 py-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-colors">
                        <div className="mt-0.5 flex-shrink-0">
                          {issue.severity === 'HIGH'
                            ? <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                            : issue.severity === 'MEDIUM'
                            ? <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                            : <Info className="h-5 w-5 text-zinc-400 dark:text-zinc-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white font-mono tracking-tight">{issue.construct}</span>
                            <SeverityBadge severity={issue.severity} />
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{issue.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-white/5 transition-colors">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400 mb-3" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">No issues at this severity level.</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Script / Split-view Tab ─── */}
            {activeTab === 'script' && (
              <div className="h-full flex flex-col">
                {convertingScreen ? (
                  <div className="flex flex-col items-center justify-center h-full py-24 select-none">
                    {/* Animated ring */}
                    <div className="relative w-20 h-20 mb-8">
                      <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-white/5" />
                      <div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-zinc-900 dark:border-t-white animate-spin"
                        style={{ animationDuration: '0.8s' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileCode className="h-6 w-6 text-zinc-900 dark:text-white" />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Converting to PostgreSQL…</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Rewriting Oracle-specific syntax</p>
                    {/* Progress bar */}
                    <div className="mt-8 w-64 h-1 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 dark:bg-white rounded-full shadow-sm dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        style={{ animation: 'convertProgress 2s ease-in-out forwards' }}
                      />
                    </div>
                    <style>{`
                      @keyframes convertProgress {
                        from { width: 0%; }
                        to   { width: 100%; }
                      }
                    `}</style>
                  </div>
                ) : script ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Side-by-side SQL Comparison</p>
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg text-xs font-semibold text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                        onClick={() => {
                          const blob = new Blob([script.convertedSql], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = `postgres_${runId?.substring(0, 8)}.sql`; a.click();
                        }}
                      >
                        <Download className="h-4 w-4" /> Download SQL
                      </button>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4 min-h-[400px]">
                      <div className="bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col shadow-inner transition-colors">
                        <div className="px-5 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center gap-3 bg-zinc-100 dark:bg-black/40">
                          <div className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-sm dark:shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Oracle Source</span>
                        </div>
                        <pre className="flex-1 p-5 font-mono text-xs text-zinc-700 dark:text-zinc-300 overflow-auto leading-relaxed whitespace-pre selection:bg-zinc-200 dark:selection:bg-white/20">
                          {script.originalSql ?? 'No source SQL available.'}
                        </pre>
                      </div>
                      <div className="bg-zinc-50 dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col shadow-inner transition-colors">
                        <div className="px-5 py-3 border-b border-zinc-200 dark:border-white/5 flex items-center gap-3 bg-zinc-100 dark:bg-black/40">
                          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">PostgreSQL Output</span>
                        </div>
                        <pre className="flex-1 p-5 font-mono text-xs text-emerald-700 dark:text-emerald-300 overflow-auto leading-relaxed whitespace-pre selection:bg-emerald-200 dark:selection:bg-emerald-500/30">
                          {script.convertedSql}
                        </pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-white/5 transition-colors">
                    <FileCode className="h-10 w-10 text-zinc-400 dark:text-zinc-500 mb-4" />
                    <p className="text-base font-bold text-zinc-900 dark:text-white mb-2">No script generated yet</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-sm">
                      Run the conversion engine to generate a PostgreSQL-compatible DDL script.
                    </p>
                    <button onClick={handleConvert} className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-semibold rounded-full hover:bg-zinc-700 dark:hover:bg-zinc-200 shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-colors">
                      <Play className="h-4 w-4" /> Convert to PostgreSQL
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── Validation Tab ─── */}
            {activeTab === 'validation' && (
              <div>
                {validation ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl px-5 py-4 transition-colors">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Status</p>
                        <div className="flex items-center gap-2">
                          {validation.validationStatus === 'PASSED'
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                            : <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />}
                          <span className={`text-xl font-bold tracking-tight ${validation.validationStatus === 'PASSED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {validation.validationStatus}
                          </span>
                        </div>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl px-5 py-4 transition-colors">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Tables Validated</p>
                        <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{validation.tablesValidatedCount}</p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 rounded-xl px-5 py-4 transition-colors">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Row Match</p>
                        <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{validation.tablesMatchedCount} <span className="text-zinc-400 dark:text-zinc-600 text-xl font-medium">/ {validation.tablesValidatedCount}</span></p>
                      </div>
                    </div>

                    <div className="border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden bg-zinc-50 dark:bg-black/20 transition-colors">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-black/40 border-b border-zinc-200 dark:border-white/10 transition-colors">
                            <th className="px-5 py-4 text-left font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Table</th>
                            <th className="px-5 py-4 text-right font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Oracle Rows</th>
                            <th className="px-5 py-4 text-center font-bold text-zinc-400 dark:text-zinc-500">
                              <ArrowRight className="h-4 w-4 inline" />
                            </th>
                            <th className="px-5 py-4 text-left font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">PG Rows</th>
                            <th className="px-5 py-4 text-center font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Match</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                          {validation.metrics.map((m, idx) => (
                            <tr key={idx} className="hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                              <td className="px-5 py-3.5 font-mono font-bold text-zinc-900 dark:text-white tracking-tight">{m.tableName}</td>
                              <td className="px-5 py-3.5 text-right font-medium text-zinc-700 dark:text-zinc-300">{m.sourceRowCount?.toLocaleString()}</td>
                              <td className="px-5 py-3.5 text-center text-zinc-400 dark:text-zinc-600">
                                <ArrowRight className="h-4 w-4 inline" />
                              </td>
                              <td className="px-5 py-3.5 font-medium text-zinc-700 dark:text-zinc-300">{m.targetRowCount?.toLocaleString()}</td>
                              <td className="px-5 py-3.5 text-center">
                                {m.rowCountMatch
                                  ? <span className="inline-block px-2.5 py-1 rounded border text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50">MATCH</span>
                                  : <span className="inline-block px-2.5 py-1 rounded border text-[10px] font-bold tracking-wider bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50">MISMATCH</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-white/5 transition-colors">
                    <Database className="h-10 w-10 text-zinc-400 dark:text-zinc-500 mb-4" />
                    <p className="text-base font-bold text-zinc-900 dark:text-white mb-2">No validation run yet</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-sm">
                      Run the validation engine to compare source and target row counts.
                    </p>
                    <button onClick={handleValidate} className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-semibold rounded-full hover:bg-zinc-700 dark:hover:bg-zinc-200 shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-colors">
                      <Search className="h-4 w-4" /> Start Validation
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── History Tab ─── */}
            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">Global Migration History</h3>
                  {currentRun?.fileName && <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 px-3 py-1 rounded-full border border-zinc-200 dark:border-white/10 transition-colors">Active: {currentRun.fileName}</span>}
                </div>
                {history && history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((run) => (
                      <div key={run.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border rounded-xl transition-colors ${run.id === runId ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-white/10 shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/20 hover:bg-zinc-100 dark:hover:bg-white/5 hover:border-zinc-300 dark:hover:border-white/20'}`}>
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="text-sm font-bold font-mono text-zinc-900 dark:text-white tracking-tight">{run.id.substring(0, 8)}</span>
                            {run.id === runId && <span className="text-[10px] font-bold text-white bg-zinc-900 dark:text-black dark:bg-white px-2 py-0.5 rounded tracking-widest">CURRENT</span>}
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(run.createdAt).toLocaleString()} <span className="mx-2 text-zinc-300 dark:text-zinc-600">|</span> {run.fileName || 'Unknown File'} <span className="mx-2 text-zinc-300 dark:text-zinc-600">|</span> {run.tableCount} tables
                          </p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                          {run.id !== runId && (
                            <button
                              onClick={() => {
                                setSearchParams({ runId: run.id });
                                setActiveTab('script');
                              }}
                              className="text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 dark:text-white dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/10 px-4 py-2 rounded-lg transition-colors"
                            >
                              View Run Details
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-white/5 transition-colors">
                    <History className="h-8 w-8 text-zinc-400 dark:text-zinc-500 mb-3" />
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No history found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
