import AddIcon from "@mui/icons-material/Add";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
   Alert,
   Box,
   Button,
   CircularProgress,
   Paper,
   Tab,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   Tabs,
   Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import api from "@/services/api";
import MoveAnimalDialog from "./components/MoveAnimalDialog";
import MoveBatchDialog from "./components/MoveBatchDialog";

// --- TIPOS VINDOS DA API ---
export interface ManagementResponse {
   id: string;
   animalId: string;
   originPasture: string;
   destinationPasture: string;
   movementDate: string;
   reason: string;
   employee: string;
   farmId: string;
   createdAt: string;
}

function formatDate(dateStr: string): string {
   const date = new Date(dateStr);
   return date.toLocaleDateString("pt-BR");
}

function formatDateTime(dateStr: string): string {
   const date = new Date(dateStr);
   return date.toLocaleString("pt-BR");
}

// --- Componente Principal ---
export default function ManagementPage() {
   const { can } = usePermission();

   const [managements, setManagements] = useState<ManagementResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [tab, setTab] = useState(0);

   const [moveAnimalDialogOpen, setMoveAnimalDialogOpen] = useState(false);
   const [moveBatchDialogOpen, setMoveBatchDialogOpen] = useState(false);

   const fetchManagements = useCallback(async () => {
      setLoading(true);
      setError("");
      try {
         const { data } = await api.get<ManagementResponse[]>("/management");
         setManagements(Array.isArray(data) ? data : []);
      } catch {
         setError("Não foi possível carregar o histórico de movimentações. Tente novamente.");
         setManagements([]);
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchManagements();
   }, [fetchManagements]);

   function handleMoveAnimalClose(saved: boolean) {
      setMoveAnimalDialogOpen(false);
      if (saved) fetchManagements();
   }

   function handleMoveBatchClose(saved: boolean) {
      setMoveBatchDialogOpen(false);
      if (saved) fetchManagements();
   }

   return (
      <Box sx={{ p: 3, maxWidth: "1400px" }}>
         {/* ── Cabeçalho ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <SwapHorizIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography
                     variant="h5"
                     sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
                  >
                     Manejo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     Histórico de movimentações de animais
                  </Typography>
               </Box>
            </Box>

            {can("register_management") && (
               <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                     variant="outlined"
                     startIcon={<AddIcon />}
                     onClick={() => setMoveAnimalDialogOpen(true)}
                     sx={{ borderColor: "divider", color: "text.secondary" }}
                  >
                     Animal Individual
                  </Button>
                  <Button
                     variant="contained"
                     startIcon={<AddIcon />}
                     onClick={() => setMoveBatchDialogOpen(true)}
                  >
                     Lote de Animais
                  </Button>
               </Box>
            )}
         </Box>

         {/* ── Erro ── */}
         {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
               {error}
            </Alert>
         )}

         {/* ── Abas ── */}
         <Paper
            elevation={0}
            sx={{
               border: "1px solid",
               borderColor: "divider",
               borderRadius: 2,
               overflow: "hidden",
            }}
         >
            <Tabs
               value={tab}
               onChange={(_, v) => setTab(v)}
               sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#F9FAFB",
                  "& .MuiTab-root": { fontSize: 13, textTransform: "none", fontWeight: 600 },
               }}
            >
               <Tab label={`Todas (${managements.length})`} />
               <Tab label="Últimas Movimentações" />
            </Tabs>

            {/* ── Aba 1: Todas as Movimentações ── */}
            {tab === 0 && (
               <Box>
                  {loading ? (
                     <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress color="primary" />
                     </Box>
                  ) : managements.length === 0 ? (
                     <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                        <SwapHorizIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                           Nenhuma movimentação registrada
                        </Typography>
                        <Typography variant="caption">
                           {can("register_management")
                              ? 'Clique em "Animal Individual" ou "Lote de Animais" para começar'
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
                                    ORIGEM
                                 </TableCell>
                                 <TableCell
                                    sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                                 >
                                    DESTINO
                                 </TableCell>
                                 <TableCell
                                    sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                                 >
                                    MOTIVO
                                 </TableCell>
                                 <TableCell
                                    sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                                 >
                                    RESPONSÁVEL
                                 </TableCell>
                              </TableRow>
                           </TableHead>

                           <TableBody>
                              {managements.map(management => (
                                 <TableRow
                                    key={management.id}
                                    hover
                                    sx={{ "&:last-child td": { border: 0 } }}
                                 >
                                    <TableCell>
                                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {formatDate(management.movementDate)}
                                       </Typography>
                                       <Typography variant="caption" color="text.secondary">
                                          {new Date(management.movementDate).toLocaleTimeString(
                                             "pt-BR",
                                             {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                             },
                                          )}
                                       </Typography>
                                    </TableCell>
                                    <TableCell>
                                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {management.animalId}
                                       </Typography>
                                    </TableCell>
                                    <TableCell>
                                       <Typography variant="body2">
                                          {management.originPasture}
                                       </Typography>
                                    </TableCell>
                                    <TableCell>
                                       <Typography
                                          variant="body2"
                                          sx={{ color: "success.main", fontWeight: 600 }}
                                       >
                                          {management.destinationPasture}
                                       </Typography>
                                    </TableCell>
                                    <TableCell>
                                       <Typography variant="body2">{management.reason}</Typography>
                                    </TableCell>
                                    <TableCell>
                                       <Typography variant="body2">
                                          {management.employee}
                                       </Typography>
                                    </TableCell>
                                 </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </TableContainer>
                  )}
               </Box>
            )}

            {/* ── Aba 2: Últimas Movimentações ── */}
            {tab === 1 && (
               <Box>
                  {loading ? (
                     <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress color="primary" />
                     </Box>
                  ) : managements.length === 0 ? (
                     <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                        <SwapHorizIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                           Nenhuma movimentação registrada
                        </Typography>
                     </Box>
                  ) : (
                     <Box sx={{ p: 2 }}>
                        {managements.slice(0, 10).map((management, idx) => (
                           <Box
                              key={management.id}
                              sx={{
                                 pb: 2,
                                 mb: 2,
                                 borderBottom:
                                    idx < managements.slice(0, 10).length - 1
                                       ? "1px solid"
                                       : "none",
                                 borderColor: "divider",
                              }}
                           >
                              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                 <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {management.animalId}
                                 </Typography>
                                 <Typography variant="caption" color="text.secondary">
                                    {formatDateTime(management.movementDate)}
                                 </Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                 <Typography variant="body2" color="text.secondary">
                                    {management.originPasture}
                                 </Typography>
                                 <SwapHorizIcon sx={{ fontSize: 16, color: "primary.main" }} />
                                 <Typography
                                    variant="body2"
                                    sx={{ color: "success.main", fontWeight: 600 }}
                                 >
                                    {management.destinationPasture}
                                 </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                 <strong>Motivo:</strong> {management.reason}
                              </Typography>
                              <Typography
                                 variant="caption"
                                 color="text.secondary"
                                 sx={{ display: "block" }}
                              >
                                 <strong>Responsável:</strong> {management.employee}
                              </Typography>
                           </Box>
                        ))}
                     </Box>
                  )}
               </Box>
            )}
         </Paper>

         {/* ── Dialogs ── */}
         <MoveAnimalDialog open={moveAnimalDialogOpen} onClose={handleMoveAnimalClose} />
         <MoveBatchDialog open={moveBatchDialogOpen} onClose={handleMoveBatchClose} />
      </Box>
   );
}
