import axios from 'axios';
import { MigrationRun, AnalysisReport, ConvertedScript } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const migrationApi = {
  upload: async (file: File): Promise<MigrationRun> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<MigrationRun>('/migrations/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  analyze: async (id: string): Promise<AnalysisReport> => {
    const response = await api.post<AnalysisReport>(`/migrations/${id}/analyze`);
    return response.data;
  },

  getAnalysis: async (id: string): Promise<AnalysisReport> => {
    const response = await api.get<AnalysisReport>(`/migrations/${id}/analysis`);
    return response.data;
  },

  convert: async (id: string): Promise<ConvertedScript> => {
    const response = await api.post<ConvertedScript>(`/migrations/${id}/convert`);
    return response.data;
  },

  getConvertedScript: async (id: string): Promise<ConvertedScript> => {
    const response = await api.get<ConvertedScript>(`/migrations/${id}/converted-script`);
    return response.data;
  },
};

export default api;
