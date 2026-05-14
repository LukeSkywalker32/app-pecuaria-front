import { z } from "zod";

export const loginSchema = z.object({
   farmId: z.string().min(1, "ID da fazenda é obrigatório"),
   username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
   password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const forgotPasswordSchema = z.object({
   farmId: z.string().min(1, "ID da fazenda é obrigatório"),
   email: z.string().email("Email inválido"),
});

export const confirmResetSchema = z
   .object({
      farmId: z.string().min(1, "ID da fazenda é obrigatório"),
      email: z.string().email("Email inválido"),
      code: z.string().regex(/^\d{6}$/, "Código deve ter 6 dígitos"),
      newPassword: z
         .string()
         .min(8, "Senha deve ter no mínimo 8 caracteres")
         .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
         .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
         .regex(/\d/, "Senha deve conter pelo menos um número")
         .regex(/[@$!%*?&]/, "Senha deve conter pelo menos um caractere especial (@$!%*?&)"),
      confirmPassword: z.string(),
   })
   .refine(data => data.newPassword === data.confirmPassword, {
      message: "As senhas não correspondem",
      path: ["confirmPassword"],
   });

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ConfirmResetFormData = z.infer<typeof confirmResetSchema>;
