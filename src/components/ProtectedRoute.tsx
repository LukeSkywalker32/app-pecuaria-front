import { Box, CircularProgress } from "@mui/material";
import type React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
   children: React.ReactNode;
   requiredRole?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
   const { isAuthenticated, isLoading, user } = useAuth();

   if (isLoading) {
      return (
         <Box
            sx={{
               display: "flex",
               justifyContent: "center",
               alignItems: "center",
               minHeight: "100vh",
            }}
         >
            <CircularProgress />
         </Box>
      );
   }

   if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
   }

   if (requiredRole && user && !requiredRole.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
   }

   return <>{children}</>;
};
