// src/pages/Weighings/components/WeighingFormDialog.tsx
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
   FormControl,
   FormHelperText,
   InputLabel,
   MenuItem,
   Select,
   TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import api from "@/services/api";
import { isoToLocalDate, todayLocalISO } from "@/utils/date";

// ─── Tipos auxiliares ─────────────────────────────────────────────────────
interface Animal {
   id: string;
   name: string;
   currentEarTag: string | null;
}
interface WeighingResponse {
   id: string;
   animalId: string;
   weightKg: number;
   date: string;
   notes: string | null;
}

const schema = z.object({
   animalId: z.string().min(1, "Selecione um animal"),
   weightKg: z
      .string()
      .min(1, "Peso é obrigatório")
      .refine(v => !Number.isNaN(Number(v)) && Number(v) > 0, "Peso deve ser maior que zero")
      .refine(v => Number(v) <= 1500, "Peso acima de 1500kg — verifique o valor"),
   date: z
      .string()
      .min(1, "Data é obrigatória")
      .refine(v => new Date(v) <= new Date(), "Data não pode ser futura"),
   notes: z
      .string()
      .max(500, "Notas devem ter no máximo 500 caracteres")
      .optional()
      .or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────
interface Props {
   open: boolean;
   weighing: WeighingResponse | null;
   defaultAnimalId?: string | null;
   onClose: (saved: boolean) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function WeighingFormDialog({ open, weighing, defaultAnimalId, onClose }: Props) {
   const isEditing = !!weighing;
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
         weightKg: "",
         date: "",
         notes: "",
      },
   });

   // ── Carrega animais ao abrir ──────────────────────────────────────────
   useEffect(() => {
      if (!open) return;
      setAnimalsLoading(true);
      api.get("/animals?status=active")
         .then(({ data }) => setAnimals(data))
         .catch(() => setAnimals([]))
         .finally(() => setAnimalsLoading(false));
   }, [open]);

   // ── Preenche formulário (edição ou criação com animal pré-selecionado) ──
   useEffect(() => {
      if (open && weighing) {
         reset({
            animalId: weighing.animalId,
            weightKg: String(weighing.weightKg),
            date: isoToLocalDate(weighing.date),
            notes: weighing.notes ?? "",
         });
      } else if (open && !weighing) {
         reset({
            animalId: defaultAnimalId ?? "",
            weightKg: "",
            date: todayLocalISO(),
            notes: "",
         });
      }
      setSubmitError("");
   }, [open, weighing, defaultAnimalId, reset]);

   async function onSubmit(data: FormData) {
      setSubmitError("");
      try {
         const payload = {
            animalId: data.animalId,
            weightKg: Number(data.weightKg),
            date: data.date,
            notes: data.notes && data.notes !== "" ? data.notes.trim() : null,
         };
         if (isEditing) {
            const { animalId, ...updatePayload } = payload;
            await api.put(`/weighings/${weighing!.id}`, updatePayload);
         } else {
            await api.post("/weighings", payload);
         }
         onClose(true);
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao salvar pesagem. Tente novamente.";
         setSubmitError(msg);
      }
   }

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle>{isEditing ? "Editar Pesagem" : "Registrar Pesagem"}</DialogTitle>
         {submitError && <Alert severity="error">{submitError}</Alert>}
         <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
               <FormControl fullWidth margin="normal" error={!!errors.animalId}>
                  <InputLabel>Animal</InputLabel>
                  <Controller
                     name="animalId"
                     control={control}
                     render={({ field }) => (
                        <Select {...field} label="Animal" disabled={isEditing}>
                           {animalsLoading ? (
                              <MenuItem disabled>Carregando...</MenuItem>
                           ) : (
                              animals.map(a => (
                                 <MenuItem key={a.id} value={a.id}>
                                    {a.name} {a.currentEarTag ? `— ${a.currentEarTag}` : ""}
                                 </MenuItem>
                              ))
                           )}
                        </Select>
                     )}
                  />
                  <FormHelperText>
                     {errors.animalId?.message ??
                        (isEditing ? "Não é possível trocar o animal na edição" : " ")}
                  </FormHelperText>
               </FormControl>

               <TextField
                  {...register("weightKg")}
                  label="Peso (kg)"
                  type="number"
                  fullWidth
                  margin="normal"
                  error={!!errors.weightKg}
                  helperText={errors.weightKg?.message}
                  slotProps={{
                     htmlInput: { step: "0.1", min: "0", max: "1500" },
                  }}
               />

               <TextField
                  {...register("date")}
                  label="Data da pesagem"
                  type="date"
                  fullWidth
                  margin="normal"
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  slotProps={{
                     inputLabel: { shrink: true },
                  }}
               />

               <TextField
                  {...register("notes")}
                  label="Notas (opcional)"
                  multiline
                  rows={3}
                  fullWidth
                  margin="normal"
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
               />
            </DialogContent>
            <DialogActions>
               <Button onClick={() => onClose(false)} disabled={isSubmitting}>
                  Cancelar
               </Button>
               <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={24} /> : "Salvar"}
               </Button>
            </DialogActions>
         </form>
      </Dialog>
   );
}
