import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import authService from "../services/authService";
import type {
   AuthContextType,
   ConfirmResetRequest,
   ForgotPasswordRequest,
   LoginRequest,
   UserTokenData,
} from "../types/auth.types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decodificar JWT para extrair dados do usuário
const decodeToken = (token: string): UserTokenData | null => {
   try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
         atob(base64)
            .split("")
            .map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
            .join(""),
      );
      return JSON.parse(jsonPayload);
   } catch (error) {
      return null;
   }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [user, setUser] = useState<UserTokenData | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // Inicializar usuário a partir do localStorage
   useEffect(() => {
      const token = localStorage.getItem("accessToken");
      if (token) {
         const userData = decodeToken(token);
         if (userData) {
            setUser(userData);
         } else {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
         }
      }
      setIsLoading(false);
   }, []);

   const login = useCallback(async (request: LoginRequest) => {
      setIsLoading(true);
      try {
         const response = await authService.login(request);
         const userData = decodeToken(response.accessToken);

         if (userData) {
            setUser(userData);
            localStorage.setItem("accessToken", response.accessToken);
            localStorage.setItem("refreshToken", response.refreshToken);
         } else {
            throw new Error("Erro ao processar token");
         }
      } catch (error) {
         throw error;
      } finally {
         setIsLoading(false);
      }
   }, []);

   const logout = useCallback(() => {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
   }, []);

   const refreshToken = useCallback(async () => {
      try {
         const token = localStorage.getItem("refreshToken");
         if (!token) {
            logout();
            return;
         }

         const response = await authService.refreshToken({ refreshToken: token });
         const userData = decodeToken(response.accessToken);

         if (userData) {
            setUser(userData);
            localStorage.setItem("accessToken", response.accessToken);
            localStorage.setItem("refreshToken", response.refreshToken);
         } else {
            logout();
         }
      } catch (error) {
         logout();
      }
   }, [logout]);

   const forgotPassword = useCallback(async (request: ForgotPasswordRequest) => {
      setIsLoading(true);
      try {
         await authService.forgotPassword(request);
      } catch (error) {
         throw error;
      } finally {
         setIsLoading(false);
      }
   }, []);

   const confirmReset = useCallback(async (request: ConfirmResetRequest) => {
      setIsLoading(true);
      try {
         await authService.confirmReset(request);
      } catch (error) {
         throw error;
      } finally {
         setIsLoading(false);
      }
   }, []);

   const value: AuthContextType = {
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshToken,
      forgotPassword,
      confirmReset,
   };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
   const context = useContext(AuthContext);
   if (context === undefined) {
      throw new Error("useAuth deve ser usado dentro de um AuthProvider");
   }
   return context;
};
