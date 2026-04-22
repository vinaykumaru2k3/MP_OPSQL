import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, Shield, Zap, FileOutput } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { migrationApi } from '../api/migrationApi';
import type { MigrationRun } from '../types';

const steps = [
  {
    icon: Upload,
    number: '01',
    title: 'Upload Schema',
    desc: 'Drop your Oracle DDL scripts — tables, sequences, views, and indexes.',
  },
  {
    icon: Shield,
    number: '02',
    title: 'Compatibility Scan',
    desc: 'Detect 50+ Oracle-specific constructs and flag migration risks by severity.',
  },
  {
    icon: Zap,
    number: '03',
    title: 'Auto Convert',
    desc: 'Get a PostgreSQL-compatible script with automated syntax transformations.',
  },
  {
    icon: FileOutput,
    number: '04',
    title: 'Export Report',
    desc: 'Download a full PDF or JSON migration report for review and audit.',
  },
];

const Home: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<MigrationRun | null>(null);
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
        <h1 className="text-xl font-semibold text-[#1a1f2e]">Upload Oracle Schema</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">
          Begin the migration analysis by uploading your Oracle SQL file.
        </p>
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-6 py-3.5 flex items-center gap-2">
          <Upload className="h-4 w-4 text-[#1a56db]" />
          <span className="text-sm font-semibold text-[#1a1f2e]">File Upload</span>
        </div>
        <div className="p-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-[#1a56db] bg-[#eff6ff]'
                : file
                ? 'border-[#374151] bg-[#f9fafb]'
                : 'border-[#d1d5db] hover:border-[#6b7280] hover:bg-[#f9fafb]'
            }`}
          >
            <input {...getInputProps()} />
            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${
              isDragActive ? 'bg-[#dbeafe]' : file ? 'bg-[#f3f4f6]' : 'bg-[#f3f4f6]'
            }`}>
              {file
                ? <FileText className="h-6 w-6 text-[#1a56db]" />
                : <Upload className={`h-6 w-6 ${isDragActive ? 'text-[#1a56db]' : 'text-[#9ca3af]'}`} />
              }
            </div>
            {file ? (
              <div>
                <p className="text-sm font-semibold text-[#1a1f2e]">{file.name}</p>
                <p className="text-xs text-[#6b7280] mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-[#374151]">
                  {isDragActive ? 'Release to upload' : 'Drag & drop your .sql file here'}
                </p>
                <p className="text-xs text-[#9ca3af] mt-1">or click to browse · Max 10MB</p>
              </div>
            )}
          </div>

          {/* Feedback */}
          {error && (
            <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-md">
              <AlertCircle className="h-4 w-4 text-[#dc2626] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#b91c1c]">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-md">
              <CheckCircle2 className="h-4 w-4 text-[#16a34a] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#166534]">Upload successful</p>
                <p className="text-xs text-[#15803d] mt-0.5">
                  Detected {success.tableCount} tables, {success.columnCount} columns. Redirecting…
                </p>
              </div>
            </div>
          )}

          {/* Action */}
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-[#9ca3af]">Supported: <code className="bg-[#f3f4f6] px-1 py-0.5 rounded text-[#374151]">.sql</code></p>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || !!success}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-md transition-all ${
                !file || uploading || !!success
                  ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                  : 'bg-[#1a56db] text-white hover:bg-[#1648c0] active:bg-[#1240ae]'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  Upload & Analyze
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-6 py-3.5">
          <span className="text-sm font-semibold text-[#1a1f2e]">How It Works</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#e5e7eb]">
          {steps.map(({ icon: Icon, number, title, desc }) => (
            <div key={number} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-[#f3f4f6] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-[#374151]" />
                </div>
                <span className="text-[10px] font-bold text-[#9ca3af] tracking-widest">{number}</span>
              </div>
              <h3 className="text-sm font-semibold text-[#1a1f2e] mb-1">{title}</h3>
              <p className="text-xs text-[#6b7280] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
