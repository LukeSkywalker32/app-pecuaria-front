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
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { type ConfirmResetFormData, confirmResetSchema } from "../schemas/authSchemas";

export const ConfirmReset: React.FC = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { confirmReset, isLoading } = useAuth();
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState(false);

   const state = location.state as { email: string; farmId: string } | null;

   const {
      control,
      handleSubmit,
      formState: { errors },
   } = useForm<ConfirmResetFormData>({
      resolver: zodResolver(confirmResetSchema),
      defaultValues: {
         farmId: state?.farmId || "",
         email: state?.email || "",
         code: "",
         newPassword: "",
         confirmPassword: "",
      },
   });

   const onSubmit = async (data: ConfirmResetFormData) => {
      setError(null);
      try {
         await confirmReset({
            farmId: data.farmId,
            email: data.email,
            code: data.code,
            newPassword: data.newPassword,
         });
         setSuccess(true);
         setTimeout(() => {
            navigate("/login");
         }, 2000);
      } catch (err: any) {
         setError(err.response?.data?.message || "Erro ao confirmar reset de senha.");
      }
   };

   if (success) {
      return (
         <Box
            sx={{
               minHeight: "100vh",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
            }}
         >
            <Container maxWidth="sm">
               <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
                  <Alert severity="success" sx={{ mb: 3 }}>
                     Senha redefinida com sucesso! Você será redirecionado para o login.
                  </Alert>
                  <CircularProgress />
               </Paper>
            </Container>
         </Box>
      );
   }

   return (
      <Box
         sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
            py: 4,
         }}
      >
         <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
               {/* Header */}
               <Box sx={{ mb: 4, textAlign: "center" }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#1b4332", mb: 1 }}>
                     Redefinir Senha
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                     Digite o código recebido por email e sua nova senha
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
                              fullWidth
                              error={!!errors.farmId}
                              helperText={errors.farmId?.message}
                              disabled={isLoading}
                           />
                        )}
                     />

                     <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                           <TextField
                              {...field}
                              label="Email"
                              type="email"
                              fullWidth
                              error={!!errors.email}
                              helperText={errors.email?.message}
                              disabled={isLoading}
                           />
                        )}
                     />

                     <Controller
                        name="code"
                        control={control}
                        render={({ field }) => (
                           <TextField
                              {...field}
                              label="Código de Recuperação"
                              placeholder="Digite o código de 6 dígitos"
                              fullWidth
                              error={!!errors.code}
                              helperText={errors.code?.message}
                              disabled={isLoading}
                              //inputProps={{ maxLength: 6 }}
                           />
                        )}
                     />

                     <Controller
                        name="newPassword"
                        control={control}
                        render={({ field }) => (
                           <TextField
                              {...field}
                              label="Nova Senha"
                              type="password"
                              placeholder="Digite sua nova senha"
                              fullWidth
                              error={!!errors.newPassword}
                              helperText={errors.newPassword?.message}
                              disabled={isLoading}
                           />
                        )}
                     />

                     <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                           <TextField
                              {...field}
                              label="Confirmar Senha"
                              type="password"
                              placeholder="Confirme sua nova senha"
                              fullWidth
                              error={!!errors.confirmPassword}
                              helperText={errors.confirmPassword?.message}
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
                        sx={{ py: 1.5, fontSize: "1rem" }}
                     >
                        {isLoading ? <CircularProgress size={24} /> : "Redefinir Senha"}
                     </Button>
                  </Stack>
               </form>

               {/* Footer Link */}
               <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">
                     Voltar para{" "}
                     <Link
                        to="/login"
                        style={{
                           color: "#2d6a4f",
                           textDecoration: "none",
                           fontWeight: 600,
                        }}
                     >
                        login
                     </Link>
                  </Typography>
               </Box>
            </Paper>
         </Container>
      </Box>
   );
};