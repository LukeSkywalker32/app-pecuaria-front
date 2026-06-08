import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import SyringeIcon from "@mui/icons-material/Vaccines";
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
import VaccinationFormDialog from "@/pages/Vaccinations/components/VaccinationFormDialog";
import api from "@/services/api";

// ---- Tipos ---
interface VaccinationResponse {
   id: string;
   farmId: string;
   animalId: string;
   animalEarTag: string | null;
   animalName: string | null;
   vaccineType: string;
   brand: string;
   batch: string;
   vaccinationDate: string;
   expirationDate: string;
   nextDoseDate: string | null;
   photoUrl: string | null;
   reaction: string | null;
   notes: string | null;
   veterinarianId: string | null;
   veterinarianName: string | null;
   createdAt: string;
   updatedAt: string;
}

// ----- Page ---------
export default function VaccinationsPage() {
   const { hasPermission } = usePermission();
   const canRegister = hasPermission("register_vaccination");
   const canEdit = hasPermission("edit_vaccination");

   const [vaccinations, setVaccinations] = useState<VaccinationResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   //Filtros
   const [searchAnimal, setSearchAnimal] = useState("");
   const [searchVaccineType, setSearchVaccineType] = useState("");
   const [filterUpComing, setFilterUpComing] = useState(false);

   //Dialogos ----
   const [formOpen, setFormOpen] = useState(false);
   const [selectedVaccination, setSelectedVaccination] = useState<VaccinationResponse | null>(null);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [vaccinationToDelete, setVaccinationToDelete] = useState<VaccinationResponse | null>(null);
   const [deleting, setDeleting] = useState(false);

   // ---- Carrega vacinações ---
   const loadVaccinations = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const params = new URLSearchParams();
         if (searchAnimal) params.append("animalId", searchAnimal);
         if (searchVaccineType) params.append("vaccineType", searchVaccineType);
         if (filterUpComing) params.append("upcoming", "true");

         const { data } = await api.get<VaccinationResponse[]>(
            `/vaccinations?${params.toString()}`,
         );
         setVaccinations(data);
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao carregar vacinações";
         setError(msg);
      } finally {
         setLoading(false);
      }
   }, [searchAnimal, searchVaccineType, filterUpComing]);

   useEffect(() => {
      loadVaccinations();
   }, [loadVaccinations]);

   // --- Abre formulario para nova vacinação ---
   function handleNewVaccination() {
      setSelectedVaccination(null);
      setFormOpen(true);
   }
   // --- Abre formulario para editar ----
   function handleEditVaccination(vaccination: VaccinationResponse) {
      setSelectedVaccination(vaccination);
      setFormOpen(true);
   }
   // fecha formulario
   function handleFormClose(saved: boolean) {
      setFormOpen(false);
      setSelectedVaccination(null);
      if (saved) loadVaccinations();
   }
   // ── Abre diálogo de confirmação de exclusão ────
   function handleDeleteClick(vaccination: VaccinationResponse) {
      setVaccinationToDelete(vaccination);
      setDeleteDialogOpen(true);
   }
   // ── Confirma exclusão ────────────
   async function handleConfirmDelete() {
      if (!vaccinationToDelete) return;
      setDeleting(true);
      try {
         await api.delete(`/vaccinations/${vaccinationToDelete.id}`);
         setDeleteDialogOpen(false);
         setVaccinationToDelete(null);
         loadVaccinations();
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao excluir vacinação";
         setError(msg);
      } finally {
         setDeleting(false);
      }
   }
   // Formata data
   function formatDate(date: string | null): string {
      if (!date) return "-";
      return new Date(date).toLocaleDateString("pt-BR");
   }
   // ── Verifica se a próxima dose está próxima (próximos 7 dias) ───
   function isUpComingDue(nextDoseDate: string | null): boolean {
      if (!nextDoseDate) return false;
      const today = new Date();
      const dueDate = new Date(nextDoseDate);
      const daysUntilDuo = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return daysUntilDuo >= 0 && daysUntilDuo <= 7;
   }
   // ── Verifica se a vacina está vencida ──────────────────────────────────
   function isExpired(expirationDate: string): boolean {
      return new Date(expirationDate) < new Date();
   }
   // ─── Render ───────────────────────────────────────────────────────────
   return (
      <Box sx={{ p: 3 }}>
         {/* ── Header ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <SyringeIcon sx={{ fontSize: 32, color: "primary.main" }} />
               <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Vacinações
               </Typography>
            </Box>
            {canRegister && (
               <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewVaccination}>
                  Registrar Vacinação
               </Button>
            )}
         </Box>

         {/* ── Filtros ── */}
         <Paper sx={{ p: 2, mb: 3, bgcolor: "#F5F7F5" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 2 }}>
               <TextField
                  label="Buscar por Animal"
                  size="small"
                  placeholder="Nome ou brinco"
                  value={searchAnimal}
                  onChange={e => setSearchAnimal(e.target.value)}
                  slotProps={{
                     input: {
                        startAdornment: (
                           <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                           </InputAdornment>
                        ),
                     },
                  }}
               />
               <TextField
                  label="Tipo de Vacina"
                  size="small"
                  placeholder="Ex: Febre Aftosa"
                  value={searchVaccineType}
                  onChange={e => setSearchVaccineType(e.target.value)}
                  slotProps={{
                     input: {
                        startAdornment: (
                           <InputAdornment position="start">
                              <FilterListIcon fontSize="small" />
                           </InputAdornment>
                        ),
                     },
                  }}
               />
               <FormControl size="small">
                  <InputLabel>Filtro</InputLabel>
                  <Select
                     value={filterUpComing ? "upcoming" : "all"}
                     onChange={e => setFilterUpComing(e.target.value === "upcoming")}
                     label="Filtro"
                  >
                     <MenuItem value="all">Todas as vacinações</MenuItem>
                     <MenuItem value="upcoming">Próximas doses (30 dias)</MenuItem>
                  </Select>
               </FormControl>
               <Button
                  variant="outlined"
                  onClick={() => {
                     setSearchAnimal("");
                     setSearchVaccineType("");
                     setFilterUpComing(false);
                  }}
               >
                  Limpar
               </Button>
            </Box>
         </Paper>

         {/* ── Erro ── */}
         {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
               {error}
            </Alert>
         )}

         {/* ── Tabela ── */}
         <TableContainer component={Paper}>
            {loading ? (
               <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
               </Box>
            ) : vaccinations.length === 0 ? (
               <Box sx={{ p: 4, textAlign: "center" }}>
                  <SyringeIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                  <Typography color="text.secondary">
                     Nenhuma vacinação registrada.{" "}
                     {canRegister && "Clique em 'Registrar Vacinação' para começar."}
                  </Typography>
               </Box>
            ) : (
               <Table>
                  <TableHead sx={{ bgcolor: "#F5F7F5" }}>
                     <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Animal</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tipo de Vacina</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Marca</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Lote</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Data de Vacinação</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Validade</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Próxima Dose</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Ações</TableCell>
                     </TableRow>
                  </TableHead>
                  <TableBody>
                     {vaccinations.map(vaccination => (
                        <TableRow key={vaccination.id} hover>
                           <TableCell>
                              <Box>
                                 <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {vaccination.animalName}
                                 </Typography>
                                 {vaccination.animalEarTag && (
                                    <Typography variant="caption" color="text.secondary">
                                       {vaccination.animalEarTag}
                                    </Typography>
                                 )}
                              </Box>
                           </TableCell>
                           <TableCell>{vaccination.vaccineType}</TableCell>
                           <TableCell>{vaccination.brand}</TableCell>
                           <TableCell>
                              <Chip label={vaccination.batch} size="small" variant="outlined" />
                           </TableCell>
                           <TableCell>{formatDate(vaccination.vaccinationDate)}</TableCell>
                           <TableCell>
                              <Chip
                                 label={formatDate(vaccination.expirationDate)}
                                 size="small"
                                 color={isExpired(vaccination.expirationDate) ? "error" : "default"}
                                 variant={
                                    isExpired(vaccination.expirationDate) ? "filled" : "outlined"
                                 }
                              />
                           </TableCell>
                           <TableCell>
                              {vaccination.nextDoseDate ? (
                                 <Chip
                                    label={formatDate(vaccination.nextDoseDate)}
                                    size="small"
                                    color={
                                       isUpComingDue(vaccination.nextDoseDate)
                                          ? "warning"
                                          : "default"
                                    }
                                    variant={
                                       isUpComingDue(vaccination.nextDoseDate)
                                          ? "filled"
                                          : "outlined"
                                    }
                                 />
                              ) : (
                                 <Typography variant="caption" color="text.secondary">
                                    —
                                 </Typography>
                              )}
                           </TableCell>
                           <TableCell sx={{ textAlign: "center" }}>
                              {canEdit && (
                                 <>
                                    <Tooltip title="Editar">
                                       <IconButton
                                          size="small"
                                          onClick={() => handleEditVaccination(vaccination)}
                                       >
                                          <EditIcon fontSize="small" />
                                       </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Deletar">
                                       <IconButton
                                          size="small"
                                          onClick={() => handleDeleteClick(vaccination)}
                                       >
                                          <DeleteIcon fontSize="small" />
                                       </IconButton>
                                    </Tooltip>
                                 </>
                              )}
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            )}
         </TableContainer>

         {/* ── Diálogo de Formulário ── */}
         <VaccinationFormDialog
            open={formOpen}
            vaccination={selectedVaccination}
            onClose={handleFormClose}
         />

         {/* ── Diálogo de Confirmação de Exclusão ── */}
         <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
               <DialogContentText>
                  Tem certeza que deseja deletar o registro de vacinação de{" "}
                  <strong>{vaccinationToDelete?.animalName}</strong> com{" "}
                  <strong>{vaccinationToDelete?.vaccineType}</strong>? Esta ação não pode ser
                  desfeita.
               </DialogContentText>
            </DialogContent>
            <DialogActions>
               <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
               <Button
                  onClick={handleConfirmDelete}
                  color="error"
                  variant="contained"
                  disabled={deleting}
                  startIcon={deleting ? <CircularProgress size={16} /> : undefined}
               >
                  {deleting ? "Deletando..." : "Deletar"}
               </Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
}
