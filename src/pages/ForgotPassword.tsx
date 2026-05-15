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
import { type ForgotPasswordFormData, forgotPasswordSchema } from "../schemas/authSchemas";

export const ForgotPassword: React.FC = () => {
   const navigate = useNavigate();
   const { forgotPassword, isLoading } = useAuth();
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState(false);

   const {
      control,
      handleSubmit,
      formState: { errors },
   } = useForm<ForgotPasswordFormData>({
      resolver: zodResolver(forgotPasswordSchema),
      defaultValues: {
         farmId: "",
         email: "",
      },
   });

   const onSubmit = async (data: ForgotPasswordFormData) => {
      setError(null);
      try {
         await forgotPassword(data);
         setSuccess(true);
         setTimeout(() => {
            navigate("/confirm-reset", { state: { email: data.email, farmId: data.farmId } });
         }, 2000);
      } catch (err: any) {
         setError(err.response?.data?.message || "Erro ao solicitar recuperação de senha.");
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
                     Email enviado com sucesso! Verifique sua caixa de entrada para o código de
                     recuperação.
                  </Alert>
                  <Typography variant="body1" color="textSecondary">
                     Você será redirecionado em breve...
                  </Typography>
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
                     Recuperar Senha
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                     Digite seu email para receber um código de recuperação
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
                        name="email"
                        control={control}
                        render={({ field }) => (
                           <TextField
                              {...field}
                              label="Email"
                              type="email"
                              placeholder="Digite seu email"
                              fullWidth
                              error={!!errors.email}
                              helperText={errors.email?.message}
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
                        {isLoading ? <CircularProgress size={24} /> : "Enviar Código"}
                     </Button>
                  </Stack>
               </form>

               {/* Footer Link */}
               <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">
                     Lembrou a senha?{" "}
                     <Link
                        to="/login"
                        style={{
                           color: "#2d6a4f",
                           textDecoration: "none",
                           fontWeight: 600,
                        }}
                     >
                        Voltar ao login
                     </Link>
                  </Typography>
               </Box>
            </Paper>
         </Container>
      </Box>
   );
};
