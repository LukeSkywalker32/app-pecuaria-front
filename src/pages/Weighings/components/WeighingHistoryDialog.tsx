import {
   Button,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableRow,
} from "@mui/material";

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

interface Props {
   open: boolean;
   animalId: string | null;
   weighings: WeighingResponse[];
   loading: boolean;
   onClose: () => void;
}

export default function WeighingHistoryDialog({
   open,
   animalId,
   weighings,
   loading,
   onClose,
}: Props) {
   return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
         <DialogTitle>Histórico Completo de Pesagens</DialogTitle>
         <DialogContent>
            {loading ? (
               <CircularProgress />
            ) : (
               <Table size="small">
                  <TableHead>
                     <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Peso (kg)</TableCell>
                        <TableCell>GMD</TableCell>
                        <TableCell>Notas</TableCell>
                     </TableRow>
                  </TableHead>
                  <TableBody>
                     {weighings.map(w => (
                        <TableRow key={w.id}>
                           <TableCell>{new Date(w.date).toLocaleDateString("pt-BR")}</TableCell>
                           <TableCell>{w.weightKg.toFixed(1)}</TableCell>
                           <TableCell>{w.gmd !== null ? w.gmd.toFixed(3) : "-"}</TableCell>
                           <TableCell>{w.notes || "-"}</TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            )}
         </DialogContent>
         <DialogActions>
            <Button onClick={onClose}>Fechar</Button>
         </DialogActions>
      </Dialog>
   );
}
