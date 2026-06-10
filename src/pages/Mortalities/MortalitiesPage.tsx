import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import HeartBrokenIcon from "@mui/icons-material/HeartBroken";
import SearchIcon from "@mui/icons-material/Search";
import {
   Alert,
   Box,
   Button,
   Chip,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogContentText,
   DialogTitle,
   FormControl,
   IconButton,
   InputAdornment,
   InputLabel,
   MenuItem,
   Paper,
   Select,
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
import MortalityFormDialog from "./components/MortalityFormDialog";

// ---- Tipos -----

export interface MortalityResponse {
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
   severity: "mild" | "moderate" | "severe";
   necropsy: boolean;
   disposal: string | null;
   photos: string[] | null;
   notes: string | null;
   registeredById: string | null;
   registeredByName: string | null;
   createdAt: string;
   updatedAt: string;
}

// ---- Componente -----
function severityColor(
   severity: MortalityResponse["severity"],
): "success" | "error" | "warning" | "default" | "info" {
   const map: Record<string, any> = {
      mild: "info",
      moderate: "warning",
      severe: "error",
   };
   return map[severity] ?? "default";
}
function severityLabel(severity: MortalityResponse["severity"]) {
   const map: Record<string, string> = {
      mild: "Leve",
      moderate: "Moderada",
      severe: "Severa",
   };
   return map[severity] ?? "Não informado";
}
function formatDate(dateStr: string): string {
   const date = new Date(dateStr);
   return date.toLocaleDateString("pt-BR");
}
function formatTime(timeStr: string | null): string {
   return timeStr ?? "-";
}

// COMPONENTE PRINCIPAL -----

export default function MortalitiesPage() {
   const { can } = usePermission();

   const [mortalities, setMortalities] = useState<MortalityResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   const [search, setSearch] = useState("");
   const [dateFromFilter, setDateFromFilter] = useState("");
   const [dateToFilter, setDateToFilter] = useState("");
   const [severityFilter, setSeverityFilter] = useState("");
   const [necropsyFilter, setNecropsyFilter] = useState("");
   const [showFilters, setShowFilters] = useState(false);

   const [formOpen, setFormOpen] = useState(false);
   const [editingMortality, setEditingMortality] = useState<MortalityResponse | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<MortalityResponse | null>(null);
   const [deleteLoading, setDeleteLoading] = useState(false);

   const fetchMortalities = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const params = new URLSearchParams();
         if (search.trim()) params.set("search", search.trim());
         if (dateFromFilter.trim()) params.set("dateFrom", dateFromFilter);
         if (dateToFilter.trim()) params.set("dateTo", dateToFilter);
         if (severityFilter.trim()) params.set("severity", severityFilter);
         if (necropsyFilter.trim()) params.set("necropsy", necropsyFilter);

         const { data } = await api.get<MortalityResponse[]>(`/mortalities?${params.toString()}`);
         setMortalities(data);
      } catch {
         setError("Erro ao carregar mortalidades. Tente novamente.");
      } finally {
         setLoading(false);
      }
   }, [search, dateFromFilter, dateToFilter, severityFilter, necropsyFilter]);

   useEffect(() => {
      const timer = setTimeout(
         () => {
            fetchMortalities();
         },
         search ? 400 : 0,
      );
      return () => clearTimeout(timer);
   }, [search, fetchMortalities]);

   function handleOpenCreate() {
      setEditingMortality(null);
      setFormOpen(true);
   }

   function handleOpenEdit(mortality: MortalityResponse) {
      setEditingMortality(mortality);
      setFormOpen(true);
   }
   function handleCloseForm(saved: boolean) {
      setFormOpen(false);
      if (saved) fetchMortalities();
   }
   async function handleDelete() {
      if (!deleteTarget) return;
      setDeleteLoading(true);
      try {
         await api.delete(`/mortalities/${deleteTarget.id}`);
         setDeleteTarget(null);
         fetchMortalities();
      } catch {
         setError("Erro ao excluir mortalidade. Tente novamente.");
      } finally {
         setDeleteLoading(false);
      }
   }

   return (
      <Box sx={{ p: 3, maxWidth: "1400px" }}>
         {/* ── Cabeçalho ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <HeartBrokenIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography
                     variant="h5"
                     sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
                  >
                     Mortalidades
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     {mortalities.length} {mortalities.length === 1 ? "registro" : "registros"}
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
               {can("register_mortality") && (
                  <Button
                     variant="contained"
                     startIcon={<AddIcon />}
                     onClick={handleOpenCreate}
                     sx={{ padding: "16px" }}
                  >
                     Registrar Morte
                  </Button>
               )}
            </Box>
         </Box>

         {/* ── Filtros ── */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}
         >
            <TextField
               fullWidth
               size="small"
               placeholder="Buscar por animal, local ou causa..."
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
               <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <TextField
                     label="Data Inicial"
                     type="date"
                     size="small"
                     value={dateFromFilter}
                     onChange={e => setDateFromFilter(e.target.value)}
                     slotProps={{ inputLabel: { shrink: true } }}
                     sx={{ minWidth: 160 }}
                  />

                  <TextField
                     label="Data Final"
                     type="date"
                     size="small"
                     value={dateToFilter}
                     onChange={e => setDateToFilter(e.target.value)}
                     slotProps={{ inputLabel: { shrink: true } }}
                     sx={{ minWidth: 160 }}
                  />

                  <FormControl size="small" sx={{ minWidth: 160 }}>
                     <InputLabel>Severidade</InputLabel>
                     <Select
                        value={severityFilter}
                        label="Severidade"
                        onChange={e => setSeverityFilter(e.target.value)}
                     >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="mild">Leve</MenuItem>
                        <MenuItem value="moderate">Moderada</MenuItem>
                        <MenuItem value="severe">Severa</MenuItem>
                     </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                     <InputLabel>Necropsia</InputLabel>
                     <Select
                        value={necropsyFilter}
                        label="Necropsia"
                        onChange={e => setNecropsyFilter(e.target.value)}
                     >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="true">Realizada</MenuItem>
                        <MenuItem value="false">Não Realizada</MenuItem>
                     </Select>
                  </FormControl>

                  {(dateFromFilter || dateToFilter || severityFilter || necropsyFilter) && (
                     <Button
                        size="small"
                        onClick={() => {
                           setDateFromFilter("");
                           setDateToFilter("");
                           setSeverityFilter("");
                           setNecropsyFilter("");
                        }}
                        sx={{ color: "error.main" }}
                     >
                        Limpar Filtros
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
            ) : mortalities.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <HeartBrokenIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     Nenhuma mortalidade registrada
                  </Typography>
                  <Typography variant="caption">
                     {search || dateFromFilter || dateToFilter || severityFilter || necropsyFilter
                        ? "Tente ajustar os filtros"
                        : can("register_mortality")
                          ? 'Clique em "Registrar Morte" para começar'
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
                              DATA
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              ANIMAL
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              LOCAL
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              CAUSA
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              SEVERIDADE
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                              align="center"
                           >
                              NECROPSIA
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              REGISTRADO POR
                           </TableCell>
                           {(can("edit_mortality") || can("delete_animal")) && (
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
                        {mortalities.map(mortality => (
                           <TableRow
                              key={mortality.id}
                              hover
                              sx={{ "&:last-child td": { border: 0 } }}
                           >
                              <TableCell>
                                 <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatDate(mortality.deathDate)}
                                 </Typography>
                                 <Typography variant="caption" color="text.secondary">
                                    {formatTime(mortality.deathTime)}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600, color: "primary.main" }}
                                 >
                                    {mortality.animalName ?? "—"}
                                 </Typography>
                                 <Typography variant="caption" color="text.secondary">
                                    {mortality.animalEarTag ?? "—"}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2">{mortality.deathLocation}</Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2">{mortality.causeOfDeath}</Typography>
                              </TableCell>
                              <TableCell>
                                 {mortality.severity ? (
                                    <Chip
                                       label={severityLabel(mortality.severity)}
                                       size="small"
                                       color={severityColor(mortality.severity)}
                                       variant="outlined"
                                    />
                                 ) : (
                                    <Typography variant="caption" color="text.secondary">
                                       —
                                    </Typography>
                                 )}
                              </TableCell>
                              <TableCell align="center">
                                 <Chip
                                    label={mortality.necropsy ? "Sim" : "Não"}
                                    size="small"
                                    color={mortality.necropsy ? "success" : "default"}
                                    variant="outlined"
                                 />
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2">
                                    {mortality.registeredByName ?? "—"}
                                 </Typography>
                              </TableCell>
                              {(can("edit_mortality") || can("delete_animal")) && (
                                 <TableCell align="right">
                                    <Box
                                       sx={{
                                          display: "flex",
                                          gap: 0.5,
                                          justifyContent: "flex-end",
                                       }}
                                    >
                                       {can("edit_mortality") && (
                                          <Tooltip title="Editar">
                                             <IconButton
                                                size="small"
                                                onClick={() => handleOpenEdit(mortality)}
                                             >
                                                <EditIcon sx={{ fontSize: 18 }} />
                                             </IconButton>
                                          </Tooltip>
                                       )}
                                       {can("delete_animal") && (
                                          <Tooltip title="Excluir">
                                             <IconButton
                                                size="small"
                                                onClick={() => setDeleteTarget(mortality)}
                                             >
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                             </IconButton>
                                          </Tooltip>
                                       )}
                                    </Box>
                                 </TableCell>
                              )}
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </TableContainer>
            )}
         </Paper>

         {/* ── Dialog de Formulário ── */}
         <MortalityFormDialog
            open={formOpen}
            mortality={editingMortality}
            onClose={handleCloseForm}
         />

         {/* ── Dialog de Confirmação de Exclusão ── */}
         <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
               <DialogContentText>
                  Tem certeza que deseja excluir o registro de mortalidade de{" "}
                  <strong>{deleteTarget?.animalName}</strong> em{" "}
                  <strong>{formatDate(deleteTarget?.deathDate ?? "")}</strong>?
               </DialogContentText>
            </DialogContent>
            <DialogActions>
               <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
               <Button
                  onClick={handleDelete}
                  color="error"
                  variant="contained"
                  disabled={deleteLoading}
               >
                  {deleteLoading ? <CircularProgress size={20} /> : "Excluir"}
               </Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
}
