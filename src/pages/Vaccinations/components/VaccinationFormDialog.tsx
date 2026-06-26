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
import ImageUploader from "@/components/ImageUploader";
import api from "@/services/api";

// ─── Tipos auxiliares ─────────────────────────────────────────────────────

interface Animal {
   id: string;
   name: string;
   currentEarTag: string | null;
}

interface User {
   id: string;
   fullName: string;
}

interface VaccinationResponse {
   id: string;
   animalId: string;
   animalName: string | null;
   animalEarTag: string | null;
   vaccineType: string;
   brand: string;
   batch: string;
   vaccinationDate: string;
   expirationDate: string;
   nextDoseDate: string | null;
   photoUrl: string | null;
   reaction: string | null;
   notes: string | null;
   veterinarianId: string | null;
   veterinarianName: string | null;
}

const schema = z
   .object({
      animalId: z.string().min(1, "Selecione um animal"),
      vaccineType: z
         .string()
         .min(2, "Tipo de vacina deve ter pelo menos 2 caracteres")
         .max(100, "Tipo de vacina deve ter no máximo 100 caracteres"),
      brand: z
         .string()
         .min(2, "Marca deve ter pelo menos 2 caracteres")
         .max(100, "Marca deve ter no máximo 100 caracteres"),
      batch: z
         .string()
         .min(1, "Número do lote é obrigatório")
         .max(50, "Número do lote deve ter no máximo 50 caracteres"),
      vaccinationDate: z.string().min(1, "Data de vacinação é obrigatória"),
      expirationDate: z.string().min(1, "Data de validade é obrigatória"),
      nextDoseDate: z.string().optional().or(z.literal("")),
      reaction: z
         .string()
         .max(300, "Descrição da reação deve ter no máximo 300 caracteres")
         .optional()
         .or(z.literal("")),
      notes: z
         .string()
         .max(500, "Notas devem ter no máximo 500 caracteres")
         .optional()
         .or(z.literal("")),
      veterinarianId: z.string().optional().or(z.literal("")),
   })
   .refine(
      data => {
         if (!data.vaccinationDate || !data.expirationDate) return true;
         return new Date(data.expirationDate) > new Date(data.vaccinationDate);
      },
      {
         message: "Data de validade deve ser posterior à data de vacinação",
         path: ["expirationDate"],
      },
   )
   .refine(
      data => {
         if (!data.nextDoseDate || data.nextDoseDate === "") return true;
         if (!data.vaccinationDate) return true;
         return new Date(data.nextDoseDate) > new Date(data.vaccinationDate);
      },
      {
         message: "Data da próxima dose deve ser posterior à data de vacinação",
         path: ["nextDoseDate"],
      },
   )
   .refine(
      data => {
         if (!data.vaccinationDate) return true;
         return new Date(data.vaccinationDate) <= new Date();
      },
      {
         message: "Data de vacinação não pode ser futura",
         path: ["vaccinationDate"],
      },
   );

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────

interface Props {
   open: boolean;
   vaccination: VaccinationResponse | null;
   onClose: (saved: boolean) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────

export default function VaccinationFormDialog({ open, vaccination, onClose }: Props) {
   const isEditing = !!vaccination;

   const [animals, setAnimals] = useState<Animal[]>([]);
   const [veterinarians, setVeterinarians] = useState<User[]>([]);
   const [animalsLoading, setAnimalsLoading] = useState(false);
   const [veterinariansLoading, setVeterinariansLoading] = useState(false);
   const [submitError, setSubmitError] = useState("");

   // photoUrl é controlado fora do react-hook-form porque o upload
   // é assíncrono — o ImageUploader chama onChange(url) após concluir.
   const [photoUrl, setPhotoUrl] = useState<string | null>(null);
   // Rastreia se o ImageUploader está no meio de um upload, pra travar
   // o botão de salvar e evitar registrar o formulário sem a foto.
   const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
         vaccineType: "",
         brand: "",
         batch: "",
         vaccinationDate: "",
         expirationDate: "",
         nextDoseDate: "",
         reaction: "",
         notes: "",
         veterinarianId: "",
      },
   });

   // ── Carrega animais e veterinários ao abrir ───────────────────────────

   useEffect(() => {
      if (!open) return;

      setAnimalsLoading(true);
      api.get<Animal[]>("/animals?status=active")
         .then(({ data }) => setAnimals(data))
         .catch(() => setAnimals([]))
         .finally(() => setAnimalsLoading(false));

      setVeterinariansLoading(true);
      api.get<User[]>("/users")
         .then(({ data }) => setVeterinarians(data))
         .catch(() => setVeterinarians([]))
         .finally(() => setVeterinariansLoading(false));
   }, [open]);

   // ── Preenche formulário no modo edição ───────────────────────────────

   useEffect(() => {
      if (open && vaccination) {
         reset({
            animalId: vaccination.animalId,
            vaccineType: vaccination.vaccineType,
            brand: vaccination.brand,
            batch: vaccination.batch,
            vaccinationDate: vaccination.vaccinationDate
               ? new Date(vaccination.vaccinationDate).toISOString().split("T")[0]
               : "",
            expirationDate: vaccination.expirationDate
               ? new Date(vaccination.expirationDate).toISOString().split("T")[0]
               : "",
            nextDoseDate: vaccination.nextDoseDate
               ? new Date(vaccination.nextDoseDate).toISOString().split("T")[0]
               : "",
            reaction: vaccination.reaction ?? "",
            notes: vaccination.notes ?? "",
            veterinarianId: vaccination.veterinarianId ?? "",
         });
         // Restaura a foto existente no estado separado
         setPhotoUrl(vaccination.photoUrl ?? null);
         setIsUploadingPhoto(false);
      } else if (open && !vaccination) {
         reset({
            animalId: "",
            vaccineType: "",
            brand: "",
            batch: "",
            vaccinationDate: "",
            expirationDate: "",
            nextDoseDate: "",
            reaction: "",
            notes: "",
            veterinarianId: "",
         });
         setPhotoUrl(null);
         setIsUploadingPhoto(false);
      }
      setSubmitError("");
   }, [open, vaccination, reset]);

   // ── Submit ────────────────────────────────────────────────────────────

   async function onSubmit(data: FormData) {
      setSubmitError("");
      try {
         const payload = {
            animalId: data.animalId,
            vaccineType: data.vaccineType.trim(),
            brand: data.brand.trim(),
            batch: data.batch.trim(),
            vaccinationDate: data.vaccinationDate,
            expirationDate: data.expirationDate,
            nextDoseDate: data.nextDoseDate && data.nextDoseDate !== "" ? data.nextDoseDate : null,
            // photoUrl vem do estado separado — foi definido pelo ImageUploader
            photoUrl: photoUrl ?? null,
            reaction: data.reaction && data.reaction !== "" ? data.reaction.trim() : null,
            notes: data.notes && data.notes !== "" ? data.notes.trim() : null,
            veterinarianId:
               data.veterinarianId && data.veterinarianId !== "" ? data.veterinarianId : null,
         };

         if (isEditing) {
            const { animalId, ...updatePayload } = payload;
            await api.put(`/vaccinations/${vaccination!.id}`, updatePayload);
         } else {
            await api.post("/vaccinations", payload);
         }

         onClose(true);
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao salvar vacinação. Tente novamente.";
         setSubmitError(msg);
      }
   }

   // ─── Render ───────────────────────────────────────────────────────────

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            {isEditing ? `Editar: ${vaccination?.animalName}` : "Registrar Vacinação"}
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
                                 <MenuItem disabled>Nenhum animal cadastrado</MenuItem>
                              ) : (
                                 animals.map(a => (
                                    <MenuItem key={a.id} value={a.id}>
                                       {a.name} {a.currentEarTag ? `(${a.currentEarTag})` : ""}
                                    </MenuItem>
                                 ))
                              )}
                           </Select>
                           <FormHelperText>
                              {errors.animalId?.message ?? "Selecione o animal a ser vacinado"}
                           </FormHelperText>
                        </FormControl>
                     )}
                  />
               </Box>

               {/* ── Informações da Vacina ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Informações da Vacina
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1, mb: 2 }}>
                  <TextField
                     label="Tipo de Vacina *"
                     size="small"
                     placeholder="Ex: Febre Aftosa"
                     error={!!errors.vaccineType}
                     helperText={errors.vaccineType?.message}
                     {...register("vaccineType")}
                  />
                  <TextField
                     label="Marca/Fabricante *"
                     size="small"
                     placeholder="Ex: Boehringer"
                     error={!!errors.brand}
                     helperText={errors.brand?.message}
                     {...register("brand")}
                  />
                  <TextField
                     label="Número do Lote *"
                     size="small"
                     placeholder="Ex: 123456"
                     error={!!errors.batch}
                     helperText={errors.batch?.message}
                     {...register("batch")}
                  />
               </Box>

               {/* ── Datas ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Datas
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1, mb: 2 }}>
                  <TextField
                     label="Data de Vacinação *"
                     size="small"
                     type="date"
                     slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { max: new Date().toISOString().split("T")[0] },
                     }}
                     error={!!errors.vaccinationDate}
                     helperText={errors.vaccinationDate?.message}
                     {...register("vaccinationDate")}
                  />
                  <TextField
                     label="Data de Validade *"
                     size="small"
                     type="date"
                     slotProps={{ inputLabel: { shrink: true } }}
                     error={!!errors.expirationDate}
                     helperText={errors.expirationDate?.message}
                     {...register("expirationDate")}
                  />
                  <TextField
                     label="Data da Próxima Dose"
                     size="small"
                     type="date"
                     slotProps={{ inputLabel: { shrink: true } }}
                     error={!!errors.nextDoseDate}
                     helperText={
                        errors.nextDoseDate?.message ?? "Opcional — reforço ou dose adicional"
                     }
                     {...register("nextDoseDate")}
                  />
               </Box>

               {/* ── Observações ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Observações
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1, mb: 2 }}>
                  <TextField
                     label="Reação"
                     size="small"
                     multiline
                     rows={2}
                     placeholder="Ex: Inchaço local, febre"
                     error={!!errors.reaction}
                     helperText={errors.reaction?.message ?? "Opcional — reações observadas"}
                     {...register("reaction")}
                  />
                  <TextField
                     label="Notas Adicionais"
                     size="small"
                     multiline
                     rows={2}
                     placeholder="Ex: Aplicado por Dr. João"
                     error={!!errors.notes}
                     helperText={errors.notes?.message ?? "Opcional — informações extras"}
                     {...register("notes")}
                  />
               </Box>

               {/* ── Documentação ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  Documentação
               </Typography>

               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1 }}>
                  <ImageUploader
                     value={photoUrl}
                     onChange={setPhotoUrl}
                     onUploadingChange={setIsUploadingPhoto}
                     folder="vaccinations"
                     label="Comprovante de Vacinação"
                     helperText="Foto do cartão de vacinação ou comprovante (JPEG, PNG ou WebP · Máx. 5MB)"
                     disabled={isSubmitting}
                  />

                  {/* Veterinário responsável */}
                  <Controller
                     name="veterinarianId"
                     control={control}
                     render={({ field }) => (
                        <FormControl size="small" error={!!errors.veterinarianId}>
                           <InputLabel>Veterinário</InputLabel>
                           <Select
                              {...field}
                              label="Veterinário"
                              disabled={veterinariansLoading}
                              displayEmpty
                           >
                              <MenuItem value="">Não informado</MenuItem>
                              {veterinariansLoading ? (
                                 <MenuItem disabled>
                                    <CircularProgress size={16} sx={{ mr: 1 }} /> Carregando...
                                 </MenuItem>
                              ) : (
                                 veterinarians.map(v => (
                                    <MenuItem key={v.id} value={v.id}>
                                       {v.fullName}
                                    </MenuItem>
                                 ))
                              )}
                           </Select>
                           <FormHelperText>
                              {errors.veterinarianId?.message ?? "Opcional — responsável"}
                           </FormHelperText>
                        </FormControl>
                     )}
                  />
               </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2 }}>
               <Button onClick={() => onClose(false)}>Cancelar</Button>
               <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || isUploadingPhoto}
                  startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
               >
                  {isSubmitting
                     ? "Salvando..."
                     : isUploadingPhoto
                       ? "Aguarde o upload..."
                       : isEditing
                         ? "Atualizar"
                         : "Registrar"}
               </Button>
            </DialogActions>
         </form>
      </Dialog>
   );
}
