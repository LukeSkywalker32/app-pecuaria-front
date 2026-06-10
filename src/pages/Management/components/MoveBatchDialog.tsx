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

// ─── Tipos auxiliares ─────────────────────────────────────────────────────
interface Animal {
   id: string;
   name: string;
   currentEarTag: string | null;
   chipId: string;
   pastureName: string | null;
}

interface Pasture {
   id: string;
   name: string;
   currentAnimals: number;
   animalCapacity: number;
}

// ─── Schema Zod ───────────────────────────────────────────────────────────
const schema = z.object({
   originPastureId: z.string().min(1, "Selecione o pasto de origem"),
   animalIds: z
      .array(z.string())
      .min(1, "Selecione pelo menos um animal")
      .max(500, "Máximo de 500 animais por lote"),
   destinationPastureId: z.string().min(1, "Selecione um pasto de destino"),
   reason: z
      .string()
      .min(3, "Motivo deve ter pelo menos 3 caracteres")
      .max(200, "Motivo deve ter no máximo 200 caracteres"),
   employee: z
      .string()
      .min(2, "Nome do responsável deve ter pelo menos 2 caracteres")
      .max(100, "Nome do responsável deve ter no máximo 100 caracteres"),
   movementDate: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
         val => !val || new Date(val) <= new Date(),
         "Data de movimentação não pode ser futura",
      ),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────
interface Props {
   open: boolean;
   onClose: (saved: boolean) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function MoveBatchDialog({ open, onClose }: Props) {
   const [originPastures, setOriginPastures] = useState<Pasture[]>([]);
   const [destinationPastures, setDestinationPastures] = useState<Pasture[]>([]);
   const [animals, setAnimals] = useState<Animal[]>([]);
   const [originPasturesLoading, setOriginPasturesLoading] = useState(false);
   const [destinationPasturesLoading, setDestinationPasturesLoading] = useState(false);
   const [animalsLoading, setAnimalsLoading] = useState(false);
   const [submitError, setSubmitError] = useState("");
   const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
   const [pasturesError, setPasturesError] = useState("");

   const {
      control,
      register,
      handleSubmit,
      reset,
      watch,
      setValue,
      formState: { errors, isSubmitting },
   } = useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
         originPastureId: "",
         animalIds: [],
         destinationPastureId: "",
         reason: "",
         employee: "",
         movementDate: "",
      },
   });

   const originPastureId = watch("originPastureId");
   const selectedOriginPasture = originPastures.find(p => p.id === originPastureId);

   // ── Carrega pastos ao abrir ───────────────────────────────────────────
   useEffect(() => {
      if (!open) return;

      setPasturesError("");
      setOriginPasturesLoading(true);
      setDestinationPasturesLoading(true);

      // Carrega pastos de origem
      api.get<Pasture[]>("/pastures?active=true")
         .then(({ data }) => {
            if (Array.isArray(data)) {
               setOriginPastures(data);
            } else {
               setOriginPastures([]);
               setPasturesError("Formato inválido de dados de pastos.");
            }
         })
         .catch(err => {
            console.error("Erro ao carregar pastos de origem:", err);
            setOriginPastures([]);
            setPasturesError("Erro ao carregar pastos. Verifique sua conexão e permissões.");
         })
         .finally(() => setOriginPasturesLoading(false));

      // Carrega pastos de destino
      api.get<Pasture[]>("/pastures?active=true")
         .then(({ data }) => {
            if (Array.isArray(data)) {
               setDestinationPastures(data);
            } else {
               setDestinationPastures([]);
            }
         })
         .catch(err => {
            console.error("Erro ao carregar pastos de destino:", err);
            setDestinationPastures([]);
         })
         .finally(() => setDestinationPasturesLoading(false));

      reset({
         originPastureId: "",
         animalIds: [],
         destinationPastureId: "",
         reason: "",
         employee: "",
         movementDate: "",
      });
      setSubmitError("");
      setAnimals([]);
      setSelectedAnimalIds([]);
   }, [open, reset]);

   // ── Carrega animais quando pasto de origem é selecionado ──────────────
   useEffect(() => {
      if (!originPastureId) {
         setAnimals([]);
         setSelectedAnimalIds([]);
         setValue("animalIds", []);
         return;
      }

      setAnimalsLoading(true);
      api.get<Animal[]>(`/animals?status=active&pastureId=${originPastureId}`)
         .then(({ data }) => {
            if (Array.isArray(data)) {
               setAnimals(data);
            } else {
               setAnimals([]);
            }
         })
         .catch(err => {
            console.error("Erro ao carregar animais:", err);
            setAnimals([]);
         })
         .finally(() => setAnimalsLoading(false));
   }, [originPastureId, setValue]);

   // ── Alterna seleção de animal E sincroniza com hook-form ──────────────
   function toggleAnimal(animalId: string) {
      setSelectedAnimalIds(prev => {
         let updated: string[];
         if (prev.includes(animalId)) {
            updated = prev.filter(id => id !== animalId);
         } else {
            updated = [...prev, animalId];
         }
         // Sincroniza com hook-form
         setValue("animalIds", updated);
         return updated;
      });
   }

   // ── Seleciona/Deseleciona todos E sincroniza com hook-form ─────────────
   function toggleAll() {
      let updated: string[];
      if (selectedAnimalIds.length === animals.length) {
         updated = [];
      } else {
         updated = animals.map(a => a.id);
      }
      setSelectedAnimalIds(updated);
      // Sincroniza com hook-form
      setValue("animalIds", updated);
   }

   // ── Submit ────────────────────────────────────────────────────────────
   async function onSubmit(data: FormData) {
      setSubmitError("");
      try {
         // Validação adicional: verificar IDs duplicados
         const uniqueIds = new Set(selectedAnimalIds);
         if (uniqueIds.size !== selectedAnimalIds.length) {
            setSubmitError("Lista contém IDs duplicados");
            return;
         }

         const payload = {
            animalIds: selectedAnimalIds,
            destinationPastureId: data.destinationPastureId,
            reason: data.reason.trim(),
            employee: data.employee.trim(),
            movementDate:
               data.movementDate && data.movementDate !== "" ? data.movementDate : undefined,
         };

         await api.post("/management/move-batch", payload);
         onClose(true);
      } catch (err: any) {
         const msg =
            err?.response?.data?.error ??
            "Erro ao registrar movimentação em lote. Tente novamente.";
         setSubmitError(msg);
      }
   }

   // ─── Render ───────────────────────────────────────────────────────────
   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>Movimentar Lote de Animais</DialogTitle>

         <Divider />

         <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent sx={{ pt: 2 }}>
               {submitError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                     {submitError}
                  </Alert>
               )}

               {pasturesError && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                     {pasturesError}
                  </Alert>
               )}

               {/* ── Pasto de Origem ── */}
               <Typography
                  variant="caption"
                  sx={{
                     fontWeight: 700,
                     color: "text.secondary",
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  1. Pasto de Origem
               </Typography>

               <Box sx={{ mb: 2, mt: 1 }}>
                  <Controller
                     name="originPastureId"
                     control={control}
                     render={({ field }) => (
                        <FormControl fullWidth size="small" error={!!errors.originPastureId}>
                           <InputLabel>Selecione o pasto onde estão os animais *</InputLabel>
                           <Select
                              {...field}
                              label="Selecione o pasto onde estão os animais *"
                              disabled={originPasturesLoading || originPastures.length === 0}
                              displayEmpty
                           >
                              {originPasturesLoading ? (
                                 <MenuItem disabled>
                                    <CircularProgress size={16} sx={{ mr: 1 }} /> Carregando...
                                 </MenuItem>
                              ) : originPastures.length === 0 ? (
                                 <MenuItem disabled>Nenhum pasto ativo</MenuItem>
                              ) : (
                                 originPastures.map(p => (
                                    <MenuItem key={p.id} value={p.id}>
                                       {p.name} ({p.currentAnimals} animais)
                                    </MenuItem>
                                 ))
                              )}
                           </Select>
                           <FormHelperText>
                              {errors.originPastureId?.message ?? "Escolha o pasto de origem"}
                           </FormHelperText>
                        </FormControl>
                     )}
                  />
               </Box>

               {/* ── Seleção de Animais (carregado após origem) ── */}
               {originPastureId && (
                  <>
                     <Box
                        sx={{
                           display: "flex",
                           justifyContent: "space-between",
                           alignItems: "center",
                           mb: 1,
                        }}
                     >
                        <Typography
                           variant="caption"
                           sx={{
                              fontWeight: 700,
                              color: "text.secondary",
                              textTransform: "uppercase",
                              letterSpacing: 0.8,
                           }}
                        >
                           2. Animais ({selectedAnimalIds.length} selecionados)
                        </Typography>
                        {animals.length > 0 && (
                           <Button
                              size="small"
                              onClick={toggleAll}
                              sx={{
                                 textTransform: "none",
                                 fontSize: 12,
                                 color: "primary.main",
                                 fontWeight: 600,
                              }}
                           >
                              {selectedAnimalIds.length === animals.length
                                 ? "Desselecionar todos"
                                 : "Selecionar todos"}
                           </Button>
                        )}
                     </Box>

                     <Box
                        sx={{
                           border: "1px solid",
                           borderColor: "divider",
                           borderRadius: 1,
                           p: 1.5,
                           mb: 2,
                           maxHeight: 240,
                           overflowY: "auto",
                           bgcolor: "background.paper",
                        }}
                     >
                        {animalsLoading ? (
                           <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                              <CircularProgress size={24} />
                           </Box>
                        ) : animals.length === 0 ? (
                           <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ textAlign: "center", py: 2 }}
                           >
                              Nenhum animal em {selectedOriginPasture?.name}
                           </Typography>
                        ) : (
                           <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              {animals.map(animal => (
                                 <Box
                                    key={animal.id}
                                    onClick={() => toggleAnimal(animal.id)}
                                    sx={{
                                       p: 1,
                                       borderRadius: 1,
                                       bgcolor: selectedAnimalIds.includes(animal.id)
                                          ? "primary.light"
                                          : "background.paper",
                                       border: "1px solid",
                                       borderColor: selectedAnimalIds.includes(animal.id)
                                          ? "primary.main"
                                          : "divider",
                                       cursor: "pointer",
                                       transition: "all 0.2s",
                                       "&:hover": {
                                          bgcolor: selectedAnimalIds.includes(animal.id)
                                             ? "primary.light"
                                             : "#F5F5F5",
                                       },
                                    }}
                                 >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                       <Box
                                          sx={{
                                             width: 20,
                                             height: 20,
                                             border: "2px solid",
                                             borderColor: selectedAnimalIds.includes(animal.id)
                                                ? "primary.main"
                                                : "divider",
                                             borderRadius: 0.5,
                                             bgcolor: selectedAnimalIds.includes(animal.id)
                                                ? "primary.main"
                                                : "transparent",
                                             display: "flex",
                                             alignItems: "center",
                                             justifyContent: "center",
                                          }}
                                       >
                                          {selectedAnimalIds.includes(animal.id) && (
                                             <Typography
                                                sx={{
                                                   color: "white",
                                                   fontSize: 12,
                                                   fontWeight: 700,
                                                }}
                                             >
                                                ✓
                                             </Typography>
                                          )}
                                       </Box>
                                       <Box sx={{ flex: 1 }}>
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                             {animal.name}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                             Chip: {animal.chipId}
                                             {animal.currentEarTag
                                                ? ` · Brinco: ${animal.currentEarTag}`
                                                : ""}
                                          </Typography>
                                       </Box>
                                    </Box>
                                 </Box>
                              ))}
                           </Box>
                        )}
                     </Box>

                     {errors.animalIds && (
                        <FormHelperText error sx={{ mb: 2 }}>
                           {errors.animalIds.message}
                        </FormHelperText>
                     )}
                  </>
               )}

               {/* ── Pasto de Destino ── */}
               {originPastureId && (
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
                        3. Pasto de Destino
                     </Typography>

                     <Box sx={{ mb: 2, mt: 1 }}>
                        <Controller
                           name="destinationPastureId"
                           control={control}
                           render={({ field }) => (
                              <FormControl
                                 fullWidth
                                 size="small"
                                 error={!!errors.destinationPastureId}
                              >
                                 <InputLabel>Selecione o pasto de destino *</InputLabel>
                                 <Select
                                    {...field}
                                    label="Selecione o pasto de destino *"
                                    disabled={
                                       destinationPasturesLoading ||
                                       destinationPastures.length === 0
                                    }
                                    displayEmpty
                                 >
                                    {destinationPasturesLoading ? (
                                       <MenuItem disabled>
                                          <CircularProgress size={16} sx={{ mr: 1 }} />{" "}
                                          Carregando...
                                       </MenuItem>
                                    ) : destinationPastures.length === 0 ? (
                                       <MenuItem disabled>Nenhum pasto ativo</MenuItem>
                                    ) : (
                                       destinationPastures.map(p => (
                                          <MenuItem key={p.id} value={p.id}>
                                             {p.name} ({p.currentAnimals}/{p.animalCapacity})
                                          </MenuItem>
                                       ))
                                    )}
                                 </Select>
                                 <FormHelperText>
                                    {errors.destinationPastureId?.message ??
                                       "Selecione o pasto de destino"}
                                 </FormHelperText>
                              </FormControl>
                           )}
                        />
                     </Box>
                  </>
               )}

               {/* ── Motivo e Responsável ── */}
               {originPastureId && (
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
                        4. Informações da Movimentação
                     </Typography>

                     <Box
                        sx={{
                           display: "grid",
                           gridTemplateColumns: "1fr 1fr",
                           gap: 2,
                           mt: 1,
                           mb: 2,
                        }}
                     >
                        <TextField
                           label="Motivo *"
                           size="small"
                           placeholder="Ex: Rotação de pastos"
                           error={!!errors.reason}
                           helperText={errors.reason?.message}
                           {...register("reason")}
                        />
                        <TextField
                           label="Responsável *"
                           size="small"
                           placeholder="Ex: João Silva"
                           error={!!errors.employee}
                           helperText={errors.employee?.message}
                           {...register("employee")}
                        />
                     </Box>

                     {/* ── Data da Movimentação ── */}
                     <Typography
                        variant="caption"
                        sx={{
                           fontWeight: 700,
                           color: "text.secondary",
                           textTransform: "uppercase",
                           letterSpacing: 0.8,
                        }}
                     >
                        Data
                     </Typography>

                     <Box sx={{ mt: 1 }}>
                        <TextField
                           fullWidth
                           label="Data da Movimentação"
                           size="small"
                           type="date"
                           slotProps={{
                              inputLabel: { shrink: true },
                              htmlInput: { max: new Date().toISOString().split("T")[0] },
                           }}
                           error={!!errors.movementDate}
                           helperText={
                              errors.movementDate?.message ??
                              "Se não informada, será usada a data de hoje"
                           }
                           {...register("movementDate")}
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
                  disabled={
                     isSubmitting ||
                     selectedAnimalIds.length === 0 ||
                     !originPastureId ||
                     originPastures.length === 0
                  }
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
               >
                  {isSubmitting ? "Movimentando..." : `Movimentar ${selectedAnimalIds.length}`}
               </Button>
            </DialogActions>
         </form>
      </Dialog>
   );
}
