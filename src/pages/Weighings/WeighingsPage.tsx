import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import ScaleIcon from "@mui/icons-material/Scale";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
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
   IconButton,
   Paper,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   Tooltip,
   Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import WeighingFormDialog from "@/pages/Weighings/components/WeighingFormDialog";
import WeighingHistoryDialog from "@/pages/Weighings/components/WeighingHistoryDialog";
import api from "@/services/api";
import { downloadBlob } from "@/utils/downloadFile";

// ---- Tipos ---
interface WeighingResponse {
   id: string;
   farmId: string;
   animalId: string;
   animalEarTag: string | null;
   animalName: string | null;
   weightKg: number;
   date: string;
   notes: string | null;
   registeredById: string | null;
   registeredByName: string | null;
   gmd: number | null;
   createdAt: string;
}

export default function WeighingsPage() {
   const { hasPermission } = usePermission();
   const canRegister = hasPermission("register_weighing");
   const canEdit = hasPermission("edit_weighing");
   const canDelete = hasPermission("delete_weighing");
   const canExport = hasPermission("export_csv");

   const [exporting, setExporting] = useState(false);

   const [weighings, setWeighings] = useState<WeighingResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   const [formOpen, setFormOpen] = useState(false);
   const [selectedWeighing, setSelectedWeighing] = useState<WeighingResponse | null>(null);

   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [weighingToDelete, setWeighingToDelete] = useState<WeighingResponse | null>(null);
   const [deleting, setDeleting] = useState(false);

   const [historyOpen, setHistoryOpen] = useState(false);
   const [selectedAnimalForHistory, setSelectedAnimalForHistory] = useState<string | null>(null);
   const [historyWeighings, setHistoryWeighings] = useState<WeighingResponse[]>([]);
   const [historyLoading, setHistoryLoading] = useState(false);

   const loadAnimalHistory = async (animalId: string) => {
      setHistoryLoading(true);
      try {
         const { data } = await api.get<WeighingResponse[]>(`/weighings/animal/${animalId}`);
         setHistoryWeighings(data);
         setSelectedAnimalForHistory(animalId);
         setHistoryOpen(true);
      } catch {
         setError("Erro ao carregar histórico");
      } finally {
         setHistoryLoading(false);
      }
   };

   const loadWeighings = useCallback(() => {
      setLoading(true);
      setError("");
      api.get<WeighingResponse[]>("/weighings")
         .then(({ data }) => setWeighings(data))
         .catch(err => {
            const msg = err?.response?.data?.error ?? "Erro ao carregar pesagens";
            setError(msg);
         })
         .finally(() => setLoading(false));
   }, []);

   useEffect(() => {
      loadWeighings();
   }, [loadWeighings]);

   async function handleNewWeighing() {
      setSelectedWeighing(null);
      setFormOpen(true);
   }

   function handleEditWeighing(weighing: WeighingResponse) {
      setSelectedWeighing(weighing);
      setFormOpen(true);
   }

   function handleFormClose(saved: boolean, savedWeighing?: WeighingResponse) {
      setFormOpen(false);
      setSelectedWeighing(null);
      if (!saved) return;

      // Atualiza a linha na hora, com o que o backend já devolveu no
      // POST/PUT (inclusive o `gmd` recalculado) — assim a tela não fica
      // um instante mostrando o estado antigo até o loadWeighings() de
      // baixo voltar. loadWeighings() continua rodando na sequência
      // porque criar/editar uma pesagem no meio do histórico também muda
      // o GMD das pesagens vizinhas do mesmo animal, e essa parte só o
      // recálculo completo do backend resolve.
      if (savedWeighing) {
         setWeighings(prev => {
            const exists = prev.some(w => w.id === savedWeighing.id);
            return exists
               ? prev.map(w => (w.id === savedWeighing.id ? savedWeighing : w))
               : [savedWeighing, ...prev];
         });
      }
      loadWeighings();
   }

   function handleDeleteClick(weighing: WeighingResponse) {
      setWeighingToDelete(weighing);
      setDeleteDialogOpen(true);
   }

   async function handleExport() {
      setExporting(true);
      try {
         const { data } = await api.get("/weighings/export/xlsx", { responseType: "blob" });
         downloadBlob(data, "pesagens.xlsx");
      } catch {
         setError("Erro ao exportar pesagens");
      } finally {
         setExporting(false);
      }
   }

   async function handleConfirmDelete() {
      if (!weighingToDelete) return;
      setDeleting(true);
      try {
         await api.delete(`/weighings/${weighingToDelete.id}`);
         setDeleteDialogOpen(false);
         setWeighingToDelete(null);
         loadWeighings();
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao remover pesagem";
         setError(msg);
      } finally {
         setDeleting(false);
      }
   }

   function formatDate(date: string): string {
      return new Date(date).toLocaleDateString("pt-BR");
   }

   function renderGmd(gmd: number | null) {
      if (gmd === null) {
         return (
            <Typography variant="caption" color="text.secondary">
               — (1ª pesagem)
            </Typography>
         );
      }
      const isPositive = gmd >= 0;
      return (
         <Chip
            size="small"
            icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={`${gmd.toFixed(3)} kg/dia`}
            color={isPositive ? "success" : "error"}
            variant="outlined"
         />
      );
   }

   return (
      <Box sx={{ p: 3 }}>
         <Box
            sx={{
               display: "flex",
               justifyContent: "space-between",
               alignItems: "center",
               mb: 3,
            }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <ScaleIcon fontSize="large" color="primary" />
               <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                     Pesagens
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                     Histórico de pesagens e Ganho Médio Diário (GMD) do rebanho
                  </Typography>
               </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               {canExport && (
                  <Button
                     variant="outlined"
                     startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
                     onClick={handleExport}
                     disabled={exporting}
                  >
                     Exportar Excel
                  </Button>
               )}
               {canRegister && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewWeighing}>
                     Nova Pesagem
                  </Button>
               )}
            </Box>
         </Box>

         {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
               {error}
            </Alert>
         )}

         <Paper variant="outlined">
            <TableContainer>
               <Table size="small">
                  <TableHead>
                     <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Animal</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Peso</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>GMD</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Registrado por</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Ações</TableCell>
                     </TableRow>
                  </TableHead>
                  <TableBody>
                     {loading ? (
                        <TableRow>
                           <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                              <CircularProgress />
                           </TableCell>
                        </TableRow>
                     ) : weighings.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                              <Typography color="text.secondary">
                                 Nenhuma pesagem registrada ainda.
                              </Typography>
                           </TableCell>
                        </TableRow>
                     ) : (
                        weighings.map(w => (
                           <TableRow key={w.id} hover>
                              <TableCell>
                                 {w.animalName}
                                 {w.animalEarTag ? ` — ${w.animalEarTag}` : ""}
                              </TableCell>
                              <TableCell>{w.weightKg.toFixed(1)} kg</TableCell>
                              <TableCell>{formatDate(w.date)}</TableCell>
                              <TableCell>{renderGmd(w.gmd)}</TableCell>
                              <TableCell>{w.registeredByName ?? "—"}</TableCell>
                              <TableCell sx={{ textAlign: "center" }}>
                                 {canEdit && (
                                    <Tooltip title="Editar">
                                       <IconButton
                                          size="small"
                                          onClick={() => handleEditWeighing(w)}
                                       >
                                          <EditIcon fontSize="small" />
                                       </IconButton>
                                    </Tooltip>
                                 )}
                                 {canDelete && (
                                    <Tooltip title="Deletar">
                                       <IconButton
                                          size="small"
                                          onClick={() => handleDeleteClick(w)}
                                       >
                                          <DeleteIcon fontSize="small" />
                                       </IconButton>
                                    </Tooltip>
                                 )}
                                 <Tooltip title="Ver histórico">
                                    <IconButton
                                       size="small"
                                       onClick={() => loadAnimalHistory(w.animalId)}
                                    >
                                       <HistoryIcon fontSize="small" />
                                    </IconButton>
                                 </Tooltip>
                              </TableCell>
                           </TableRow>
                        ))
                     )}
                  </TableBody>
               </Table>
            </TableContainer>
         </Paper>

         {/* ── Diálogo de Formulário de nova pesagem ── */}
         <WeighingFormDialog
            open={formOpen}
            weighing={selectedWeighing}
            onClose={handleFormClose}
         />
         {/* ── Diálogo de Formulário de histórico ── */}
         <WeighingHistoryDialog
            open={historyOpen}
            weighings={historyWeighings}
            onClose={() => setHistoryOpen(false)}
            loading={historyLoading}
         />

         {/* ── Diálogo de Confirmação de Exclusão ── */}
         <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Remover pesagem?</DialogTitle>
            <DialogContent>
               <DialogContentText>
                  Essa ação não pode ser desfeita. O GMD das pesagens seguintes desse animal será
                  recalculado automaticamente.
               </DialogContentText>
            </DialogContent>
            <DialogActions>
               <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                  Cancelar
               </Button>
               <Button
                  onClick={handleConfirmDelete}
                  color="error"
                  variant="contained"
                  disabled={deleting}
               >
                  {deleting ? <CircularProgress size={20} /> : "Remover"}
               </Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
}
