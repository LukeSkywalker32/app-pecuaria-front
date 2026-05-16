import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import type { AuthUser } from "@/types/auth.types";

//formato do contexto
interface AuthContextData {
   user: AuthUser | null;
   isLoading: boolean;
   isAuthenticated: boolean;
   logout: () => void;
   refreshUser: () => Promise<void>;
}

// Cria contexto
const AuthContext = createContext<AuthContextData>({
   user: null,
   isLoading: true,
   isAuthenticated: false,
   logout: () => {},
   refreshUser: async () => {},
});
// ---------- Provider -------------
export function AuthProvider({ children }: { children: ReactNode }) {
   const navigate = useNavigate();

   const [user, setUser] = useState<AuthUser | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // --- Busca dados do usuario logado ---
   const fetchMe = useCallback(async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
         setIsLoading(false);
         return;
      }
      try {
         const { data } = await api.get<AuthUser>("/users/me");
         setUser(data);
      } catch {
         localStorage.clear();
         setUser(null);
      } finally {
         setIsLoading(false);
      }
   }, []);

   //--- Roda uma vez no mount para restaurar sessao existente
   useEffect(() => {
      fetchMe();
   }, [fetchMe]);

   // --- Logout ---
   const logout = useCallback(() => {
      localStorage.clear(); // remove accessToken, refreshToken, role, farmId
      setUser(null);
      navigate("/login");
   }, [navigate]);

   // Usado após o usuário editar o próprio perfil
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
            logout,
            refreshUser,
         }}
      >
         {children}
      </AuthContext.Provider>
   );
}

// --- Hook de consumo ---
export function useAuth() {
   const ctx = useContext(AuthContext);
   if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
   return ctx;
}
