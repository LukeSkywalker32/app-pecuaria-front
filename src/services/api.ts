import axios from "axios";

const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
   headers: {
      "Content-Type": "application/json",
   },
});

//Interceptor de request - injeta o accessToken em toda requisição autenticada
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
      if (error.response?.status === 401 && !original._retry) {
         original._retry = true;
         try {
            const refreshToken = localStorage.getItem("refreshToken");
            const { data } = await axios.post(
               `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/auth/renew-token`,
               { refreshToken },
            );
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            //retona a requisição original com o novo token
            return api.request(original);
         } catch {
            // Refresh expirado — desloga e manda pro login
            localStorage.clear();
            window.location.href = "/login";
         }
      }
      return Promise.reject(error);
   },
);
export default api;
