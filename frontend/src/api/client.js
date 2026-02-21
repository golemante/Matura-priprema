// api/client.js
import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // za httpOnly cookie auth
});

// Automatski dodaj JWT token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → logout
apiClient.interceptors.response.use(
  (res) => res.data, // unwrap data odmah
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err.response?.data ?? err);
  },
);
