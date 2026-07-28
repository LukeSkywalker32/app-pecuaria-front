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
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import WeighingFormDialog from "@/pages/Weighings/components/WeighingFormDialog";
import WeighingHistoryDialog from "@/pages/Weighings/components/WeighingHistoryDialog";
import api from "@/services/api";
import { downloadBlob } from "@/utils/downloadFile";

// --- Tipos ---
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

// Agrupa pesagens por animal e retorna apenas a mais recente de cada um
function getLatestWeighingsByAnimal(weighings: WeighingResponse[]): WeighingResponse[] {
   const latestByAnimal = new Map<string, WeighingResponse>();

   for (const w of weighings) {
      const current = latestByAnimal.get(w.animalId);
      if (!current) {
         latestByAnimal.set(w.animalId, w);
         continue;
      }
      // Compara datas para encontrar a mais recente
      const isMoreRecent =
         w.date > current.date || (w.date === current.date && w.createdAt > current.createdAt);
      if (isMoreRecent) {
         latestByAnimal.set(w.animalId, w);
      }
   }

   return Array.from(latestByAnimal.values());
}

// Acha, pra cada animal, o id da pesagem mais antiga (mesmo critério do
// backend: date asc, createdAt como desempate). Só essa pesagem pode
// ter peso/data editados na tela.
function getFirstWeighingIds(weighings: WeighingResponse[]): Set<string> {
   const firstByAnimal = new Map<string, WeighingResponse>();
   for (const w of weighings) {
      const current = firstByAnimal.get(w.animalId);
      if (!current) {
         firstByAnimal.set(w.animalId, w);
         continue;
      }
      const isEarlier =
         w.date < current.date || (w.date === current.date && w.createdAt < current.createdAt);
      if (isEarlier) firstByAnimal.set(w.animalId, w);
   }
   return new Set(Array.from(firstByAnimal.values(), w => w.id));
}

export default function WeighingsPage() {
   const { hasPermission } = usePermission();
   const canRegister = hasPermission("register_weighing");
   const canEdit = hasPermission("edit_weighing");
   const canDelete = hasPermission("delete_weighing");
   const canExport = hasPermission("export_csv");

   const [exporting, setExporting] = useState(false);

   const [allWeighings, setAllWeighings] = useState<WeighingResponse[]>([]);
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

   // Pesagens agrupadas: apenas a mais recente de cada animal para exibição na tabela principal
   const latestWeighings = useMemo(() => getLatestWeighingsByAnimal(allWeighings), [allWeighings]);

   // IDs da primeira pesagem de cada animal (para controle de edição)
   const firstWeighingIds = useMemo(() => getFirstWeighingIds(allWeighings), [allWeighings]);

   const loadAnimalHistory = async (animalId: string) => {
      setHistoryLoading(true);
      try {
         const { data } = await api.get(`/weighings/animal/${animalId}`, {
            params: { _t: Date.now() },
         });
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
      // Cache-busting client-side: garante que o navegador nunca sirva uma
      // resposta guardada dessa URL, independente do header Cache-Control
      // do servidor já estar em produção ou não (o Cache-Control resolve
      // isso do lado certo, mas essa camada aqui não depende de deploy).
      api.get("/weighings", { params: { _t: Date.now() } })
         .then(({ data }) => setAllWeighings(data))
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
         setAllWeighings(prev => {
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
         const { data } = await api.get("/weighings/export/xlsx", {
            responseType: "blob",
            params: { _t: Date.now() },
         });
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
            <Chip icon={<ScaleIcon />} label="— (1ª pesagem)" variant="outlined" color="default" />
         );
      }
      const isPositive = gmd >= 0;
      return (
         <Chip
            icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={`${gmd.toFixed(3)} kg/dia`}
            color={isPositive ? "success" : "error"}
            variant="outlined"
         />
      );
   }

   return (
      <Box sx={{ p: 3 }}>
         <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <ScaleIcon sx={{ fontSize: 32, color: "primary.main" }} />
               <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Pesagens
               </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
               Histórico de pesagens e Ganho Médio Diário (GMD) do rebanho
            </Typography>
         </Box>

         <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
            {canExport && (
               <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  disabled={exporting}
                  sx={{ padding: 1, fontSize: 16 }}
               >
                  Exportar Excel
               </Button>
            )}
            {canRegister && (
               <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNewWeighing}
                  sx={{ padding: 1, fontSize: 16 }}
               >
                  Nova Pesagem
               </Button>
            )}
         </Box>

         {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
               {error}
            </Alert>
         )}

         <TableContainer component={Paper}>
            <Table>
               <TableHead>
                  <TableRow>
                     <TableCell>Animal</TableCell>
                     <TableCell>Peso</TableCell>
                     <TableCell>Data</TableCell>
                     <TableCell>GMD</TableCell>
                     <TableCell>Registrado por</TableCell>
                     <TableCell>Ações</TableCell>
                  </TableRow>
               </TableHead>
               <TableBody>
                  {loading ? (
                     <TableRow>
                        <TableCell colSpan={6} align="center">
                           <CircularProgress />
                        </TableCell>
                     </TableRow>
                  ) : latestWeighings.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={6} align="center">
                           Nenhuma pesagem registrada ainda.
                        </TableCell>
                     </TableRow>
                  ) : (
                     latestWeighings.map(w => (
                        <TableRow key={w.animalId}>
                           <TableCell>
                              {w.animalName}
                              {w.animalEarTag ? ` — ${w.animalEarTag}` : ""}
                           </TableCell>
                           <TableCell>{w.weightKg.toFixed(1)} kg</TableCell>
                           <TableCell>{formatDate(w.date)}</TableCell>
                           <TableCell>{renderGmd(w.gmd)}</TableCell>
                           <TableCell>{w.registeredByName ?? "—"}</TableCell>
                           <TableCell>
                              {canEdit &&
                                 (firstWeighingIds.has(w.id) ? (
                                    <IconButton
                                       size="small"
                                       color="primary"
                                       onClick={() => handleEditWeighing(w)}
                                    >
                                       <EditIcon />
                                    </IconButton>
                                 ) : (
                                    <IconButton size="small" color="default" disabled>
                                       <EditIcon />
                                    </IconButton>
                                 ))}
                              {canDelete && (
                                 <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteClick(w)}
                                 >
                                    <DeleteIcon />
                                 </IconButton>
                              )}
                              <IconButton
                                 size="small"
                                 color="info"
                                 onClick={() => loadAnimalHistory(w.animalId)}
                              >
                                 <HistoryIcon />
                              </IconButton>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </TableContainer>

         {/* ── Diálogo de Formulário de nova pesagem ── */}
         <WeighingFormDialog
            open={formOpen}
            weighing={selectedWeighing}
            onClose={handleFormClose}
         />

         {/* ── Diálogo de Formulário de histórico ── */}
         <WeighingHistoryDialog
            open={historyOpen}
            animalId={selectedAnimalForHistory}
            weighings={historyWeighings}
            loading={historyLoading}
            onClose={() => setHistoryOpen(false)}
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
                  {deleting ? <CircularProgress size={24} /> : "Remover"}
               </Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
}
