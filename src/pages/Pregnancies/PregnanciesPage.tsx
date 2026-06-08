import AddIcon from "@mui/icons-material/Add";
import BabyChangingStationIcon from "@mui/icons-material/BabyChangingStation";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FilterListIcon from "@mui/icons-material/FilterList";
import HistoryIcon from "@mui/icons-material/History";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PendingIcon from "@mui/icons-material/Pending";
import ScienceIcon from "@mui/icons-material/Science";
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

type PregnancyStatus = "not_started" | "in_progress" | "pregnant" | "failed";
type MatingType = "NATURAL" | "AI";
type UltrasoundResult = "PREGNANT" | "EMPTY" | "ABSORPTION" | "VIABLE";

interface UltrasoundResponse {
   id: string;
   attemptId: string;
   days: number;
   result: UltrasoundResult;
   notes: string | null;
   ultrasoundDate: string;
   veterinarianId: string | null;
   veterinarianName: string | null;
}

interface AttemptResponse {
   id: string;
   pregnancyId: string;
   number: number;
   matingDate: string;
   matingType: MatingType;
   bullId: string | null;
   bullEarTag: string | null;
   semenName: string | null;
   technician: string | null;
   estimatedBirthDate: string;
   attemptStatus: "in_progress" | "success" | "failed";
   notes: string | null;
   ultrasounds: UltrasoundResponse[];
}

interface PregnancyResponse {
   id: string;
   farmId: string;
   animalId: string;
   animalEarTag: string | null;
   animalName: string | null;
   currentStatus: PregnancyStatus;
   currentStatusDate: string;
   totalAttempts: number;
   attempts: AttemptResponse[];
   createdAt: string;
   updatedAt: string;
}

interface AnimalOption {
   id: string;
   name: string;
   chipId: string;
   currentEarTag: string | null;
   gender: string;
   status: string;
}

interface BullOption {
   id: string;
   name: string;
   chipId: string;
   currentEarTag: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
   if (!iso) return "—";
   return new Date(iso).toLocaleDateString("pt-BR");
}

function daysUntil(iso: string): number {
   const diff = new Date(iso).getTime() - Date.now();
   return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const STATUS_CONFIG: Record<
   PregnancyStatus,
   { label: string; color: any; bgcolor: string; icon: React.ReactNode }
> = {
   not_started: {
      label: "Aguardando",
      color: "default",
      bgcolor: "#F3F4F6",
      icon: <PendingIcon sx={{ fontSize: 14 }} />,
   },
   in_progress: {
      label: "Em Andamento",
      color: "info",
      bgcolor: "#EFF6FF",
      icon: <FavoriteIcon sx={{ fontSize: 14 }} />,
   },
   pregnant: {
      label: "Prenhe",
      color: "success",
      bgcolor: "#F0FFF4",
      icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
   },
   failed: {
      label: "Falhou",
      color: "error",
      bgcolor: "#FEF2F2",
      icon: <CancelIcon sx={{ fontSize: 14 }} />,
   },
};

const ATTEMPT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
   in_progress: { label: "Em andamento", color: "#3B82F6" },
   success: { label: "Sucesso", color: "#10B981" },
   failed: { label: "Falhou", color: "#EF4444" },
};

const ULTRASOUND_RESULT_CONFIG: Record<UltrasoundResult, { label: string; color: string }> = {
   PREGNANT: { label: "Prenhe", color: "#10B981" },
   VIABLE: { label: "Viável", color: "#1B4332" },
   EMPTY: { label: "Vazia", color: "#EF4444" },
   ABSORPTION: { label: "Absorção", color: "#F59E0B" },
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

// ─── Dialog: Iniciar Prenhez ──────────────────────────────────────────────

interface NewPregnancyDialogProps {
   open: boolean;
   onClose: (saved: boolean) => void;
}

function NewPregnancyDialog({ open, onClose }: NewPregnancyDialogProps) {
   const [animals, setAnimals] = useState<AnimalOption[]>([]);
   const [loading, setLoading] = useState(false);
   const [animalsLoading, setAnimalsLoading] = useState(false);
   const [selectedAnimal, setSelectedAnimal] = useState<AnimalOption | null>(null);
   const [error, setError] = useState("");

   useEffect(() => {
      if (!open) return;
      setSelectedAnimal(null);
      setError("");
      setAnimalsLoading(true);
      api.get<AnimalOption[]>("/animals?status=active&gender=F")
         .then(({ data }) => setAnimals(data))
         .catch(() => setAnimals([]))
         .finally(() => setAnimalsLoading(false));
   }, [open]);

   async function handleSubmit() {
      if (!selectedAnimal) {
         setError("Selecione uma fêmea.");
         return;
      }
      setLoading(true);
      setError("");
      try {
         await api.post("/pregnancies", { animalId: selectedAnimal.id });
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao iniciar prenhez.");
      } finally {
         setLoading(false);
      }
   }

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <LocalHospitalIcon sx={{ color: "primary.main" }} />
               Iniciar Controle de Prenhez
            </Box>
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2.5 }}>
            {error && (
               <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                  {error}
               </Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
               Selecione a fêmea para iniciar o acompanhamento. A cobertura (MONTA ou IA) será
               registrada em seguida.
            </Typography>
            <Autocomplete
               options={animals}
               loading={animalsLoading}
               value={selectedAnimal}
               onChange={(_, val) => setSelectedAnimal(val)}
               getOptionLabel={a => `${a.name}${a.currentEarTag ? ` — ${a.currentEarTag}` : ""}`}
               isOptionEqualToValue={(a, b) => a.id === b.id}
               noOptionsText="Nenhuma fêmea ativa disponível"
               renderOption={(props, a) => (
                  <Box component="li" {...props} key={a.id}>
                     <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                           {a.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                           {a.currentEarTag ? `Brinco: ${a.currentEarTag}` : "Sem brinco"} · Chip:{" "}
                           {a.chipId}
                        </Typography>
                     </Box>
                  </Box>
               )}
               renderInput={params => (
                  <TextField
                     {...params}
                     size="small"
                     label="Selecione a fêmea *"
                     helperText="Apenas fêmeas ativas sem prenhez em andamento"
                  />
               )}
            />
         </DialogContent>
         <Divider />
         <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => onClose(false)} disabled={loading}>
               Cancelar
            </Button>
            <Button
               variant="contained"
               onClick={handleSubmit}
               disabled={loading || !selectedAnimal}
               startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            >
               {loading ? "Iniciando..." : "Iniciar Prenhez"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Dialog: Registrar Cobertura ──────────────────────────────────────────

interface MatingDialogProps {
   open: boolean;
   pregnancy: PregnancyResponse | null;
   onClose: (saved: boolean) => void;
}

function MatingDialog({ open, pregnancy, onClose }: MatingDialogProps) {
   const [matingType, setMatingType] = useState<MatingType>("NATURAL");
   const [matingDate, setMatingDate] = useState(new Date().toISOString().split("T")[0]);
   const [bulls, setBulls] = useState<BullOption[]>([]);
   const [bullsLoading, setBullsLoading] = useState(false);
   const [selectedBull, setSelectedBull] = useState<BullOption | null>(null);
   const [semenName, setSemenName] = useState("");
   const [technician, setTechnician] = useState("");
   const [notes, setNotes] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   useEffect(() => {
      if (!open) return;
      setMatingType("NATURAL");
      setMatingDate(new Date().toISOString().split("T")[0]);
      setSelectedBull(null);
      setSemenName("");
      setTechnician("");
      setNotes("");
      setError("");

      setBullsLoading(true);
      api.get<BullOption[]>("/animals?status=active&gender=M")
         .then(({ data }) => setBulls(data))
         .catch(() => setBulls([]))
         .finally(() => setBullsLoading(false));
   }, [open]);

   async function handleSubmit() {
      setError("");
      if (!matingDate) {
         setError("Informe a data da cobertura.");
         return;
      }
      if (matingType === "NATURAL" && !selectedBull) {
         setError("Selecione o touro.");
         return;
      }
      if (matingType === "AI" && !semenName.trim()) {
         setError("Informe o nome/código do sêmen.");
         return;
      }

      setLoading(true);
      try {
         await api.post(`/pregnancies/${pregnancy!.id}/attempts`, {
            matingDate,
            matingType,
            bullId: matingType === "NATURAL" ? selectedBull?.id : undefined,
            semenName: matingType === "AI" ? semenName.trim() : undefined,
            technician: technician.trim() || undefined,
            notes: notes.trim() || undefined,
         });
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao registrar cobertura.");
      } finally {
         setLoading(false);
      }
   }

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <FavoriteIcon sx={{ color: "error.main" }} />
               Registrar Cobertura
            </Box>
            {pregnancy && (
               <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.25 }}
               >
                  {pregnancy.animalName} — {pregnancy.animalEarTag ?? "Sem brinco"}
               </Typography>
            )}
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2.5 }}>
            {error && (
               <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                  {error}
               </Alert>
            )}

            {/* Tipo de cobertura */}
            <Typography
               variant="caption"
               sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  display: "block",
                  mb: 1,
               }}
            >
               Tipo de Cobertura
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, mb: 2.5 }}>
               {(["NATURAL", "AI"] as MatingType[]).map(type => (
                  <Box
                     key={type}
                     onClick={() => setMatingType(type)}
                     sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: matingType === type ? "primary.main" : "divider",
                        bgcolor: matingType === type ? "rgba(27,67,50,0.06)" : "transparent",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s",
                     }}
                  >
                     <Typography
                        variant="body2"
                        sx={{
                           fontWeight: 700,
                           color: matingType === type ? "primary.main" : "text.secondary",
                        }}
                     >
                        {type === "NATURAL" ? "🐂 Monta Natural" : "💉 Inseminação Artificial"}
                     </Typography>
                  </Box>
               ))}
            </Box>

            {/* Data */}
            <TextField
               fullWidth
               label="Data da Cobertura *"
               size="small"
               type="date"
               value={matingDate}
               onChange={e => setMatingDate(e.target.value)}
               slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: new Date().toISOString().split("T")[0] },
               }}
               sx={{ mb: 2 }}
            />

            {/* MONTA: selecionar touro */}
            {matingType === "NATURAL" && (
               <Autocomplete
                  options={bulls}
                  loading={bullsLoading}
                  value={selectedBull}
                  onChange={(_, val) => setSelectedBull(val)}
                  getOptionLabel={b => `${b.name}${b.currentEarTag ? ` — ${b.currentEarTag}` : ""}`}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  noOptionsText="Nenhum touro ativo encontrado"
                  renderOption={(props, b) => (
                     <Box component="li" {...props} key={b.id}>
                        <Box>
                           <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {b.name}
                           </Typography>
                           <Typography variant="caption" color="text.secondary">
                              {b.currentEarTag ? `Brinco: ${b.currentEarTag}` : "Sem brinco"} ·
                              Chip: {b.chipId}
                           </Typography>
                        </Box>
                     </Box>
                  )}
                  renderInput={params => (
                     <TextField {...params} size="small" label="Touro *" sx={{ mb: 2 }} />
                  )}
               />
            )}

            {/* IA: sêmen + técnico */}
            {matingType === "AI" && (
               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <TextField
                     label="Nome/Código do Sêmen *"
                     size="small"
                     value={semenName}
                     onChange={e => setSemenName(e.target.value)}
                     helperText="Ex: Touro Nelore PO"
                  />
                  <TextField
                     label="Técnico Responsável"
                     size="small"
                     value={technician}
                     onChange={e => setTechnician(e.target.value)}
                     helperText="Opcional"
                  />
               </Box>
            )}

            {/* Data estimada do parto (preview) */}
            {matingDate && (
               <Box
                  sx={{
                     p: 1.5,
                     borderRadius: 2,
                     bgcolor: "#F0FFF4",
                     border: "1px solid",
                     borderColor: "success.200",
                     mb: 2,
                  }}
               >
                  <Typography variant="caption" sx={{ color: "success.dark", fontWeight: 600 }}>
                     🐄 Parto previsto:{" "}
                     {formatDate(
                        new Date(
                           new Date(matingDate).getTime() + 283 * 24 * 60 * 60 * 1000,
                        ).toISOString(),
                     )}{" "}
                     (+283 dias)
                  </Typography>
               </Box>
            )}

            {/* Notas */}
            <TextField
               fullWidth
               label="Observações"
               size="small"
               multiline
               rows={2}
               value={notes}
               onChange={e => setNotes(e.target.value)}
               helperText="Opcional"
            />
         </DialogContent>
         <Divider />
         <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => onClose(false)} disabled={loading}>
               Cancelar
            </Button>
            <Button
               variant="contained"
               onClick={handleSubmit}
               disabled={loading || !matingDate}
               startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <FavoriteIcon />
               }
            >
               {loading ? "Registrando..." : "Registrar Cobertura"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Dialog: Registrar Ultrassom ──────────────────────────────────────────

interface UltrasoundDialogProps {
   open: boolean;
   pregnancy: PregnancyResponse | null;
   onClose: (saved: boolean) => void;
}

function UltrasoundDialog({ open, pregnancy, onClose }: UltrasoundDialogProps) {
   const [days, setDays] = useState<30 | 60 | 260>(30);
   const [result, setResult] = useState<UltrasoundResult>("PREGNANT");
   const [ultrasoundDate, setUltrasoundDate] = useState(new Date().toISOString().split("T")[0]);
   const [notes, setNotes] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   // Detecta quais dias já foram registrados na tentativa atual
   const currentAttempt = pregnancy?.attempts.find(a => a.attemptStatus === "in_progress");
   const usedDays = currentAttempt?.ultrasounds.map(u => u.days) ?? [];

   useEffect(() => {
      if (!open) return;
      setResult("PREGNANT");
      setUltrasoundDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setError("");
      // Seleciona automaticamente o próximo dias disponível
      const available = ([30, 60, 260] as const).find(d => !usedDays.includes(d));
      if (available) setDays(available);
   }, [open, usedDays]);

   async function handleSubmit() {
      setError("");
      setLoading(true);
      try {
         await api.post(`/pregnancies/${pregnancy!.id}/ultrasounds`, {
            days,
            result,
            ultrasoundDate,
            notes: notes.trim() || undefined,
         });
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao registrar ultrassom.");
      } finally {
         setLoading(false);
      }
   }

   const resultDescriptions: Record<UltrasoundResult, string> = {
      PREGNANT: "Embrião detectado — prenhez confirmada provisoriamente",
      VIABLE: "Feto viável — prenhez confirmada, aguardando parto",
      EMPTY: "Sem embrião — tentativa encerrada",
      ABSORPTION: "Absorção embrionária — tentativa encerrada",
   };

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <ScienceIcon sx={{ color: "primary.main" }} />
               Registrar Ultrassom
            </Box>
            {pregnancy && (
               <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.25 }}
               >
                  {pregnancy.animalName} — {pregnancy.animalEarTag ?? "Sem brinco"} · Tentativa #
                  {currentAttempt?.number ?? "—"}
               </Typography>
            )}
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2.5 }}>
            {error && (
               <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                  {error}
               </Alert>
            )}

            {!currentAttempt && (
               <Alert severity="warning" sx={{ mb: 2 }}>
                  Não há cobertura em andamento. Registre uma cobertura primeiro.
               </Alert>
            )}

            {/* Dias do ultrassom */}
            <Typography
               variant="caption"
               sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  display: "block",
                  mb: 1,
               }}
            >
               Qual Ultrassom?
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, mb: 2.5 }}>
               {([30, 60, 260] as const).map(d => {
                  const used = usedDays.includes(d);
                  return (
                     <Box
                        key={d}
                        onClick={() => !used && setDays(d)}
                        sx={{
                           flex: 1,
                           p: 1.5,
                           borderRadius: 2,
                           border: "2px solid",
                           borderColor: used ? "divider" : days === d ? "primary.main" : "divider",
                           bgcolor: used
                              ? "#F3F4F6"
                              : days === d
                                ? "rgba(27,67,50,0.06)"
                                : "transparent",
                           cursor: used ? "not-allowed" : "pointer",
                           textAlign: "center",
                           opacity: used ? 0.5 : 1,
                           transition: "all 0.15s",
                        }}
                     >
                        <Typography
                           variant="body2"
                           sx={{
                              fontWeight: 700,
                              color: used
                                 ? "text.disabled"
                                 : days === d
                                   ? "primary.main"
                                   : "text.secondary",
                           }}
                        >
                           {d === 260 ? "Final" : `${d} dias`}
                        </Typography>
                        {used && (
                           <Typography
                              variant="caption"
                              sx={{ color: "text.disabled", fontSize: 10 }}
                           >
                              Já registrado
                           </Typography>
                        )}
                     </Box>
                  );
               })}
            </Box>

            {/* Data */}
            <TextField
               fullWidth
               label="Data do Ultrassom *"
               size="small"
               type="date"
               value={ultrasoundDate}
               onChange={e => setUltrasoundDate(e.target.value)}
               slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: new Date().toISOString().split("T")[0] },
               }}
               sx={{ mb: 2 }}
            />

            {/* Resultado */}
            <Typography
               variant="caption"
               sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  display: "block",
                  mb: 1,
               }}
            >
               Resultado
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2 }}>
               {(["PREGNANT", "VIABLE", "EMPTY", "ABSORPTION"] as UltrasoundResult[]).map(r => {
                  const cfg = ULTRASOUND_RESULT_CONFIG[r];
                  return (
                     <Box
                        key={r}
                        onClick={() => setResult(r)}
                        sx={{
                           p: 1.5,
                           borderRadius: 2,
                           border: "2px solid",
                           borderColor: result === r ? cfg.color : "divider",
                           bgcolor: result === r ? `${cfg.color}15` : "transparent",
                           cursor: "pointer",
                           transition: "all 0.15s",
                        }}
                     >
                        <Typography
                           variant="body2"
                           sx={{
                              fontWeight: 700,
                              color: result === r ? cfg.color : "text.secondary",
                           }}
                        >
                           {cfg.label}
                        </Typography>
                     </Box>
                  );
               })}
            </Box>

            {/* Descrição do resultado selecionado */}
            <Box
               sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#F9FAFB",
                  border: "1px solid",
                  borderColor: "divider",
                  mb: 2,
               }}
            >
               <Typography variant="caption" color="text.secondary">
                  {resultDescriptions[result]}
               </Typography>
            </Box>

            {/* Notas */}
            <TextField
               fullWidth
               label="Observações"
               size="small"
               multiline
               rows={2}
               value={notes}
               onChange={e => setNotes(e.target.value)}
               helperText="Opcional"
            />
         </DialogContent>
         <Divider />
         <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => onClose(false)} disabled={loading}>
               Cancelar
            </Button>
            <Button
               variant="contained"
               onClick={handleSubmit}
               disabled={loading || !currentAttempt}
               startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <ScienceIcon />
               }
            >
               {loading ? "Registrando..." : "Registrar Ultrassom"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Dialog: Histórico Completo ───────────────────────────────────────────

interface HistoryDialogProps {
   open: boolean;
   pregnancy: PregnancyResponse | null;
   onClose: () => void;
}

function HistoryDialog({ open, pregnancy, onClose }: HistoryDialogProps) {
   if (!pregnancy) return null;

   return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <HistoryIcon sx={{ color: "primary.main" }} />
               Histórico de Prenhez
            </Box>
            <Typography
               variant="caption"
               color="text.secondary"
               sx={{ display: "block", mt: 0.25 }}
            >
               {pregnancy.animalName} — {pregnancy.animalEarTag ?? "Sem brinco"} ·{" "}
               {pregnancy.totalAttempts} tentativa(s)
            </Typography>
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2.5 }}>
            {pregnancy.attempts.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                     Nenhuma cobertura registrada ainda.
                  </Typography>
               </Box>
            ) : (
               <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {pregnancy.attempts.map(attempt => {
                     const statusCfg = ATTEMPT_STATUS_CONFIG[attempt.attemptStatus];
                     return (
                        <Paper
                           key={attempt.id}
                           elevation={0}
                           sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                              overflow: "hidden",
                           }}
                        >
                           {/* Header da tentativa */}
                           <Box
                              sx={{
                                 p: 2,
                                 bgcolor: "#F9FAFB",
                                 borderBottom: "1px solid",
                                 borderColor: "divider",
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "space-between",
                              }}
                           >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                 <Avatar
                                    sx={{
                                       bgcolor: statusCfg.color,
                                       width: 32,
                                       height: 32,
                                       fontSize: 13,
                                       fontWeight: 700,
                                    }}
                                 >
                                    {attempt.number}
                                 </Avatar>
                                 <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                       {attempt.matingType === "NATURAL"
                                          ? `Monta Natural${attempt.bullEarTag ? ` — Touro: ${attempt.bullEarTag}` : ""}`
                                          : `IA — ${attempt.semenName}`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                       Cobertura: {formatDate(attempt.matingDate)} · Parto previsto:{" "}
                                       {formatDate(attempt.estimatedBirthDate)}
                                    </Typography>
                                 </Box>
                              </Box>
                              <Chip
                                 label={statusCfg.label}
                                 size="small"
                                 sx={{
                                    bgcolor: `${statusCfg.color}20`,
                                    color: statusCfg.color,
                                    fontWeight: 700,
                                    fontSize: 11,
                                    height: 22,
                                 }}
                              />
                           </Box>

                           {/* Ultrassons */}
                           <Box sx={{ p: 2 }}>
                              {attempt.ultrasounds.length === 0 ? (
                                 <Typography variant="caption" color="text.secondary">
                                    Nenhum ultrassom registrado.
                                 </Typography>
                              ) : (
                                 <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                    {attempt.ultrasounds.map(us => {
                                       const cfg = ULTRASOUND_RESULT_CONFIG[us.result];
                                       return (
                                          <Box
                                             key={us.id}
                                             sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                border: "1px solid",
                                                borderColor: `${cfg.color}40`,
                                                bgcolor: `${cfg.color}10`,
                                                minWidth: 120,
                                             }}
                                          >
                                             <Typography
                                                variant="caption"
                                                sx={{
                                                   fontWeight: 700,
                                                   color: "text.secondary",
                                                   display: "block",
                                                }}
                                             >
                                                {us.days === 260
                                                   ? "Ultrassom Final"
                                                   : `US ${us.days} dias`}
                                             </Typography>
                                             <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 700, color: cfg.color }}
                                             >
                                                {cfg.label}
                                             </Typography>
                                             <Typography variant="caption" color="text.secondary">
                                                {formatDate(us.ultrasoundDate)}
                                             </Typography>
                                             {us.notes && (
                                                <Typography
                                                   variant="caption"
                                                   color="text.secondary"
                                                   sx={{
                                                      display: "block",
                                                      mt: 0.5,
                                                      fontStyle: "italic",
                                                   }}
                                                >
                                                   {us.notes}
                                                </Typography>
                                             )}
                                          </Box>
                                       );
                                    })}
                                 </Box>
                              )}

                              {attempt.notes && (
                                 <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: "block", mt: 1.5, fontStyle: "italic" }}
                                 >
                                    Obs: {attempt.notes}
                                 </Typography>
                              )}
                           </Box>
                        </Paper>
                     );
                  })}
               </Box>
            )}
         </DialogContent>
         <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose}>Fechar</Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Página Principal ─────────────────────────────────────────────────────

export default function PregnanciesPage() {
   const { can } = usePermission();

   const [records, setRecords] = useState<PregnancyResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   // Filtros
   const [search, setSearch] = useState("");
   const [statusFilter, setStatusFilter] = useState<PregnancyStatus | "">("");
   const [showFilters, setShowFilters] = useState(false);

   // Dialogs
   const [newPregnancyOpen, setNewPregnancyOpen] = useState(false);
   const [matingTarget, setMatingTarget] = useState<PregnancyResponse | null>(null);
   const [ultrasoundTarget, setUltrasoundTarget] = useState<PregnancyResponse | null>(null);
   const [historyTarget, setHistoryTarget] = useState<PregnancyResponse | null>(null);

   // ── Fetch ─────────────────────────────────────────────────────────────
   const fetchRecords = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const params = new URLSearchParams();
         if (statusFilter) params.set("status", statusFilter);

         const { data } = await api.get<PregnancyResponse[]>(`/pregnancies?${params.toString()}`);

         const filtered = search.trim()
            ? data.filter(
                 r =>
                    (r.animalName ?? "").toLowerCase().includes(search.toLowerCase()) ||
                    (r.animalEarTag ?? "").toLowerCase().includes(search.toLowerCase()),
              )
            : data;

         setRecords(filtered);
      } catch {
         setError("Não foi possível carregar as prenhezes.");
      } finally {
         setLoading(false);
      }
   }, [statusFilter, search]);

   useEffect(() => {
      const timer = setTimeout(fetchRecords, search ? 350 : 0);
      return () => clearTimeout(timer);
   }, [fetchRecords, search]);

   // ── Métricas ──────────────────────────────────────────────────────────
   const totalPrenhe = records.filter(r => r.currentStatus === "pregnant").length;
   const totalEmAndamento = records.filter(r => r.currentStatus === "in_progress").length;
   const totalFalhas = records.filter(r => r.currentStatus === "failed").length;
   const partosProximos = records.filter(r => {
      if (r.currentStatus !== "pregnant") return false;
      const ultimaTentativa = [...r.attempts].reverse().find(a => a.attemptStatus !== "failed");
      if (!ultimaTentativa) return false;
      const days = daysUntil(ultimaTentativa.estimatedBirthDate);
      return days >= 0 && days <= 30;
   }).length;

   // ── Helpers de ação ───────────────────────────────────────────────────
   function getEstimatedBirthDate(pregnancy: PregnancyResponse): string | null {
      const lastAttempt = [...pregnancy.attempts].reverse().find(a => a.attemptStatus !== "failed");
      return lastAttempt?.estimatedBirthDate ?? null;
   }

   function canRegisterMating(p: PregnancyResponse): boolean {
      return (
         p.currentStatus === "not_started" &&
         !p.attempts.some(a => a.attemptStatus === "in_progress")
      );
   }

   function canRegisterUltrasound(p: PregnancyResponse): boolean {
      return (
         (p.currentStatus === "in_progress" || p.currentStatus === "pregnant") &&
         p.attempts.some(a => a.attemptStatus === "in_progress")
      );
   }

   // ─── Render ───────────────────────────────────────────────────────────
   return (
      <Box sx={{ p: 3, maxWidth: 1200 }}>
         {/* ── Header ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <LocalHospitalIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                     Controle de Prenhez
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
                  sx={{ borderColor: "divider", color: "text.secondary" }}
               >
                  Filtros
               </Button>
               {can("edit_pregnancy") && (
                  <Button
                     variant="contained"
                     startIcon={<AddIcon />}
                     onClick={() => setNewPregnancyOpen(true)}
                  >
                     Nova Prenhez
                  </Button>
               )}
            </Box>
         </Box>

         {/* ── Cards de resumo ── */}
         <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <SummaryCard
               title="Total de Registros"
               value={loading ? "—" : records.length}
               subtitle="Todas as prenhezes"
               icon={<LocalHospitalIcon sx={{ fontSize: 22 }} />}
               color="#1B4332"
               loading={loading}
            />
            <SummaryCard
               title="Confirmadas Prenhes"
               value={loading ? "—" : totalPrenhe}
               subtitle="Ultrassom confirmado"
               icon={<CheckCircleIcon sx={{ fontSize: 22 }} />}
               color="#10B981"
               loading={loading}
            />
            <SummaryCard
               title="Em Andamento"
               value={loading ? "—" : totalEmAndamento}
               subtitle="Aguardando ultrassom"
               icon={<FavoriteIcon sx={{ fontSize: 22 }} />}
               color="#3B82F6"
               loading={loading}
            />
            <SummaryCard
               title="Falhas"
               value={loading ? "—" : totalFalhas}
               subtitle="Prenhezes falhadas"
               icon={<CancelIcon sx={{ fontSize: 22 }} />}
               color="#EF4444"
               loading={loading}
               alert={totalFalhas > 0}
            />
            <SummaryCard
               title="Partos em 30 dias"
               value={loading ? "—" : partosProximos}
               subtitle="Partos previstos"
               icon={<BabyChangingStationIcon sx={{ fontSize: 22 }} />}
               color="#F59E0B"
               loading={loading}
               alert={partosProximos > 0}
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
               placeholder="Buscar por nome ou brinco do animal..."
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
                     <InputLabel>Status</InputLabel>
                     <Select
                        value={statusFilter}
                        label="Status"
                        onChange={e => setStatusFilter(e.target.value as any)}
                     >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="not_started">Aguardando</MenuItem>
                        <MenuItem value="in_progress">Em Andamento</MenuItem>
                        <MenuItem value="pregnant">Prenhe</MenuItem>
                        <MenuItem value="failed">Falhou</MenuItem>
                     </Select>
                  </FormControl>
                  {statusFilter && (
                     <Button
                        size="small"
                        onClick={() => setStatusFilter("")}
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
                  <LocalHospitalIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     Nenhum registro encontrado
                  </Typography>
                  <Typography variant="caption">
                     {search || statusFilter
                        ? "Tente ajustar os filtros"
                        : can("edit_pregnancy")
                          ? 'Clique em "Nova Prenhez" para começar'
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
                              ANIMAL
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              STATUS
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              TENTATIVAS
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              PARTO PREVISTO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                              align="right"
                           >
                              AÇÕES
                           </TableCell>
                        </TableRow>
                     </TableHead>
                     <TableBody>
                        {records.map(record => {
                           const statusCfg = STATUS_CONFIG[record.currentStatus];
                           const estimatedBirth = getEstimatedBirthDate(record);
                           const daysLeft = estimatedBirth ? daysUntil(estimatedBirth) : null;
                           const isSoonBirth = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

                           return (
                              <TableRow
                                 key={record.id}
                                 hover
                                 sx={{
                                    "&:last-child td": { border: 0 },
                                    bgcolor: isSoonBirth ? "rgba(245,158,11,0.03)" : "transparent",
                                 }}
                              >
                                 {/* Animal */}
                                 <TableCell>
                                    <Typography
                                       variant="body2"
                                       sx={{ fontWeight: 700, color: "primary.main" }}
                                    >
                                       {record.animalEarTag ?? "—"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                       {record.animalName ?? "—"}
                                    </Typography>
                                 </TableCell>

                                 {/* Status */}
                                 <TableCell>
                                    <Chip
                                       icon={statusCfg.icon as any}
                                       label={statusCfg.label}
                                       color={statusCfg.color}
                                       size="small"
                                       sx={{ fontSize: 11, height: 24, fontWeight: 700 }}
                                    />
                                 </TableCell>

                                 {/* Tentativas */}
                                 <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                       {record.totalAttempts}
                                    </Typography>
                                    {record.totalAttempts > 0 && (
                                       <Typography variant="caption" color="text.secondary">
                                          {
                                             record.attempts.filter(
                                                a => a.attemptStatus === "failed",
                                             ).length
                                          }{" "}
                                          falha(s)
                                       </Typography>
                                    )}
                                 </TableCell>

                                 {/* Parto previsto */}
                                 <TableCell>
                                    {estimatedBirth ? (
                                       <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                          <Typography variant="body2">
                                             {formatDate(estimatedBirth)}
                                          </Typography>
                                          {isSoonBirth && (
                                             <Chip
                                                label={daysLeft === 0 ? "Hoje" : `${daysLeft}d`}
                                                color="warning"
                                                size="small"
                                                sx={{ fontSize: 10, height: 20, fontWeight: 700 }}
                                             />
                                          )}
                                       </Box>
                                    ) : (
                                       <Typography variant="body2" color="text.disabled">
                                          —
                                       </Typography>
                                    )}
                                 </TableCell>

                                 {/* Ações */}
                                 <TableCell align="right">
                                    <Box
                                       sx={{
                                          display: "flex",
                                          gap: 0.5,
                                          justifyContent: "flex-end",
                                       }}
                                    >
                                       {/* Histórico — sempre disponível */}
                                       <Tooltip title="Ver histórico">
                                          <IconButton
                                             size="small"
                                             onClick={() => setHistoryTarget(record)}
                                             sx={{ color: "text.secondary" }}
                                          >
                                             <HistoryIcon fontSize="small" />
                                          </IconButton>
                                       </Tooltip>

                                       {/* Registrar cobertura */}
                                       {can("register_mating") && canRegisterMating(record) && (
                                          <Tooltip title="Registrar cobertura">
                                             <IconButton
                                                size="small"
                                                onClick={() => setMatingTarget(record)}
                                                sx={{ color: "error.main" }}
                                             >
                                                <FavoriteIcon fontSize="small" />
                                             </IconButton>
                                          </Tooltip>
                                       )}

                                       {/* Registrar ultrassom */}
                                       {can("register_ultrasound_30") &&
                                          canRegisterUltrasound(record) && (
                                             <Tooltip title="Registrar ultrassom">
                                                <IconButton
                                                   size="small"
                                                   onClick={() => setUltrasoundTarget(record)}
                                                   sx={{ color: "primary.main" }}
                                                >
                                                   <ScienceIcon fontSize="small" />
                                                </IconButton>
                                             </Tooltip>
                                          )}
                                    </Box>
                                 </TableCell>
                              </TableRow>
                           );
                        })}
                     </TableBody>
                  </Table>
               </TableContainer>
            )}
         </Paper>

         {/* ── Dialogs ── */}
         <NewPregnancyDialog
            open={newPregnancyOpen}
            onClose={saved => {
               setNewPregnancyOpen(false);
               if (saved) fetchRecords();
            }}
         />

         <MatingDialog
            open={!!matingTarget}
            pregnancy={matingTarget}
            onClose={saved => {
               setMatingTarget(null);
               if (saved) fetchRecords();
            }}
         />

         <UltrasoundDialog
            open={!!ultrasoundTarget}
            pregnancy={ultrasoundTarget}
            onClose={saved => {
               setUltrasoundTarget(null);
               if (saved) fetchRecords();
            }}
         />

         <HistoryDialog
            open={!!historyTarget}
            pregnancy={historyTarget}
            onClose={() => setHistoryTarget(null)}
         />
      </Box>
   );
}
