import axios from "axios";
import { useAuthStore } from "./store";

// Falls back to "" (same-origin, relative requests) for the single-service
// deployment where Express serves the built frontend directly. Local dev
// overrides this via VITE_API_URL in frontend/.env.local.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
