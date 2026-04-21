import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  AlertTriangle, CheckCircle2, Info, 
  Download, Play, FileCode, Loader2, AlertCircle,
  BarChart2, Search, Database, ArrowRight
} from 'lucide-react';
import { migrationApi } from '../api/migrationApi';
import type { AnalysisReport, ConvertedScript, ValidationResult } from '../types';

const Dashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId');

  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [script, setScript] = useState<ConvertedScript | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'script' | 'validation'>('analysis');
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    if (runId) {
      fetchAnalysis(runId);
      fetchValidation(runId);
    }
  }, [runId]);

  const fetchAnalysis = async (id: string) => {
    // setLoading(true); // Don't set global loading if validation also fetches
    setError(null);
    try {
      let data;
      try {
        data = await migrationApi.getAnalysis(id);
      } catch (e) {
        data = await migrationApi.analyze(id);
      }
      setReport(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchValidation = async (id: string) => {
    try {
      const data = await migrationApi.getValidation(id);
      setValidation(data);
    } catch (e) {
      // It's fine if validation doesn't exist yet
    }
  };

  const handleConvert = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const data = await migrationApi.convert(runId);
      setScript(data);
      setActiveTab('script');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to convert script.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const data = await migrationApi.validate(runId);
      setValidation(data);
      setActiveTab('validation');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to run validation.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: 'pdf' | 'json') => {
    if (!runId) return;
    window.location.href = type === 'pdf'
      ? migrationApi.exportPdfUrl(runId)
      : migrationApi.exportJsonUrl(runId);
  };

  if (!runId) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Migration Selected</h2>
        <p className="text-gray-600 mb-6">Please upload a file first to view the analysis dashboard.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const chartData = report ? [
    { name: 'High', value: report.highSeverityCount, color: '#ef4444' },
    { name: 'Medium', value: report.mediumSeverityCount, color: '#f59e0b' },
    { name: 'Low', value: report.lowSeverityCount, color: '#3b82f6' },
  ] : [];

  const filteredIssues = report?.issues.filter(issue => 
    filter === 'ALL' || issue.severity === filter
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center">
            <BarChart2 className="h-6 w-6 mr-2 text-blue-600" />
            Migration Analysis Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">Run ID: {runId}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              fetchAnalysis(runId);
              fetchValidation(runId);
            }}
            className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-md shadow-sm transition-colors"
            title="Refresh Dashboard"
          >
            <Loader2 className={`h-5 w-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            className="p-2 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded-md shadow-sm transition-colors"
            title="Download PDF Report"
          >
            <Download className="h-5 w-5" />
          </button>
          <button 
            onClick={() => handleExport('json')}
            className="p-2 text-gray-400 hover:text-yellow-600 bg-white border border-gray-200 rounded-md shadow-sm transition-colors"
            title="Download JSON Report"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={handleConvert}
            disabled={loading || !!script}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-bold transition-all shadow-sm ${
              loading || !!script 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Play className="h-4 w-4" />
            <span>{script ? 'Converted' : 'Run Conversion'}</span>
          </button>
          <button
            onClick={handleValidate}
            disabled={loading || !!validation}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-bold transition-all shadow-sm ${
              loading || !!validation 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>{validation ? 'Validated' : 'Run Validation'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Issues</p>
          <p className="text-3xl font-extrabold text-gray-900">
            {report ? report.highSeverityCount + report.mediumSeverityCount + report.lowSeverityCount : '...'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-50">
          <p className="text-sm font-medium text-red-600 mb-1 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            High Severity
          </p>
          <p className="text-3xl font-extrabold text-red-700">
            {report?.highSeverityCount ?? '...'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-50">
          <p className="text-sm font-medium text-yellow-600 mb-1 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Medium Severity
          </p>
          <p className="text-3xl font-extrabold text-yellow-700">
            {report?.mediumSeverityCount ?? '...'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-50">
          <p className="text-sm font-medium text-blue-600 mb-1 flex items-center">
            <Info className="h-4 w-4 mr-1" />
            Low Severity
          </p>
          <p className="text-3xl font-extrabold text-blue-700">
            {report?.lowSeverityCount ?? '...'}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Severity Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-2">
              {chartData.map(d => (
                <div key={d.name} className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: d.color}}></div>
                  <span className="text-gray-600">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Tabs Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-6 py-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'analysis' 
                    ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Issue Report</span>
              </button>
              <button
                onClick={() => setActiveTab('script')}
                disabled={!script}
                className={`px-6 py-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'script' 
                    ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                    : !script 
                      ? 'opacity-50 cursor-not-allowed text-gray-300 border-transparent'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileCode className="h-4 w-4" />
                <span>PostgreSQL Script</span>
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                disabled={!validation}
                className={`px-6 py-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'validation' 
                    ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                    : !validation 
                      ? 'opacity-50 cursor-not-allowed text-gray-300 border-transparent'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Validation Metrics</span>
              </button>
            </div>

            <div className="p-6 flex-grow overflow-auto max-h-[600px]">
              {activeTab === 'analysis' ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Detected Incompatibilities</h3>
                    <div className="flex bg-gray-100 rounded-lg p-1 p-1">
                      {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setFilter(lvl)}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                            filter === lvl ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loading && !report ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                      <p className="text-gray-500 italic">Analyzing schema...</p>
                    </div>
                  ) : filteredIssues.length > 0 ? (
                    <div className="space-y-3">
                      {filteredIssues.map((issue, idx) => (
                        <div key={idx} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors flex items-start space-x-4">
                          <div className={`mt-1 p-1 rounded-full ${
                            issue.severity === 'HIGH' ? 'bg-red-100 text-red-600' : 
                            issue.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' : 
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {issue.severity === 'HIGH' ? <AlertTriangle className="h-4 w-4" /> : 
                             issue.severity === 'MEDIUM' ? <AlertTriangle className="h-4 w-4" /> : 
                             <Info className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-bold text-gray-900">{issue.construct}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                                issue.severity === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : 
                                issue.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                                'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{issue.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-xl">
                      <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-500">No issues found for this severity level.</p>
                    </div>
                  )}
                </div>
              ) : activeTab === 'script' ? (
                <div className="h-full flex flex-col">
                  {script ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500 italic">Side-by-side SQL Comparison</p>
                        <button 
                          className="text-xs font-bold text-blue-600 flex items-center hover:underline bg-blue-50 px-3 py-1.5 rounded-md"
                          onClick={() => {
                            const blob = new Blob([script.convertedSql], { type: 'text/plain' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `postgres_converted_${runId.substring(0,8)}.sql`;
                            a.click();
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download Output
                        </button>
                      </div>
                      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900 rounded-lg p-4 flex flex-col h-full min-h-[400px]">
                          <div className="text-xs font-bold text-gray-400 mb-2 border-b border-gray-700 pb-2">Oracle Source Code</div>
                          <div className="font-mono text-xs text-gray-300 overflow-auto whitespace-pre leading-relaxed flex-grow">
                            {script.originalSql || 'No original SQL provided.'}
                          </div>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4 flex flex-col h-full min-h-[400px]">
                          <div className="text-xs font-bold text-emerald-400 mb-2 border-b border-gray-700 pb-2">PostgreSQL Output</div>
                          <div className="font-mono text-xs text-emerald-50 overflow-auto whitespace-pre leading-relaxed flex-grow">
                            {script.convertedSql}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 h-full">
                      <FileCode className="h-12 w-12 text-gray-200 mb-4" />
                      <p className="text-gray-500 mb-6 text-center max-w-xs">
                        Run the conversion engine to generate a PostgreSQL-compatible script.
                      </p>
                      <button
                        onClick={handleConvert}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Convert to PostgreSQL
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {validation ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Status</p>
                          <div className="flex items-center space-x-2">
                            {validation.validationStatus === 'PASSED' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            )}
                            <span className={`font-extrabold ${
                              validation.validationStatus === 'PASSED' ? 'text-green-700' : 'text-yellow-700'
                            }`}>
                              {validation.validationStatus}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Tables Validated</p>
                          <p className="text-xl font-extrabold text-gray-900">{validation.tablesValidatedCount}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Row Count Match</p>
                          <p className="text-xl font-extrabold text-gray-900">
                            {validation.tablesMatchedCount} / {validation.tablesValidatedCount}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-gray-100 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Table Name</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Source (Oracle)</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                                <ArrowRight className="h-3 w-3 inline mx-auto" />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Target (Postgres)</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {validation.metrics.map((m, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">{m.tableName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">{m.sourceRowCount.toLocaleString()}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <ArrowRight className="h-4 w-4 text-gray-300 mx-auto" />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{m.targetRowCount.toLocaleString()}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  {m.rowCountMatch ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold bg-green-100 text-green-800 border border-green-200">
                                      MATCH
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold bg-red-100 text-red-800 border border-red-200">
                                      MISMATCH
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 h-full">
                      <Database className="h-12 w-12 text-gray-200 mb-4" />
                      <p className="text-gray-500 mb-6 text-center max-w-xs">
                        Run the validation engine to compare source and target database metrics.
                      </p>
                      <button
                        onClick={handleValidate}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Start Validation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
