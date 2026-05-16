import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@/types/auth.types";
import { useAuth } from "../contexts/AuthContext";

interface Props {
   // Se informado, apenas os roles listados passam — omitir = todos passam
   allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
   const { isAuthenticated, isLoading, user } = useAuth();
   // ── 1. Ainda verificando a sessão no mount ───
   if (isLoading) {
      return (
         <Box
            sx={{
               minHeight: "100vh",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               bgcolor: "background.default",
            }}
         >
            <CircularProgress color="primary" />
         </Box>
      );
   }
   // --- 2. Não autenticado -> vai para o login
   if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
   }
   // ── 3. Role não permitido → vai para o dashboard (sem permissão) ──
   if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
   }
   // ── 4. Tudo certo → renderiza a página filha ─────
   return <Outlet />;
}
