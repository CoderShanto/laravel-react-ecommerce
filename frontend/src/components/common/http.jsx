import axios from "axios";

export const baseUrl = "http://localhost:8000";
export const apiUrl = `${baseUrl}/api`;

/* =========================
   ✅ Helpers
========================= */
export const userToken = () => {
  const data = JSON.parse(localStorage.getItem("userInfo"));
  return data?.token || null;
};

export const adminToken = () => {
  const data = JSON.parse(localStorage.getItem("adminInfo"));
  return data?.token || null;
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
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
