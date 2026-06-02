import { createContext, type ReactNode, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import type { AuthUser } from "@/types/auth.types";

interface AuthContextData {
   user: AuthUser | null;
   isLoading: boolean;
   isAuthenticated: boolean;
   login: (accessToken: string, refreshToken: string) => Promise<void>;
   logout: () => void;
   refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({
   user: null,
   isLoading: true,
   isAuthenticated: false,
   login: async () => {},
   logout: () => {},
   refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
   const navigate = useNavigate();

   const [user, setUser] = useState<AuthUser | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // Busca dados do usuário logado usando o token já no localStorage
   const fetchMe = useCallback(async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
         setIsLoading(false);
         return;
      }
      // Garantir que o header esteja atualiazado antes da chamada
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      try {
         const { data } = await api.get<AuthUser>("/users/me");
         setUser(data);
      } catch (error: any) {
         const status = error?.response?.status;
         if (status === 401) {
            localStorage.clear();
            delete api.defaults.headers.common["X-Farm-Id"];
            setUser(null);
         }
         // Outros erros (rede, 500) não derrubam a sessão
      } finally {
         setIsLoading(false);
      }
   }, []);

   // Roda uma vez no mount para restaurar sessão existente
   useEffect(() => {
      fetchMe();
   }, [fetchMe]);

   // Chamado pela LoginPage após receber os tokens da API
   // Salva os tokens E já busca o usuário — evita a race condition
   const login = useCallback(async (accessToken: string, refreshToken: string) => {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      try {
         const { data } = await api.get<AuthUser>("/users/me");
         setUser(data);
      } catch {
         localStorage.clear();
         throw new Error("Não foi possível carregar os dados do usuário após o login.");
      }
   }, []);

   const logout = useCallback(() => {
      localStorage.clear();
      // Limpa headers injetados pelo AdminFarmContext
      delete api.defaults.headers.common["Authorization"];
      delete api.defaults.headers.common["X-Farm-Id"];
      setUser(null);
      navigate("/login");
   }, [navigate]);

   const refreshUser = useCallback(async () => {
      try {
         const { data } = await api.get<AuthUser>("/users/me");
         setUser(data);
      } catch {
         logout();
      }
   }, [logout]);

   return (
      <AuthContext.Provider
         value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            logout,
            refreshUser,
         }}
      >
         {children}
      </AuthContext.Provider>
   );
}
