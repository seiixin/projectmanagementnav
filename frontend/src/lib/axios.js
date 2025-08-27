// frontend/src/lib/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: false,
});

// Always attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "undefined" && token.trim() !== "") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Only redirect to /login on 401 if caller didn't opt out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const cfg = err?.config || {};
    if (status === 401 && !cfg.__skipAuthRedirect) {
      // Do NOT clear the token here; just route to login
      window.location.replace("/login");
      return; // stop further rejection after redirect
    }
    return Promise.reject(err);
  }
);

export default api;
