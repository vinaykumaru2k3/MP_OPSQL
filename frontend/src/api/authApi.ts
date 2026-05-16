import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api/v1/auth`;

export const authApi = {
  login: async (username: string, password: string): Promise<{ token: string }> => {
    const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
    return response.data;
  },
  register: async (username: string, password: string): Promise<{ token: string }> => {
    const response = await axios.post(`${API_BASE_URL}/register`, { username, password });
    return response.data;
  },
};

