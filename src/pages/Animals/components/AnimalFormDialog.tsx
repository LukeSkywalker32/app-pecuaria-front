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
import api from "@/services/api";
import type { AnimalResponse } from "../AnimalsPage";

// ─── Tipos auxiliares ─────────────────────────────────────────────────────
interface Pasture {
   id: string;
   name: string;
   type: string;
   currentAnimals: number;
   animalCapacity: number;
   active: boolean;
}

// ─── Schema de validação com Zod ─────────────────────────────────────────
// Espelha as regras do backend — evita roundtrip desnecessário
const schema = z.object({
   chipId: z
      .string()
      .min(3, "Chip ID deve ter pelo menos 3 caracteres")
      .max(30, "Chip ID deve ter no máximo 30 caracteres")
      .regex(/^[a-zA-Z0-9-]+$/, "Chip ID deve conter apenas letras, números e hífens"),
   currentEarTag: z
      .string()
      .max(20, "Brinco deve ter no máximo 20 caracteres")
      .optional()
      .or(z.literal("")),
   name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
   breed: z
      .string()
      .min(2, "Raça deve ter pelo menos 2 caracteres")
      .max(50, "Raça deve ter no máximo 50 caracteres"),
   gender: z.enum(["M", "F"], "Sexo é obrigatório"),
   birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
   origin: z.enum(["born", "purchased"]),
   pastureId: z.string().optional().or(z.literal("")),
   status: z.enum(["active", "quarantine", "treatment", "dead", "sold"]).optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────
interface Props {
   open: boolean;
   animal: AnimalResponse | null; // null = criar, com dados = editar
   onClose: (saved: boolean) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function AnimalFormDialog({ open, animal, onClose }: Props) {
   const isEditing = !!animal; // true quando veio com dados = modo edição

   const [pastures, setPastures] = useState<Pasture[]>([]);
   const [pasturesLoading, setPasturesLoading] = useState(false);
   const [submitError, setSubmitError] = useState("");

   // ── React Hook Form com validação Zod ─────────────────────────────────
   const {
      control, // conecta campos controlados (Select, etc.)
      register, // conecta campos de input simples
      handleSubmit, // envolve o submit com validação
      watch, // observa valores de outros campos em tempo real
      reset, // reseta o formulário
      formState: { errors, isSubmitting },
   } = useForm<FormData>({
      resolver: zodResolver(schema),
      // Preenche com dados do animal ao editar, ou defaults ao criar
      defaultValues: {
         chipId: "",
         currentEarTag: "",
         name: "",
         breed: "",
         gender: undefined,
         birthDate: "",
         origin: "born",
         pastureId: "",
         status: "active",
      },
   });

   // Observa o campo origin para mostrar/esconder a mensagem de quarentena
   const originValue = watch("origin");

   // ── Carrega pastos disponíveis para o select ──────────────────────────
   useEffect(() => {
      if (!open) return;
      setPasturesLoading(true);
      api.get<Pasture[]>("/pastures?active=true")
         .then(({ data }) => setPastures(data))
         .catch(() => setPastures([]))
         .finally(() => setPasturesLoading(false));
   }, [open]);

   // ── Popula o formulário ao abrir no modo edição ───────────────────────
   useEffect(() => {
      if (open && animal) {
         // Converte a data ISO para o formato YYYY-MM-DD que o input type=date espera
         const birthDateFormatted = animal.birthDate
            ? new Date(animal.birthDate).toISOString().split("T")[0]
            : "";

         reset({
            chipId: animal.chipId,
            currentEarTag: animal.currentEarTag ?? "",
            name: animal.name,
            breed: animal.breed,
            gender: animal.gender,
            birthDate: birthDateFormatted,
            origin: (animal as any).origin ?? "born",
            pastureId: animal.pastureId ?? "",
            status: (["active", "quarantine", "treatment", "dead", "sold"].includes(animal.status)
               ? animal.status
               : "active") as "active" | "quarantine" | "treatment" | "dead" | "sold",
         });
      } else if (open && !animal) {
         // Limpa o formulário ao abrir para criação
         reset({
            chipId: "",
            currentEarTag: "",
            name: "",
            breed: "",
            gender: undefined,
            birthDate: "",
            origin: "born",
            pastureId: "",
            status: "active",
         });
      }
      setSubmitError("");
   }, [open, animal, reset]);

   // ── Submit ────────────────────────────────────────────────────────────
   async function onSubmit(data: FormData) {
      setSubmitError("");
      try {
         // Limpa campos vazios opcionais antes de enviar
         const payload = {
            ...data,
            currentEarTag: data.currentEarTag || undefined,
            pastureId: data.pastureId || undefined,
         };

         if (isEditing) {
            // PUT — atualiza o animal existente
            // chipId não é editável (não enviamos no update)
            const { chipId, origin, ...updatePayload } = payload;
            await api.put(`/animals/${animal!.id}`, updatePayload);
         } else {
            // POST — cria novo animal
            await api.post("/animals", payload);
         }

         onClose(true); // fecha e sinaliza que houve alteração
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao salvar animal. Tente novamente.";
         setSubmitError(msg);
      }
   }

   // ─── Render ───────────────────────────────────────────────────────────
   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            {isEditing ? `Editar: ${animal?.name}` : "Novo Animal"}
         </DialogTitle>

         <Divider />

         {/* noValidate desativa a validação nativa do browser — o Zod assume */}
         <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent sx={{ pt: 2 }}>
               {/* Erro geral do servidor */}
               {submitError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                     {submitError}
                  </Alert>
               )}

               {/* ── Seção: Identificação ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Identificação
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1, mb: 2 }}>
                  {/* Chip ID — não editável após criação */}
                  <TextField
                     label="Chip ID *"
                     size="small"
                     disabled={isEditing} // chip não pode ser alterado depois
                     error={!!errors.chipId}
                     helperText={
                        errors.chipId?.message ?? (isEditing ? "Não editável" : "Ex: CHIP-T001")
                     }
                     {...register("chipId")}
                  />

                  {/* Brinco (earTag) — opcional */}
                  <TextField
                     label="Brinco"
                     size="small"
                     error={!!errors.currentEarTag}
                     helperText={errors.currentEarTag?.message ?? "Ex: BR-T001"}
                     {...register("currentEarTag")}
                  />
               </Box>

               {/* ── Seção: Dados básicos ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Dados do Animal
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1, mb: 2 }}>
                  {/* Nome */}
                  <TextField
                     label="Nome *"
                     size="small"
                     error={!!errors.name}
                     helperText={errors.name?.message}
                     {...register("name")}
                  />

                  {/* Raça */}
                  <TextField
                     label="Raça *"
                     size="small"
                     error={!!errors.breed}
                     helperText={errors.breed?.message ?? "Ex: Nelore, Angus, Gir"}
                     {...register("breed")}
                  />

                  {/* Sexo */}
                  <Controller
                     name="gender"
                     control={control}
                     render={({ field }) => (
                        <FormControl size="small" error={!!errors.gender}>
                           <InputLabel>Sexo *</InputLabel>
                           <Select {...field} label="Sexo *">
                              <MenuItem value="F">Fêmea</MenuItem>
                              <MenuItem value="M">Macho</MenuItem>
                           </Select>
                           {errors.gender && (
                              <FormHelperText>{errors.gender.message}</FormHelperText>
                           )}
                        </FormControl>
                     )}
                  />

                  {/* Data de nascimento — type=date renderiza o date picker nativo */}
                  <TextField
                     label="Data de Nascimento *"
                     size="small"
                     type="date"
                     slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                           max: new Date().toISOString().split("T")[0],
                        },
                     }}
                     error={!!errors.birthDate}
                     helperText={errors.birthDate?.message}
                     {...register("birthDate")}
                  />
               </Box>

               {/* ── Seção: Origem e localização ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Origem e Localização
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1, mb: 1 }}>
                  {/* Origem — born ou purchased (não editável) */}
                  <Controller
                     name="origin"
                     control={control}
                     render={({ field }) => (
                        <FormControl size="small" disabled={isEditing}>
                           <InputLabel>Origem *</InputLabel>
                           <Select {...field} label="Origem *">
                              <MenuItem value="born">Nascido na fazenda</MenuItem>
                              <MenuItem value="purchased">Comprado</MenuItem>
                           </Select>
                           {isEditing && <FormHelperText>Não editável</FormHelperText>}
                        </FormControl>
                     )}
                  />

                  {/* Pasto — obrigatório para born, opcional para purchased */}
                  <Controller
                     name="pastureId"
                     control={control}
                     render={({ field }) => (
                        <FormControl size="small" error={!!errors.pastureId}>
                           <InputLabel>
                              {originValue === "born" ? "Pasto *" : "Pasto (opcional)"}
                           </InputLabel>
                           <Select
                              {...field}
                              label={originValue === "born" ? "Pasto *" : "Pasto (opcional)"}
                              disabled={pasturesLoading}
                           >
                              {originValue === "purchased" && (
                                 <MenuItem value="">Sem pasto (quarentena)</MenuItem>
                              )}
                              {pastures.map(p => (
                                 <MenuItem key={p.id} value={p.id}>
                                    {p.name}
                                    <Typography
                                       component="span"
                                       variant="caption"
                                       color="text.secondary"
                                       sx={{ ml: 1 }}
                                    >
                                       ({p.currentAnimals}/{p.animalCapacity})
                                    </Typography>
                                 </MenuItem>
                              ))}
                           </Select>
                           {errors.pastureId && (
                              <FormHelperText>{errors.pastureId.message}</FormHelperText>
                           )}
                        </FormControl>
                     )}
                  />
               </Box>

               {/* Dica visual: comprado sem pasto entra em quarentena automaticamente */}
               {originValue === "purchased" && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                     Animais comprados sem pasto são automaticamente registrados com status{" "}
                     <strong>Quarentena</strong>.
                  </Alert>
               )}

               {/* Status — só aparece no modo edição */}
               {isEditing && (
                  <Box sx={{ mt: 2 }}>
                     <Typography
                        variant="caption"
                        sx={{
                           fontWeight: 700,
                           color: "text.secondary",
                           textTransform: "uppercase",
                           letterSpacing: 0.8,
                        }}
                     >
                        Status
                     </Typography>
                     <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                           <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                              <InputLabel>Status</InputLabel>
                              <Select {...field} label="Status">
                                 <MenuItem value="active">Ativo</MenuItem>
                                 <MenuItem value="quarantine">Quarentena</MenuItem>
                                 <MenuItem value="treatment">Tratamento</MenuItem>
                              </Select>
                              <FormHelperText>
                                 Para registrar morte ou venda, use os módulos específicos.
                              </FormHelperText>
                           </FormControl>
                        )}
                     />
                  </Box>
               )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2, gap: 1 }}>
               <Button onClick={() => onClose(false)} disabled={isSubmitting}>
                  Cancelar
               </Button>
               <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={
                     isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
                  }
               >
                  {isSubmitting
                     ? "Salvando..."
                     : isEditing
                       ? "Salvar Alterações"
                       : "Cadastrar Animal"}
               </Button>
            </DialogActions>
         </form>
      </Dialog>
   );
}
