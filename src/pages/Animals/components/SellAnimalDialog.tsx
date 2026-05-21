import SellIcon from "@mui/icons-material/Sell";
import {
   Alert,
   Autocomplete,
   Box,
   Button,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   Divider,
   TextField,
   Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Buyer } from "@/pages/Buyers/BuyersPage";
import api from "@/services/api";
import type { AnimalResponse } from "../AnimalsPage";

const STORAGE_KEY = "pecuaria:buyers";

function loadBuyers(): Buyer[] {
   try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
   } catch {
      return [];
   }
}

interface Props {
   open: boolean;
   animal: AnimalResponse | null;
   onClose: (sold: boolean) => void;
}

export default function SellAnimalDialog({ open, animal, onClose }: Props) {
   const navigate = useNavigate();
   const [buyers, setBuyers] = useState<Buyer[]>([]);
   const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
   const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
   const [notes, setNotes] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   useEffect(() => {
      if (open) {
         setBuyers(loadBuyers());
         setSelectedBuyer(null);
         setSaleDate(new Date().toISOString().split("T")[0]);
         setNotes("");
         setError("");
      }
   }, [open]);

   async function handleSell() {
      if (!animal) return;
      setLoading(true);
      setError("");
      try {
         // Atualiza status do animal para "sold"
         // TODO: quando o backend tiver campo buyerId, incluir aqui:
         // await api.put(`/animals/${animal.id}`, { status: "sold", buyerId: selectedBuyer?.id });
         await api.put(`/animals/${animal.id}`, {
            status: "sold",
            // notes: `Vendido para: ${selectedBuyer?.name ?? "não informado"}. ${notes}`.trim(),
         });
         onClose(true);
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao registrar venda.");
      } finally {
         setLoading(false);
      }
   }

   return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
         <DialogTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
               <SellIcon sx={{ color: "primary.main" }} />
               <Typography sx={{ fontWeight: 700 }}>Registrar Venda</Typography>
            </Box>
         </DialogTitle>
         <Divider />
         <DialogContent sx={{ pt: 2 }}>
            {error && (
               <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
               </Alert>
            )}

            {/* Animal que está sendo vendido */}
            <Box
               sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#F0F4F1",
                  border: "1px solid",
                  borderColor: "divider",
                  mb: 2,
               }}
            >
               <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  ANIMAL
               </Typography>
               <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {animal?.name}
               </Typography>
               <Typography variant="caption" color="text.secondary">
                  Brinco: {animal?.currentEarTag ?? "—"} · Chip: {animal?.chipId}
               </Typography>
            </Box>

            {/* Data da venda */}
            <TextField
               fullWidth
               label="Data da Venda *"
               type="date"
               size="small"
               slotProps={{
                  inputLabel: {
                     shrink: true,
                  },
                  htmlInput: {
                     max: new Date().toISOString().split("T")[0],
                  },
               }}
               value={saleDate}
               onChange={e => setSaleDate(e.target.value)}
               sx={{ mb: 2 }}
            />

            {/* Seleção de comprador */}
            <Autocomplete
               options={buyers}
               getOptionLabel={b => b.name}
               value={selectedBuyer}
               onChange={(_, val) => setSelectedBuyer(val)}
               noOptionsText={
                  <Box>
                     <Typography variant="body2" color="text.secondary">
                        Nenhum comprador encontrado.
                     </Typography>
                     <Button
                        size="small"
                        onClick={() => {
                           onClose(false);
                           navigate("/buyers");
                        }}
                     >
                        Cadastrar comprador
                     </Button>
                  </Box>
               }
               renderInput={params => (
                  <TextField
                     {...params}
                     label="Comprador"
                     size="small"
                     helperText="Opcional — cadastre em Compradores para selecionar aqui"
                  />
               )}
               sx={{ mb: 2 }}
            />

            {/* Observações */}
            <TextField
               fullWidth
               label="Observações"
               size="small"
               multiline
               rows={2}
               value={notes}
               onChange={e => setNotes(e.target.value)}
               helperText="Valor da venda, condições, etc."
            />
         </DialogContent>
         <Divider />
         <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => onClose(false)} disabled={loading}>
               Cancelar
            </Button>
            <Button
               variant="contained"
               onClick={handleSell}
               disabled={loading}
               startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SellIcon />}
            >
               {loading ? "Registrando..." : "Confirmar Venda"}
            </Button>
         </DialogActions>
      </Dialog>
   );
}
