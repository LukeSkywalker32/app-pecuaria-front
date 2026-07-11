import { zodResolver } from "@hookform/resolvers/zod";
import DeleteIcon from "@mui/icons-material/Delete";
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
   IconButton,
   InputLabel,
   MenuItem,
   Select,
   TextField,
   Tooltip,
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
   photos: string[] | null;
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

// ─── Constantes ───────────────────────────────────────────────────────────

const MAX_PHOTOS = 3;

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

   // Lista de URLs das fotos — gerenciada fora do react-hook-form
   // porque cada upload é assíncrono e independente.
   const [photos, setPhotos] = useState<string[]>([]);
   // Rastreia se o ImageUploader está no meio de um upload, pra travar
   // o botão de salvar e evitar registrar o formulário sem a foto.
   const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
   // URL da foto original (já salva no banco) que está sendo removida agora,
   // pra desabilitar o botão específico e mostrar um spinner nela.
   const [removingPhotoUrl, setRemovingPhotoUrl] = useState<string | null>(null);

   // Controla se o ImageUploader "vazio" está visível para adicionar mais fotos
   // Só mostramos quando ainda há espaço (< MAX_PHOTOS)
   const canAddMore = photos.length < MAX_PHOTOS;

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
         // Restaura as fotos existentes no estado separado
         setPhotos(vaccination.photos ?? []);
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
         setPhotos([]);
         setIsUploadingPhoto(false);
      }
      setSubmitError("");
   }, [open, vaccination, reset]);

   // ── Handlers de fotos ─────────────────────────────────────────────────

   // Chamado pelo ImageUploader quando um upload é concluído com sucesso.
   // Recebe a URL retornada pelo Cloudinary e acrescenta à lista.
   function handlePhotoUploaded(url: string | null) {
      if (!url) return;
      setPhotos(prev => [...prev, url]);
   }

   // Remove uma foto NOVA (adicionada nesta sessão, ainda não persistida).
   // Como ela nunca foi enviada ao backend, basta tirar do array local.
   function handleRemoveNewPhoto(index: number) {
      setPhotos(prev => prev.filter((_, i) => i !== index));
   }

   // Remove uma foto ORIGINAL (já salva no banco) chamando o endpoint real
   // de remoção. Só depois da confirmação do backend é que tiramos do estado local.
   async function handleRemoveOriginalPhoto(url: string) {
      if (!vaccination) return;
      setRemovingPhotoUrl(url);
      setSubmitError("");
      try {
         await api.delete(`/vaccinations/${vaccination.id}/photos`, {
            data: { photoUrl: url },
         });
         setPhotos(prev => prev.filter(u => u !== url));
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao remover foto. Tente novamente.";
         setSubmitError(msg);
      } finally {
         setRemovingPhotoUrl(null);
      }
   }

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
            reaction: data.reaction && data.reaction !== "" ? data.reaction.trim() : null,
            notes: data.notes && data.notes !== "" ? data.notes.trim() : null,
            veterinarianId:
               data.veterinarianId && data.veterinarianId !== "" ? data.veterinarianId : null,
         };

         if (isEditing) {
            // 1. Atualiza os campos textuais (sem fotos)
            const { animalId, ...updatePayload } = payload;
            await api.put(`/vaccinations/${vaccination!.id}`, updatePayload);

            // 2. Se há fotos novas além das que já existiam no banco, envia via addPhotos.
            // Compara com as fotos originais para enviar apenas as novas.
            const originalPhotos = vaccination!.photos ?? [];
            const newPhotos = photos.filter(url => !originalPhotos.includes(url));
            if (newPhotos.length > 0) {
               await api.patch(`/vaccinations/${vaccination!.id}/photos`, {
                  photoUrls: newPhotos,
               });
            }
         } else {
            // No create, envia as fotos já acumuladas no array
            await api.post("/vaccinations", {
               ...payload,
               photos: photos.length > 0 ? photos : undefined,
            });
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
                  Fotos ({photos.length}/{MAX_PHOTOS})
               </Typography>

               <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
               >
                  {isEditing
                     ? "Adicione novas fotos ou remova as existentes — a remoção é imediata."
                     : "Foto do cartão de vacinação ou comprovante. JPEG, PNG ou WebP · Máx. 5MB por foto."}
               </Typography>

               {/* Grid de fotos já carregadas */}
               {photos.length > 0 && (
                  <Box
                     sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 1,
                        mb: 1.5,
                     }}
                  >
                     {photos.map((url, index) => {
                        // Em modo edição, fotos originais do banco não podem ser removidas
                        // localmente (backend é append-only para photos). Novas fotos
                        // adicionadas nesta sessão podem ser descartadas antes do submit.
                        const isOriginal = isEditing && (vaccination?.photos ?? []).includes(url);

                        return (
                           <Box
                              key={url}
                              sx={{
                                 position: "relative",
                                 borderRadius: 1.5,
                                 overflow: "hidden",
                                 border: "1px solid",
                                 borderColor: "divider",
                                 aspectRatio: "1",
                              }}
                           >
                              <Box
                                 component="img"
                                 src={url}
                                 alt={`Foto ${index + 1}`}
                                 sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                 }}
                              />
                              {/* Botão de remover — fotos novas removem só localmente,
                                  fotos originais chamam a API de remoção real */}
                              <Box
                                 sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    bgcolor: "rgba(0,0,0,0.55)",
                                    borderRadius: 1,
                                 }}
                              >
                                 <Tooltip title="Remover foto">
                                    <IconButton
                                       size="small"
                                       onClick={() =>
                                          isOriginal
                                             ? handleRemoveOriginalPhoto(url)
                                             : handleRemoveNewPhoto(index)
                                       }
                                       sx={{ color: "white", p: 0.4 }}
                                       disabled={isSubmitting || removingPhotoUrl === url}
                                    >
                                       {removingPhotoUrl === url ? (
                                          <CircularProgress size={14} sx={{ color: "white" }} />
                                       ) : (
                                          <DeleteIcon sx={{ fontSize: 16 }} />
                                       )}
                                    </IconButton>
                                 </Tooltip>
                              </Box>
                              {/* Badge "salva" para fotos do banco, só informativo agora */}
                              {isOriginal && (
                                 <Box
                                    sx={{
                                       position: "absolute",
                                       bottom: 0,
                                       left: 0,
                                       right: 0,
                                       bgcolor: "rgba(0,0,0,0.45)",
                                       py: 0.25,
                                       textAlign: "center",
                                    }}
                                 >
                                    <Typography
                                       variant="caption"
                                       sx={{ color: "white", fontSize: 10 }}
                                    >
                                       Salva
                                    </Typography>
                                 </Box>
                              )}
                           </Box>
                        );
                     })}
                  </Box>
               )}

               {/* ImageUploader para adicionar nova foto — só aparece se ainda há espaço */}
               {canAddMore && (
                  <ImageUploader
                     value={null}
                     onChange={handlePhotoUploaded}
                     onUploadingChange={setIsUploadingPhoto}
                     folder="vaccinations"
                     label=""
                     helperText={`${MAX_PHOTOS - photos.length} foto(s) restante(s)`}
                     disabled={isSubmitting}
                  />
               )}

               {/* Aviso quando o limite foi atingido */}
               {!canAddMore && (
                  <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                     Limite de {MAX_PHOTOS} fotos atingido.
                  </Alert>
               )}

               {/* ── Veterinário responsável ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                     display: "block",
                     mt: 2,
                  }}
               >
                  Responsável
               </Typography>

               <Box sx={{ mt: 1 }}>
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
