import axios from 'axios';
import type { MigrationRun, AnalysisReport, ConvertedScript, ValidationResult } from '../types';

const API_BASE_URL = '/api/v1/migrations';

const api = axios.create({
  baseURL: API_BASE_URL,
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
};
