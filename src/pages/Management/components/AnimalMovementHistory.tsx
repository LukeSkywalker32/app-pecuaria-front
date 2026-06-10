import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
   Box,
   CircularProgress,
   Paper,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "@/services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────
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

interface Props {
   animalId: string;
}

function formatDate(dateStr: string): string {
   const date = new Date(dateStr);
   return date.toLocaleDateString("pt-BR");
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function AnimalMovementHistory({ animalId }: Props) {
   const [movements, setMovements] = useState<ManagementResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      if (!animalId) return;

      setLoading(true);
      setError("");
      api.get<ManagementResponse[]>(`/management/animal/${animalId}`)
         .then(({ data }) => setMovements(data))
         .catch(() => {
            setError("Não foi possível carregar o histórico de movimentações.");
            setMovements([]);
         })
         .finally(() => setLoading(false));
   }, [animalId]);

   if (loading) {
      return (
         <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress color="primary" size={32} />
         </Box>
      );
   }

   if (error) {
      return (
         <Box sx={{ textAlign: "center", py: 4, color: "error.main" }}>
            <Typography variant="body2">{error}</Typography>
         </Box>
      );
   }

   if (movements.length === 0) {
      return (
         <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            <Typography variant="body2">
               Nenhuma movimentação registrada para este animal.
            </Typography>
         </Box>
      );
   }

   return (
      <TableContainer
         component={Paper}
         elevation={0}
         sx={{ border: "1px solid", borderColor: "divider" }}
      >
         <Table size="small">
            <TableHead>
               <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                     DATA
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                     ORIGEM
                  </TableCell>
                  <TableCell
                     sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                     align="center"
                  >
                     →
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                     DESTINO
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                     MOTIVO
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                     RESPONSÁVEL
                  </TableCell>
               </TableRow>
            </TableHead>

            <TableBody>
               {movements.map(movement => (
                  <TableRow key={movement.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                     <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           {formatDate(movement.movementDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                           {new Date(movement.movementDate).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                           })}
                        </Typography>
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2">{movement.originPasture}</Typography>
                     </TableCell>
                     <TableCell align="center">
                        <ArrowForwardIcon sx={{ fontSize: 16, color: "primary.main" }} />
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
                           {movement.destinationPasture}
                        </Typography>
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2">{movement.reason}</Typography>
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2">{movement.employee}</Typography>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </TableContainer>
   );
}
