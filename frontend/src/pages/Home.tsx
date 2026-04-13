import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { migrationApi } from '../api/migrationApi';
import type { MigrationRun } from '../types';

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
      // Wait a bit to show success then navigate
      setTimeout(() => {
        navigate(`/dashboard?runId=${result.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload and parse SQL file.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Oracle to PostgreSQL Migration
        </h1>
        <p className="text-lg text-gray-600">
          Upload your Oracle SQL schema file to begin the automated analysis and conversion process.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 border border-gray-100">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
          {file ? (
            <div className="flex items-center justify-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">{file.name}</span>
            </div>
          ) : (
            <p className="text-gray-500">
              {isDragActive ? 'Drop the file here' : 'Drag & drop your Oracle SQL file, or click to select'}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">Supported format: .sql (Max 10MB)</p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success!</p>
              <p className="text-sm text-green-700">
                File parsed: {success.tableCount} tables, {success.columnCount} columns detected.
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleUpload}
            disabled={!file || uploading || !!success}
            className={`flex items-center space-x-2 px-8 py-3 rounded-md font-bold transition-all shadow-sm ${
              !file || uploading || !!success
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Upload & Analyze</span>
            )}
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-center">
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 font-bold">1</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Upload Schema</h3>
          <p className="text-sm text-gray-500">Drop your Oracle DDL scripts including tables, views, and indexes.</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-center">
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 font-bold">2</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Automated Analysis</h3>
          <p className="text-sm text-gray-500">We scan for 50+ Oracle-specific constructs and flag migration risks.</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-center">
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 font-bold">3</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Generate Script</h3>
          <p className="text-sm text-gray-500">Download a PostgreSQL-compatible script with automated transformations.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
