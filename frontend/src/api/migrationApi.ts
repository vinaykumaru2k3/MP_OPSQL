import axios from 'axios';
import type { MigrationRun, AnalysisReport, ConvertedScript, ValidationResult } from '../types';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api/v1/migrations`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const migrationApi = {
  upload: async (file: File): Promise<MigrationRun> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  analyze: async (id: string): Promise<AnalysisReport> => {
    const response = await api.post(`/${id}/analyze`);
    return response.data;
  },

  getRun: async (id: string): Promise<MigrationRun> => {
    const response = await api.get(`/${id}`);
    return response.data;
  },

  getAnalysis: async (id: string): Promise<AnalysisReport> => {
    const response = await api.get(`/${id}/analysis`);
    return response.data;
  },

  convert: async (id: string): Promise<ConvertedScript> => {
    const response = await api.post(`/${id}/convert`);
    return response.data;
  },

  getConvertedScript: async (id: string): Promise<ConvertedScript> => {
    const response = await api.get(`/${id}/converted-script`);
    return response.data;
  },

  validate: async (id: string): Promise<ValidationResult> => {
    const response = await api.post(`/${id}/validate`);
    return response.data;
  },

  getValidation: async (id: string): Promise<ValidationResult> => {
    const response = await api.get(`/${id}/validation`);
    return response.data;
  },

  exportPdfUrl: (id: string): string =>
    `${API_BASE_URL}/${id}/export/pdf`,

  exportJsonUrl: (id: string): string =>
    `${API_BASE_URL}/${id}/export/json`,

  getHistory: async (): Promise<MigrationRun[]> => {
    const response = await api.get('/history');
    return response.data;
  },

  connectToDb: async (config: {
    host: string;
    port: number;
    serviceName: string;
    username: string;
    password: string;
    schema?: string;
  }): Promise<MigrationRun> => {
    const response = await api.post('/connect', config);
    return response.data;
  },
};
