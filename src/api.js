import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = rawBaseUrl || undefined;

if (import.meta.env.PROD && !baseURL) {
  console.error('VITE_API_BASE_URL is not set. API requests will use the frontend origin.');
}

const api = axios.create({
  baseURL,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function apiUrl(path) {
  if (!baseURL) return path;
  return new URL(path, baseURL).toString();
}

export default api;
