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
   InputAdornment,
   InputLabel,
   MenuItem,
   Select,
   TextField,
   Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import api from "@/services/api";
import { PastureFormDialog } from "../../Pasture/PasturesPage";
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

interface Breed {
   id: string;
   name: string;
   active: boolean;
}

// ─── Schema Zod ───────────────────────────────────────────────────────────
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
   // Raça agora é o nome da raça selecionada (string obrigatória)
   breed: z.string().min(1, "Selecione uma raça"),
   gender: z.enum(["M", "F"], { message: "Sexo é obrigatório" }),
   birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
   origin: z.enum(["born", "purchased"]),
   pastureId: z.string().optional().or(z.literal("")),
   status: z.enum(["active", "quarantine", "treatment", "dead", "sold"]).optional(),
   weightKg: z
      .string()
      .optional()
      .refine(
         val => !val || (!Number.isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 9999),
         { message: "Informe um peso válido entre 1 e 9999 kg" },
      ),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────
interface Props {
   open: boolean;
   animal: AnimalResponse | null;
   onClose: (saved: boolean) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function AnimalFormDialog({ open, animal, onClose }: Props) {
   const isEditing = !!animal;

   const [pastures, setPastures] = useState<Pasture[]>([]);
   const [breeds, setBreeds] = useState<Breed[]>([]);
   const [pasturesLoading, setPasturesLoading] = useState(false);
   const [breedsLoading, setBreedsLoading] = useState(false);
   const [submitError, setSubmitError] = useState("");
   // Dialogo (empilhado) pra criar o pasto de quarentena sem fechar este formulario
   const [createPastureOpen, setCreatePastureOpen] = useState(false);

   const {
      control,
      register,
      handleSubmit,
      watch,
      reset,
      setValue,
      formState: { errors, isSubmitting },
   } = useForm<FormData>({
      resolver: zodResolver(schema),
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
         weightKg: "",
      },
   });

   const originValue = watch("origin");
   const pastureIdValue = watch("pastureId");
   // Pasto de quarentena já cadastrado e ativo na fazenda, se existir
   const quarantinePasture = pastures.find(p => p.type === "quarantine") ?? null;

   // Busca os pastos ativos da fazenda — extraído em função pra poder
   // recarregar depois de criar um novo pasto de quarentena sem fechar o diálogo.
   const loadPastures = useCallback(async () => {
      setPasturesLoading(true);
      try {
         const { data } = await api.get<Pasture[]>("/pastures?active=true");
         setPastures(data);
         return data;
      } catch {
         setPastures([]);
         return [] as Pasture[];
      } finally {
         setPasturesLoading(false);
      }
   }, []);

   // ── Carrega pastos e raças ao abrir ───────────────────────────────────
   useEffect(() => {
      if (!open) return;

      loadPastures();

      // Raças ativas (ordenadas por nome — já vêm ordenadas da API)
      setBreedsLoading(true);
      api.get<Breed[]>("/breeds?active=true")
         .then(({ data }) => setBreeds(data))
         .catch(() => setBreeds([]))
         .finally(() => setBreedsLoading(false));
   }, [open, loadPastures]);

   // Quando o usuário marca a origem como "Comprado" e existe um pasto de
   // quarentena cadastrado, vincula automaticamente — sem sobrescrever se o
   // usuário já tiver escolhido outro pasto manualmente.
   async function handleOriginChange(value: "born" | "purchased") {
      if (value === "purchased" && !pastureIdValue) {
         const current =
            quarantinePasture ?? (await loadPastures()).find(p => p.type === "quarantine");
         if (current) setValue("pastureId", current.id);
      }
   }

   // Chamado ao fechar o diálogo (empilhado) de criação do pasto de quarentena
   async function handlePastureCreated(saved: boolean) {
      setCreatePastureOpen(false);
      if (!saved) return;
      const updated = await loadPastures();
      const created = updated.find(p => p.type === "quarantine");
      if (created) setValue("pastureId", created.id);
   }

   // ── Preenche formulário no modo edição ───────────────────────────────
   useEffect(() => {
      if (open && animal) {
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
            origin: animal.origin ?? "born",
            pastureId: animal.pastureId ?? "",
            status: (["active", "quarantine", "treatment", "dead", "sold"].includes(animal.status)
               ? animal.status
               : "active") as FormData["status"],
            weightKg: animal.weightKg != null ? String(animal.weightKg) : "",
         });
      } else if (open && !animal) {
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
            weightKg: "",
         });
      }
      setSubmitError("");
   }, [open, animal, reset]);

   // ── Submit ────────────────────────────────────────────────────────────
   async function onSubmit(data: FormData) {
      setSubmitError("");
      try {
         const weightKg =
            data.weightKg && data.weightKg.trim() !== "" ? Number(data.weightKg) : undefined;

         const payload = {
            ...data,
            currentEarTag: data.currentEarTag || undefined,
            pastureId: data.pastureId || undefined,
            weightKg,
         };

         if (isEditing) {
            const { chipId, origin, ...updatePayload } = payload;

            // Se o status remove o animal do pasto (vendido ou morto),
            // não enviar pastureId para evitar conflito no backend entre
            // campo escalar e operação de relação (pasture.disconnect)
            const statusExitsPasture =
               updatePayload.status === "sold" || updatePayload.status === "dead";
            if (statusExitsPasture) {
               delete updatePayload.pastureId;
            }

            await api.put(`/animals/${animal!.id}`, updatePayload);
         } else {
            await api.post("/animals", payload);
         }

         onClose(true);
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

         <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent sx={{ pt: 2 }}>
               {submitError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                     {submitError}
                  </Alert>
               )}

               {/* ── Identificação ── */}
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
                  <TextField
                     label="Chip ID *"
                     size="small"
                     disabled={isEditing}
                     error={!!errors.chipId}
                     helperText={
                        errors.chipId?.message ?? (isEditing ? "Não editável" : "Ex: CHIP-T001")
                     }
                     {...register("chipId")}
                  />
                  <TextField
                     label="Brinco"
                     size="small"
                     error={!!errors.currentEarTag}
                     helperText={errors.currentEarTag?.message ?? "Ex: BR-T001"}
                     {...register("currentEarTag")}
                  />
               </Box>

               {/* ── Dados do Animal ── */}
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

                  {/* Raça — SELECT via API */}
                  <Controller
                     name="breed"
                     control={control}
                     render={({ field }) => (
                        <FormControl size="small" error={!!errors.breed}>
                           <InputLabel>Raça *</InputLabel>
                           <Select {...field} label="Raça *" disabled={breedsLoading} displayEmpty>
                              {breedsLoading ? (
                                 <MenuItem disabled>
                                    <CircularProgress size={16} sx={{ mr: 1 }} /> Carregando...
                                 </MenuItem>
                              ) : breeds.length === 0 ? (
                                 <MenuItem disabled>Nenhuma raça cadastrada</MenuItem>
                              ) : (
                                 breeds.map(b => (
                                    <MenuItem key={b.id} value={b.name}>
                                       {b.name}
                                    </MenuItem>
                                 ))
                              )}
                           </Select>
                           <FormHelperText>
                              {errors.breed?.message ?? "Selecione a raça do animal"}
                           </FormHelperText>
                        </FormControl>
                     )}
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

                  {/* Data de nascimento */}
                  <TextField
                     label="Data de Nascimento *"
                     size="small"
                     type="date"
                     slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { max: new Date().toISOString().split("T")[0] },
                     }}
                     error={!!errors.birthDate}
                     helperText={errors.birthDate?.message}
                     {...register("birthDate")}
                  />

                  {/* Peso */}
                  <TextField
                     label="Peso"
                     size="small"
                     type="number"
                     slotProps={{
                        input: {
                           endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                        },
                        htmlInput: { min: 1, max: 9999, step: 0.1 },
                     }}
                     error={!!errors.weightKg}
                     helperText={errors.weightKg?.message ?? "Opcional — atualize após pesagem"}
                     {...register("weightKg")}
                  />
               </Box>

               {/* ── Origem e Localização ── */}
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
                  <Controller
                     name="origin"
                     control={control}
                     render={({ field }) => (
                        <FormControl size="small" disabled={isEditing}>
                           <InputLabel>Origem *</InputLabel>
                           <Select
                              {...field}
                              label="Origem *"
                              onChange={e => {
                                 field.onChange(e);
                                 handleOriginChange(e.target.value as "born" | "purchased");
                              }}
                           >
                              <MenuItem value="born">Nascido na fazenda</MenuItem>
                              <MenuItem value="purchased">Comprado</MenuItem>
                           </Select>
                           {isEditing && <FormHelperText>Não editável</FormHelperText>}
                        </FormControl>
                     )}
                  />

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

               {originValue === "purchased" && !pasturesLoading && (
                  <>
                     {quarantinePasture && pastureIdValue === quarantinePasture.id && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                           Vinculado automaticamente ao pasto de quarentena{" "}
                           <strong>{quarantinePasture.name}</strong>. Status será definido como{" "}
                           <strong>Quarentena</strong>.
                        </Alert>
                     )}
                     {!quarantinePasture && (
                        <Alert
                           severity="warning"
                           sx={{ mt: 1 }}
                           action={
                              <Button
                                 color="inherit"
                                 size="small"
                                 onClick={() => setCreatePastureOpen(true)}
                              >
                                 Criar pasto de quarentena
                              </Button>
                           }
                        >
                           Nenhum pasto de quarentena cadastrado nesta fazenda. Crie um agora ou
                           selecione outro pasto existente acima.
                        </Alert>
                     )}
                  </>
               )}

               <PastureFormDialog
                  open={createPastureOpen}
                  pasture={null}
                  defaultType="quarantine"
                  onClose={handlePastureCreated}
               />

               {/* ── Status ── */}
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
                              {isEditing
                                 ? "Morto ou vendido: use os módulos Mortalidade / Venda"
                                 : "A categoria (Vaca, Touro, Novilha...) é definida automaticamente pela idade e sexo"}
                           </FormHelperText>
                        </FormControl>
                     )}
                  />
               </Box>
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
                  sx={{ px: 3 }}
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
