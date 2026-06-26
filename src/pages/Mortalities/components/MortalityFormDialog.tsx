// src/pages/Mortalities/components/MortalityFormDialog.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
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
   })
   .refine(
      data => {
         if (!data.deathDate) return true;
         return new Date(data.deathDate) <= new Date();
      },
      { message: "Data da morte não pode ser futura", path: ["deathDate"] },
   );

type FormData = z.infer<typeof schema>;

// ─── Constantes ───────────────────────────────────────────────────────────

const MAX_PHOTOS = 10;

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
         deathDate: "",
         deathTime: "",
         deathLocation: "",
         causeOfDeath: "",
         severity: "",
         necropsy: false,
         disposal: "",
         notes: "",
      },
   });

   // ── Carrega animais ativos ao abrir ───────────────────────────────────

   useEffect(() => {
      if (!open) return;
      setAnimalsLoading(true);
      api.get<Animal[]>("/animals?status=active")
         .then(({ data }) => setAnimals(data))
         .catch(() => setAnimals([]))
         .finally(() => setAnimalsLoading(false));
   }, [open]);

   // ── Preenche formulário no modo edição ───────────────────────────────

   useEffect(() => {
      if (open && mortality) {
         reset({
            animalId: mortality.animalId,
            deathDate: mortality.deathDate
               ? new Date(mortality.deathDate).toISOString().split("T")[0]
               : "",
            deathTime: mortality.deathTime ?? "",
            deathLocation: mortality.deathLocation,
            causeOfDeath: mortality.causeOfDeath,
            severity: mortality.severity ?? "",
            necropsy: mortality.necropsy,
            disposal: mortality.disposal ?? "",
            notes: mortality.notes ?? "",
         });
         // Carrega as fotos existentes no estado separado
         setPhotos(mortality.photos ?? []);
         setIsUploadingPhoto(false);
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
         });
         setPhotos([]);
         setIsUploadingPhoto(false);
      }
      setSubmitError("");
   }, [open, mortality, reset]);

   // ── Handlers de fotos ─────────────────────────────────────────────────

   // Chamado pelo ImageUploader quando um upload é concluído com sucesso.
   // Recebe a URL retornada pelo Cloudinary e acrescenta à lista.
   function handlePhotoUploaded(url: string | null) {
      if (!url) return;
      setPhotos(prev => [...prev, url]);
   }

   // Remove uma foto da lista pelo índice.
   // Remove uma foto NOVA (adicionada nesta sessão, ainda não persistida).
   // Como ela nunca foi enviada ao backend, basta tirar do array local.
   function handleRemoveNewPhoto(index: number) {
      setPhotos(prev => prev.filter((_, i) => i !== index));
   }

   // Remove uma foto ORIGINAL (já salva no banco) chamando o endpoint real
   // de remoção. Só depois da confirmação do backend é que tiramos do estado local.
   async function handleRemoveOriginalPhoto(url: string) {
      if (!mortality) return;
      setRemovingPhotoUrl(url);
      setSubmitError("");
      try {
         await api.delete(`/mortalities/${mortality.id}/photos`, {
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
            deathDate: data.deathDate,
            deathTime: data.deathTime && data.deathTime !== "" ? data.deathTime : undefined,
            deathLocation: data.deathLocation.trim(),
            causeOfDeath: data.causeOfDeath.trim(),
            severity: data.severity || undefined,
            necropsy: data.necropsy ?? false,
            disposal: data.disposal?.trim() || undefined,
            notes: data.notes?.trim() || undefined,
         };

         if (isEditing) {
            // 1. Atualiza os campos textuais
            const { animalId, ...updatePayload } = payload;
            await api.put(`/mortalities/${mortality!.id}`, updatePayload);

            // 2. Se há fotos novas além das que já existiam no banco, envia via addPhotos.
            // Compara com as fotos originais para enviar apenas as novas.
            const originalPhotos = mortality!.photos ?? [];
            const newPhotos = photos.filter(url => !originalPhotos.includes(url));
            if (newPhotos.length > 0) {
               await api.patch(`/mortalities/${mortality!.id}/photos`, {
                  photoUrls: newPhotos,
               });
            }
         } else {
            // No create, envia as fotos já acumuladas no array
            await api.post("/mortalities", {
               ...payload,
               photos: photos.length > 0 ? photos : undefined,
            });
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

               {/* ── Destinação e Notas ── */}
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

               {/* ── Fotos ── */}
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
                     : "Adicione fotos do caso (necrópsia, local, etc.). JPEG, PNG ou WebP · Máx. 5MB por foto."}
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
                        // (backend é append-only para photos). Novas fotos adicionadas
                        // nesta sessão podem ser descartadas antes do submit.
                        const isOriginal = isEditing && (mortality?.photos ?? []).includes(url);

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
                     folder="mortalities"
                     label=""
                     helperText={`${MAX_PHOTOS - photos.length} foto(s) restante(s)`}
                     disabled={isSubmitting}
                  />
               )}

               {/* Aviso quando o limite foi atingido */}
               {!canAddMore && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                     Limite de {MAX_PHOTOS} fotos atingido.
                  </Alert>
               )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2 }}>
               <Button onClick={() => onClose(false)}>Cancelar</Button>
               <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || isUploadingPhoto}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
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
