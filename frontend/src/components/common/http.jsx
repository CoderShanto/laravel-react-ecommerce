import axios from "axios";

/* =========================
   ✅ Base URL (Vercel/Production + Local Dev)
   - In Vercel: set VITE_API_URL
   - Locally: you can set VITE_API_URL in frontend/.env
========================= */
export const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const apiUrl = `${baseUrl}/api`;

/* =========================
   ✅ Helpers
========================= */
export const userToken = () => {
  try {
    const data = JSON.parse(localStorage.getItem("userInfo"));
    return data?.token || null;
  } catch {
    return null;
  }
};

export const adminToken = () => {
  try {
    const data = JSON.parse(localStorage.getItem("adminInfo"));
    return data?.token || null;
  } catch {
    return null;
  }
};

/* =========================
   ✅ USER AXIOS (Bearer Token)
========================= */
export const api = axios.create({
  baseURL: apiUrl,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = userToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =========================
   ✅ ADMIN AXIOS (Bearer Token)
========================= */
export const adminApi = axios.create({
  baseURL: apiUrl,
  headers: {
    Accept: "application/json",
  },
});

adminApi.interceptors.request.use((config) => {
  const token = adminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});