// src/pages/Estrus/EstrusPage.tsx

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FilterListIcon from "@mui/icons-material/FilterList";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SearchIcon from "@mui/icons-material/Search";
import TodayIcon from "@mui/icons-material/Today";
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
   FormControlLabel,
   IconButton,
   InputAdornment,
   InputLabel,
   MenuItem,
   Paper,
   Select,
   Skeleton,
   Switch,
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

interface EstrusRecord {
   id: string;
   farmId: string;
   animalId: string;
   animalEarTag: string | null;
   animalName: string | null;
   date: string;
   intensity: "weak" | "normal" | "strong";
   nextEstrus: string;
   notes: string | null;
   detectedById: string | null;
   detectedByName: string | null;
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

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
   if (!iso) return "—";
   return new Date(iso).toLocaleDateString("pt-BR");
}

function daysUntil(iso: string): number {
   const diff = new Date(iso).getTime() - Date.now();
   return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function intensityLabel(i: EstrusRecord["intensity"]) {
   return { weak: "Fraco", normal: "Normal", strong: "Forte" }[i] ?? i;
}

function intensityColor(i: EstrusRecord["intensity"]): "default" | "warning" | "error" {
   return { weak: "default", normal: "warning", strong: "error" }[i] as any;
}

function urgencyColor(days: number): "error" | "warning" | "success" {
   if (days <= 2) return "error";
   if (days <= 7) return "warning";
   return "success";
}

// ─── Cards de resumo ──────────────────────────────────────────────────────

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

// ─── Dialog de Registro/Edição ────────────────────────────────────────────

interface EstrusFormDialogProps {
   open: boolean;
   record: EstrusRecord | null;
   onClose: (saved: boolean) => void;
}

function EstrusFormDialog({ open, record, onClose }: EstrusFormDialogProps) {
   const isEditing = !!record;

   const [animals, setAnimals] = useState<AnimalOption[]>([]);
   const [animalsLoading, setAnimalsLoading] = useState(false);
   const [selectedAnimal, setSelectedAnimal] = useState<AnimalOption | null>(null);
   const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
   const [intensity, setIntensity] = useState<"weak" | "normal" | "strong">("normal");
   const [notes, setNotes] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   // Carrega fêmeas ativas ao abrir
   useEffect(() => {
      if (!open) return;
      setError("");

      if (isEditing && record) {
         // Modo edição — preenche campos
         setDate(new Date(record.date).toISOString().split("T")[0]);
         setIntensity(record.intensity);
         setNotes(record.notes ?? "");
         setSelectedAnimal(null); // animal não editável
      } else {
         // Modo criação — reseta campos
         setDate(new Date().toISOString().split("T")[0]);
         setIntensity("normal");
         setNotes("");
         setSelectedAnimal(null);

         // Busca fêmeas ativas
         setAnimalsLoading(true);
         api.get<AnimalOption[]>("/animals?status=active&gender=F")
            .then(({ data }) => setAnimals(data))
            .catch(() => setAnimals([]))
            .finally(() => setAnimalsLoading(false));
      }
   }, [open, record, isEditing]);

   async function handleSubmit() {
      setError("");

      if (!isEditing && !selectedAnimal) {
         setError("Selecione um animal.");
         return;
      }
      if (!date) {
         setError("Informe a data do CIO.");
         return;
      }

      setLoading(true);
      try {
         if (isEditing) {
            await api.put(`/estrus/${record!.id}`, {
               date,
               intensity,
               notes: notes.trim() || undefined,
            });
         } else {
            await api.post("/estrus", {
               animalId: selectedAnimal!.id,
               date,
               intensity,
               notes: notes.trim() || undefined,
            });
         }
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao salvar registro de CIO.");
      } finally {
         setLoading(false);
      }
   }

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <FavoriteIcon sx={{ color: "error.main", fontSize: 22 }} />
               {isEditing
                  ? `Editar CIO — ${record?.animalName ?? record?.animalEarTag ?? "Animal"}`
                  : "Registrar CIO"}
            </Box>
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2.5 }}>
            {error && (
               <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                  {error}
               </Alert>
            )}

            {/* Seleção de animal — apenas no cadastro */}
            {!isEditing && (
               <>
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
                     Animal
                  </Typography>
                  <Autocomplete
                     options={animals}
                     loading={animalsLoading}
                     value={selectedAnimal}
                     onChange={(_, val) => setSelectedAnimal(val)}
                     getOptionLabel={a =>
                        `${a.name}${a.currentEarTag ? ` — Brinco: ${a.currentEarTag}` : ""}`
                     }
                     isOptionEqualToValue={(a, b) => a.id === b.id}
                     noOptionsText="Nenhuma fêmea ativa encontrada"
                     renderOption={(props, a) => (
                        <Box component="li" {...props} key={a.id}>
                           <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                 {a.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                 {a.currentEarTag ? `Brinco: ${a.currentEarTag}` : "Sem brinco"} ·
                                 Chip: {a.chipId}
                              </Typography>
                           </Box>
                        </Box>
                     )}
                     renderInput={params => (
                        <TextField
                           {...params}
                           size="small"
                           label="Selecione a fêmea *"
                           helperText="Apenas fêmeas com status Ativo são exibidas"
                           slotProps={{
                              ...params.slotProps,
                              input: {
                                 ...params.slotProps?.input,
                                 endAdornment: (
                                    <>
                                       {animalsLoading ? (
                                          <CircularProgress color="inherit" size={16} />
                                       ) : null}
                                       {(params.slotProps?.input as any)?.endAdornment}
                                    </>
                                 ),
                              },
                           }}
                        />
                     )}
                     sx={{ mb: 2.5 }}
                  />
               </>
            )}

            {/* Dados do CIO */}
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
               Dados do CIO
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
               <TextField
                  label="Data do CIO *"
                  size="small"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  slotProps={{
                     inputLabel: { shrink: true },
                     htmlInput: { max: new Date().toISOString().split("T")[0] },
                  }}
               />
               <FormControl size="small">
                  <InputLabel>Intensidade *</InputLabel>
                  <Select
                     value={intensity}
                     label="Intensidade *"
                     onChange={e => setIntensity(e.target.value as any)}
                  >
                     <MenuItem value="weak">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                           <Box
                              sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#9CA3AF" }}
                           />
                           Fraco
                        </Box>
                     </MenuItem>
                     <MenuItem value="normal">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                           <Box
                              sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#F59E0B" }}
                           />
                           Normal
                        </Box>
                     </MenuItem>
                     <MenuItem value="strong">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                           <Box
                              sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#EF4444" }}
                           />
                           Forte
                        </Box>
                     </MenuItem>
                  </Select>
               </FormControl>
            </Box>

            {/* Preview do próximo CIO calculado */}
            {date && (
               <Box
                  sx={{
                     p: 1.5,
                     borderRadius: 2,
                     bgcolor: "#F0FFF4",
                     border: "1px solid",
                     borderColor: "success.200",
                     mb: 2,
                     display: "flex",
                     alignItems: "center",
                     gap: 1,
                  }}
               >
                  <TodayIcon sx={{ fontSize: 16, color: "success.main" }} />
                  <Typography variant="caption" sx={{ color: "success.dark", fontWeight: 600 }}>
                     Próximo CIO previsto:{" "}
                     {formatDate(
                        new Date(new Date(date).getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
                     )}{" "}
                     (+ 21 dias)
                  </Typography>
               </Box>
            )}

            {/* Notas */}
            <TextField
               fullWidth
               label="Observações"
               size="small"
               multiline
               rows={3}
               value={notes}
               onChange={e => setNotes(e.target.value)}
               helperText="Opcional — comportamento, contexto, etc."
               slotProps={{ htmlInput: { maxLength: 500 } }}
            />
            {notes.length > 400 && (
               <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", textAlign: "right", mt: 0.5 }}
               >
                  {notes.length}/500
               </Typography>
            )}
         </DialogContent>
         <Divider />
         <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => onClose(false)} disabled={loading}>
               Cancelar
            </Button>
            <Button
               variant="contained"
               onClick={handleSubmit}
               disabled={loading || (!isEditing && !selectedAnimal) || !date}
               startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <FavoriteIcon />
               }
            >
               {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Registrar CIO"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Página Principal ─────────────────────────────────────────────────────

export default function EstrusPage() {
   const { can } = usePermission();

   const [records, setRecords] = useState<EstrusRecord[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   // Filtros
   const [search, setSearch] = useState("");
   const [upcomingOnly, setUpcomingOnly] = useState(false);
   const [showFilters, setShowFilters] = useState(false);

   // Dialog
   const [formOpen, setFormOpen] = useState(false);
   const [editingRecord, setEditingRecord] = useState<EstrusRecord | null>(null);

   // ── Fetch ─────────────────────────────────────────────────────────────
   const fetchRecords = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const params = new URLSearchParams();
         if (upcomingOnly) params.set("upcoming", "true");

         const { data } = await api.get<EstrusRecord[]>(`/estrus?${params.toString()}`);

         // Filtro local por busca de nome/brinco
         const filtered = search.trim()
            ? data.filter(
                 r =>
                    (r.animalName ?? "").toLowerCase().includes(search.toLowerCase()) ||
                    (r.animalEarTag ?? "").toLowerCase().includes(search.toLowerCase()),
              )
            : data;

         setRecords(filtered);
      } catch {
         setError("Não foi possível carregar os registros de CIO.");
      } finally {
         setLoading(false);
      }
   }, [upcomingOnly, search]);

   useEffect(() => {
      const timer = setTimeout(fetchRecords, search ? 350 : 0);
      return () => clearTimeout(timer);
   }, [fetchRecords, search]);

   // ── Handlers ──────────────────────────────────────────────────────────
   function handleOpenCreate() {
      setEditingRecord(null);
      setFormOpen(true);
   }

   function handleOpenEdit(record: EstrusRecord) {
      setEditingRecord(record);
      setFormOpen(true);
   }

   function handleFormClose(saved: boolean) {
      setFormOpen(false);
      if (saved) fetchRecords();
   }

   // ── Métricas ──────────────────────────────────────────────────────────
   const hoje = new Date();
   const proximos7 = records.filter(r => {
      const days = daysUntil(r.nextEstrus);
      return days >= 0 && days <= 7;
   });
   const fortes = records.filter(r => r.intensity === "strong");
   const totalMes = records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
   });

   // ─── Render ───────────────────────────────────────────────────────────
   return (
      <Box sx={{ p: 3, maxWidth: 1200 }}>
         {/* ── Header ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <FavoriteIcon sx={{ color: "error.main", fontSize: 28 }} />
               <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                     Controle de CIO
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
               {can("register_estrus") && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                     Registrar CIO
                  </Button>
               )}
            </Box>
         </Box>

         {/* ── Cards de resumo ── */}
         <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <SummaryCard
               title="Total de Registros"
               value={loading ? "—" : records.length}
               subtitle={`${totalMes.length} este mês`}
               icon={<FavoriteIcon sx={{ fontSize: 22 }} />}
               color="#1B4332"
               loading={loading}
            />
            <SummaryCard
               title="Próximos 7 Dias"
               value={loading ? "—" : proximos7.length}
               subtitle="Fêmeas com CIO previsto"
               icon={<NotificationsActiveIcon sx={{ fontSize: 22 }} />}
               color="#F59E0B"
               loading={loading}
               alert={proximos7.length > 0}
            />
            <SummaryCard
               title="Intensidade Forte"
               value={loading ? "—" : fortes.length}
               subtitle="Registros com CIO forte"
               icon={<FavoriteIcon sx={{ fontSize: 22 }} />}
               color="#EF4444"
               loading={loading}
            />
            <SummaryCard
               title="Ciclos no Mês"
               value={loading ? "—" : totalMes.length}
               subtitle={`${hoje.toLocaleDateString("pt-BR", { month: "long" })}`}
               icon={<TodayIcon sx={{ fontSize: 22 }} />}
               color="#2D6A4F"
               loading={loading}
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
               placeholder="Buscar por nome do animal ou brinco..."
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
               <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControlLabel
                     control={
                        <Switch
                           checked={upcomingOnly}
                           onChange={e => setUpcomingOnly(e.target.checked)}
                           color="warning"
                           size="small"
                        />
                     }
                     label={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           Apenas próximos 7 dias
                        </Typography>
                     }
                  />
                  {upcomingOnly && (
                     <Button
                        size="small"
                        onClick={() => setUpcomingOnly(false)}
                        sx={{ color: "error.main" }}
                     >
                        Limpar Filtros
                     </Button>
                  )}
               </Box>
            )}
         </Paper>

         {/* ── Alerta de CIOs próximos ── */}
         {!loading && proximos7.length > 0 && !upcomingOnly && (
            <Alert
               severity="warning"
               icon={<NotificationsActiveIcon />}
               sx={{ mb: 2 }}
               action={
                  <Button
                     color="inherit"
                     size="small"
                     onClick={() => {
                        setUpcomingOnly(true);
                        setShowFilters(true);
                     }}
                  >
                     Ver apenas esses
                  </Button>
               }
            >
               <strong>
                  {proximos7.length} fêmea{proximos7.length > 1 ? "s" : ""}
               </strong>{" "}
               com CIO previsto nos próximos 7 dias.
            </Alert>
         )}

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
                  <FavoriteIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     Nenhum registro de CIO encontrado
                  </Typography>
                  <Typography variant="caption">
                     {search || upcomingOnly
                        ? "Tente ajustar os filtros"
                        : can("register_estrus")
                          ? 'Clique em "Registrar CIO" para começar'
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
                              DATA DO CIO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              INTENSIDADE
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              PRÓXIMO CIO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              OBSERVAÇÕES
                           </TableCell>
                           {can("edit_estrus") && (
                              <TableCell
                                 sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                                 align="right"
                              >
                                 AÇÕES
                              </TableCell>
                           )}
                        </TableRow>
                     </TableHead>
                     <TableBody>
                        {records.map(record => {
                           const days = daysUntil(record.nextEstrus);
                           const isUpcoming = days >= 0 && days <= 7;

                           return (
                              <TableRow
                                 key={record.id}
                                 hover
                                 sx={{
                                    "&:last-child td": { border: 0 },
                                    bgcolor: isUpcoming ? "rgba(245,158,11,0.04)" : "transparent",
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

                                 {/* Data */}
                                 <TableCell>
                                    <Typography variant="body2">
                                       {formatDate(record.date)}
                                    </Typography>
                                 </TableCell>

                                 {/* Intensidade */}
                                 <TableCell>
                                    <Chip
                                       label={intensityLabel(record.intensity)}
                                       color={intensityColor(record.intensity)}
                                       size="small"
                                       sx={{ fontSize: 11, height: 22, fontWeight: 700 }}
                                    />
                                 </TableCell>

                                 {/* Próximo CIO */}
                                 <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                       <Typography variant="body2">
                                          {formatDate(record.nextEstrus)}
                                       </Typography>
                                       {isUpcoming && (
                                          <Chip
                                             label={days === 0 ? "Hoje" : `${days}d`}
                                             color={urgencyColor(days)}
                                             size="small"
                                             sx={{ fontSize: 10, height: 20, fontWeight: 700 }}
                                          />
                                       )}
                                    </Box>
                                 </TableCell>

                                 {/* Observações */}
                                 <TableCell>
                                    <Typography
                                       variant="body2"
                                       color={record.notes ? "text.primary" : "text.disabled"}
                                       sx={{
                                          maxWidth: 200,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                       }}
                                    >
                                       {record.notes ?? "—"}
                                    </Typography>
                                 </TableCell>

                                 {/* Ações */}
                                 {can("edit_estrus") && (
                                    <TableCell align="right">
                                       <Tooltip title="Editar registro">
                                          <IconButton
                                             size="small"
                                             onClick={() => handleOpenEdit(record)}
                                             sx={{ color: "primary.main" }}
                                          >
                                             <EditIcon fontSize="small" />
                                          </IconButton>
                                       </Tooltip>
                                    </TableCell>
                                 )}
                              </TableRow>
                           );
                        })}
                     </TableBody>
                  </Table>
               </TableContainer>
            )}
         </Paper>

         {/* ── Dialog ── */}
         <EstrusFormDialog open={formOpen} record={editingRecord} onClose={handleFormClose} />
      </Box>
   );
}
