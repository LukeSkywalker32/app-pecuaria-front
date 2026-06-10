import { zodResolver } from "@hookform/resolvers/zod";
import {
   Alert,
   Autocomplete,
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
   animalId: z.string().min(1, "Selecione um animal"),
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
export default function MoveAnimalDialog({ open, onClose }: Props) {
   const [originPastures, setOriginPastures] = useState<Pasture[]>([]);
   const [destinationPastures, setDestinationPastures] = useState<Pasture[]>([]);
   const [animals, setAnimals] = useState<Animal[]>([]);
   const [originPasturesLoading, setOriginPasturesLoading] = useState(false);
   const [destinationPasturesLoading, setDestinationPasturesLoading] = useState(false);
   const [animalsLoading, setAnimalsLoading] = useState(false);
   const [submitError, setSubmitError] = useState("");
   const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
   const [pasturesError, setPasturesError] = useState("");

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
         originPastureId: "",
         animalId: "",
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
         animalId: "",
         destinationPastureId: "",
         reason: "",
         employee: "",
         movementDate: "",
      });
      setSubmitError("");
      setAnimals([]);
      setSelectedAnimal(null);
   }, [open, reset]);

   // ── Carrega animais quando pasto de origem é selecionado ──────────────
   useEffect(() => {
      if (!originPastureId) {
         setAnimals([]);
         setSelectedAnimal(null);
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
   }, [originPastureId]);

   // ── Submit ────────────────────────────────────────────────────────────
   async function onSubmit(data: FormData) {
      setSubmitError("");
      try {
         const payload = {
            animalId: data.animalId,
            destinationPastureId: data.destinationPastureId,
            reason: data.reason.trim(),
            employee: data.employee.trim(),
            movementDate:
               data.movementDate && data.movementDate !== "" ? data.movementDate : undefined,
         };

         await api.post("/management/move", payload);
         onClose(true);
      } catch (err: any) {
         const msg =
            err?.response?.data?.error ?? "Erro ao registrar movimentação. Tente novamente.";
         setSubmitError(msg);
      }
   }

   // ─── Render ───────────────────────────────────────────────────────────
   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>Movimentar Animal</DialogTitle>

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

               {/* ── Animal (carregado após origem) ── */}
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
                        2. Animal
                     </Typography>

                     <Box sx={{ mb: 2, mt: 1 }}>
                        <Controller
                           name="animalId"
                           control={control}
                           render={({ field }) => (
                              <Autocomplete
                                 options={animals}
                                 loading={animalsLoading}
                                 value={selectedAnimal}
                                 onChange={(_, val) => {
                                    setSelectedAnimal(val);
                                    field.onChange(val?.id ?? "");
                                 }}
                                 getOptionLabel={a =>
                                    `${a.name} — Chip: ${a.chipId}${a.currentEarTag ? ` — Brinco: ${a.currentEarTag}` : ""}`
                                 }
                                 isOptionEqualToValue={(a, b) => a.id === b.id}
                                 noOptionsText={
                                    animalsLoading
                                       ? "Carregando animais..."
                                       : `Nenhum animal em ${selectedOriginPasture?.name}`
                                 }
                                 renderOption={(props, a) => (
                                    <Box component="li" {...props} key={a.id}>
                                       <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                             {a.name}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                             Chip: {a.chipId}
                                             {a.currentEarTag
                                                ? ` · Brinco: ${a.currentEarTag}`
                                                : ""}
                                          </Typography>
                                       </Box>
                                    </Box>
                                 )}
                                 renderInput={params => (
                                    <TextField
                                       {...params}
                                       size="small"
                                       label="Selecione o animal *"
                                       error={!!errors.animalId}
                                       helperText={
                                          errors.animalId?.message ??
                                          `Animais em ${selectedOriginPasture?.name}`
                                       }
                                       slotProps={{
                                          ...params.slotProps,
                                          input: {
                                             ...params.slotProps.input,
                                             endAdornment: (
                                                <>
                                                   {animalsLoading ? (
                                                      <CircularProgress color="inherit" size={16} />
                                                   ) : null}
                                                   {params.slotProps.input.endAdornment}
                                                </>
                                             ),
                                          },
                                       }}
                                    />
                                 )}
                              />
                           )}
                        />
                     </Box>
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
                  disabled={isSubmitting || !originPastureId || originPastures.length === 0}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
               >
                  {isSubmitting ? "Movimentando..." : "Movimentar"}
               </Button>
            </DialogActions>
         </form>
      </Dialog>
   );
}
