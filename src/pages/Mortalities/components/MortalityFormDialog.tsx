import { zodResolver } from "@hookform/resolvers/zod";
import {
   Alert,
   Box,
   Button,
   Checkbox,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   Divider,
   FormControl,
   FormControlLabel,
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
import ImageUploader from "@/components/ImageUploader";
import api from "@/services/api";

// ─── Tipos auxiliares ─────────────────────────────────────────────────────
interface Animal {
   id: string;
   name: string;
   currentEarTag: string | null;
}

interface MortalityResponse {
   id: string;
   farmId: string;
   animalId: string;
   animalEarTag: string | null;
   animalName: string | null;
   birthId: string | null;
   deathDate: string;
   deathTime: string | null;
   deathLocation: string;
   causeOfDeath: string;
   severity: "mild" | "moderate" | "severe" | null;
   necropsy: boolean;
   disposal: string | null;
   photos: string[] | null;
   notes: string | null;
   registeredById: string | null;
   registeredByName: string | null;
   createdAt: string;
   updatedAt: string;
}

// ─── Schema Zod ───────────────────────────────────────────────────────────
const schema = z
   .object({
      animalId: z.string().min(1, "Selecione um animal"),
      deathDate: z.string().min(1, "Data da morte é obrigatória"),
      deathTime: z
         .string()
         .optional()
         .or(z.literal(""))
         .refine(val => !val || /^\d{2}:\d{2}$/.test(val), "Horário deve estar no formato HH:MM"),
      deathLocation: z
         .string()
         .min(2, "Local da morte deve ter pelo menos 2 caracteres")
         .max(50, "Local da morte deve ter no máximo 50 caracteres"),
      causeOfDeath: z
         .string()
         .min(3, "Causa da morte deve ter pelo menos 3 caracteres")
         .max(50, "Causa da morte deve ter no máximo 50 caracteres"),
      severity: z.enum(["mild", "moderate", "severe"]).optional().or(z.literal("")),
      necropsy: z.boolean().optional(),
      disposal: z
         .string()
         .max(200, "Destinação deve ter no máximo 200 caracteres")
         .optional()
         .or(z.literal("")),
      notes: z
         .string()
         .max(500, "Notas devem ter no máximo 500 caracteres")
         .optional()
         .or(z.literal("")),
      photoUrl: z.string().optional().or(z.literal("")),
   })
   .refine(
      data => {
         if (!data.deathDate) return true;
         return new Date(data.deathDate) <= new Date();
      },
      {
         message: "Data da morte não pode ser futura",
         path: ["deathDate"],
      },
   );

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────
interface Props {
   open: boolean;
   mortality: MortalityResponse | null;
   onClose: (saved: boolean) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function MortalityFormDialog({ open, mortality, onClose }: Props) {
   const isEditing = !!mortality;

   const [animals, setAnimals] = useState<Animal[]>([]);
   const [animalsLoading, setAnimalsLoading] = useState(false);
   const [submitError, setSubmitError] = useState("");

   const {
      control,
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
   } = useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
         animalId: "",
         deathDate: "",
         deathTime: "",
         deathLocation: "",
         causeOfDeath: "",
         severity: "",
         necropsy: false,
         disposal: "",
         notes: "",
         photoUrl: "",
      },
   });

   // ── Carrega animais ao abrir ───────────────────────────────────────────
   useEffect(() => {
      if (!open) return;

      // Animais ativos (não mortos nem vendidos)
      setAnimalsLoading(true);
      api.get<Animal[]>("/animals?status=active")
         .then(({ data }) => setAnimals(data))
         .catch(() => setAnimals([]))
         .finally(() => setAnimalsLoading(false));
   }, [open]);

   // ── Preenche formulário no modo edição ───────────────────────────────
   useEffect(() => {
      if (open && mortality) {
         const deathDateFormatted = mortality.deathDate
            ? new Date(mortality.deathDate).toISOString().split("T")[0]
            : "";

         reset({
            animalId: mortality.animalId,
            deathDate: deathDateFormatted,
            deathTime: mortality.deathTime ?? "",
            deathLocation: mortality.deathLocation,
            causeOfDeath: mortality.causeOfDeath,
            severity: mortality.severity ?? "",
            necropsy: mortality.necropsy,
            disposal: mortality.disposal ?? "",
            notes: mortality.notes ?? "",
            photoUrl: mortality.photos?.[0] ?? "",
         });
      } else if (open && !mortality) {
         reset({
            animalId: "",
            deathDate: "",
            deathTime: "",
            deathLocation: "",
            causeOfDeath: "",
            severity: "",
            necropsy: false,
            disposal: "",
            notes: "",
            photoUrl: "",
         });
      }
      setSubmitError("");
   }, [open, mortality, reset]);

   // ── Submit ────────────────────────────────────────────────────────────
   async function onSubmit(data: FormData) {
      setSubmitError("");
      try {
         const payload = {
            animalId: data.animalId,
            deathDate: data.deathDate,
            deathTime: data.deathTime && data.deathTime !== "" ? data.deathTime : undefined,
            deathLocation: data.deathLocation.trim(),
            causeOfDeath: data.causeOfDeath.trim(),
            severity: data.severity || undefined,
            necropsy: data.necropsy ?? false,
            disposal: data.disposal && data.disposal !== "" ? data.disposal.trim() : undefined,
            notes: data.notes && data.notes !== "" ? data.notes.trim() : undefined,
            photos: data.photoUrl && data.photoUrl !== "" ? [data.photoUrl.trim()] : undefined,
         };

         if (isEditing) {
            const { animalId, ...updatePayload } = payload;
            await api.put(`/mortalities/${mortality!.id}`, updatePayload);
         } else {
            await api.post("/mortalities", payload);
         }

         onClose(true);
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao salvar mortalidade. Tente novamente.";
         setSubmitError(msg);
      }
   }

   // ─── Render ───────────────────────────────────────────────────────────
   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            {isEditing ? `Editar: ${mortality?.animalName}` : "Registrar Mortalidade"}
         </DialogTitle>

         <Divider />

         <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent sx={{ pt: 2 }}>
               {submitError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                     {submitError}
                  </Alert>
               )}

               {/* ── Seleção do Animal ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Animal
               </Typography>

               <Box sx={{ mb: 2, mt: 1 }}>
                  <Controller
                     name="animalId"
                     control={control}
                     render={({ field }) => (
                        <FormControl fullWidth size="small" error={!!errors.animalId}>
                           <InputLabel>Animal *</InputLabel>
                           <Select
                              {...field}
                              label="Animal *"
                              disabled={isEditing || animalsLoading}
                              displayEmpty
                           >
                              {animalsLoading ? (
                                 <MenuItem disabled>
                                    <CircularProgress size={16} sx={{ mr: 1 }} /> Carregando...
                                 </MenuItem>
                              ) : animals.length === 0 ? (
                                 <MenuItem disabled>Nenhum animal ativo</MenuItem>
                              ) : (
                                 animals.map(a => (
                                    <MenuItem key={a.id} value={a.id}>
                                       {a.name} {a.currentEarTag ? `(${a.currentEarTag})` : ""}
                                    </MenuItem>
                                 ))
                              )}
                           </Select>
                           <FormHelperText>
                              {errors.animalId?.message ?? "Selecione o animal"}
                           </FormHelperText>
                        </FormControl>
                     )}
                  />
               </Box>

               {/* ── Data e Hora da Morte ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Data e Hora
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1, mb: 2 }}>
                  <TextField
                     label="Data da Morte *"
                     size="small"
                     type="date"
                     slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { max: new Date().toISOString().split("T")[0] },
                     }}
                     error={!!errors.deathDate}
                     helperText={errors.deathDate?.message}
                     {...register("deathDate")}
                  />
                  <TextField
                     label="Hora da Morte"
                     size="small"
                     type="time"
                     placeholder="HH:MM"
                     error={!!errors.deathTime}
                     helperText={errors.deathTime?.message}
                     {...register("deathTime")}
                  />
               </Box>

               {/* ── Local e Causa ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Informações da Morte
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1, mb: 2 }}>
                  <TextField
                     label="Local da Morte *"
                     size="small"
                     placeholder="Ex: Pasto Norte"
                     error={!!errors.deathLocation}
                     helperText={errors.deathLocation?.message}
                     {...register("deathLocation")}
                  />
                  <TextField
                     label="Causa da Morte *"
                     size="small"
                     placeholder="Ex: Cólica"
                     error={!!errors.causeOfDeath}
                     helperText={errors.causeOfDeath?.message}
                     {...register("causeOfDeath")}
                  />
               </Box>

               {/* ── Severidade e Necropsia ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Análise
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1, mb: 2 }}>
                  <Controller
                     name="severity"
                     control={control}
                     render={({ field }) => (
                        <FormControl fullWidth size="small">
                           <InputLabel>Severidade</InputLabel>
                           <Select {...field} label="Severidade" displayEmpty>
                              <MenuItem value="">Não informado</MenuItem>
                              <MenuItem value="mild">Leve</MenuItem>
                              <MenuItem value="moderate">Moderada</MenuItem>
                              <MenuItem value="severe">Severa</MenuItem>
                           </Select>
                        </FormControl>
                     )}
                  />
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                     <Controller
                        name="necropsy"
                        control={control}
                        render={({ field }) => (
                           <FormControlLabel
                              control={<Checkbox {...field} checked={field.value ?? false} />}
                              label="Necropsia Realizada"
                           />
                        )}
                     />
                  </Box>
               </Box>

               {/* ── Destinação ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Destinação e Observações
               </Typography>

               <Box sx={{ mt: 1, mb: 2 }}>
                  <Controller
                     name="photoUrl"
                     control={control}
                     render={({ field }) => (
                        <ImageUploader
                           value={field.value || null}
                           onChange={url => field.onChange(url ?? "")}
                           folder="mortalities"
                           label="Foto da Mortalidade"
                           helperText="Opcional — evidência fotográfica"
                           disabled={isSubmitting}
                           maxSizeMB={5}
                        />
                     )}
                  />
               </Box>
               <Box sx={{ mt: 1, mb: 2 }}>
                  <TextField
                     fullWidth
                     label="Destinação do Corpo"
                     size="small"
                     placeholder="Ex: Enterrado, Incinerado, etc."
                     error={!!errors.disposal}
                     helperText={errors.disposal?.message}
                     {...register("disposal")}
                     sx={{ mb: 2 }}
                  />
                  <TextField
                     fullWidth
                     label="Notas Adicionais"
                     size="small"
                     multiline
                     rows={3}
                     placeholder="Observações sobre o caso..."
                     error={!!errors.notes}
                     helperText={errors.notes?.message}
                     {...register("notes")}
                  />
               </Box>
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
                  {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Registrar"}
               </Button>
            </DialogActions>
         </form>
      </Dialog>
   );
}
