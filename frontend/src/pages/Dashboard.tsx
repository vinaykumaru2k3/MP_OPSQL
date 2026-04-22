import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from 'recharts';
import {
  AlertTriangle, CheckCircle2, Info,
  Download, Play, FileCode, Loader2, AlertCircle,
  BarChart2, Search, Database, ArrowRight, RefreshCw,
} from 'lucide-react';
import { migrationApi } from '../api/migrationApi';
import type { AnalysisReport, ConvertedScript, ValidationResult } from '../types';

/* ─── Reusable sub-components ───────────────────────────────────── */

const StatCard = ({
  label, value, accent,
}: { label: string; value: string | number; accent?: string }) => (
  <div className="bg-white border border-[#e5e7eb] rounded-lg px-5 py-4">
    <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-2xl font-bold ${accent ?? 'text-[#1a1f2e]'}`}>{value}</p>
  </div>
);

const SeverityBadge = ({ severity }: { severity: string }) => {
  const map: Record<string, string> = {
    HIGH: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
    MEDIUM: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]',
    LOW: 'bg-[#eff6ff] text-[#1a56db] border-[#bfdbfe]',
  };
  return (
    <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${map[severity] ?? ''}`}>
      {severity}
    </span>
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */

const Dashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId');

  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [script, setScript] = useState<ConvertedScript | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'script' | 'validation'>('analysis');
  const [filter, setFilter] = useState('ALL');
  const [convertingScreen, setConvertingScreen] = useState(false);

  useEffect(() => {
    if (runId) {
      fetchAnalysis(runId);
      fetchValidation(runId);
    }
  }, [runId]);

  const fetchAnalysis = async (id: string) => {
    setError(null);
    try {
      let data;
      try { data = await migrationApi.getAnalysis(id); }
      catch { data = await migrationApi.analyze(id); }
      setReport(data);
    } catch (err) { console.error(err); }
  };

  const fetchValidation = async (id: string) => {
    try { setValidation(await migrationApi.getValidation(id)); }
    catch { /* not yet run */ }
  };

  const handleConvert = async () => {
    if (!runId) return;
    setActionLoading('convert');
    try {
      const data = await migrationApi.convert(runId);
      setConvertingScreen(true);
      setActiveTab('script');
      setTimeout(() => {
        setScript(data);
        setConvertingScreen(false);
      }, 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Conversion failed.');
    } finally { setActionLoading(null); }
  };

  const handleValidate = async () => {
    if (!runId) return;
    setActionLoading('validate');
    try {
      const data = await migrationApi.validate(runId);
      setValidation(data);
      setActiveTab('validation');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Validation failed.');
    } finally { setActionLoading(null); }
  };

  const handleExport = (type: 'pdf' | 'json') => {
    if (!runId) return;
    window.location.href = type === 'pdf'
      ? migrationApi.exportPdfUrl(runId)
      : migrationApi.exportJsonUrl(runId);
  };

  /* ── No run selected ── */
  if (!runId) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-white rounded-lg border border-[#e5e7eb] text-center px-6">
        <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-[#9ca3af]" />
        </div>
        <h2 className="text-base font-semibold text-[#1a1f2e] mb-1">No migration selected</h2>
        <p className="text-sm text-[#6b7280] mb-5">Upload a SQL file first to open the analysis dashboard.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-semibold rounded-md hover:bg-[#1648c0] transition-colors"
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
  ] as const;

  return (
    <div className="space-y-4">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1f2e] flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[#1a56db]" />
            Analysis Dashboard
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5 font-mono">Run: {runId}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => { fetchAnalysis(runId); fetchValidation(runId); }}
            className="p-2 bg-white border border-[#e5e7eb] rounded-md text-[#6b7280] hover:text-[#1a1f2e] hover:border-[#374151] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {/* Exports */}
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-xs font-medium text-[#6b7280] hover:text-[#1a1f2e] hover:border-[#374151] transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> PDF
          </button>
          <button
            onClick={() => handleExport('json')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-xs font-medium text-[#6b7280] hover:text-[#1a1f2e] hover:border-[#374151] transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          {/* Convert */}
          <button
            onClick={handleConvert}
            disabled={!!script || actionLoading === 'convert'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors ${
              script || actionLoading === 'convert'
                ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                : 'bg-[#1a1f2e] text-white hover:bg-[#374151]'
            }`}
          >
            {actionLoading === 'convert'
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Converting…</>
              : <><Play className="h-3.5 w-3.5" />{script ? 'Converted' : 'Convert'}</>}
          </button>
          {/* Validate */}
          <button
            onClick={handleValidate}
            disabled={!!validation || actionLoading === 'validate'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors ${
              validation || actionLoading === 'validate'
                ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                : 'bg-[#1a56db] text-white hover:bg-[#1648c0]'
            }`}
          >
            {actionLoading === 'validate'
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…</>
              : <><Search className="h-3.5 w-3.5" />{validation ? 'Validated' : 'Validate'}</>}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-md">
          <AlertCircle className="h-4 w-4 text-[#dc2626] flex-shrink-0" />
          <p className="text-sm text-[#b91c1c]">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-[#9ca3af] hover:text-[#6b7280] text-xs">Dismiss</button>
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
        <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-4 py-3">
            <p className="text-xs font-semibold text-[#1a1f2e] uppercase tracking-wider">Severity Breakdown</p>
          </div>
          <div className="p-4">
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
                    contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {chartData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-[#6b7280]">{d.name}</span>
                  </div>
                  <span className="font-semibold text-[#1a1f2e]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab panel */}
        <div className="lg:col-span-3 bg-white border border-[#e5e7eb] rounded-lg overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-[#e5e7eb]">
            {tabs.map(({ id, label, icon: Icon, locked }) => (
              <button
                key={id}
                onClick={() => !locked && setActiveTab(id)}
                disabled={locked}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-[#1a56db] text-[#1a56db] bg-[#eff6ff]/40'
                    : locked
                    ? 'border-transparent text-[#d1d5db] cursor-not-allowed'
                    : 'border-transparent text-[#6b7280] hover:text-[#1a1f2e] hover:bg-[#f9fafb]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-4 max-h-[520px]">

            {/* ─── Analysis Tab ─── */}
            {activeTab === 'analysis' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#1a1f2e]">Detected Incompatibilities</h3>
                  <div className="flex items-center gap-1 bg-[#f3f4f6] rounded-md p-0.5">
                    {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setFilter(lvl)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                          filter === lvl
                            ? 'bg-white text-[#1a56db] shadow-sm'
                            : 'text-[#6b7280] hover:text-[#1a1f2e]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {!report ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 text-[#1a56db] animate-spin mb-2" />
                    <p className="text-sm text-[#6b7280]">Analyzing schema…</p>
                  </div>
                ) : filteredIssues.length > 0 ? (
                  <div className="space-y-1.5">
                    {filteredIssues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-3 px-4 py-3 rounded-md border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors">
                        <div className="mt-0.5 flex-shrink-0">
                          {issue.severity === 'HIGH'
                            ? <AlertTriangle className="h-4 w-4 text-[#dc2626]" />
                            : issue.severity === 'MEDIUM'
                            ? <AlertTriangle className="h-4 w-4 text-[#d97706]" />
                            : <Info className="h-4 w-4 text-[#1a56db]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-[#1a1f2e] font-mono">{issue.construct}</span>
                            <SeverityBadge severity={issue.severity} />
                          </div>
                          <p className="text-xs text-[#6b7280]">{issue.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[#e5e7eb] rounded-lg">
                    <CheckCircle2 className="h-8 w-8 text-[#16a34a] mb-2" />
                    <p className="text-sm text-[#6b7280]">No issues at this severity level.</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Script / Split-view Tab ─── */}
            {activeTab === 'script' && (
              <div className="h-full flex flex-col">
                {convertingScreen ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 select-none">
                    {/* Animated ring */}
                    <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-[#e5e7eb]" />
                      <div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1a56db] animate-spin"
                        style={{ animationDuration: '0.8s' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileCode className="h-7 w-7 text-[#1a56db]" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[#1a1f2e] mb-1">Converting to PostgreSQL…</p>
                    <p className="text-xs text-[#6b7280]">Rewriting Oracle-specific syntax</p>
                    {/* Progress bar */}
                    <div className="mt-6 w-56 h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1a56db] rounded-full"
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
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-[#6b7280] font-medium">Side-by-side SQL Comparison</p>
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f3f4f6] border border-[#e5e7eb] rounded text-xs font-semibold text-[#374151] hover:bg-[#e5e7eb] transition-colors"
                        onClick={() => {
                          const blob = new Blob([script.convertedSql], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = `postgres_${runId?.substring(0, 8)}.sql`; a.click();
                        }}
                      >
                        <Download className="h-3 w-3" /> Download SQL
                      </button>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3 min-h-[400px]">
                      <div className="bg-[#1a1f2e] rounded-lg overflow-hidden flex flex-col">
                        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#dc2626]" />
                          <span className="text-[10px] font-bold text-[#8b92a5] uppercase tracking-wider">Oracle Source</span>
                        </div>
                        <pre className="flex-1 p-4 font-mono text-[11px] text-[#a8b0c2] overflow-auto leading-relaxed whitespace-pre">
                          {script.originalSql ?? 'No source SQL available.'}
                        </pre>
                      </div>
                      <div className="bg-[#0d1117] rounded-lg overflow-hidden flex flex-col">
                        <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
                          <span className="text-[10px] font-bold text-[#4ade80] uppercase tracking-wider">PostgreSQL Output</span>
                        </div>
                        <pre className="flex-1 p-4 font-mono text-[11px] text-[#86efac] overflow-auto leading-relaxed whitespace-pre">
                          {script.convertedSql}
                        </pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16">
                    <FileCode className="h-10 w-10 text-[#d1d5db] mb-3" />
                    <p className="text-sm font-medium text-[#374151] mb-1">No script generated yet</p>
                    <p className="text-xs text-[#6b7280] mb-5 text-center max-w-xs">
                      Run the conversion engine to generate a PostgreSQL-compatible DDL script.
                    </p>
                    <button onClick={handleConvert} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1f2e] text-white text-sm font-semibold rounded-md hover:bg-[#374151] transition-colors">
                      <Play className="h-3.5 w-3.5" /> Convert to PostgreSQL
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
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-md px-4 py-3">
                        <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Status</p>
                        <div className="flex items-center gap-1.5">
                          {validation.validationStatus === 'PASSED'
                            ? <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
                            : <AlertTriangle className="h-4 w-4 text-[#d97706]" />}
                          <span className={`text-sm font-bold ${validation.validationStatus === 'PASSED' ? 'text-[#166534]' : 'text-[#92400e]'}`}>
                            {validation.validationStatus}
                          </span>
                        </div>
                      </div>
                      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-md px-4 py-3">
                        <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Tables Validated</p>
                        <p className="text-lg font-bold text-[#1a1f2e]">{validation.tablesValidatedCount}</p>
                      </div>
                      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-md px-4 py-3">
                        <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Row Match</p>
                        <p className="text-lg font-bold text-[#1a1f2e]">{validation.tablesMatchedCount} / {validation.tablesValidatedCount}</p>
                      </div>
                    </div>

                    <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-[#f3f4f6] border-b border-[#e5e7eb]">
                            <th className="px-4 py-2.5 text-left font-semibold text-[#374151] uppercase tracking-wider">Table</th>
                            <th className="px-4 py-2.5 text-right font-semibold text-[#374151] uppercase tracking-wider">Oracle Rows</th>
                            <th className="px-4 py-2.5 text-center font-semibold text-[#374151]">
                              <ArrowRight className="h-3 w-3 inline" />
                            </th>
                            <th className="px-4 py-2.5 text-left font-semibold text-[#374151] uppercase tracking-wider">PG Rows</th>
                            <th className="px-4 py-2.5 text-center font-semibold text-[#374151] uppercase tracking-wider">Match</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] bg-white">
                          {validation.metrics.map((m, idx) => (
                            <tr key={idx} className="hover:bg-[#f9fafb] transition-colors">
                              <td className="px-4 py-2.5 font-mono font-semibold text-[#1a1f2e]">{m.tableName}</td>
                              <td className="px-4 py-2.5 text-right text-[#374151]">{m.sourceRowCount?.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-center text-[#d1d5db]">
                                <ArrowRight className="h-3 w-3 inline" />
                              </td>
                              <td className="px-4 py-2.5 text-[#374151]">{m.targetRowCount?.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-center">
                                {m.rowCountMatch
                                  ? <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">MATCH</span>
                                  : <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">MISMATCH</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16">
                    <Database className="h-10 w-10 text-[#d1d5db] mb-3" />
                    <p className="text-sm font-medium text-[#374151] mb-1">No validation run yet</p>
                    <p className="text-xs text-[#6b7280] mb-5 text-center max-w-xs">
                      Run the validation engine to compare source and target row counts.
                    </p>
                    <button onClick={handleValidate} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-semibold rounded-md hover:bg-[#1648c0] transition-colors">
                      <Search className="h-3.5 w-3.5" /> Start Validation
                    </button>
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
