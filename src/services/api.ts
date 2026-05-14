import axios, { type AxiosError, type AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api: AxiosInstance = axios.create({
   baseURL: API_BASE_URL,
   headers: {
      "Content-Type": "application/json",
   },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
   config => {
      const token = localStorage.getItem("accessToken");
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
   },
   error => {
      return Promise.reject(error);
   },
);
//interceptador para tratamentos de erros
api.interceptors.response.use(
   response => response,
   async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // se receber 401 e nao for uma tentativa de refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
         originalRequest._retry = true;

         try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
               //redirecionar para login
               window.location.href = "/login";
               return Promise.reject(error);
            }
            const response = await axios.post(`${API_BASE_URL}/auth/renew-token`, { refreshToken });

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", newRefreshToken);

            // Repetir requisição original com novo token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
         } catch (refreshError) {
            // Se falhar, redirecionar para login
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return Promise.reject(refreshError);
         }
      }
      return Promise.reject(error);
   },
);

export default api;
