import axios from "axios";

// In production the backend serves the frontend, so "/api" just works.
// Set VITE_API_URL only if you host the frontend separately (e.g. Vercel).
export const API_URL = import.meta.env.VITE_API_URL || "/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired/invalid token -> back to login instead of a silently broken page
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const s = err.response?.status;
    if ((s === 401 || s === 422) && !err.config.url.includes("/auth/login")) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
