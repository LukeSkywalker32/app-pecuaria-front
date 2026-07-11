// src/pages/Vaccinations/components/VaccinationHistoryDialog.tsx

import CloseIcon from "@mui/icons-material/Close";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import {
   Alert,
   Box,
   Chip,
   CircularProgress,
   Dialog,
   DialogContent,
   DialogTitle,
   IconButton,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   Tooltip,
   Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "@/services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────

interface VaccinationHistoryItem {
   id: string;
   vaccineType: string;
   brand: string;
   batch: string;
   vaccinationDate: string;
   expirationDate: string;
   photos: string[] | null;
   veterinarianName: string | null;
}

interface Props {
   open: boolean;
   animalId: string | null;
   animalName: string | null;
   onClose: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────

export default function VaccinationHistoryDialog({ open, animalId, animalName, onClose }: Props) {
   const [items, setItems] = useState<VaccinationHistoryItem[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   // Fotos sendo exibidas no lightbox no momento (null = fechado)
   const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);

   useEffect(() => {
      if (!open || !animalId) return;
      setLoading(true);
      setError("");
      api.get<VaccinationHistoryItem[]>(`/vaccinations/animal/${animalId}`)
         .then(({ data }) => setItems(data))
         .catch(err => {
            const msg = err?.response?.data?.error ?? "Erro ao carregar histórico de vacinações";
            setError(msg);
         })
         .finally(() => setLoading(false));
   }, [open, animalId]);

   function formatDate(date: string): string {
      return new Date(date).toLocaleDateString("pt-BR");
   }

   function handleCloseHistory() {
      setViewingPhotos(null);
      onClose();
   }

   return (
      <>
         <Dialog open={open} onClose={handleCloseHistory} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>
               Histórico de Vacinações — {animalName}
            </DialogTitle>
            <DialogContent>
               {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                     {error}
                  </Alert>
               )}

               {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                     <CircularProgress />
                  </Box>
               ) : items.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                     Nenhuma vacinação registrada para este animal.
                  </Typography>
               ) : (
                  <TableContainer>
                     <Table size="small">
                        <TableHead>
                           <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Vacina</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Marca</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Lote</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Responsável</TableCell>
                              <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                                 Fotos
                              </TableCell>
                           </TableRow>
                        </TableHead>
                        <TableBody>
                           {items.map(item => {
                              const photoCount = item.photos?.length ?? 0;
                              return (
                                 <TableRow key={item.id} hover>
                                    <TableCell>{item.vaccineType}</TableCell>
                                    <TableCell>{item.brand}</TableCell>
                                    <TableCell>
                                       <Chip label={item.batch} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>{formatDate(item.vaccinationDate)}</TableCell>
                                    <TableCell>{item.veterinarianName ?? "—"}</TableCell>
                                    <TableCell sx={{ textAlign: "center" }}>
                                       {photoCount > 0 ? (
                                          <Tooltip title={`Ver ${photoCount} foto(s)`}>
                                             <IconButton
                                                size="small"
                                                onClick={() => setViewingPhotos(item.photos)}
                                             >
                                                <PhotoLibraryIcon fontSize="small" />
                                             </IconButton>
                                          </Tooltip>
                                       ) : (
                                          <Typography variant="caption" color="text.secondary">
                                             —
                                          </Typography>
                                       )}
                                    </TableCell>
                                 </TableRow>
                              );
                           })}
                        </TableBody>
                     </Table>
                  </TableContainer>
               )}
            </DialogContent>
         </Dialog>

         {/* ── Lightbox simples com as fotos do registro selecionado ── */}
         <Dialog
            open={!!viewingPhotos}
            onClose={() => setViewingPhotos(null)}
            maxWidth="sm"
            fullWidth
         >
            <DialogTitle
               sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
               Fotos do registro
               <IconButton size="small" onClick={() => setViewingPhotos(null)}>
                  <CloseIcon fontSize="small" />
               </IconButton>
            </DialogTitle>
            <DialogContent>
               <Box
                  sx={{
                     display: "grid",
                     gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                     gap: 1.5,
                  }}
               >
                  {viewingPhotos?.map(url => (
                     <Box
                        key={url}
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                           display: "block",
                           borderRadius: 1.5,
                           overflow: "hidden",
                           border: "1px solid",
                           borderColor: "divider",
                           aspectRatio: "1",
                        }}
                     >
                        <Box
                           component="img"
                           src={url}
                           alt="Foto da vacinação"
                           sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                           }}
                        />
                     </Box>
                  ))}
               </Box>
            </DialogContent>
         </Dialog>
      </>
   );
}
