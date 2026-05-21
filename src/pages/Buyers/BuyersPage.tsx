import { zodResolver } from "@hookform/resolvers/zod";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SearchIcon from "@mui/icons-material/Search";
import {
   Alert,
   Box,
   Button,
   Dialog,
   DialogActions,
   DialogContent,
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
import {useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { usePermission } from "@/hooks/usePermission";

//-------- Tipo de comprador --------
export interface Buyer {
   id: string;
   name: string;
   document: string; // CPF ou CNPJ
   phone: string;
   email: string;
   city: string;
   notes: string;
   createdAt: string;
}
// -----Schema Zod ----
const schema = z.object({
   name: z
      .string()
      .min(3, "Nome deve ter pelo menos 3 caracteres")
      .max(50, "Nome deve ter no máximo 50 caracteres"),
   document: z.string().optional().or(z.literal("")),
   phone: z.string().optional().or(z.literal("")),
   email: z.string().email("Email invalido").optional().or(z.literal("")),
   city: z.string().optional().or(z.literal("")),
   notes: z
      .string()
      .max(500, "Notas deve ter no máximo 500 caracteres")
      .optional()
      .or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

// ─── Cadastro temporário em localStorage ─────────────────────────
// TODO: migrar para /api/buyers quando o backend tiver o módulo pronto

const STORAGE_KEY = "pecuaria:buyers";
function loadBuyers(): Buyer[] {
   try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
   } catch {
      return [];
   }
}
function saveBuyers(list: Buyer[]) {
   localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ─── Dialog de formulário ─────────────────────────────────────────────────
function BuyerFormDialog({
   open,
   buyer,
   onClose,
}: {
   open: boolean;
   buyer: Buyer | null;
   onClose: (saved: boolean, data?: FormData) => void;
}) {
   const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
   } = useForm<FormData>({ resolver: zodResolver(schema) });

   useEffect(() => {
      if (open) {
         reset({
            name: buyer?.name ?? "",
            document: buyer?.document ?? "",
            phone: buyer?.phone ?? "",
            email: buyer?.email ?? "",
            city: buyer?.city ?? "",
            notes: buyer?.notes ?? "",
         });
      }
   }, [open, buyer, reset]);

   function onSubmit(data: FormData) {
      onClose(true, data);
   }
   return (
      <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
         <DialogTitle sx={{ fontWeight: 700 }}>
            {buyer ? "Editar Comprador" : "Novo Comprador"}
         </DialogTitle>
         <Divider />
         <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent sx={{ pt: 2 }}>
               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 'fr", gap: 2 }}>
                  <TextField
                     label="Nome / Razão Social"
                     size="small"
                     error={!!errors.name}
                     helperText={errors.name?.message}
                     fullWidth
                     sx={{ gridColumn: "1 / -1" }}
                     {...register("name")}
                  />
                  <TextField
                     label="CPF / CNPJ"
                     size="small"
                     helperText="Opcional"
                     {...register("document")}
                  />
                  <TextField
                     label="Telefone"
                     size="small"
                     helperText="Opcional"
                     {...register("phone")}
                  />
                  <TextField
                     label="Email"
                     size="small"
                     type="email"
                     error={!!errors.email}
                     helperText={errors.email?.message}
                     {...register("email")}
                  />
                  <TextField label="Cidade" size="small" {...register("city")} />
                  <TextField
                     label="Observações"
                     size="small"
                     multiline
                     rows={4}
                     helperText={errors.notes?.message}
                     sx={{ gridColumn: "1 / -1" }}
                     {...register("notes")}
                  />
               </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
               <Button onClick={() => onClose(false)}>Cancelar</Button>
               <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {buyer ? "Salvar Alterações" : "Cadastrar"}
               </Button>
            </DialogActions>
         </form>
      </Dialog>
   );
}
// Página Principal
export default function BuyersPage() {
   const { can } = usePermission();
   const [buyers, setBuyers] = useState<Buyer[]>(loadBuyers);
   const [search, setSearch] = useState("");
   const [formOpen, setFormOpen] = useState(false);
   const [editing, setEditing] = useState<Buyer | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<Buyer | null>(null);

   // Persiste sempre que a lista muda
   useEffect(() => {
      saveBuyers(buyers);
   }, [buyers]);

   const filtered = buyers.filter(
      b =>
         b.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
         b.document.includes(search) ||
         b.city.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
   );
   function handleFormClose(saved: boolean, data?: FormData) {
      setFormOpen(false);
      if (!saved || !data) return;
      if (editing) {
         // Editar Existente
         setBuyers(prev => prev.map(b => (b.id === editing.id ? { ...b, ...data } : b)));
      } else {
         // Criar novo com ID local
         const novo: Buyer = {
            id: `buyer-${Date.now()}`,
            name: data.name,
            document: data.document ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            city: data.city ?? "",
            notes: data.notes ?? "",
            createdAt: new Date().toISOString(),
         };
         setBuyers(prev => [...prev, novo]);
      }
      setEditing(null);
   }
   function handleDelete() {
      if (!deleteTarget) return;
      setBuyers(prev => prev.filter(b => b.id !== deleteTarget.id));
      setDeleteTarget(null);
   }
   return (
      <Box sx={{ p: 3, maxWidth: 1000 }}>
         {/* ── Header ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <PeopleAltIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                     Compradores
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     {buyers.length} comprador{buyers.length !== 1 && "es"} cadastrados
                  </Typography>
               </Box>
            </Box>
            {can("edit_animal") && (
               <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                     setEditing(null);
                     setFormOpen(true);
                  }}
               >
                  Novo Comprador
               </Button>
            )}
         </Box>

         {/* ── Aviso de armazenamento local ── */}
         <Alert severity="warning" sx={{ mb: 2 }}>
            Os compradores estão armazenados localmente neste dispositivo. A integração com o
            servidor será ativada em breve.
         </Alert>

         {/* ── Busca ── */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}
         >
            <TextField
               fullWidth
               size="small"
               placeholder="Buscar por nome, CPF/CNPJ ou cidade..."
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
            {filtered.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <PeopleAltIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     {search ? "Nenhum comprador encontrado" : "Nenhum comprador cadastrado ainda"}
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
                              NOME
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              CPF / CNPJ
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              CONTATO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              CIDADE
                           </TableCell>
                           {can("edit_animal") && (
                              <TableCell
                                 align="right"
                                 sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                              >
                                 AÇÕES
                              </TableCell>
                           )}
                        </TableRow>
                     </TableHead>
                     <TableBody>
                        {filtered.map(buyer => (
                           <TableRow key={buyer.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                              <TableCell>
                                 <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {buyer.name}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2" color="text.secondary">
                                    {buyer.document || "—"}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2">{buyer.phone || "—"}</Typography>
                                 <Typography variant="caption" color="text.secondary">
                                    {buyer.email || ""}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2" color="text.secondary">
                                    {buyer.city || "—"}
                                 </Typography>
                              </TableCell>
                              {can("edit_animal") && (
                                 <TableCell align="right">
                                    <Tooltip title="Editar">
                                       <IconButton
                                          size="small"
                                          onClick={() => {
                                             setEditing(buyer);
                                             setFormOpen(true);
                                          }}
                                       >
                                          <EditIcon
                                             fontSize="small"
                                             sx={{ color: "primary.main" }}
                                          />
                                       </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Excluir">
                                       <IconButton
                                          size="small"
                                          onClick={() => setDeleteTarget(buyer)}
                                       >
                                          <DeleteIcon
                                             fontSize="small"
                                             sx={{ color: "error.main" }}
                                          />
                                       </IconButton>
                                    </Tooltip>
                                 </TableCell>
                              )}
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </TableContainer>
            )}
         </Paper>

         {/* ── Dialogs ── */}
         <BuyerFormDialog open={formOpen} buyer={editing} onClose={handleFormClose} />

         <Dialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            maxWidth="xs"
            fullWidth
         >
            <DialogTitle sx={{ fontWeight: 700 }}>Excluir comprador?</DialogTitle>
            <DialogContent>
               <Typography variant="body2">
                  Você está prestes a remover <strong>{deleteTarget?.name}</strong> do cadastro.
               </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
               <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
               <Button variant="contained" color="error" onClick={handleDelete}>
                  Excluir
               </Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
}
