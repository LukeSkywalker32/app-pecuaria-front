// src/pages/EarTags/EarTagsPage.tsx

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import HistoryIcon from "@mui/icons-material/History";
import LabelIcon from "@mui/icons-material/Label";
import LabelOffIcon from "@mui/icons-material/LabelOff";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
   Alert,
   Autocomplete,
   Box,
   Button,
   Chip,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogContentText,
   DialogTitle,
   Divider,
   FormControlLabel,
   IconButton,
   InputAdornment,
   Paper,
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

export interface EarTagRecord {
   id: string;
   farmId: string;
   animalId: string;
   animalName: string | null;
   animalEarTag: string | null;
   earTagNumber: string;
   placementDate: string;
   removalDate: string | null;
   reason: string | null;
   isActive: boolean;
   createdAt: string;
}

interface AnimalOption {
   id: string;
   name: string;
   chipId: string;
   currentEarTag: string | null;
   status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
   if (!iso) return "—";
   return new Date(iso).toLocaleDateString("pt-BR");
}

// ─── Dialog: Colocar Brinco ───────────────────────────────────────────────

interface PlaceDialogProps {
   open: boolean;
   onClose: (saved: boolean) => void;
}

function PlaceEarTagDialog({ open, onClose }: PlaceDialogProps) {
   const [animals, setAnimals] = useState<AnimalOption[]>([]);
   const [animalsLoading, setAnimalsLoading] = useState(false);
   const [selectedAnimal, setSelectedAnimal] = useState<AnimalOption | null>(null);
   const [earTagNumber, setEarTagNumber] = useState("");
   const [placementDate, setPlacementDate] = useState(new Date().toISOString().split("T")[0]);
   const [reason, setReason] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   // Carrega animais ativos ao abrir
   useEffect(() => {
      if (!open) return;
      setSelectedAnimal(null);
      setEarTagNumber("");
      setPlacementDate(new Date().toISOString().split("T")[0]);
      setReason("");
      setError("");

      setAnimalsLoading(true);
      api.get<AnimalOption[]>("/animals?status=active")
         .then(({ data }) => setAnimals(data))
         .catch(() => setAnimals([]))
         .finally(() => setAnimalsLoading(false));
   }, [open]);

   async function handleSubmit() {
      setError("");

      if (!selectedAnimal) {
         setError("Selecione um animal.");
         return;
      }
      if (!earTagNumber.trim()) {
         setError("Informe o número do brinco.");
         return;
      }
      if (earTagNumber.trim().length < 1 || earTagNumber.trim().length > 20) {
         setError("Brinco deve ter entre 1 e 20 caracteres.");
         return;
      }
      if (!/^[a-zA-Z0-9-]+$/.test(earTagNumber.trim())) {
         setError("Brinco deve conter apenas letras, números e hífens.");
         return;
      }
      if (!placementDate) {
         setError("Informe a data de colocação.");
         return;
      }

      setLoading(true);
      try {
         await api.post("/earTagHistory", {
            animalId: selectedAnimal.id,
            earTagNumber: earTagNumber.trim().toUpperCase(),
            placementDate,
            reason: reason.trim() || undefined,
         });
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao registrar brinco.");
      } finally {
         setLoading(false);
      }
   }

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>Registrar Brinco</DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2 }}>
            {error && (
               <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
               </Alert>
            )}

            {/* Animal */}
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
                  `${a.name} — Chip: ${a.chipId}${a.currentEarTag ? ` — Brinco atual: ${a.currentEarTag}` : ""}`
               }
               isOptionEqualToValue={(a, b) => a.id === b.id}
               noOptionsText="Nenhum animal ativo encontrado"
               renderOption={(props, a) => (
                  <Box component="li" {...props} key={a.id}>
                     <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                           {a.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                           Chip: {a.chipId}
                           {a.currentEarTag
                              ? ` · Brinco atual: ${a.currentEarTag}`
                              : " · Sem brinco"}
                        </Typography>
                     </Box>
                  </Box>
               )}
               renderInput={params => (
                  <TextField
                     {...params}
                     size="small"
                     label="Selecione o animal *"
                     helperText="Apenas animais com status Ativo são exibidos"
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
               sx={{ mb: 2 }}
            />

            {/* Aviso se animal já tem brinco ativo */}
            {selectedAnimal?.currentEarTag && (
               <Alert severity="info" sx={{ mb: 2 }}>
                  Este animal possui o brinco <strong>{selectedAnimal.currentEarTag}</strong> ativo.
                  Ao confirmar, ele será <strong>substituído</strong> automaticamente.
               </Alert>
            )}

            {/* Dados do brinco */}
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
               Dados do Brinco
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
               <TextField
                  label="Número do Brinco *"
                  size="small"
                  value={earTagNumber}
                  onChange={e =>
                     setEarTagNumber(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase())
                  }
                  slotProps={{ htmlInput: { maxLength: 20 } }}
                  helperText="Letras, números e hífens"
               />
               <TextField
                  label="Data de Colocação *"
                  size="small"
                  type="date"
                  value={placementDate}
                  onChange={e => setPlacementDate(e.target.value)}
                  slotProps={{
                     inputLabel: { shrink: true },
                     htmlInput: { max: new Date().toISOString().split("T")[0] },
                  }}
               />
            </Box>

            <TextField
               fullWidth
               label="Motivo"
               size="small"
               value={reason}
               onChange={e => setReason(e.target.value)}
               helperText="Opcional — ex: Nascimento, Compra, Substituição"
               slotProps={{ htmlInput: { maxLength: 200 } }}
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
               disabled={loading}
               startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            >
               {loading ? "Registrando..." : "Registrar Brinco"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Dialog: Remover Brinco ───────────────────────────────────────────────

interface RemoveDialogProps {
   open: boolean;
   record: EarTagRecord | null;
   onClose: (saved: boolean) => void;
}

function RemoveEarTagDialog({ open, record, onClose }: RemoveDialogProps) {
   const [removalDate, setRemovalDate] = useState(new Date().toISOString().split("T")[0]);
   const [reason, setReason] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   useEffect(() => {
      if (open) {
         setRemovalDate(new Date().toISOString().split("T")[0]);
         setReason("");
         setError("");
      }
   }, [open]);

   async function handleSubmit() {
      setError("");

      if (!removalDate) {
         setError("Informe a data de remoção.");
         return;
      }

      setLoading(true);
      try {
         await api.patch(`/earTagHistory/${record!.id}/remove`, {
            removalDate,
            reason: reason.trim() || undefined,
         });
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao registrar remoção.");
      } finally {
         setLoading(false);
      }
   }

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>Remover Brinco</DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2 }}>
            {error && (
               <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
               </Alert>
            )}

            {/* Resumo do brinco */}
            <Box
               sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#FFF8E1",
                  border: "1px solid",
                  borderColor: "warning.200",
                  mb: 2,
               }}
            >
               <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  BRINCO A REMOVER
               </Typography>
               <Typography variant="body1" sx={{ fontWeight: 700, color: "warning.dark" }}>
                  {record?.earTagNumber}
               </Typography>
               <Typography variant="caption" color="text.secondary">
                  Animal: {record?.animalName ?? "—"}
               </Typography>
            </Box>

            <TextField
               fullWidth
               label="Data de Remoção *"
               size="small"
               type="date"
               value={removalDate}
               onChange={e => setRemovalDate(e.target.value)}
               slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { max: new Date().toISOString().split("T")[0] },
               }}
               sx={{ mb: 2 }}
            />

            <TextField
               fullWidth
               label="Motivo"
               size="small"
               value={reason}
               onChange={e => setReason(e.target.value)}
               helperText="Opcional — ex: Perdido, Danificado, Substituído"
               slotProps={{ htmlInput: { maxLength: 200 } }}
            />
         </DialogContent>
         <Divider />
         <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => onClose(false)} disabled={loading}>
               Cancelar
            </Button>
            <Button
               variant="contained"
               color="warning"
               onClick={handleSubmit}
               disabled={loading}
               startIcon={
                  loading ? (
                     <CircularProgress size={16} color="inherit" />
                  ) : (
                     <RemoveCircleOutlineIcon />
                  )
               }
            >
               {loading ? "Removendo..." : "Confirmar Remoção"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Dialog: Histórico por Animal ─────────────────────────────────────────

interface HistoryDialogProps {
   open: boolean;
   animalId: string | null;
   animalName: string | null;
   onClose: () => void;
   canDelete: boolean;
   onRequestDelete: (record: EarTagRecord) => void;
   refreshKey: number;
}

function EarTagHistoryDialog({
   open,
   animalId,
   animalName,
   onClose,
   canDelete,
   onRequestDelete,
   refreshKey,
}: HistoryDialogProps) {
   const [records, setRecords] = useState<EarTagRecord[]>([]);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      if (!open || !animalId) return;
      setLoading(true);
      api.get<EarTagRecord[]>(`/earTagHistory/animal/${animalId}`)
         .then(({ data }) => setRecords(data))
         .catch(() => setRecords([]))
         .finally(() => setLoading(false));
   }, [open, animalId, refreshKey]);

   return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            Histórico de Brincos — {animalName ?? "Animal"}
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2 }}>
            {loading ? (
               <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={32} />
               </Box>
            ) : records.length === 0 ? (
               <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 3 }}
               >
                  Nenhum brinco registrado para este animal.
               </Typography>
            ) : (
               <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {records.map((r, idx) => (
                     <Box
                        key={r.id}
                        sx={{
                           p: 2,
                           borderRadius: 2,
                           border: "1px solid",
                           borderColor: r.isActive ? "success.200" : "divider",
                           bgcolor: r.isActive ? "#F0FFF4" : "#FAFAFA",
                           position: "relative",
                        }}
                     >
                        {/* Linha do tempo */}
                        {idx < records.length - 1 && (
                           <Box
                              sx={{
                                 position: "absolute",
                                 bottom: -13,
                                 left: 28,
                                 width: 2,
                                 height: 14,
                                 bgcolor: "divider",
                                 zIndex: 1,
                              }}
                           />
                        )}

                        <Box
                           sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 1,
                           }}
                        >
                           <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <LabelIcon
                                 sx={{
                                    fontSize: 18,
                                    color: r.isActive ? "success.main" : "text.disabled",
                                 }}
                              />
                              <Box>
                                 <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {r.earTagNumber}
                                 </Typography>
                                 <Typography variant="caption" color="text.secondary">
                                    Colocado em {formatDate(r.placementDate)}
                                    {r.removalDate && ` · Removido em ${formatDate(r.removalDate)}`}
                                 </Typography>
                                 {r.reason && (
                                    <Typography
                                       variant="caption"
                                       color="text.secondary"
                                       sx={{ display: "block" }}
                                    >
                                       Motivo: {r.reason}
                                    </Typography>
                                 )}
                              </Box>
                           </Box>
                           <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Chip
                                 label={r.isActive ? "Ativo" : "Removido"}
                                 color={r.isActive ? "success" : "default"}
                                 size="small"
                                 sx={{ fontSize: 11, height: 22 }}
                              />
                              {canDelete && !r.isActive && (
                                 <Tooltip title="Excluir este registro do histórico">
                                    <IconButton
                                       size="small"
                                       onClick={() => onRequestDelete(r)}
                                       sx={{ color: "error.main" }}
                                    >
                                       <DeleteIcon fontSize="small" />
                                    </IconButton>
                                 </Tooltip>
                              )}
                           </Box>
                        </Box>
                     </Box>
                  ))}
               </Box>
            )}
         </DialogContent>
         <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose}>Fechar</Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Agrupamento por Animal ────────────────────────────────────────────────
// A tabela principal não deve listar uma linha por TROCA de brinco (isso
// polui a visualização quando um animal trocou de brinco várias vezes).
// Em vez disso, agrupamos por animal: mostramos o brinco ativo (ou o último
// removido, se não houver ativo) e o número de trocas vai num badge que
// abre o histórico completo daquele animal.

interface GroupedAnimalRow {
   animalId: string;
   animalName: string | null;
   current: EarTagRecord; // brinco ativo, ou o mais recente se nenhum ativo
   totalRecords: number;
   hasActive: boolean;
}

function groupByAnimal(records: EarTagRecord[]): GroupedAnimalRow[] {
   const byAnimal = new Map<string, EarTagRecord[]>();
   for (const r of records) {
      const list = byAnimal.get(r.animalId) ?? [];
      list.push(r);
      byAnimal.set(r.animalId, list);
   }

   const groups: GroupedAnimalRow[] = [];
   for (const [animalId, list] of byAnimal) {
      // Ordena por placementDate desc para pegar o mais recente como fallback
      const sorted = [...list].sort(
         (a, b) => new Date(b.placementDate).getTime() - new Date(a.placementDate).getTime(),
      );
      const active = sorted.find(r => r.isActive);
      const current = active ?? sorted[0];

      groups.push({
         animalId,
         animalName: current.animalName,
         current,
         totalRecords: list.length,
         hasActive: !!active,
      });
   }

   // Ordena: animais com brinco ativo primeiro, depois por nome
   return groups.sort((a, b) => {
      if (a.hasActive !== b.hasActive) return a.hasActive ? -1 : 1;
      return (a.animalName ?? "").localeCompare(b.animalName ?? "");
   });
}

// ─── Componente Principal ─────────────────────────────────────────────────

export default function EarTagsPage() {
   const { can } = usePermission();

   const [records, setRecords] = useState<EarTagRecord[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   // Filtros
   const [search, setSearch] = useState("");
   const [activeOnly, setActiveOnly] = useState(false);
   const [showFilters, setShowFilters] = useState(false);

   // Dialogs
   const [placeOpen, setPlaceOpen] = useState(false);
   const [removeTarget, setRemoveTarget] = useState<EarTagRecord | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<EarTagRecord | null>(null);
   const [deleteLoading, setDeleteLoading] = useState(false);
   const [historyAnimalId, setHistoryAnimalId] = useState<string | null>(null);
   const [historyAnimalName, setHistoryAnimalName] = useState<string | null>(null);
   const [historyOpen, setHistoryOpen] = useState(false);
   const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

   // ── Fetch ─────────────────────────────────────────────────────────────
   const fetchRecords = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const params = new URLSearchParams();
         if (activeOnly) params.set("activeOnly", "true");

         const { data } = await api.get<EarTagRecord[]>(`/earTagHistory?${params.toString()}`);

         // Filtro local por search (número do brinco ou nome do animal)
         const filtered = search.trim()
            ? data.filter(
                 r =>
                    r.earTagNumber.toLowerCase().includes(search.toLowerCase()) ||
                    (r.animalName ?? "").toLowerCase().includes(search.toLowerCase()),
              )
            : data;

         setRecords(filtered);
      } catch {
         setError("Não foi possível carregar os brincos. Tente novamente.");
      } finally {
         setLoading(false);
      }
   }, [activeOnly, search]);

   useEffect(() => {
      const timer = setTimeout(fetchRecords, search ? 350 : 0);
      return () => clearTimeout(timer);
   }, [fetchRecords, search]);

   // ── Handlers ──────────────────────────────────────────────────────────
   function handlePlaceClose(saved: boolean) {
      setPlaceOpen(false);
      if (saved) fetchRecords();
   }

   function handleRemoveClose(saved: boolean) {
      setRemoveTarget(null);
      if (saved) fetchRecords();
   }

   function handleOpenHistory(record: EarTagRecord) {
      setHistoryAnimalId(record.animalId);
      setHistoryAnimalName(record.animalName);
      setHistoryOpen(true);
   }

   async function handleDelete() {
      if (!deleteTarget) return;
      setDeleteLoading(true);
      try {
         await api.delete(`/earTagHistory/${deleteTarget.id}`);
         setDeleteTarget(null);
         fetchRecords();
         setHistoryRefreshKey(k => k + 1);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao excluir registro.");
         setDeleteTarget(null);
      } finally {
         setDeleteLoading(false);
      }
   }

   // ── Agrupamento por animal ───────────────────────────────────────────
   const groupedRows = groupByAnimal(records);

   // ── Estatísticas rápidas (contam ANIMAIS, não registros de troca) ────
   const totalAtivos = groupedRows.filter(g => g.hasActive).length;
   const totalRemovidos = groupedRows.filter(g => !g.hasActive).length;

   // ─── Render ───────────────────────────────────────────────────────────
   return (
      <Box sx={{ p: 3, maxWidth: 1200 }}>
         {/* ── Header ── */}
         <Box
            sx={{
               display: "flex",
               alignItems: "center",
               justifyContent: "space-between",
               mb: 3,
            }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <LabelIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                     Brincos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     {totalAtivos} {totalAtivos === 1 ? "animal" : "animais"} com brinco ativo ·{" "}
                     {totalRemovidos} sem brinco
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
               {can("place_ear_tag") && (
                  <Button
                     variant="contained"
                     startIcon={<AddIcon />}
                     onClick={() => setPlaceOpen(true)}
                  >
                     Novo Brinco
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
               placeholder="Buscar por número do brinco ou nome do animal..."
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
                           checked={activeOnly}
                           onChange={e => setActiveOnly(e.target.checked)}
                           color="primary"
                           size="small"
                        />
                     }
                     label={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           Apenas brincos ativos
                        </Typography>
                     }
                  />
                  {activeOnly && (
                     <Button
                        size="small"
                        onClick={() => setActiveOnly(false)}
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
            ) : groupedRows.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <LabelIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     Nenhum brinco encontrado
                  </Typography>
                  <Typography variant="caption">
                     {search || activeOnly
                        ? "Tente ajustar os filtros"
                        : can("place_ear_tag")
                          ? 'Clique em "Novo Brinco" para começar'
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
                              BRINCO ATUAL
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              ANIMAL
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              DESDE
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              TROCAS
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              STATUS
                           </TableCell>
                           {(can("remove_ear_tag") || can("delete_ear_tag_history")) && (
                              <TableCell
                                 align="right"
                                 sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                              >
                                 AÇÕES
                              </TableCell>
                           )}
                        </TableRow>
                     </TableHead>

                     <TableBody>
                        {groupedRows.map(group => {
                           const record = group.current;
                           return (
                              <TableRow
                                 key={group.animalId}
                                 hover
                                 sx={{
                                    "&:last-child td": { border: 0 },
                                    opacity: group.hasActive ? 1 : 0.7,
                                 }}
                              >
                                 {/* Brinco atual */}
                                 <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                       {group.hasActive ? (
                                          <LabelIcon sx={{ fontSize: 16, color: "success.main" }} />
                                       ) : (
                                          <LabelOffIcon
                                             sx={{ fontSize: 16, color: "text.disabled" }}
                                          />
                                       )}
                                       <Typography
                                          variant="body2"
                                          sx={{
                                             fontWeight: 700,
                                             color: group.hasActive
                                                ? "primary.main"
                                                : "text.secondary",
                                          }}
                                       >
                                          {group.hasActive ? record.earTagNumber : "Sem brinco"}
                                       </Typography>
                                    </Box>
                                 </TableCell>

                                 {/* Animal */}
                                 <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                       {group.animalName ?? "—"}
                                    </Typography>
                                 </TableCell>

                                 {/* Desde (colocação do brinco atual, ou remoção do último) */}
                                 <TableCell>
                                    <Typography variant="body2">
                                       {group.hasActive
                                          ? formatDate(record.placementDate)
                                          : formatDate(record.removalDate)}
                                    </Typography>
                                 </TableCell>

                                 {/* Trocas — badge que abre o histórico completo */}
                                 <TableCell>
                                    <Tooltip title="Ver histórico completo de trocas">
                                       <Chip
                                          icon={<HistoryIcon sx={{ fontSize: 14 }} />}
                                          label={`${group.totalRecords}x`}
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleOpenHistory(record)}
                                          sx={{
                                             fontSize: 11,
                                             height: 24,
                                             cursor: "pointer",
                                             borderColor: "divider",
                                          }}
                                       />
                                    </Tooltip>
                                 </TableCell>

                                 {/* Status */}
                                 <TableCell>
                                    <Chip
                                       label={group.hasActive ? "Ativo" : "Sem brinco"}
                                       color={group.hasActive ? "success" : "default"}
                                       size="small"
                                       sx={{ fontSize: 11, height: 22 }}
                                    />
                                 </TableCell>

                                 {/* Ações */}
                                 {(can("remove_ear_tag") || can("delete_ear_tag_history")) && (
                                    <TableCell align="right">
                                       <Box
                                          sx={{
                                             display: "flex",
                                             gap: 0.5,
                                             justifyContent: "flex-end",
                                          }}
                                       >
                                          {/* Histórico */}
                                          <Tooltip title="Ver histórico do animal">
                                             <IconButton
                                                size="small"
                                                onClick={() => handleOpenHistory(record)}
                                                sx={{ color: "text.secondary" }}
                                             >
                                                <HistoryIcon fontSize="small" />
                                             </IconButton>
                                          </Tooltip>

                                          {/* Remover brinco ativo */}
                                          {can("remove_ear_tag") && group.hasActive && (
                                             <Tooltip title="Registrar remoção">
                                                <IconButton
                                                   size="small"
                                                   onClick={() => setRemoveTarget(record)}
                                                   sx={{ color: "warning.main" }}
                                                >
                                                   <RemoveCircleOutlineIcon fontSize="small" />
                                                </IconButton>
                                             </Tooltip>
                                          )}
                                       </Box>
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

         {/* ── Dialogs ── */}
         <PlaceEarTagDialog open={placeOpen} onClose={handlePlaceClose} />

         <RemoveEarTagDialog
            open={!!removeTarget}
            record={removeTarget}
            onClose={handleRemoveClose}
         />

         <EarTagHistoryDialog
            open={historyOpen}
            animalId={historyAnimalId}
            animalName={historyAnimalName}
            onClose={() => setHistoryOpen(false)}
            canDelete={can("delete_ear_tag_history")}
            onRequestDelete={record => setDeleteTarget(record)}
            refreshKey={historyRefreshKey}
         />

         {/* Dialog: Confirmar exclusão */}
         <Dialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            maxWidth="xs"
            fullWidth
         >
            <DialogTitle sx={{ fontWeight: 700 }}>Excluir Registro?</DialogTitle>
            <DialogContent>
               <DialogContentText>
                  Você está prestes a excluir permanentemente o registro do brinco{" "}
                  <strong>{deleteTarget?.earTagNumber}</strong>.
                  <br />
                  <br />
                  Apenas registros de brincos já removidos podem ser excluídos.
               </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
               <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                  Cancelar
               </Button>
               <Button
                  variant="contained"
                  color="error"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  startIcon={
                     deleteLoading ? <CircularProgress size={16} color="inherit" /> : undefined
                  }
               >
                  {deleteLoading ? "Excluindo..." : "Excluir"}
               </Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
}
