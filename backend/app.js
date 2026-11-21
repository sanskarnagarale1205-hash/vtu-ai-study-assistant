import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// If the server says the login is missing or expired, go back to login.
const onUnauthorized = (error) => {
  const status = error.response?.status;
  const onAuthPage = ["/login", "/register"].includes(window.location.pathname);

  if (status === 401 && !onAuthPage && localStorage.getItem("token")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return Promise.reject(error);
};

API.interceptors.response.use((response) => response, onUnauthorized);

// Pages that use plain axios (Upload Notes, Previous Papers, Saved) get the same protection.
axios.interceptors.response.use((response) => response, onUnauthorized);

export default API;