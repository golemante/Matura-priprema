// api/attemptApi.js
import { apiClient } from "./client";
export const attemptApi = {
  submit: (examId, answers) =>
    apiClient.post(`/exams/${examId}/attempts`, { answers }),
  getAll: () => apiClient.get("/attempts"),
  getById: (id) => apiClient.get(`/attempts/${id}`),
};
