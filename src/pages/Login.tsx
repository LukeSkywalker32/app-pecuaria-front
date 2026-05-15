import { zodResolver } from "@hookform/resolvers/zod";
import {
   Alert,
   Box,
   Button,
   CircularProgress,
   Container,
   Paper,
   Stack,
   TextField,
   Typography,
} from "@mui/material";
import type React from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { type LoginFormData, loginSchema } from "../schemas/authSchemas";

export const Login: React.FC = () => {
   const navigate = useNavigate();
   const { login, isLoading } = useAuth();
   const [error, setError] = useState<string | null>(null);

   const {
      control,
      handleSubmit,
      formState: { errors },
   } = useForm<LoginFormData>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
         farmId: "",
         username: "",
         password: "",
      },
   });

   const onSubmit = async (data: LoginFormData) => {
      setError(null);
      try {
         await login(data);
         navigate("/dashboard");
      } catch (err: any) {
         setError(err.response?.data?.message || "Erro ao fazer login. Tente novamente");
      }
   };
   return (
      <Box
         sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1b4332 0%,#2d6a4f 100%)",
            py: 4,
         }}
      >
         <Container maxWidth="sm">
            <Paper
               elevation={3}
               sx={{
                  p: 4,
                  borderRadius: 2,
               }}
            >
               {/*logo/Header */}
               <Box sx={{ mb: 4, textAlign: "center" }}>
                  <Typography
                     variant="h3"
                     sx={{
                        fontWeight: 700,
                        color: "primary.main",
                        mb: 1,
                     }}
                  >
                     🐄 Pecuária
                  </Typography>
                  <Typography
                     variant="body1"
                     sx={{
                        color: "text.secondary",
                     }}
                  >
                     Sistema de Manejo de pecuária
                  </Typography>
               </Box>
               {/* Error Alert */}
               {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                     {error}
                  </Alert>
               )}

               {/* Form */}
               <form onSubmit={handleSubmit(onSubmit)}>
                  <Stack spacing={3}>
                     <Controller
                        name="farmId"
                        control={control}
                        render={({ field }) => (
                           <TextField
                              {...field}
                              label="ID da Fazenda"
                              placeholder="Digite o ID da sua fazenda"
                              fullWidth
                              error={!!errors.farmId}
                              helperText={errors.farmId?.message}
                              disabled={isLoading}
                           />
                        )}
                     />

                     <Controller
                        name="username"
                        control={control}
                        render={({ field }) => (
                           <TextField
                              {...field}
                              label="Usuário"
                              placeholder="Digite seu usuário"
                              fullWidth
                              error={!!errors.username}
                              helperText={errors.username?.message}
                              disabled={isLoading}
                           />
                        )}
                     />

                     <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                           <TextField
                              {...field}
                              label="Senha"
                              type="password"
                              placeholder="Digite sua senha"
                              fullWidth
                              error={!!errors.password}
                              helperText={errors.password?.message}
                              disabled={isLoading}
                           />
                        )}
                     />

                     <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={isLoading}
                        sx={{
                           py: 1.5,
                           fontSize: "1rem",
                        }}
                     >
                        {isLoading ? <CircularProgress size={24} /> : "Entrar"}
                     </Button>
                  </Stack>
               </form>

               {/* Footer Links */}
               <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">
                     Esqueceu sua senha?{" "}
                     <Link
                        to="/forgot-password"
                        style={{
                           color: "#2d6a4f",
                           textDecoration: "none",
                           fontWeight: 600,
                        }}
                     >
                        Clique aqui
                     </Link>
                  </Typography>
               </Box>
            </Paper>
         </Container>
      </Box>
   );
};
