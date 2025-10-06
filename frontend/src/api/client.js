import axios from "axios";

// ---------------------------
// Backend API
// ---------------------------
const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: backend,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically attach JWT token for all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---------------------------
// ML Model API (optional)
// ---------------------------
export const ml = axios.create({
  baseURL: import.meta.env.VITE_ML_URL || "http://127.0.0.1:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add interceptor if ML API also needs token in future
// ml.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );
