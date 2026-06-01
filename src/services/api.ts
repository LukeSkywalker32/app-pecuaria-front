import axios from "axios";

// Rotas que não precisam de autenticação — o interceptor de 401 as ignora
const PUBLIC_ROUTES = ["/auth/login", "/auth/admin-login", "/farms/public", "/auth/renew-token"];

const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
   headers: {
      "Content-Type": "application/json",
   },
});

// Interceptor de request — injeta o accessToken em toda requisição autenticada
api.interceptors.request.use(config => {
   const token = localStorage.getItem("accessToken");
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

// Interceptor de response — trata 401 globalmente (token expirado)
api.interceptors.response.use(
   response => response,
   async error => {
      const original = error.config;

      // Verifica se é uma rota pública — se sim, rejeita sem tentar refresh
      const isPublicRoute = PUBLIC_ROUTES.some(route => original.url?.includes(route));
      if (isPublicRoute) {
         return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem("refreshToken");

      // Só tenta renovar token se:
      // 1. Status for 401
      // 2. Não tiver tentado antes (_retry)
      // 3. Existir um refreshToken salvo
      if (error.response?.status === 401 && !original._retry && refreshToken) {
         original._retry = true;
         try {
            const { data } = await axios.post(
               `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/auth/renew-token`,
               { refreshToken },
            );
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return api.request(original);
         } catch {
            // Refresh expirado ou inválido — desloga
            localStorage.clear();
            window.location.href = "/login";
         }
      }

      return Promise.reject(error);
   },
);

export default api;
