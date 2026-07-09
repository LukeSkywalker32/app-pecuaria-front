import { zodResolver } from "@hookform/resolvers/zod";
import AddIcon from "@mui/icons-material/Add";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import SearchIcon from "@mui/icons-material/Search";
import {
   Alert,
   Box,
   Button,
   Chip,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   Divider,
   IconButton,
   InputAdornment,
   LinearProgress,
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
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAdminFarm } from "@/contexts/AdminFarmContext";
import { usePermission } from "@/hooks/usePermission";
import api from "@/services/api";

// ------- Tipos -------
export interface Farm {
   id: string;
   name: string;
   location: string;
   cnpj: string | null;
   logoUrl: string | null;
   active: boolean;
   createdAt: string;
   updatedAt: string;
}

// Schema Zod para validação do formulário
const schema = z.object({
   name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(50, "Nome deve ter no máximo 50 caracteres"),
   location: z
      .string()
      .min(3, "Localização deve ter pelo menos 3 caracteres")
      .max(100, "Localização deve ter no máximo 100 caracteres"),
   cnpj: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

// ------- NOVO COMPONENTE: FarmLogoUploader -------
function FarmLogoUploader({
   farmId,
   currentLogoUrl,
   onUploadSuccess,
   onUploadError,
   disabled = false,
}: {
   farmId: string;
   currentLogoUrl: string | null;
   onUploadSuccess: (url: string) => void;
   onUploadError: (error: string) => void;
   disabled?: boolean;
}) {
   const inputRef = useRef<HTMLInputElement>(null);
   const [uploading, setUploading] = useState(false);
   const [progress, setProgress] = useState(0);
   const [error, setError] = useState<string | null>(null);

   const handleFileChange = useCallback(
      async (e: ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0];
         if (!file) return;

         setError(null);

         // Valida tipo
         const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
         if (!allowedTypes.includes(file.type)) {
            setError(`Tipo inválido: ${file.type}. Use JPEG, PNG ou WebP.`);
            return;
         }

         // Valida tamanho
         const maxSizeMB = 5;
         if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`Arquivo muito grande. Máx. ${maxSizeMB}MB.`);
            return;
         }

         setUploading(true);
         setProgress(10);

         try {
            const formData = new FormData();
            formData.append("logo", file); // Campo esperado pelo backend: 'logo'

            // Simula progresso
            const progressInterval = setInterval(() => {
               setProgress(prev => Math.min(prev + 15, 85));
            }, 300);

            // Envia direto para /farms/:id/logo (que já tem a lógica de upload testada)
            const { data } = await api.patch<{ logoUrl: string }>(
               `/farms/${farmId}/logo`,
               formData,
               {
                  headers: { "Content-Type": "multipart/form-data" },
               },
            );

            clearInterval(progressInterval);
            setProgress(100);

            setTimeout(() => {
               setUploading(false);
               setProgress(0);
               onUploadSuccess(data.logoUrl);
            }, 400);
         } catch (err: any) {
            clearInterval(progressInterval);
            setUploading(false);
            setProgress(0);
            const msg = err?.response?.data?.error ?? "Erro ao fazer upload da logo.";
            setError(msg);
            onUploadError(msg);
         }
      },
      [farmId, onUploadSuccess, onUploadError],
   );

   const handleClear = useCallback(() => {
      onUploadSuccess("");
      setError(null);
   }, [onUploadSuccess]);

   return (
      <Box>
         <Typography
            variant="caption"
            sx={{
               fontWeight: 700,
               color: disabled ? "text.disabled" : "text.secondary",
               textTransform: "uppercase",
               letterSpacing: 0.8,
               display: "block",
               mb: 1,
            }}
         >
            Logo da Fazenda
         </Typography>

         <Box
            onClick={() => !disabled && !uploading && inputRef.current?.click()}
            sx={{
               position: "relative",
               width: "100%",
               minHeight: 140,
               borderRadius: 2,
               border: "2px dashed",
               borderColor: error ? "error.300" : "divider",
               bgcolor: uploading ? "rgba(27,67,50,0.06)" : currentLogoUrl ? "#F0FFF4" : "#FAFAFA",
               display: "flex",
               flexDirection: "column",
               alignItems: "center",
               justifyContent: "center",
               gap: 1,
               cursor: disabled || uploading ? "default" : "pointer",
               transition: "all 0.2s",
               overflow: "hidden",
               "&:hover":
                  !disabled && !uploading && !currentLogoUrl
                     ? { borderColor: "primary.main", bgcolor: "rgba(27,67,50,0.04)" }
                     : {},
            }}
         >
            {/* Preview da logo */}
            {currentLogoUrl && !uploading && (
               <>
                  <Box
                     component="img"
                     src={currentLogoUrl}
                     alt="Logo Preview"
                     sx={{
                        width: "100%",
                        height: 140,
                        objectFit: "cover",
                        display: "block",
                     }}
                  />
                  {/* Botão de remover */}
                  {!disabled && (
                     <Box
                        sx={{
                           position: "absolute",
                           top: 6,
                           right: 6,
                           bgcolor: "rgba(0,0,0,0.55)",
                           borderRadius: 1,
                        }}
                     >
                        <Tooltip title="Remover logo">
                           <IconButton
                              size="small"
                              onClick={e => {
                                 e.stopPropagation();
                                 handleClear();
                              }}
                              sx={{ color: "white", p: 0.5 }}
                           >
                              <DeleteIcon fontSize="small" />
                           </IconButton>
                        </Tooltip>
                     </Box>
                  )}
                  {/* Botão de substituir */}
                  {!disabled && (
                     <Box
                        onClick={e => e.stopPropagation()}
                        sx={{
                           position: "absolute",
                           bottom: 0,
                           left: 0,
                           right: 0,
                           bgcolor: "rgba(0,0,0,0.55)",
                           py: 0.75,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           gap: 0.5,
                           cursor: "pointer",
                           "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                        }}
                     >
                        <CloudUploadIcon sx={{ fontSize: 14, color: "white" }} />
                        <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>
                           Substituir logo
                        </Typography>
                     </Box>
                  )}
               </>
            )}

            {/* Upload em andamento */}
            {uploading && (
               <Box
                  sx={{
                     display: "flex",
                     flexDirection: "column",
                     alignItems: "center",
                     gap: 1,
                     p: 2,
                  }}
               >
                  <CircularProgress size={32} color="primary" />
                  <Typography variant="caption" color="text.secondary">
                     Enviando logo...
                  </Typography>
                  <Box sx={{ width: "80%" }}>
                     <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 4, borderRadius: 2 }}
                     />
                  </Box>
               </Box>
            )}

            {/* Sem logo */}
            {!currentLogoUrl && !uploading && (
               <Box
                  sx={{
                     display: "flex",
                     flexDirection: "column",
                     alignItems: "center",
                     gap: 0.5,
                     p: 2,
                     textAlign: "center",
                  }}
               >
                  <Box
                     sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: "rgba(27,67,50,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 0.5,
                     }}
                  >
                     <ImageIcon sx={{ color: "primary.main", fontSize: 22 }} />
                  </Box>
                  <Typography
                     variant="body2"
                     sx={{ fontWeight: 700, color: disabled ? "text.disabled" : "text.primary" }}
                  >
                     {disabled ? "Sem logo" : "Clique ou arraste uma imagem"}
                  </Typography>
                  {!disabled && (
                     <Typography variant="caption" color="text.secondary">
                        JPEG, PNG, WebP · Máx. 5MB
                     </Typography>
                  )}
               </Box>
            )}
         </Box>

         {/* Erro */}
         {error && (
            <Alert
               severity="error"
               sx={{ mt: 1, py: 0.5, fontSize: 12 }}
               onClose={() => setError(null)}
            >
               {error}
            </Alert>
         )}

         {/* Input oculto */}
         <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={disabled || uploading}
         />
      </Box>
   );
}

// ------- Dialog de Formulário -------
function FarmFormDialog({
   open,
   farm,
   onClose,
}: {
   open: boolean;
   farm: Farm | null;
   onClose: (saved: boolean, data?: FormData) => void;
}) {
   const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
   } = useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
         name: "",
         location: "",
         cnpj: "",
      },
   });

   const [logoUrl, setLogoUrl] = useState<string | null>(null);
   const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

   // Atualiza o formulário quando o dialog abre
   useEffect(() => {
      if (open) {
         reset({
            name: farm?.name ?? "",
            location: farm?.location ?? "",
            cnpj: farm?.cnpj ?? "",
         });
         setLogoUrl(farm?.logoUrl ?? null);
         setLogoUploadError(null);
      }
   }, [open, farm, reset]);

   function onSubmit(data: FormData) {
      onClose(true, data);
   }

   return (
      <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
         <DialogTitle sx={{ fontWeight: 700 }}>
            {farm ? "Editar Fazenda" : "Nova Fazenda"}
         </DialogTitle>
         <Divider />
         <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent sx={{ pt: 2 }}>
               <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  {/* Nome */}
                  <TextField
                     label="Nome da Fazenda"
                     size="small"
                     error={!!errors.name}
                     helperText={errors.name?.message}
                     fullWidth
                     sx={{ gridColumn: "1 / -1" }}
                     {...register("name")}
                  />

                  {/* Localização */}
                  <TextField
                     label="Localização"
                     size="small"
                     error={!!errors.location}
                     helperText={errors.location?.message}
                     fullWidth
                     sx={{ gridColumn: "1 / -1" }}
                     {...register("location")}
                  />

                  {/* CNPJ */}
                  <TextField
                     label="CNPJ"
                     size="small"
                     placeholder="00.000.000/0001-00"
                     error={!!errors.cnpj}
                     helperText={errors.cnpj?.message || "Opcional"}
                     {...register("cnpj")}
                  />

                  {/* Logo - Usa upload direto para /farms/:id/logo (só para edição) */}
                  {farm && (
                     <Box sx={{ gridColumn: "1 / -1" }}>
                        <FarmLogoUploader
                           farmId={farm.id}
                           currentLogoUrl={logoUrl}
                           onUploadSuccess={url => setLogoUrl(url)}
                           onUploadError={err => setLogoUploadError(err)}
                        />
                        {logoUploadError && (
                           <Alert severity="error" sx={{ mt: 1, py: 0.5, fontSize: 12 }}>
                              {logoUploadError}
                           </Alert>
                        )}
                     </Box>
                  )}
                  {!farm && (
                     <Box sx={{ gridColumn: "1 / -1" }}>
                        <Alert severity="info" sx={{ py: 0.5, fontSize: 12 }}>
                           <strong>Nota:</strong> Crie a fazenda primeiro. Depois, edite-a para
                           adicionar a logo.
                        </Alert>
                     </Box>
                  )}
               </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
               <Button onClick={() => onClose(false)} sx={{ padding: "10px" }}>
                  Cancelar
               </Button>
               <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ padding: "10px" }}
               >
                  {farm ? "Salvar Alterações" : "Cadastrar Fazenda"}
               </Button>
            </DialogActions>
         </form>
      </Dialog>
   );
}

// ------- Página Principal -------
export default function FarmsPage() {
   const { can } = usePermission();
   const { refetchFarms } = useAdminFarm();
   const [farms, setFarms] = useState<Farm[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [search, setSearch] = useState("");
   const [formOpen, setFormOpen] = useState(false);
   const [editing, setEditing] = useState<Farm | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<Farm | null>(null);
   const [activateTarget, setActivateTarget] = useState<Farm | null>(null);
   const [deactivateTarget, setDeactivateTarget] = useState<Farm | null>(null);
   const [toast, setToast] = useState<{ message: string; severity: "success" | "error" } | null>(
      null,
   );

   // Busca todas as fazendas (admin vê todas)
   const fetchFarms = useCallback(async () => {
      try {
         setLoading(true);
         const response = await api.get<Farm[]>("/farms");
         setFarms(response.data);
         setError("");
      } catch (err: any) {
         setError(err?.response?.data?.error ?? "Erro ao carregar fazendas.");
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchFarms();
   }, [fetchFarms]);

   // Filtra fazendas por busca
   const filtered = farms.filter(
      f =>
         f.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
         f.location.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
         (f.cnpj?.includes(search.replace(/\D/g, "")) ?? false),
   );

   // Feedback visual (toast)
   useEffect(() => {
      if (toast) {
         const timer = setTimeout(() => setToast(null), 6000);
         return () => clearTimeout(timer);
      }
   }, [toast]);

   // Salvar fazenda (criar ou editar)
   async function handleFormClose(saved: boolean, data?: FormData) {
      setFormOpen(false);
      if (!saved || !data) return;

      try {
         if (editing) {
            // Editar fazenda existente (logo é enviada separadamente via /farms/:id/logo)
            const payload = {
               name: data.name,
               location: data.location,
               cnpj: data.cnpj || null,
            };
            await api.put(`/farms/${editing.id}`, payload);

            setToast({ message: "Fazenda atualizada com sucesso!", severity: "success" });
         } else {
            // Criar nova fazenda
            const payload = {
               name: data.name,
               location: data.location,
               cnpj: data.cnpj || null,
            };
            await api.post<Farm>("/farms", payload);

            setToast({
               message: "Fazenda criada com sucesso! Edite-a para adicionar a logo.",
               severity: "success",
            });
         }

         // Atualiza a lista e o contexto do admin
         await fetchFarms();
         if (refetchFarms) refetchFarms();
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao salvar fazenda.";
         setToast({ message: msg, severity: "error" });
      }
      setEditing(null);
   }

   // Excluir fazenda
   async function handleDelete() {
      if (!deleteTarget) return;
      try {
         await api.delete(`/farms/${deleteTarget.id}`);
         setToast({ message: "Fazenda removida com sucesso!", severity: "success" });
         await fetchFarms();
         if (refetchFarms) refetchFarms();
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao excluir fazenda.";
         setToast({ message: msg, severity: "error" });
      }
      setDeleteTarget(null);
   }

   // Ativar fazenda
   async function handleActivate() {
      if (!activateTarget) return;
      try {
         await api.patch(`/farms/${activateTarget.id}/activate`);
         setToast({ message: "Fazenda ativada com sucesso!", severity: "success" });
         await fetchFarms();
         if (refetchFarms) refetchFarms();
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao ativar fazenda.";
         setToast({ message: msg, severity: "error" });
      }
      setActivateTarget(null);
   }

   // Desativar fazenda
   async function handleDeactivate() {
      if (!deactivateTarget) return;
      try {
         await api.patch(`/farms/${deactivateTarget.id}/deactivate`);
         setToast({ message: "Fazenda desativada com sucesso!", severity: "success" });
         await fetchFarms();
         if (refetchFarms) refetchFarms();
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao desativar fazenda.";
         setToast({ message: msg, severity: "error" });
      }
      setDeactivateTarget(null);
   }

   return (
      <Box sx={{ p: 3, maxWidth: 1000 }}>
         {/* Toast de feedback */}
         {toast && (
            <Alert
               severity={toast.severity}
               sx={{ mb: 2, position: "fixed", top: 20, right: 20, zIndex: 9999, width: "auto" }}
               onClose={() => setToast(null)}
            >
               {toast.message}
            </Alert>
         )}

         {/* Header */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <AgricultureIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                     Fazendas
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     {farms.length} fazenda{farms.length !== 1 && "s"} cadastrada
                     {farms.length !== 1 && "s"}
                  </Typography>
               </Box>
            </Box>
            {can("create_farm") && (
               <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                     setEditing(null);
                     setFormOpen(true);
                  }}
                  sx={{ padding: "16px" }}
               >
                  Nova Fazenda
               </Button>
            )}
         </Box>

         {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
               {error}
            </Alert>
         )}

         {/* Busca */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}
         >
            <TextField
               fullWidth
               size="small"
               placeholder="Buscar por nome, localização ou CNPJ..."
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

         {/* Tabela */}
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
               <Box sx={{ textAlign: "center", py: 8 }}>
                  <CircularProgress />
               </Box>
            ) : filtered.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <AgricultureIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     {search ? "Nenhuma fazenda encontrada" : "Nenhuma fazenda cadastrada ainda"}
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
                              LOCALIZAÇÃO
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              CNPJ
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              STATUS
                           </TableCell>
                           <TableCell
                              sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           >
                              LOGO
                           </TableCell>
                           {can("edit_farm") && (
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
                        {filtered.map(farm => (
                           <TableRow key={farm.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                              <TableCell>
                                 <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {farm.name}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2" color="text.secondary">
                                    {farm.location}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Typography variant="body2" color="text.secondary">
                                    {farm.cnpj || "—"}
                                 </Typography>
                              </TableCell>
                              <TableCell>
                                 <Chip
                                    label={farm.active ? "Ativa" : "Inativa"}
                                    color={farm.active ? "success" : "default"}
                                    size="small"
                                    icon={
                                       farm.active ? (
                                          <CheckCircleIcon fontSize="small" />
                                       ) : undefined
                                    }
                                 />
                              </TableCell>
                              <TableCell>
                                 {farm.logoUrl ? (
                                    <Box
                                       component="img"
                                       src={farm.logoUrl}
                                       alt="Logo"
                                       sx={{
                                          width: 40,
                                          height: 40,
                                          objectFit: "cover",
                                          borderRadius: 1,
                                       }}
                                    />
                                 ) : (
                                    <ImageIcon sx={{ color: "text.disabled", fontSize: 24 }} />
                                 )}
                              </TableCell>
                              {can("edit_farm") && (
                                 <TableCell align="right">
                                    <Tooltip title="Editar">
                                       <IconButton
                                          size="small"
                                          onClick={() => {
                                             setEditing(farm);
                                             setFormOpen(true);
                                          }}
                                       >
                                          <EditIcon
                                             fontSize="small"
                                             sx={{ color: "primary.main" }}
                                          />
                                       </IconButton>
                                    </Tooltip>

                                    {farm.active ? (
                                       <Tooltip title="Desativar">
                                          <IconButton
                                             size="small"
                                             onClick={() => setDeactivateTarget(farm)}
                                          >
                                             <CheckCircleIcon
                                                fontSize="small"
                                                sx={{ color: "warning.main" }}
                                             />
                                          </IconButton>
                                       </Tooltip>
                                    ) : (
                                       <Tooltip title="Ativar">
                                          <IconButton
                                             size="small"
                                             onClick={() => setActivateTarget(farm)}
                                          >
                                             <CheckCircleIcon
                                                fontSize="small"
                                                sx={{ color: "success.main" }}
                                             />
                                          </IconButton>
                                       </Tooltip>
                                    )}

                                    <Tooltip title="Excluir">
                                       <IconButton
                                          size="small"
                                          onClick={() => setDeleteTarget(farm)}
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

         {/* Dialogs */}
         <FarmFormDialog open={formOpen} farm={editing} onClose={handleFormClose} />

         {/* Dialog de Exclusão */}
         <Dialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            maxWidth="xs"
            fullWidth
         >
            <DialogTitle sx={{ fontWeight: 700 }}>Excluir Fazenda?</DialogTitle>
            <DialogContent>
               <Typography variant="body2">
                  Você está prestes a remover <strong>{deleteTarget?.name}</strong> do cadastro.
                  <br />
                  <Alert severity="warning" sx={{ mt: 2, py: 0.5, fontSize: 12 }}>
                     Todos os dados relacionados (animais, usuários, pastos, etc.) também serão
                     removidos permanentemente.
                  </Alert>
               </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
               <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
               <Button variant="contained" color="error" onClick={handleDelete}>
                  Excluir
               </Button>
            </DialogActions>
         </Dialog>

         {/* Dialog de Ativação */}
         <Dialog
            open={!!activateTarget}
            onClose={() => setActivateTarget(null)}
            maxWidth="xs"
            fullWidth
         >
            <DialogTitle sx={{ fontWeight: 700 }}>Ativar Fazenda?</DialogTitle>
            <DialogContent>
               <Typography variant="body2">
                  Você está prestes a ativar <strong>{activateTarget?.name}</strong>.
               </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
               <Button onClick={() => setActivateTarget(null)}>Cancelar</Button>
               <Button variant="contained" color="success" onClick={handleActivate}>
                  Ativar
               </Button>
            </DialogActions>
         </Dialog>

         {/* Dialog de Desativação */}
         <Dialog
            open={!!deactivateTarget}
            onClose={() => setDeactivateTarget(null)}
            maxWidth="xs"
            fullWidth
         >
            <DialogTitle sx={{ fontWeight: 700 }}>Desativar Fazenda?</DialogTitle>
            <DialogContent>
               <Typography variant="body2">
                  Você está prestes a desativar <strong>{deactivateTarget?.name}</strong>.
                  <br />
                  <Alert severity="info" sx={{ mt: 2, py: 0.5, fontSize: 12 }}>
                     A fazenda não será excluída, mas não aparecerá mais para os usuários.
                  </Alert>
               </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
               <Button onClick={() => setDeactivateTarget(null)}>Cancelar</Button>
               <Button variant="contained" color="warning" onClick={handleDeactivate}>
                  Desativar
               </Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
}
