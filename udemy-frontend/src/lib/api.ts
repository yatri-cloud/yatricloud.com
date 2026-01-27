import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const courseAPI = {
  getAll: (filters?: any) => apiClient.get("/api/courses", { params: filters }),
  getById: (id: string) => apiClient.get(`/api/courses/${id}`),
  create: (data: any) => apiClient.post("/api/courses", data),
  update: (id: string, data: any) => apiClient.put(`/api/courses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/courses/${id}`),
  search: (query: string) => apiClient.get("/api/courses/search", { params: { q: query } }),
};

export const userAPI = {
  getProfile: () => apiClient.get("/api/users/profile"),
  updateProfile: (data: any) => apiClient.put("/api/users/profile", data),
  enrollCourse: (courseId: string) => apiClient.post(`/api/users/enroll/${courseId}`),
  getEnrolledCourses: () => apiClient.get("/api/users/enrolled-courses"),
};

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post("/api/auth/login", { email, password }),
  register: (email: string, password: string, name: string) =>
    apiClient.post("/api/auth/register", { email, password, name }),
  logout: () => apiClient.post("/api/auth/logout"),
  verifyToken: () => apiClient.get("/api/auth/verify"),
};

export const paymentAPI = {
  createOrder: (data: any) => apiClient.post("/api/payments/order", data),
  verifyPayment: (data: any) => apiClient.post("/api/payments/verify", data),
};

export default apiClient;
