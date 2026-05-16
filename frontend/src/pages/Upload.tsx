import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, Shield, Zap, FileOutput } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { migrationApi } from '../api/migrationApi';
import type { MigrationRun } from '../types';

const steps = [
  { icon: Upload,     number: '01', title: 'Upload Schema',      desc: 'Drop your Oracle DDL scripts — tables, sequences, views, and indexes.' },
  { icon: Shield,     number: '02', title: 'Compatibility Scan', desc: 'Detect 50+ Oracle-specific constructs and flag migration risks by severity.' },
  { icon: Zap,        number: '03', title: 'Auto Convert',        desc: 'Get a PostgreSQL-compatible script with automated syntax transformations.' },
  { icon: FileOutput, number: '04', title: 'Export Report',       desc: 'Download a full PDF or JSON migration report for review and audit.' },
];

const card = 'bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-[0_0_20px_rgba(0,0,0,0.2)]';
const cardHeader = 'border-b border-zinc-100 dark:border-white/5 px-6 py-4 flex items-center gap-2 bg-zinc-50 dark:bg-black/20';

const UploadPage: React.FC = () => {
  const [file, setFile]         = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<MigrationRun | null>(null);
  const navigate = useNavigate();

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

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await migrationApi.upload(file);
      setSuccess(result);
      localStorage.setItem('lastRunId', result.id);
      setTimeout(() => navigate(`/dashboard?runId=${result.id}`), 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload and parse SQL file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Upload Oracle Schema</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Begin the migration analysis by uploading your Oracle SQL file. For live database connections, use the <strong className="text-zinc-700 dark:text-zinc-300">Live Database</strong> option in the sidebar.
        </p>
      </div>

      {/* Upload card */}
      <div className={`${card} rounded-2xl overflow-hidden`}>
        <div className={cardHeader}>
          <Upload className="h-4 w-4 text-zinc-700 dark:text-white" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">File Upload</span>
        </div>
        <div className="p-6 md:p-8">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-white/5'
                : file
                ? 'border-zinc-300 dark:border-white/20 bg-zinc-50 dark:bg-black/20'
                : 'border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/30 hover:bg-zinc-50 dark:hover:bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isDragActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : file ? 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-400'
            }`}>
              {file ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </div>
            {file ? (
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {isDragActive ? 'Release to upload' : 'Drag & drop your .sql file here'}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">or click to browse · Max 10MB</p>
              </div>
            )}
          </div>

          {/* Feedback */}
          {error && (
            <div className="mt-5 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-200 leading-relaxed">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-5 flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Upload successful</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400/70 mt-1">
                  Detected {success.tableCount} tables, {success.columnCount} columns. Redirecting to analysis…
                </p>
              </div>
            </div>
          )}

          {/* Action */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Supported format: <code className="bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">.sql</code></p>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || !!success}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full transition-all ${
                !file || uploading || !!success
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-200 shadow-[0_0_15px_rgba(0,0,0,0.15)]'
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
      </div>

      {/* How it works */}
      <div className={`${card} rounded-2xl overflow-hidden`}>
        <div className={cardHeader}>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">How It Works</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-white/5">
          {steps.map(({ icon: Icon, number, title, desc }) => (
            <div key={number} className="p-6 transition-colors hover:bg-zinc-50 dark:hover:bg-white/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-zinc-700 dark:text-white" />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 tracking-widest">{number}</span>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 tracking-tight">{title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
