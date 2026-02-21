// api/examApi.js
import { apiClient } from "./client";
export const examApi = {
  getBySubject: (subjectId) => apiClient.get(`/subjects/${subjectId}/exams`),
  getById: (examId) => apiClient.get(`/exams/${examId}`),
  getQuestions: (examId) => apiClient.get(`/exams/${examId}/questions`),
};
