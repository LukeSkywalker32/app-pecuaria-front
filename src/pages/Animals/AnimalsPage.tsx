import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PetsIcon from "@mui/icons-material/Pets";
import SearchIcon from "@mui/icons-material/Search";
import SellIcon from "@mui/icons-material/Sell";
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
import { useNavigate } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import api from "@/services/api";
import AnimalFormDialog from "./components/AnimalFormDialog";
import SellAnimalDialog from "./components/SellAnimalDialog";

// --- TIPOS VINDOS DA API ---
export interface AnimalResponse {
   id: string;
   chipId: string;
   currentEarTag: string | null;
   name: string;
   breed: string;
   gender: "M" | "F";
   birthDate: string;
   origin: "born" | "purchased";
   ageInMonths: number;
   category: string;
   // Peso em kg — null quando não informado
   weightKg: number | null;
   status: "active" | "dead" | "sold" | "quarantine" | "treatment";
   pastureId: string | null;
   pastureName: string | null;
   sireId: string | null;
   damId: string | null;
   sireExternalName: string | null;
   damExternalName: string | null;
   farmId: string;
   createdAt: string;
}

// ---- Mapeamentos visuais ----
function statusColor(
   status: AnimalResponse["status"],
): "success" | "error" | "warning" | "default" | "info" {
   const map: Record<string, any> = {
      active: "success",
      dead: "error",
      sold: "default",
      quarantine: "warning",
      treatment: "info",
   };
   return map[status] ?? "default";
}

function statusLabel(status: AnimalResponse["status"]) {
   const map: Record<string, string> = {
      active: "Ativo",
      dead: "Morto",
      sold: "Vendido",
      quarantine: "Quarentena",
      treatment: "Tratamento",
   };
   return map[status] ?? status;
}

function categoryColor(cat: string): string {
   if (cat === "Touro") return "#1B4332";
   if (cat === "Vaca") return "#2D6A4F";
   if (cat === "Garrote" || cat === "Novilha") return "#52B788";
   return "#95D5B2";
}

function formatAge(months: number): string {
   if (months < 12) return `${months} meses`;
   const years = Math.floor(months / 12);
   const rem = months % 12;
   return rem > 0 ? `${years}a ${rem}m` : `${years}anos`;
}

// Formata peso: "420 kg" ou "—" quando null
function formatWeight(kg: number | null): string {
   if (kg === null || kg === undefined) return "—";
   return `${kg} kg`;
}

// --- Componente Principal ---
export default function AnimalsPage() {
   const navigate = useNavigate();
   const { can } = usePermission();

   const [animals, setAnimals] = useState<AnimalResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   const [search, setSearch] = useState("");
   const [statusFilter, setStatusFilter] = useState("");
   const [genderFilter, setGenderFilter] = useState("");
   const [showFilters, setShowFilters] = useState(false);

   const [formOpen, setFormOpen] = useState(false);
   const [editingAnimal, setEditingAnimal] = useState<AnimalResponse | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<AnimalResponse | null>(null);
   const [deleteLoading, setDeleteLoading] = useState(false);
   const [sellTarget, setSellTarget] = useState<AnimalResponse | null>(null);

   const fetchAnimals = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const params = new URLSearchParams();
         if (search.trim()) params.set("search", search.trim());
         if (statusFilter) params.set("status", statusFilter);
         if (genderFilter) params.set("gender", genderFilter);

         const { data } = await api.get<AnimalResponse[]>(`/animals?${params.toString()}`);
         setAnimals(data);
      } catch {
         setError("Não foi possível carregar os animais. Tente novamente.");
      } finally {
         setLoading(false);
      }
   }, [search, statusFilter, genderFilter]);

   useEffect(() => {
      const timer = setTimeout(
         () => {
            fetchAnimals();
         },
         search ? 400 : 0,
      );
      return () => clearTimeout(timer);
   }, [fetchAnimals, search]);

   function handleOpenCreate() {
      setEditingAnimal(null);
      setFormOpen(true);
   }
   function handleOpenEdit(animal: AnimalResponse) {
      setEditingAnimal(animal);
      setFormOpen(true);
   }
   function handleFormClose(saved: boolean) {
      setFormOpen(false);
      if (saved) fetchAnimals();
   }

   async function handleDelete() {
      if (!deleteTarget) return;
      setDeleteLoading(true);
      try {
         await api.delete(`/animals/${deleteTarget.id}`);
         setDeleteTarget(null);
         fetchAnimals();
      } catch {
         setError("Erro ao excluir animal. Verifique se ele não possui registros vinculados.");
      } finally {
         setDeleteLoading(false);
      }
   }

   return (
      <Box sx={{ p: 3, maxWidth: "1200px" }}>
         {/* ── Cabeçalho ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <PetsIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography
                     variant="h5"
                     sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
                  >
                     Animais
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     {animals.length} {animals.length === 1 ? "animal" : "animais"}
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
               {can("create_animal") && (
                  <Button
                     variant="contained"
                     startIcon={<AddIcon />}
                     onClick={handleOpenCreate}
                     sx={{ padding: "16px" }}
                  >
                     Novo Animal
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
               placeholder="Buscar por nome, chip ou brinco..."
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
               <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                     <InputLabel>Status</InputLabel>
                     <Select
                        value={statusFilter}
                        label="Status"
                        onChange={e => setStatusFilter(e.target.value)}
                     >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="active">Ativo</MenuItem>
                        <MenuItem value="quarantine">Quarentena</MenuItem>
                        <MenuItem value="sold">Vendido</MenuItem>
                        <MenuItem value="dead">Morto</MenuItem>
                        <MenuItem value="treatment">Tratamento</MenuItem>
                     </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 140 }}>
                     <InputLabel>Sexo</InputLabel>
                     <Select
                        value={genderFilter}
                        label="Sexo"
                        onChange={e => setGenderFilter(e.target.value)}
                     >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="F">Fêmea</MenuItem>
                        <MenuItem value="M">Macho</MenuItem>
                     </Select>
                  </FormControl>

                  {(statusFilter || genderFilter) && (
                     <Button
                        size="small"
                        onClick={() => {
                           setStatusFilter("");
                           setGenderFilter("");
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
            ) : animals.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <PetsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     Nenhum animal encontrado
                  </Typography>
                  <Typography variant="caption">
                     {search || statusFilter || genderFilter
                        ? "Tente ajustar os filtros"
                        : can("create_animal")
                          ? 'Clique em "Novo Animal" para começar'
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
                              BRINCO / CHIP
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              NOME
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              RAÇA
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              CATEGORIA
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              IDADE
                           </TableCell>
                           {/* PESO substituiu UA */}
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              PESO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              STATUS
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              PASTO
                           </TableCell>
                           {(can("edit_animal") || can("delete_animal")) && (
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
                        {animals.map(animal => (
                           <TableRow
                              key={animal.id}
                              hover
                              onClick={() => navigate(`/animals/${animal.id}`)}
                              sx={{ cursor: "pointer", "&:last-child td": { border: 0 } }}
                           >
                              <TableCell>
                                 <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700, color: "primary.main" }}
                                 >
                                    {animal.currentEarTag ?? "—"}
                                 </Typography>
                                 <Typography variant="caption" color="text.secondary">
                                    {animal.chipId}
                                 </Typography>
                              </TableCell>

                              <TableCell>
                                 <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {animal.name}
                                 </Typography>
                              </TableCell>

                              <TableCell>
                                 <Typography variant="body2" color="text.secondary">
                                    {animal.breed}
                                 </Typography>
                              </TableCell>

                              <TableCell>
                                 <Chip
                                    label={animal.category}
                                    size="small"
                                    sx={{
                                       bgcolor: categoryColor(animal.category),
                                       color: "white",
                                       fontSize: 11,
                                       fontWeight: 700,
                                       height: 22,
                                    }}
                                 />
                              </TableCell>

                              <TableCell>
                                 <Typography variant="body2">
                                    {formatAge(animal.ageInMonths)}
                                 </Typography>
                              </TableCell>

                              {/* Coluna PESO */}
                              <TableCell>
                                 <Typography
                                    variant="body2"
                                    sx={{ fontWeight: animal.weightKg ? 600 : 400 }}
                                    color={animal.weightKg ? "text.primary" : "text.disabled"}
                                 >
                                    {formatWeight(animal.weightKg)}
                                 </Typography>
                              </TableCell>

                              <TableCell>
                                 <Chip
                                    label={statusLabel(animal.status)}
                                    color={statusColor(animal.status)}
                                    size="small"
                                    sx={{ fontSize: 11, height: 22 }}
                                 />
                              </TableCell>

                              <TableCell>
                                 <Typography
                                    variant="body2"
                                    color={animal.pastureName ? "text.primary" : "text.disabled"}
                                 >
                                    {animal.pastureName ?? "Sem pasto"}
                                 </Typography>
                              </TableCell>

                              {(can("edit_animal") || can("delete_animal")) && (
                                 <TableCell align="right" onClick={e => e.stopPropagation()}>
                                    <Box
                                       sx={{
                                          display: "flex",
                                          gap: 0.5,
                                          justifyContent: "flex-end",
                                       }}
                                    >
                                       <Tooltip title="Ver detalhes">
                                          <IconButton
                                             size="small"
                                             onClick={() => navigate(`/animals/${animal.id}`)}
                                             sx={{ color: "text.secondary" }}
                                          >
                                             <InfoOutlinedIcon fontSize="small" />
                                          </IconButton>
                                       </Tooltip>

                                       {can("edit_animal") && (
                                          <Tooltip title="Editar animal">
                                             <IconButton
                                                size="small"
                                                onClick={() => handleOpenEdit(animal)}
                                                sx={{ color: "primary.main" }}
                                                disabled={
                                                   animal.status === "dead" ||
                                                   animal.status === "sold"
                                                }
                                             >
                                                <EditIcon fontSize="small" />
                                             </IconButton>
                                          </Tooltip>
                                       )}

                                       {can("delete_animal") && (
                                          <Tooltip
                                             title={
                                                animal.status === "dead" || animal.status === "sold"
                                                   ? "Animais mortos ou vendidos não podem ser excluídos"
                                                   : "Excluir animal"
                                             }
                                          >
                                             <span>
                                                <IconButton
                                                   size="small"
                                                   onClick={() => setDeleteTarget(animal)}
                                                   sx={{ color: "error.main" }}
                                                   disabled={
                                                      animal.status === "dead" ||
                                                      animal.status === "sold"
                                                   }
                                                >
                                                   <DeleteIcon fontSize="small" />
                                                </IconButton>
                                             </span>
                                          </Tooltip>
                                       )}

                                       {can("edit_animal") && animal.status === "active" && (
                                          <Tooltip title="Registrar venda">
                                             <IconButton
                                                size="small"
                                                onClick={() => setSellTarget(animal)}
                                                sx={{ color: "#F57F17" }}
                                             >
                                                <SellIcon fontSize="small" />
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

         <AnimalFormDialog open={formOpen} animal={editingAnimal} onClose={handleFormClose} />

         <Dialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            maxWidth="xs"
            fullWidth
         >
            <DialogTitle sx={{ fontWeight: 700 }}>Excluir animal?</DialogTitle>
            <DialogContent>
               <DialogContentText>
                  Você está prestes a excluir <strong>{deleteTarget?.name}</strong> (Brinco:{" "}
                  {deleteTarget?.currentEarTag ?? deleteTarget?.chipId}).
                  <br />
                  <br />
                  Esta ação é <strong>permanente</strong> e removerá todos os registros vinculados.
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

         <SellAnimalDialog
            open={!!sellTarget}
            animal={sellTarget}
            onClose={sold => {
               setSellTarget(null);
               if (sold) fetchAnimals();
            }}
         />
      </Box>
   );
}
