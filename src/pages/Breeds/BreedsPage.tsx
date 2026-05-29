import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PetsIcon from "@mui/icons-material/Pets";
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
   IconButton,
   InputAdornment,
   Paper,
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

// TIPOS ------

export interface Breed {
   id: string;
   name: string;
   active: boolean;
   createdAt: string;
   updatedAt: string;
}
// Dialog de Formulario ---
interface BreedFormDialogProps {
   open: boolean;
   breed: Breed | null;
   onClose: (saved: boolean) => void;
}
function BreedFormDialog({ open, breed, onClose }: BreedFormDialogProps) {
   const isEditing = !!breed;
   const [name, setName] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   useEffect(() => {
      if (open) {
         setName(breed?.name ?? "");
         setError("");
      }
   }, [open, breed]);

   async function handleSubmit() {
      if (!name.trim()) {
         setError("O nome da raça é obrigatório");
         return;
      }
      if (name.trim().length < 2) {
         setError("O nome da raça deve ter pelo menos 2 caracteres");
         return;
      }
      setLoading(true);
      setError("");
      try {
         if (isEditing) {
            await api.put(`/breeds/${breed!.id}`, { name: name.trim() });
         } else {
            await api.post("/breeds", { name: name.trim() });
         }
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao salvar raça");
      } finally {
         setLoading(false);
      }
   }
   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
         <DialogTitle sx={{ fontWeight: 700 }}>
            {isEditing ? `Editar: ${breed?.name}` : "Nova Raça"}
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2 }}>
            {error && (
               <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
               </Alert>
            )}
            <TextField
               fullWidth
               label="Nome da Raça *"
               size="small"
               value={name}
               onChange={e => setName(e.target.value)}
               onKeyDown={e => e.key === "Enter" && handleSubmit()}
               autoFocus
               helperText="Ex: Nelore, Angus, Gir"
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
               disabled={loading || !name.trim()}
               startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
               sx={{ px: 3 }}
            >
               {loading ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}

// ─── Componente Principal ─────────
export default function BreedsPage() {
   const [breeds, setBreeds] = useState<Breed[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [search, setSearch] = useState("");

   const [formOpen, setFormOpen] = useState(false);
   const [editingBreed, setEditingBreed] = useState<Breed | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<Breed | null>(null);
   const [deleteLoading, setDeleteLoading] = useState(false);
   const [actionLoading, setActionLoading] = useState<string | null>(null);

   // ── Fetch ─────────────────────────────────────────────────────────────
   const fetchBreeds = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const params = new URLSearchParams();
         if (search.trim()) params.set("search", search.trim());
         const { data } = await api.get<Breed[]>(`/breeds?${params.toString()}`);
         setBreeds(data);
      } catch {
         setError("Não foi possível carregar as raças.");
      } finally {
         setLoading(false);
      }
   }, [search]);

   useEffect(() => {
      const timer = setTimeout(fetchBreeds, search ? 350 : 0);
      return () => clearTimeout(timer);
   }, [fetchBreeds, search]);

   // ── Handlers ──────────────────────────────────────────────────────────
   function handleOpenCreate() {
      setEditingBreed(null);
      setFormOpen(true);
   }

   function handleOpenEdit(breed: Breed) {
      setEditingBreed(breed);
      setFormOpen(true);
   }

   function handleFormClose(saved: boolean) {
      setFormOpen(false);
      if (saved) fetchBreeds();
   }

   async function handleToggleActive(breed: Breed) {
      setActionLoading(breed.id);
      try {
         const endpoint = breed.active
            ? `/breeds/${breed.id}/deactivate`
            : `/breeds/${breed.id}/activate`;
         await api.patch(endpoint);
         fetchBreeds();
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao alterar status da raça.");
      } finally {
         setActionLoading(null);
      }
   }

   async function handleDelete() {
      if (!deleteTarget) return;
      setDeleteLoading(true);
      try {
         await api.delete(`/breeds/${deleteTarget.id}`);
         setDeleteTarget(null);
         fetchBreeds();
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao excluir raça.");
         setDeleteTarget(null);
      } finally {
         setDeleteLoading(false);
      }
   }

   const activeCount = breeds.filter(b => b.active).length;
   const inactiveCount = breeds.filter(b => !b.active).length;

   // ── Render ────────────────────────────────────────────────────────────
   return (
      <Box sx={{ p: 3, maxWidth: 800 }}>
         {/* ── Header ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <PetsIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                     Raças
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
               Nova Raça
            </Button>
         </Box>

         {/* ── Busca ── */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}
         >
            <TextField
               fullWidth
               size="small"
               placeholder="Buscar raça..."
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
            />
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
            ) : breeds.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <PetsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     {search ? "Nenhuma raça encontrada" : "Nenhuma raça cadastrada"}
                  </Typography>
                  {!search && (
                     <Typography variant="caption">Clique em "Nova Raça" para começar</Typography>
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
                              STATUS
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              CADASTRADA EM
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
                        {breeds.map(breed => (
                           <TableRow
                              key={breed.id}
                              hover
                              sx={{
                                 "&:last-child td": { border: 0 },
                                 opacity: breed.active ? 1 : 0.6,
                              }}
                           >
                              <TableCell>
                                 <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {breed.name}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Chip
                                    label={breed.active ? "Ativa" : "Inativa"}
                                    color={breed.active ? "success" : "default"}
                                    size="small"
                                    sx={{ fontSize: 11, height: 22 }}
                                 />
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2" color="text.secondary">
                                    {new Date(breed.createdAt).toLocaleDateString("pt-BR")}
                                 </Typography>
                              </TableCell>
                              <TableCell align="right">
                                 <Box
                                    sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}
                                 >
                                    {/* Editar */}
                                    <Tooltip title="Editar nome">
                                       <IconButton
                                          size="small"
                                          onClick={() => handleOpenEdit(breed)}
                                          sx={{ color: "primary.main" }}
                                       >
                                          <EditIcon fontSize="small" />
                                       </IconButton>
                                    </Tooltip>

                                    {/* Ativar / Desativar */}
                                    <Tooltip title={breed.active ? "Desativar" : "Ativar"}>
                                       <IconButton
                                          size="small"
                                          onClick={() => handleToggleActive(breed)}
                                          disabled={actionLoading === breed.id}
                                          sx={{
                                             color: breed.active ? "warning.main" : "success.main",
                                          }}
                                       >
                                          {actionLoading === breed.id ? (
                                             <CircularProgress size={16} />
                                          ) : breed.active ? (
                                             <PauseCircleIcon fontSize="small" />
                                          ) : (
                                             <PlayCircleIcon fontSize="small" />
                                          )}
                                       </IconButton>
                                    </Tooltip>

                                    {/* Deletar — só se inativa */}
                                    <Tooltip
                                       title={
                                          breed.active
                                             ? "Desative antes de excluir"
                                             : "Excluir permanentemente"
                                       }
                                    >
                                       <span>
                                          <IconButton
                                             size="small"
                                             onClick={() => setDeleteTarget(breed)}
                                             disabled={breed.active}
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

         {/* ── Dialog: Form ── */}
         <BreedFormDialog open={formOpen} breed={editingBreed} onClose={handleFormClose} />

         {/* ── Dialog: Confirmar exclusão ── */}
         <Dialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            maxWidth="xs"
            fullWidth
         >
            <DialogTitle sx={{ fontWeight: 700 }}>Excluir raça?</DialogTitle>
            <DialogContent>
               <DialogContentText>
                  Você está prestes a excluir a raça <strong>{deleteTarget?.name}</strong>{" "}
                  permanentemente.
                  <br />
                  <br />
                  Isso só é possível se nenhum animal estiver cadastrado com essa raça.
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
