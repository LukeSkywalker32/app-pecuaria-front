import { zodResolver } from "@hookform/resolvers/zod";
import {
   Alert,
   Box,
   Button,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   Divider,
   FormControl,
   FormHelperText,
   InputLabel,
   MenuItem,
   Select,
   TextField,
   Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/useAuth";
import api from "@/services/api";

interface UserResponse {
   id: string;
   fullName: string;
   username: string;
   email: string;
   phone: string | null;
   role: string;
   active: boolean;
   farmName: string;
   crmv: string | null;
   graduationDate: string | null;
   specialties: string[] | null;
   lastLogin: string | null;
   createdAt: string;
}

const schema = z.object({
   fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
   username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
   email: z.string().email("Email inválido"),
   phone: z.string().optional().or(z.literal("")),
   role: z.enum(["admin", "owner", "farmmanager", "veterinarian"]),
   password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .optional()
      .or(z.literal("")),
   crmv: z.string().optional().or(z.literal("")),
   graduationDate: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
   open: boolean;
   onClose: (saved: boolean) => void;
   editingUser: UserResponse | null;
}

export default function UserFormDialog({ open, onClose, editingUser }: Props) {
   const { user: authUser } = useAuth();
   const [submitError, setSubmitError] = useState("");

   const {
      control,
      register,
      handleSubmit,
      reset,
      watch,
      formState: { errors, isSubmitting },
   } = useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
         fullName: "",
         username: "",
         email: "",
         phone: "",
         role: "veterinarian",
         password: "",
         crmv: "",
         graduationDate: "",
      },
   });

   const selectedRole = watch("role");

   useEffect(() => {
      if (editingUser) {
         reset({
            fullName: editingUser.fullName,
            username: editingUser.username,
            email: editingUser.email,
            phone: editingUser.phone ?? "",
            role: (editingUser.role as any) ?? "veterinarian",
            password: "",
            crmv: editingUser.crmv ?? "",
            graduationDate: editingUser.graduationDate ?? "",
         });
      } else {
         reset({
            fullName: "",
            username: "",
            email: "",
            phone: "",
            role: "veterinarian",
            password: "",
            crmv: "",
            graduationDate: "",
         });
      }
      setSubmitError("");
   }, [open,editingUser, reset]);

   async function onSubmit(data: FormData) {
      setSubmitError("");
      try {
         const payload: any = {
            fullName: data.fullName.trim(),
            username: data.username.trim(),
            email: data.email.trim(),
            phone: data.phone?.trim() || null,
            role: data.role,
         };

         if (!editingUser) {
            if (!data.password) {
               setSubmitError("Senha é obrigatória para novo usuário");
               return;
            }
            payload.password = data.password;
         }

         if (data.role === "veterinarian") {
            payload.crmv = data.crmv?.trim() || null;
            payload.graduationDate = data.graduationDate || null;
         }

         if (editingUser) {
            await api.put(`/users/${editingUser.id}`, payload);
         } else {
            await api.post("/users", payload);
         }

         onClose(true);
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao salvar usuário";
         setSubmitError(msg);
      }
   }

   const availableRoles =
      authUser?.role === "admin"
         ? ["admin", "owner", "farmmanager", "veterinarian"]
         : authUser?.role === "owner"
           ? ["farmmanager", "veterinarian"]
           : ["veterinarian"];

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            {editingUser ? "Editar Usuário" : "Novo Usuário"}
         </DialogTitle>

         <Divider />

         <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent sx={{ pt: 2 }}>
               {submitError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                     {submitError}
                  </Alert>
               )}

               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Informações Básicas
               </Typography>

               <Box sx={{ display: "grid", gap: 2, mt: 1, mb: 2 }}>
                  <TextField
                     fullWidth
                     label="Nome Completo *"
                     size="small"
                     error={!!errors.fullName}
                     helperText={errors.fullName?.message}
                     {...register("fullName")}
                  />

                  <TextField
                     fullWidth
                     label="Username *"
                     size="small"
                     error={!!errors.username}
                     helperText={errors.username?.message}
                     {...register("username")}
                  />

                  <TextField
                     fullWidth
                     label="Email *"
                     size="small"
                     type="email"
                     error={!!errors.email}
                     helperText={errors.email?.message}
                     {...register("email")}
                  />

                  <TextField
                     fullWidth
                     label="Telefone"
                     size="small"
                     error={!!errors.phone}
                     helperText={errors.phone?.message}
                     {...register("phone")}
                  />
               </Box>

               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Permissões
               </Typography>

               <Box sx={{ mt: 1, mb: 2 }}>
                  <Controller
                     name="role"
                     control={control}
                     render={({ field }) => (
                        <FormControl fullWidth size="small" error={!!errors.role}>
                           <InputLabel>Role *</InputLabel>
                           <Select {...field} label="Role *">
                              {availableRoles.map(role => (
                                 <MenuItem key={role} value={role}>
                                    {role === "admin"
                                       ? "Administrador"
                                       : role === "owner"
                                         ? "Proprietário"
                                         : role === "farmmanager"
                                           ? "Gerente da Fazenda"
                                           : "Veterinário"}
                                 </MenuItem>
                              ))}
                           </Select>
                           <FormHelperText>
                              {errors.role?.message ?? "Selecione a permissão do usuário"}
                           </FormHelperText>
                        </FormControl>
                     )}
                  />
               </Box>

               {!editingUser && (
                  <>
                     <Typography
                        variant="caption"
                        sx={{
                           fontWeight: 700,
                           color: "text.secondary",
                           textTransform: "uppercase",
                           letterSpacing: 0.8,
                        }}
                     >
                        Segurança
                     </Typography>

                     <Box sx={{ mt: 1, mb: 2 }}>
                        <TextField
                           fullWidth
                           label="Senha *"
                           size="small"
                           type="password"
                           error={!!errors.password}
                           helperText={errors.password?.message ?? "Mínimo 6 caracteres"}
                           {...register("password")}
                        />
                     </Box>
                  </>
               )}

               {selectedRole === "veterinarian" && (
                  <>
                     <Typography
                        variant="caption"
                        sx={{
                           fontWeight: 700,
                           color: "text.secondary",
                           textTransform: "uppercase",
                           letterSpacing: 0.8,
                        }}
                     >
                        Informações Profissionais (Opcional)
                     </Typography>

                     <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
                        <TextField
                           fullWidth
                           label="CRMV"
                           size="small"
                           error={!!errors.crmv}
                           helperText={errors.crmv?.message}
                           {...register("crmv")}
                        />

                        <TextField
                           fullWidth
                           label="Data de Formação"
                           size="small"
                           type="date"
                           slotProps={{
                              inputLabel: { shrink: true },
                           }}
                           error={!!errors.graduationDate}
                           helperText={errors.graduationDate?.message}
                           {...register("graduationDate")}
                        />
                     </Box>
                  </>
               )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2 }}>
               <Button onClick={() => onClose(false)}>Cancelar</Button>
               <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
               >
                  {isSubmitting ? "Salvando..." : editingUser ? "Atualizar" : "Criar"}
               </Button>
            </DialogActions>
         </form>
      </Dialog>
   );
}
