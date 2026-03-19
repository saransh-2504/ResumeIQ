import axios from "axios";

// Base axios instance — all API calls go through this
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // send cookies with every request
});

export default api;
