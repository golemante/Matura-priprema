// api/authApi.js
// Svi pozivi prema /auth endpointima.
// apiClient automatski dodaje JWT header i obrađuje 401 → logout (vidi client.js)
import { apiClient } from "./client";

export const authApi = {
  /**
   * @param {{ email: string, password: string }} credentials
   * @returns {{ user: User, token: string }}
   */
  login: (credentials) => apiClient.post("/auth/login", credentials),

  /**
   * @param {{ name: string, email: string, password: string }} data
   * @returns {{ user: User, token: string }}
   */
  register: (data) => apiClient.post("/auth/register", data),

  /**
   * Dohvati trenutno prijavljenog korisnika (verifikacija tokena).
   * @returns {{ user: User }}
   */
  me: () => apiClient.get("/auth/me"),

  /**
   * Invalidira refresh token na serveru.
   */
  logout: () => apiClient.post("/auth/logout"),

  /**
   * @param {{ email: string }} data
   */
  forgotPassword: (data) => apiClient.post("/auth/forgot-password", data),

  /**
   * @param {{ token: string, password: string }} data
   */
  resetPassword: (data) => apiClient.post("/auth/reset-password", data),
};
