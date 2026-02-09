import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bc_token');
      localStorage.removeItem('bc_wallet');
      localStorage.removeItem('bc_is_mod');
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const login = (walletAddress, signature, message) =>
  api.post('/api/auth/login', { wallet_address: walletAddress, signature, message });

// ---- Activities ----
export const getActivities = (activeOnly = true) =>
  api.get('/api/activities/', { params: { active_only: activeOnly } });

export const getActivity = (id) =>
  api.get(`/api/activities/${id}`);

export const createActivity = (data) =>
  api.post('/api/activities/', data);

export const updateActivity = (id, data) =>
  api.patch(`/api/activities/${id}`, data);

export const deleteActivity = (id) =>
  api.delete(`/api/activities/${id}`);

// ---- Submissions ----
export const getMySubmissions = () =>
  api.get('/api/submissions/mine');

export const getPendingSubmissions = () =>
  api.get('/api/submissions/pending');

export const getAllSubmissions = (status) =>
  api.get('/api/submissions/all', { params: status ? { status } : {} });

export const createSubmission = (data) =>
  api.post('/api/submissions/', data);

export const reviewSubmission = (id, data) =>
  api.patch(`/api/submissions/${id}/review`, data);

// ---- Distributions ----
export const recordDistribution = (data) =>
  api.post('/api/submissions/distribution', data);

export const getDistributions = () =>
  api.get('/api/submissions/distributions');

// ---- Balance ----
export const getWalletBalance = (walletAddress) =>
  api.get(`/api/balance/${walletAddress}`);

// ---- Moderators ----
export const checkModeratorStatus = () =>
  api.get('/api/moderators/check');

export const getModerators = () =>
  api.get('/api/moderators/');

export const addModerator = (walletAddress, name) =>
  api.post('/api/moderators/', null, { params: { wallet_address: walletAddress, name } });

export const removeModerator = (walletAddress) =>
  api.delete(`/api/moderators/${walletAddress}`);

export default api;
