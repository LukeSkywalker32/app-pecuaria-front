import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GrassIcon from "@mui/icons-material/Grass";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
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
   Divider,
   FormControl,
   IconButton,
   InputAdornment,
   InputLabel,
   LinearProgress,
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
import api from "@/services/api";

// --------- TIPOS -----------

export type PastureType = "native" | "planted" | "irrigated" | "feedlot" | "quarantine";
export interface Pasture {
   id: string;
   name: string;
   hectares: number;
   type: PastureType;
   animalCapacity: number;
   currentAnimals: number;
   occupancyRate: number;
   active: boolean;
   farmId: string;
   createdAt: string;
   updatedAt: string;
}

// --------- DIALOG DE FORMULARIO ------------

export interface PastureFormDialogProps {
   open: boolean;
   pasture: Pasture | null;
   onClose: (saved: boolean) => void;
   defaultType?: PastureType;
}
export function PastureFormDialog({ open, pasture, onClose, defaultType }: PastureFormDialogProps) {
   const isEditing = !!pasture;
   const [name, setName] = useState("");
   const [hectares, setHectares] = useState("");
   const [type, setType] = useState<PastureType>("native");
   const [animalCapacity, setAnimalCapacity] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   useEffect(() => {
      if (open) {
         if (isEditing && pasture) {
            setName(pasture.name);
            setHectares(pasture.hectares.toString());
            setType(pasture.type);
            setAnimalCapacity(pasture.animalCapacity.toString());
         } else {
            setName("");
            setHectares("");
            setType(defaultType ?? "native");
            setAnimalCapacity("");
         }
         setError("");
      }
   }, [open, pasture, isEditing, defaultType]);

   async function handleSubmit() {
      //Validações
      if (!name.trim()) {
         setError("O nome do pasto é obrigatorio");
         return;
      }
      if (name.trim().length < 2) {
         setError("O nome do pasto deve ter pelo menos 2 caracteres");
         return;
      }
      if (!hectares || parseFloat(hectares) <= 0) {
         setError("A quantidade de hectares deve ser maior que 0");
         return;
      }
      if (!animalCapacity || parseInt(animalCapacity) <= 0) {
         setError("A capacidade de animais deve ser maior que 0");
         return;
      }
      setLoading(true);
      setError("");
      try {
         const payload = {
            name: name.trim(),
            hectares: parseFloat(hectares),
            type,
            animalCapacity: parseInt(animalCapacity),
         };
         if (isEditing) {
            await api.put(`/pastures/${pasture.id}`, payload);
         } else {
            await api.post("/pastures", payload);
         }
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao salvar o pasto");
      } finally {
         setLoading(false);
      }
   }

   const pastureTypeLabels: Record<PastureType, string> = {
      native: "Nativo",
      planted: "Plantado",
      irrigated: "Irrigado",
      feedlot: "Confinamento",
      quarantine: "Quarentena",
   };

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            {isEditing ? `Editar: ${pasture?.name}` : "Novo Pasto"}
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
               fullWidth
               label="Nome do Pasto *"
               size="small"
               value={name}
               onChange={e => setName(e.target.value)}
               placeholder="Ex: Pasto Sul, Pasto Irrigado"
               disabled={loading}
               autoFocus
            />

            <TextField
               fullWidth
               label="Hectares *"
               size="small"
               type="number"
               slotProps={{ htmlInput: { step: "0.1", min: "0.1" } }}
               value={hectares}
               onChange={e => setHectares(e.target.value)}
               placeholder="Ex: 10.5"
               disabled={loading}
            />

            <FormControl fullWidth size="small" disabled={loading}>
               <InputLabel>Tipo de Pasto *</InputLabel>
               <Select
                  value={type}
                  label="Tipo de Pasto *"
                  onChange={e => setType(e.target.value as PastureType)}
               >
                  {Object.entries(pastureTypeLabels).map(([key, label]) => (
                     <MenuItem key={key} value={key}>
                        {label}
                     </MenuItem>
                  ))}
               </Select>
            </FormControl>

            <TextField
               fullWidth
               label="Capacidade de Animais *"
               size="small"
               type="number"
               slotProps={{ htmlInput: { min: "1" } }}
               value={animalCapacity}
               onChange={e => setAnimalCapacity(e.target.value)}
               placeholder="Ex: 50"
               disabled={loading}
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
               disabled={loading || !name.trim() || !hectares || !animalCapacity}
               startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
               sx={{ px: 3 }}
            >
               {loading ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}
// ─── DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO ────────────
interface DeleteConfirmDialogProps {
   open: boolean;
   pasture: Pasture | null;
   loading: boolean;
   onConfirm: () => void;
   onCancel: () => void;
}
function DeleteConfirmDialog({
   open,
   pasture,
   loading,
   onConfirm,
   onCancel,
}: DeleteConfirmDialogProps) {
   return (
      <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>Excluir Pasto</DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2 }}>
            <DialogContentText>
               Tem certeza que deseja excluir o pasto <strong>{pasture?.name}</strong>?
            </DialogContentText>
            <DialogContentText sx={{ mt: 1, color: "text.secondary", fontSize: 12 }}>
               Esta ação não pode ser desfeita. O pasto só pode ser excluído se não houver animais
               nele.
            </DialogContentText>
         </DialogContent>
         <Divider />
         <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={onCancel} disabled={loading}>
               Cancelar
            </Button>
            <Button
               variant="contained"
               color="error"
               onClick={onConfirm}
               disabled={loading}
               startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
               {loading ? "Excluindo..." : "Excluir"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}
export default function PasturesPage() {
   const [pastures, setPastures] = useState<Pasture[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [search, setSearch] = useState("");
   const [filterType, setFilterType] = useState<PastureType | "">("");
   const [filterActive, setFilterActive] = useState<boolean | "">("");

   const [formOpen, setFormOpen] = useState(false);
   const [editingPasture, setEditingPasture] = useState<Pasture | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<Pasture | null>(null);
   const [deleteLoading, setDeleteLoading] = useState(false);
   const [actionLoading, setActionLoading] = useState<string | null>(null);

   // ─── FETCH ────────────────────────────────────────────────────────────

   const fetchPastures = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const params = new URLSearchParams();
         if (search.trim()) params.set("search", search.trim());
         if (filterType) params.set("type", filterType);
         if (filterActive !== "") params.set("active", filterActive === true ? "true" : "false");

         const { data } = await api.get<Pasture[]>(`/pastures?${params.toString()}`);
         setPastures(data);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Não foi possível carregar os pastos.");
      } finally {
         setLoading(false);
      }
   }, [search, filterType, filterActive]);

   useEffect(() => {
      const timer = setTimeout(fetchPastures, search ? 350 : 0);
      return () => clearTimeout(timer);
   }, [fetchPastures, search]);

   // ─── HANDLERS ─────────────────────────────────────────────────────────

   function handleOpenCreate() {
      setEditingPasture(null);
      setFormOpen(true);
   }

   function handleOpenEdit(pasture: Pasture) {
      setEditingPasture(pasture);
      setFormOpen(true);
   }

   function handleFormClose(saved: boolean) {
      setFormOpen(false);
      if (saved) fetchPastures();
   }

   async function handleToggleActive(pasture: Pasture) {
      setActionLoading(pasture.id);
      try {
         const endpoint = pasture.active
            ? `/pastures/${pasture.id}/deactivate`
            : `/pastures/${pasture.id}/activate`;
         await api.patch(endpoint);
         fetchPastures();
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao alterar status do pasto.");
      } finally {
         setActionLoading(null);
      }
   }

   async function handleDelete() {
      if (!deleteTarget) return;
      setDeleteLoading(true);
      try {
         await api.delete(`/pastures/${deleteTarget.id}`);
         setDeleteTarget(null);
         fetchPastures();
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao excluir pasto.");
         setDeleteTarget(null);
      } finally {
         setDeleteLoading(false);
      }
   }

   // ─── HELPERS ──────────────────────────────────────────────────────────

   function occupancyColor(rate: number): string {
      if (rate >= 90) return "#DC2626"; // red
      if (rate >= 70) return "#EA580C"; // orange
      return "#16A34A"; // green
   }

   const pastureTypeLabels: Record<PastureType, string> = {
      native: "Nativo",
      planted: "Plantado",
      irrigated: "Irrigado",
      feedlot: "Confinamento",
      quarantine: "Quarentena",
   };

   const activeCount = pastures.filter(p => p.active).length;
   const inactiveCount = pastures.filter(p => !p.active).length;

   // ─── RENDER ───────────────────────────────────────────────────────────

   return (
      <Box sx={{ p: 3, maxWidth: 1200 }}>
         {/* ── Header ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <GrassIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                     Pastos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     {activeCount} ativas · {inactiveCount} inativas
                  </Typography>
               </Box>
            </Box>
            <Button
               variant="contained"
               startIcon={<AddIcon />}
               onClick={handleOpenCreate}
               sx={{ px: 3 }}
            >
               Novo Pasto
            </Button>
         </Box>

         {/* ── Filtros ── */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}
         >
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
               <TextField
                  size="small"
                  placeholder="Buscar pasto..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  sx={{ flex: 1, minWidth: 200 }}
                  slotProps={{
                     input: {
                        startAdornment: (
                           <InputAdornment position="start">
                              <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                           </InputAdornment>
                        ),
                     },
                  }}
               />

               <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                     value={filterType}
                     label="Tipo"
                     onChange={e => setFilterType(e.target.value as PastureType | "")}
                  >
                     <MenuItem value="">Todos</MenuItem>
                     {Object.entries(pastureTypeLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                           {label}
                        </MenuItem>
                     ))}
                  </Select>
               </FormControl>

               <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                     value={filterActive}
                     label="Status"
                     onChange={e =>
                        setFilterActive(e.target.value === "" ? "" : e.target.value === "true")
                     }
                  >
                     <MenuItem value="">Todos</MenuItem>
                     <MenuItem value="true">Ativas</MenuItem>
                     <MenuItem value="false">Inativas</MenuItem>
                  </Select>
               </FormControl>
            </Box>
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
            ) : pastures.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <GrassIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     {search || filterType || filterActive !== ""
                        ? "Nenhum pasto encontrado"
                        : "Nenhum pasto cadastrado"}
                  </Typography>
                  {!search && !filterType && filterActive === "" && (
                     <Typography variant="caption">Clique em "Novo Pasto" para começar</Typography>
                  )}
               </Box>
            ) : (
               <TableContainer>
                  <Table size="small">
                     <TableHead>
                        <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              NOME
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              TIPO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                              align="right"
                           >
                              HECTARES
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                              align="center"
                           >
                              OCUPAÇÃO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              STATUS
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
                        {pastures.map(pasture => (
                           <TableRow
                              key={pasture.id}
                              hover
                              sx={{
                                 "&:last-child td": { border: 0 },
                                 opacity: pasture.active ? 1 : 0.6,
                              }}
                           >
                              <TableCell>
                                 <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {pasture.name}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2" color="text.secondary">
                                    {pastureTypeLabels[pasture.type]}
                                 </Typography>
                              </TableCell>
                              <TableCell align="right">
                                 <Typography variant="body2">
                                    {pasture.hectares.toFixed(2)} ha
                                 </Typography>
                              </TableCell>
                              <TableCell align="center">
                                 <Box
                                    sx={{
                                       display: "flex",
                                       alignItems: "center",
                                       justifyContent: "center",
                                       gap: 1,
                                    }}
                                 >
                                    <Box sx={{ flex: 1, maxWidth: 80 }}>
                                       <Tooltip
                                          title={`${pasture.occupancyRate}% ocupado`}
                                          placement="top"
                                       >
                                          <LinearProgress
                                             variant="determinate"
                                             value={Math.min(pasture.occupancyRate, 100)}
                                             sx={{
                                                height: 6,
                                                borderRadius: 3,
                                                bgcolor: "#E5E7EB",
                                                "& .MuiLinearProgress-bar": {
                                                   bgcolor: occupancyColor(pasture.occupancyRate),
                                                   borderRadius: 3,
                                                },
                                             }}
                                          />
                                       </Tooltip>
                                    </Box>
                                    <Typography
                                       variant="caption"
                                       sx={{
                                          fontWeight: 700,
                                          color: occupancyColor(pasture.occupancyRate),
                                          minWidth: 35,
                                       }}
                                    >
                                       {pasture.occupancyRate}%
                                    </Typography>
                                 </Box>
                                 <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: "block", mt: 0.5 }}
                                 >
                                    {pasture.currentAnimals} / {pasture.animalCapacity}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Chip
                                    label={pasture.active ? "Ativa" : "Inativa"}
                                    color={pasture.active ? "success" : "default"}
                                    size="small"
                                    sx={{ fontSize: 11, height: 22 }}
                                 />
                              </TableCell>
                              <TableCell align="right">
                                 <Box
                                    sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}
                                 >
                                    {/* Editar */}
                                    <Tooltip title="Editar">
                                       <IconButton
                                          size="small"
                                          onClick={() => handleOpenEdit(pasture)}
                                          sx={{ color: "primary.main" }}
                                       >
                                          <EditIcon fontSize="small" />
                                       </IconButton>
                                    </Tooltip>

                                    {/* Ativar / Desativar */}
                                    <Tooltip title={pasture.active ? "Desativar" : "Ativar"}>
                                       <IconButton
                                          size="small"
                                          onClick={() => handleToggleActive(pasture)}
                                          disabled={actionLoading === pasture.id}
                                          sx={{
                                             color: pasture.active
                                                ? "warning.main"
                                                : "success.main",
                                          }}
                                       >
                                          {actionLoading === pasture.id ? (
                                             <CircularProgress size={16} />
                                          ) : pasture.active ? (
                                             <PauseCircleIcon fontSize="small" />
                                          ) : (
                                             <PlayCircleIcon fontSize="small" />
                                          )}
                                       </IconButton>
                                    </Tooltip>

                                    {/* Deletar */}
                                    <Tooltip
                                       title={
                                          pasture.currentAnimals > 0
                                             ? `Não é possível excluir com ${pasture.currentAnimals} animal(is)`
                                             : "Excluir"
                                       }
                                    >
                                       <span>
                                          <IconButton
                                             size="small"
                                             onClick={() => setDeleteTarget(pasture)}
                                             disabled={pasture.currentAnimals > 0}
                                             sx={{ color: "error.main" }}
                                          >
                                             <DeleteIcon fontSize="small" />
                                          </IconButton>
                                       </span>
                                    </Tooltip>
                                 </Box>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </TableContainer>
            )}
         </Paper>

         {/* ── Dialogs ── */}
         <PastureFormDialog open={formOpen} pasture={editingPasture} onClose={handleFormClose} />
         <DeleteConfirmDialog
            open={!!deleteTarget}
            pasture={deleteTarget}
            loading={deleteLoading}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
         />
      </Box>
   );
}
