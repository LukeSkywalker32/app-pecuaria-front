import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import BabyChangingStationIcon from "@mui/icons-material/BabyChangingStation";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import FilterListIcon from "@mui/icons-material/FilterList";
import HistoryIcon from "@mui/icons-material/History";
import MonitorWeightIcon from "@mui/icons-material/MonitorWeight";
import SearchIcon from "@mui/icons-material/Search";
import {
   Alert,
   Autocomplete,
   Avatar,
   Box,
   Button,
   Chip,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   Divider,
   FormControl,
   Grid,
   IconButton,
   InputAdornment,
   InputLabel,
   MenuItem,
   Paper,
   Select,
   Skeleton,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   TextField,
   Tooltip,
   Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import api from "@/services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────

type BirthType = "normal" | "assisted" | "c_section";
type BirthSituation = "normal" | "dead";
type CalfStatus = "pending" | "complete";
type Gender = "M" | "F";

interface BirthResponse {
   id: string;
   farmId: string;
   damId: string;
   damEarTag: string | null;
   damName: string | null;
   attemptId: string | null;
   birthDate: string;
   birthTime: string | null;
   birthType: BirthType;
   situation: BirthSituation;
   deathReason: string | null;
   calfGender: Gender | null;
   calfWeight: number | null;
   calfEarTag: string | null;
   calfChip: string | null;
   calfStatus: CalfStatus;
   calfAnimalId: string | null;
   notes: string | null;
   veterinarianId: string | null;
   veterinarianName: string | null;
   createdAt: string;
   updatedAt: string;
}

interface AnimalOption {
   id: string;
   name: string;
   chipId: string;
   currentEarTag: string | null;
}

interface VeterinarianOption {
   id: string;
   fullName: string;
}

interface PregnancyAttemptOption {
   id: string;
   number: number;
   matingDate: string;
   animalName: string | null;
   animalEarTag: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
   if (!iso) return "—";
   return new Date(iso).toLocaleDateString("pt-BR");
}

const BIRTH_TYPE_CONFIG: Record<BirthType, { label: string; color: string }> = {
   normal: { label: "Normal", color: "#10B981" },
   assisted: { label: "Assistido", color: "#F59E0B" },
   c_section: { label: "Cesárea", color: "#EF4444" },
};

const SITUATION_CONFIG: Record<
   BirthSituation,
   { label: string; color: any; icon: React.ReactNode }
> = {
   normal: {
      label: "Normal",
      color: "success",
      icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
   },
   dead: {
      label: "Natimorto",
      color: "error",
      icon: <CancelIcon sx={{ fontSize: 14 }} />,
   },
};

// ─── Card de Resumo ───────────────────────────────────────────────────────

interface SummaryCardProps {
   title: string;
   value: number | string;
   subtitle?: string;
   icon: React.ReactNode;
   color: string;
   loading?: boolean;
   alert?: boolean;
}

function SummaryCard({ title, value, subtitle, icon, color, loading, alert }: SummaryCardProps) {
   return (
      <Paper
         elevation={0}
         sx={{
            border: "1px solid",
            borderColor: alert ? "warning.300" : "divider",
            bgcolor: alert ? "#FFFBEB" : "background.paper",
            borderRadius: 3,
            p: 2.5,
            flex: 1,
            position: "relative",
            overflow: "hidden",
            minWidth: 200,
         }}
      >
         <Box
            sx={{
               position: "absolute",
               top: -20,
               right: -20,
               width: 100,
               height: 100,
               borderRadius: "50%",
               bgcolor: color,
               opacity: 0.06,
            }}
         />
         <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box>
               <Typography
                  variant="caption"
                  sx={{
                     color: alert ? "warning.dark" : "text.secondary",
                     fontWeight: 700,
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  {title}
               </Typography>
               {loading ? (
                  <Skeleton width={60} height={48} />
               ) : (
                  <Typography
                     variant="h3"
                     sx={{
                        fontWeight: 800,
                        color: alert ? "warning.dark" : "text.primary",
                        lineHeight: 1.1,
                        mt: 0.5,
                     }}
                  >
                     {value}
                  </Typography>
               )}
               {subtitle && !loading && (
                  <Typography
                     variant="caption"
                     color={alert ? "warning.dark" : "text.secondary"}
                     sx={{ mt: 0.5, display: "block" }}
                  >
                     {subtitle}
                  </Typography>
               )}
            </Box>
            <Avatar
               sx={{ bgcolor: alert ? "#F59E0B" : color, width: 48, height: 48, borderRadius: 2 }}
            >
               {icon}
            </Avatar>
         </Box>
      </Paper>
   );
}

// ─── Dialog: Detalhes do Parto ───────────────────────────────────────────

interface BirthDetailsDialogProps {
   open: boolean;
   birth: BirthResponse | null;
   onClose: () => void;
}

function BirthDetailsDialog({ open, birth, onClose }: BirthDetailsDialogProps) {
   if (!birth) return null;

   const sitCfg = SITUATION_CONFIG[birth.situation];
   const typeCfg = BIRTH_TYPE_CONFIG[birth.birthType];

   return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <HistoryIcon sx={{ color: "primary.main" }} />
               Detalhes do Parto
            </Box>
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ mb: 4 }}>
               <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, textTransform: "uppercase", mb: 1, display: "block" }}
               >
                  Mãe do Bezerro
               </Typography>
               <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#F9FAFB" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                     <Avatar sx={{ bgcolor: "primary.main" }}>{birth.damName?.charAt(0)}</Avatar>
                     <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                           {birth.damName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                           Brinco: {birth.damEarTag || "Não informado"}
                        </Typography>
                     </Box>
                  </Box>
               </Paper>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
               <Grid size={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                     <CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                     <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        DATA
                     </Typography>
                  </Box>
                  <Typography variant="body2">{formatDate(birth.birthDate)}</Typography>
               </Grid>
               <Grid size={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                     <AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                     <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        HORÁRIO
                     </Typography>
                  </Box>
                  <Typography variant="body2">{birth.birthTime || "Não informado"}</Typography>
               </Grid>
               <Grid size={6}>
                  <Typography
                     variant="caption"
                     color="text.secondary"
                     sx={{ fontWeight: 700, mb: 0.5, display: "block" }}
                  >
                     SITUAÇÃO
                  </Typography>
                  <Chip
                     size="small"
                     label={sitCfg.label}
                     color={sitCfg.color}
                     sx={{ fontWeight: 700 }}
                  />
               </Grid>
               <Grid size={6}>
                  <Typography
                     variant="caption"
                     color="text.secondary"
                     sx={{ fontWeight: 700, mb: 0.5, display: "block" }}
                  >
                     TIPO DE PARTO
                  </Typography>
                  <Typography variant="body2" sx={{ color: typeCfg.color, fontWeight: 700 }}>
                     {typeCfg.label}
                  </Typography>
               </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Typography
               variant="caption"
               color="text.secondary"
               sx={{ fontWeight: 700, textTransform: "uppercase", mb: 2, display: "block" }}
            >
               Dados do Bezerro
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
               <Grid size={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                     <BadgeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                     <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        BRINCO / CHIP
                     </Typography>
                  </Box>
                  <Typography variant="body2">
                     {birth.calfEarTag || "—"} / {birth.calfChip || "—"}
                  </Typography>
               </Grid>
               <Grid size={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                     <MonitorWeightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                     <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        PESO
                     </Typography>
                  </Box>
                  <Typography variant="body2">
                     {birth.calfWeight ? `${birth.calfWeight} kg` : "Não informado"}
                  </Typography>
               </Grid>
               <Grid size={6}>
                  <Typography
                     variant="caption"
                     color="text.secondary"
                     sx={{ fontWeight: 700, mb: 0.5, display: "block" }}
                  >
                     SEXO
                  </Typography>
                  <Typography variant="body2">
                     {birth.calfGender === "M"
                        ? "Macho"
                        : birth.calfGender === "F"
                          ? "Fêmea"
                          : "Não informado"}
                  </Typography>
               </Grid>
               <Grid size={6}>
                  <Typography
                     variant="caption"
                     color="text.secondary"
                     sx={{ fontWeight: 700, mb: 0.5, display: "block" }}
                  >
                     STATUS DE REGISTRO
                  </Typography>
                  <Chip
                     size="small"
                     label={birth.calfStatus === "complete" ? "Registrado como Animal" : "Pendente"}
                     variant="outlined"
                     color={birth.calfStatus === "complete" ? "success" : "warning"}
                  />
               </Grid>
            </Grid>

            {birth.situation === "dead" && birth.deathReason && (
               <Box
                  sx={{
                     mb: 3,
                     p: 2,
                     bgcolor: "#FEF2F2",
                     borderRadius: 2,
                     border: "1px solid",
                     borderColor: "error.light",
                  }}
               >
                  <Typography
                     variant="caption"
                     color="error.dark"
                     sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
                  >
                     MOTIVO DA MORTE
                  </Typography>
                  <Typography variant="body2" color="error.dark">
                     {birth.deathReason}
                  </Typography>
               </Box>
            )}

            <Box sx={{ mb: 2 }}>
               <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, mb: 0.5, display: "block" }}
               >
                  VETERINÁRIO RESPONSÁVEL
               </Typography>
               <Typography variant="body2">{birth.veterinarianName || "Não informado"}</Typography>
            </Box>

            {birth.notes && (
               <Box>
                  <Typography
                     variant="caption"
                     color="text.secondary"
                     sx={{ fontWeight: 700, mb: 0.5, display: "block" }}
                  >
                     OBSERVAÇÕES
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                     {birth.notes}
                  </Typography>
               </Box>
            )}
         </DialogContent>
         <Divider />
         <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose} variant="outlined">
               Fechar
            </Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Dialog: Registrar Parto ──────────────────────────────────────────────

interface NewBirthDialogProps {
   open: boolean;
   onClose: (saved: boolean) => void;
}

function NewBirthDialog({ open, onClose }: NewBirthDialogProps) {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   // Opções
   const [animals, setAnimals] = useState<AnimalOption[]>([]);
   const [vets, setVets] = useState<VeterinarianOption[]>([]);
   const [attempts, setAttempts] = useState<PregnancyAttemptOption[]>([]);
   const [optionsLoading, setOptionsLoading] = useState(false);

   // Form
   const [dam, setDam] = useState<AnimalOption | null>(null);
   const [attempt, setAttempt] = useState<PregnancyAttemptOption | null>(null);
   const [birthDate, setBirthDate] = useState(new Date().toISOString().split("T")[0]);
   const [birthTime, setBirthTime] = useState("");
   const [birthType, setBirthType] = useState<BirthType>("normal");
   const [situation, setSituation] = useState<BirthSituation>("normal");
   const [deathReason, setDeathReason] = useState("");
   const [calfGender, setCalfGender] = useState<Gender | "">("");
   const [calfWeight, setCalfWeight] = useState("");
   const [calfEarTag, setCalfEarTag] = useState("");
   const [calfChip, setCalfChip] = useState("");
   const [registerAsAnimal, setRegisterAsAnimal] = useState(true);
   const [vet, setVet] = useState<VeterinarianOption | null>(null);
   const [notes, setNotes] = useState("");

   useEffect(() => {
      if (!open) return;
      resetForm();
      fetchOptions();
   }, [open]);

   function resetForm() {
      setDam(null);
      setAttempt(null);
      setBirthDate(new Date().toISOString().split("T")[0]);
      setBirthTime("");
      setBirthType("normal");
      setSituation("normal");
      setDeathReason("");
      setCalfGender("");
      setCalfWeight("");
      setCalfEarTag("");
      setCalfChip("");
      setRegisterAsAnimal(true);
      setVet(null);
      setNotes("");
      setError("");
   }

   async function fetchOptions() {
      setOptionsLoading(true);
      try {
         const [resAnimals, resVets] = await Promise.all([
            api.get<AnimalOption[]>("/animals?status=active&gender=F"),
            api.get<VeterinarianOption[]>("/users?role=veterinarian&active=true"),
         ]);
         setAnimals(resAnimals.data);
         setVets(resVets.data);
      } catch (err) {
         console.error("Erro ao carregar opções:", err);
      } finally {
         setOptionsLoading(false);
      }
   }

   // Ao selecionar a mãe, buscar tentativas de prenhez em andamento
   useEffect(() => {
      if (!dam) {
         setAttempts([]);
         setAttempt(null);
         return;
      }
      api.get<any>(`/pregnancies/animal/${dam.id}`)
         .then(({ data }) => {
            const inProgress: PregnancyAttemptOption[] = [];
            data.forEach((p: any) => {
               p.attempts.forEach((a: any) => {
                  if (a.attemptStatus === "in_progress" || a.attemptStatus === "success") {
                     inProgress.push({
                        id: a.id,
                        number: a.number,
                        matingDate: a.matingDate,
                        animalName: p.animalName,
                        animalEarTag: p.animalEarTag,
                     });
                  }
               });
            });
            setAttempts(inProgress);
            if (inProgress.length > 0) setAttempt(inProgress[0]);
         })
         .catch(() => setAttempts([]));
   }, [dam]);

   async function handleSubmit() {
      if (!dam || !birthDate || !birthType || !situation) {
         setError("Preencha os campos obrigatórios (*)");
         return;
      }
      if (situation === "dead" && !deathReason.trim()) {
         setError("Informe o motivo da morte");
         return;
      }
      if (registerAsAnimal && situation === "normal" && !calfChip.trim()) {
         setError("O chip é obrigatório para registrar o bezerro como animal");
         return;
      }

      setLoading(true);
      setError("");
      try {
         await api.post("/births", {
            damId: dam.id,
            attemptId: attempt?.id || undefined,
            birthDate,
            birthTime: birthTime || undefined,
            birthType,
            situation,
            deathReason: situation === "dead" ? deathReason : undefined,
            calfGender: calfGender || undefined,
            calfWeight: calfWeight ? Number(calfWeight) : undefined,
            calfEarTag: calfEarTag || undefined,
            calfChip: calfChip || undefined,
            registerCalfAsAnimal: situation === "normal" ? registerAsAnimal : false,
            veterinarianId: vet?.id || undefined,
            notes: notes || undefined,
         });
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao registrar parto.");
      } finally {
         setLoading(false);
      }
   }

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <ChildCareIcon sx={{ color: "primary.main" }} />
               Registrar Novo Parto
            </Box>
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2.5 }}>
            {error && (
               <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                  {error}
               </Alert>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
               <Autocomplete
                  options={animals}
                  loading={optionsLoading}
                  value={dam}
                  onChange={(_, val) => setDam(val)}
                  getOptionLabel={a => `${a.name}${a.currentEarTag ? ` — ${a.currentEarTag}` : ""}`}
                  renderInput={params => (
                     <TextField {...params} size="small" label="Mãe (Doadora/Matriz) *" />
                  )}
               />

               <Autocomplete
                  options={attempts}
                  value={attempt}
                  disabled={!dam}
                  onChange={(_, val) => setAttempt(val)}
                  getOptionLabel={a => `Tentativa #${a.number} (${formatDate(a.matingDate)})`}
                  renderInput={params => (
                     <TextField
                        {...params}
                        size="small"
                        label="Vincular à Prenhez"
                        helperText={dam && attempts.length === 0 ? "Nenhuma prenhez ativa" : ""}
                     />
                  )}
               />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
               <TextField
                  fullWidth
                  label="Data do Parto *"
                  size="small"
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  slotProps={{
                     inputLabel: { shrink: true },
                     htmlInput: { max: new Date().toISOString().split("T")[0] },
                  }}
               />
               <TextField
                  fullWidth
                  label="Hora do Parto"
                  size="small"
                  type="time"
                  value={birthTime}
                  onChange={e => setBirthTime(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
               />
               <FormControl size="small" fullWidth>
                  <InputLabel>Tipo de Parto *</InputLabel>
                  <Select
                     value={birthType}
                     label="Tipo de Parto *"
                     onChange={e => setBirthType(e.target.value as BirthType)}
                  >
                     <MenuItem value="normal">Normal</MenuItem>
                     <MenuItem value="assisted">Assistido</MenuItem>
                     <MenuItem value="c_section">Cesárea</MenuItem>
                  </Select>
               </FormControl>
            </Box>

            <Divider sx={{ my: 2 }}>
               <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  DADOS DO BEZERRO
               </Typography>
            </Divider>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
               <FormControl size="small" fullWidth>
                  <InputLabel>Situação *</InputLabel>
                  <Select
                     value={situation}
                     label="Situação *"
                     onChange={e => setSituation(e.target.value as BirthSituation)}
                  >
                     <MenuItem value="normal">Vivo / Normal</MenuItem>
                     <MenuItem value="dead">Natimorto</MenuItem>
                  </Select>
               </FormControl>

               <FormControl size="small" fullWidth>
                  <InputLabel>Sexo</InputLabel>
                  <Select
                     value={calfGender}
                     label="Sexo"
                     onChange={e => setCalfGender(e.target.value as Gender)}
                  >
                     <MenuItem value="">Não informado</MenuItem>
                     <MenuItem value="M">Macho (M)</MenuItem>
                     <MenuItem value="F">Fêmea (F)</MenuItem>
                  </Select>
               </FormControl>

               <TextField
                  fullWidth
                  label="Peso (kg)"
                  size="small"
                  type="number"
                  value={calfWeight}
                  onChange={e => setCalfWeight(e.target.value)}
               />
            </Box>

            {situation === "dead" && (
               <TextField
                  fullWidth
                  label="Motivo da Morte *"
                  size="small"
                  value={deathReason}
                  onChange={e => setDeathReason(e.target.value)}
                  sx={{ mb: 2 }}
               />
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
               <TextField
                  fullWidth
                  label="Brinco do Bezerro"
                  size="small"
                  value={calfEarTag}
                  onChange={e => setCalfEarTag(e.target.value)}
               />
               <TextField
                  fullWidth
                  label="Chip do Bezerro"
                  size="small"
                  value={calfChip}
                  onChange={e => setCalfChip(e.target.value)}
                  helperText={registerAsAnimal ? "Obrigatório para registro automático" : ""}
               />
            </Box>

            {situation === "normal" && (
               <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2">Registrar automaticamente como animal?</Typography>
                  <Select
                     size="small"
                     value={registerAsAnimal ? "yes" : "no"}
                     onChange={e => setRegisterAsAnimal(e.target.value === "yes")}
                  >
                     <MenuItem value="yes">Sim</MenuItem>
                     <MenuItem value="no">Não</MenuItem>
                  </Select>
               </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mb: 2 }}>
               <Autocomplete
                  options={vets}
                  loading={optionsLoading}
                  value={vet}
                  onChange={(_, val) => setVet(val)}
                  getOptionLabel={v => v.fullName}
                  renderInput={params => <TextField {...params} size="small" label="Veterinário" />}
               />
               <TextField
                  fullWidth
                  label="Observações"
                  size="small"
                  multiline
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
               />
            </Box>
         </DialogContent>
         <Divider />
         <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => onClose(false)} disabled={loading}>
               Cancelar
            </Button>
            <Button
               variant="contained"
               onClick={handleSubmit}
               disabled={loading || !dam}
               startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            >
               {loading ? "Registrando..." : "Registrar Parto"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Página Principal ─────────────────────────────────────────────────────

export default function BirthsPage() {
   const { can } = usePermission();

   const [records, setRecords] = useState<BirthResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   // Filtros
   const [search, setSearch] = useState("");
   const [situationFilter, setSituationFilter] = useState<BirthSituation | "">("");
   const [showFilters, setShowFilters] = useState(false);

   // Dialogs
   const [newBirthOpen, setNewBirthOpen] = useState(false);
   const [detailsTarget, setDetailsTarget] = useState<BirthResponse | null>(null);

   // ── Fetch ─────────────────────────────────────────────────────────────
   const fetchRecords = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const params = new URLSearchParams();
         if (situationFilter) params.set("situation", situationFilter);

         const { data } = await api.get<BirthResponse[]>(`/births?${params.toString()}`);

         const filtered = search.trim()
            ? data.filter(
                 r =>
                    (r.damName ?? "").toLowerCase().includes(search.toLowerCase()) ||
                    (r.damEarTag ?? "").toLowerCase().includes(search.toLowerCase()) ||
                    (r.calfEarTag ?? "").toLowerCase().includes(search.toLowerCase()) ||
                    (r.calfChip ?? "").toLowerCase().includes(search.toLowerCase()) ||
                    (r.veterinarianName ?? "").toLowerCase().includes(search.toLowerCase()),
              )
            : data;

         setRecords(filtered);
      } catch {
         setError("Não foi possível carregar os partos.");
      } finally {
         setLoading(false);
      }
   }, [situationFilter, search]);

   useEffect(() => {
      const timer = setTimeout(fetchRecords, search ? 350 : 0);
      return () => clearTimeout(timer);
   }, [fetchRecords, search]);

   // ── Métricas ──────────────────────────────────────────────────────────
   const totalVivos = records.filter(r => r.situation === "normal").length;
   const totalMortos = records.filter(r => r.situation === "dead").length;
   const totalCesareas = records.filter(r => r.birthType === "c_section").length;

   // ─── Render ───────────────────────────────────────────────────────────
   return (
      <Box sx={{ p: 3, maxWidth: 1200 }}>
         {/* ── Header ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <ChildCareIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                     Controle de Partos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     {records.length} {records.length === 1 ? "registro" : "registros"}
                  </Typography>
               </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
               <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(v => !v)}
                  sx={{ borderColor: "divider", color: "text.secondary", padding: "16px" }}
               >
                  Filtros
               </Button>
               {can("register_birth") && (
                  <Button
                     sx={{ padding: "16px" }}
                     variant="contained"
                     startIcon={<AddIcon />}
                     onClick={() => setNewBirthOpen(true)}
                  >
                     Novo Parto
                  </Button>
               )}
            </Box>
         </Box>

         {/* ── Cards de resumo ── */}
         <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <SummaryCard
               title="Total de Partos"
               value={loading ? "—" : records.length}
               subtitle="Registrados na fazenda"
               icon={<ChildCareIcon sx={{ fontSize: 22 }} />}
               color="#1b4332d3"
               loading={loading}
            />
            <SummaryCard
               title="Bezerros Vivos"
               value={loading ? "—" : totalVivos}
               subtitle="Nascimentos com sucesso"
               icon={<CheckCircleIcon sx={{ fontSize: 22 }} />}
               color="#10B981"
               loading={loading}
            />
            <SummaryCard
               title="Natimortos"
               value={loading ? "—" : totalMortos}
               subtitle="Perdas neonatais"
               icon={<CancelIcon sx={{ fontSize: 22 }} />}
               color="#EF4444"
               loading={loading}
               alert={totalMortos > 0}
            />
            <SummaryCard
               title="Cesáreas"
               value={loading ? "—" : totalCesareas}
               subtitle="Partos operatórios"
               icon={<BabyChangingStationIcon sx={{ fontSize: 22 }} />}
               color="#F59E0B"
               loading={loading}
               alert={totalCesareas > 0}
            />
         </Box>

         {/* ── Filtros ── */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}
         >
            <TextField
               fullWidth
               size="small"
               placeholder="Buscar por mãe, brinco ou chip do bezerro..."
               value={search}
               onChange={e => setSearch(e.target.value)}
               slotProps={{
                  input: {
                     startAdornment: (
                        <InputAdornment position="start">
                           <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                        </InputAdornment>
                     ),
                  },
               }}
               sx={{ mb: showFilters ? 2 : 0 }}
            />
            {showFilters && (
               <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                     <InputLabel>Situação</InputLabel>
                     <Select
                        value={situationFilter}
                        label="Situação"
                        onChange={e => setSituationFilter(e.target.value as any)}
                     >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="normal">Vivo</MenuItem>
                        <MenuItem value="dead">Natimorto</MenuItem>
                     </Select>
                  </FormControl>
                  {situationFilter && (
                     <Button
                        size="small"
                        onClick={() => setSituationFilter("")}
                        sx={{ color: "error.main" }}
                     >
                        Limpar
                     </Button>
                  )}
               </Box>
            )}
         </Paper>

         {/* ── Erro ── */}
         {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
               {error}
            </Alert>
         )}

         {/* ── Tabela ── */}
         <Paper
            elevation={0}
            sx={{
               border: "1px solid",
               borderColor: "divider",
               borderRadius: 2,
               overflow: "hidden",
            }}
         >
            {loading ? (
               <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress color="primary" />
               </Box>
            ) : records.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <ChildCareIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     Nenhum parto encontrado
                  </Typography>
                  <Typography variant="caption">
                     {search || situationFilter
                        ? "Tente ajustar os filtros"
                        : can("register_birth")
                          ? 'Clique em "Novo Parto" para começar'
                          : ""}
                  </Typography>
               </Box>
            ) : (
               <TableContainer>
                  <Table size="small">
                     <TableHead>
                        <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              MÃE / DATA
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              BEZERRO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              SITUAÇÃO / TIPO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              VETERINÁRIO
                           </TableCell>
                           <TableCell
                              align="right"
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              AÇÕES
                           </TableCell>
                        </TableRow>
                     </TableHead>
                     <TableBody>
                        {records.map(r => (
                           <TableRow key={r.id} hover>
                              <TableCell>
                                 <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <Avatar
                                       sx={{
                                          bgcolor: "primary.main",
                                          width: 32,
                                          height: 32,
                                          fontSize: 14,
                                          fontWeight: 700,
                                       }}
                                    >
                                       {r.damName?.charAt(0)}
                                    </Avatar>
                                    <Box>
                                       <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                          {r.damName}
                                       </Typography>
                                       <Typography variant="caption" color="text.secondary">
                                          {r.damEarTag ? `Brinco: ${r.damEarTag}` : "Sem brinco"} ·{" "}
                                          {formatDate(r.birthDate)}
                                       </Typography>
                                    </Box>
                                 </Box>
                              </TableCell>
                              <TableCell>
                                 <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                       {r.calfEarTag ? `Brinco: ${r.calfEarTag}` : "Sem brinco"}
                                       {r.calfGender && ` (${r.calfGender})`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                       {r.calfChip ? `Chip: ${r.calfChip}` : "Sem chip"}
                                       {r.calfWeight && ` · ${r.calfWeight}kg`}
                                    </Typography>
                                 </Box>
                              </TableCell>
                              <TableCell>
                                 <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                    <Chip
                                       size="small"
                                       icon={SITUATION_CONFIG[r.situation].icon}
                                       label={SITUATION_CONFIG[r.situation].label}
                                       color={SITUATION_CONFIG[r.situation].color}
                                       variant="outlined"
                                       sx={{
                                          fontWeight: 700,
                                          fontSize: 11,
                                          width: "fit-content",
                                       }}
                                    />
                                    <Typography
                                       variant="caption"
                                       sx={{
                                          color: BIRTH_TYPE_CONFIG[r.birthType].color,
                                          fontWeight: 600,
                                       }}
                                    >
                                       Parto {BIRTH_TYPE_CONFIG[r.birthType].label}
                                    </Typography>
                                 </Box>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2">
                                    {r.veterinarianName ?? "—"}
                                 </Typography>
                              </TableCell>
                              <TableCell align="right">
                                 <Tooltip title="Ver Detalhes">
                                    <IconButton size="small" onClick={() => setDetailsTarget(r)}>
                                       <HistoryIcon fontSize="small" />
                                    </IconButton>
                                 </Tooltip>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </TableContainer>
            )}
         </Paper>

         {/* Dialogs */}
         <NewBirthDialog
            open={newBirthOpen}
            onClose={saved => {
               setNewBirthOpen(false);
               if (saved) fetchRecords();
            }}
         />
         <BirthDetailsDialog
            open={!!detailsTarget}
            birth={detailsTarget}
            onClose={() => setDetailsTarget(null)}
         />
      </Box>
   );
}
