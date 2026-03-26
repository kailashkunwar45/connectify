import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "production" ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:5001/api"),
  withCredentials: true,                // send cookies
  headers: { "Content-Type": "application/json" },
});
