import axios from 'axios';
import { LoginRequest, LoginResponse, User } from '../types/index.ts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/api/users/me');
    return response.data;
  },
};

export const analyticsAPI = {
  getDashboardStats: async (): Promise<any> => {
    const response = await apiClient.get('/api/analytics/dashboard');
    return response.data;
  },
};

export const assetsAPI = {
  getAssets: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/assets/', { params });
    return response.data;
  },
  createAsset: async (assetData: any): Promise<any> => {
    const response = await apiClient.post('/api/assets/', assetData);
    return response.data;
  },
  getTransfers: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/api/transfers/', { params });
    return response.data;
  },
  getTransferById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/api/transfers/${id}`);
    return response.data;
  },
  createTransfer: async (transferData: any): Promise<any> => {
    const response = await apiClient.post('/api/transfers/', transferData);
    return response.data;
  },
  updateTransfer: async (id: string, transferData: any): Promise<any> => {
    const response = await apiClient.put(`/api/transfers/${id}`, transferData);
    return response.data;
  },
};

export const usersAPI = {
  getUsers: async (): Promise<any> => {
    const response = await apiClient.get('/api/users/');
    return response.data;
  },
  createUser: async (userData: any): Promise<any> => {
    const response = await apiClient.post('/api/users/', userData);
    return response.data;
  },
  updateUser: async (id: string, userData: any): Promise<any> => {
    const response = await apiClient.put(`/api/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/api/users/${id}`);
    return response.data;
  },
};

export const locationsAPI = {
  getLocations: async (): Promise<any> => {
    const response = await apiClient.get('/api/locations/');
    return response.data;
  },
  createLocation: async (locationData: any): Promise<any> => {
    const response = await apiClient.post('/api/locations/', locationData);
    return response.data;
  },
  updateLocation: async (id: string, locationData: any): Promise<any> => {
    const response = await apiClient.put(`/api/locations/${id}`, locationData);
    return response.data;
  },
  deleteLocation: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/api/locations/${id}`);
    return response.data;
  },
};

export default apiClient;
