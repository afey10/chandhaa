import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err: unknown): string {
  const anyErr = err as any;
  return anyErr?.response?.data?.error || anyErr?.message || "Something went wrong. Please try again.";
}

export default api;
