// api/statsApi.js
import { apiClient } from "./client";
export const statsApi = {
  getOverview: () => apiClient.get("/stats"),
  getBySubject: (subjectId) => apiClient.get(`/stats/${subjectId}`),
};
