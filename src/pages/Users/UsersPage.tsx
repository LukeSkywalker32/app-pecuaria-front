import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PeopleIcon from "@mui/icons-material/People";
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
   Menu,
   MenuItem,
   Paper,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   TextField,
   Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts//useAuth";
import { usePermission } from "@/hooks/usePermission";
import api from "@/services/api";
import UserFormDialog from "./UserFormDialog";

// ----- TIPOS -----
export interface UserResponse {
   id: string;
   fullName: string;
   username: string;
   email: string;
   phone: string | null;
   role: string;
   active: boolean;
   farmName: string;
   crmv: string | null;
   graduationDate: string | null;
   specialties: string[] | null;
   lastLogin: string | null;
   createdAt: string;
}
function roleLabel(role: string): string {
   return (
      {
         admin: "Administrador",
         owner: "Proprietário",
         farmmanager: "Gerente",
         veterinarian: "Veterinário",
      }[role] || role
   );
}
function roleColor(role: string): any {
   return (
      {
         admin: "error",
         owner: "warning",
         farmmanager: "info",
         veterinarian: "success",
      }[role] || "default"
   );
}

export default function UsersPage() {
   const { user: authUser } = useAuth();
   const { can } = usePermission();

   const [users, setUsers] = useState<UserResponse[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [searchTerm, setSearchTerm] = useState("");
   const [roleFilter, setRoleFilter] = useState("");
   const [activeFilter, setActiveFilter] = useState<boolean | "">("");

   const [formDialogOpen, setFormDialogOpen] = useState(false);
   const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
   const [deleteLoading, setDeleteLoading] = useState(false);

   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
   const [menuUser, setMenuUser] = useState<UserResponse | null>(null);

   //Verifica se o usuario tem acesso a tela
   const hasAccess = authUser?.role === "admin" || authUser?.role === "owner";
   const fetchUsers = useCallback(async () => {
      if (!hasAccess) return;

      setLoading(true);
      setError("");
      try {
         let url = `/users`;
         const params = new URLSearchParams();

         if (roleFilter) params.append("role", roleFilter);
         if (activeFilter !== "") params.append("active", String(activeFilter));
         if (searchTerm) params.append("search", searchTerm);

         if (params.toString()) url += `?${params.toString()}`;

         const { data } = await api.get<UserResponse[]>(url);
         setUsers(Array.isArray(data) ? data : []);
      } catch (err: any) {
         setError("Não foi possivel carregar os usuários");
         setUsers([]);
      } finally {
         setLoading(false);
      }
   }, [hasAccess, roleFilter, activeFilter, searchTerm]);
   useEffect(() => {
      fetchUsers();
   }, [fetchUsers]);

   function handleOpenMenu(event: React.MouseEvent<HTMLButtonElement>, user: UserResponse) {
      setAnchorEl(event.currentTarget);
      setMenuUser(user);
   }
   function handleCloseMenu() {
      setAnchorEl(null);
      setMenuUser(null);
   }
   function handleEditUser(user: UserResponse) {
      setEditingUser(user);
      setFormDialogOpen(true);
      handleCloseMenu();
   }
   function handleDeleteUser(user: UserResponse) {
      setDeleteDialogOpen(true);
      setUserToDelete(user);
      handleCloseMenu();
   }
   async function confirmDelete() {
      if (!userToDelete) return;

      setDeleteLoading(true);
      try {
         await api.delete(`/users/${userToDelete.id}`);
         setUsers(users.filter(u => u.id !== userToDelete.id));
         setDeleteDialogOpen(false);
         setUserToDelete(null);
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao deletar usuário";
         setError(msg);
      } finally {
         setDeleteLoading(false);
      }
   }
   function handleFormClose(saved: boolean) {
      setFormDialogOpen(false);
      setEditingUser(null);
      if (saved) fetchUsers();
   }
   // Filtro usuários localmente
   const filteredUsers = users.filter(user => {
      const matchesSearch =
         !searchTerm ||
         user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.email.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
   });

   if (!hasAccess) {
      return (
         <Box>
            <Alert severity="warning">
               Você não tem permissão para acessar essa página. Apenas Administradores e
               Proprietários podem gerenciar o usuários
            </Alert>
         </Box>
      );
   }

   return (
      <Box sx={{ p: 3, maxWidth: "1400px" }}>
         {/* ── Cabeçalho ── */}
         <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
               <PeopleIcon sx={{ color: "primary.main", fontSize: 28 }} />
               <Box>
                  <Typography
                     variant="h5"
                     sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
                  >
                     Usuários
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     Gerencie os usuários da sua fazenda
                  </Typography>
               </Box>
            </Box>

            {can("create_user") && (
               <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                     setEditingUser(null);
                     setFormDialogOpen(true);
                  }}
               >
                  Novo Usuário
               </Button>
            )}
         </Box>

         {/* ── Erro ── */}
         {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
               {error}
            </Alert>
         )}

         {/* ── Filtros ── */}
         <Paper
            elevation={0}
            sx={{
               p: 2,
               mb: 3,
               border: "1px solid",
               borderColor: "divider",
               borderRadius: 2,
               bgcolor: "#F9FAFB",
            }}
         >
            <Box
               sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 2,
               }}
            >
               <TextField
                  size="small"
                  placeholder="Buscar por nome, username ou email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
               />

               <TextField
                  select
                  size="small"
                  label="Filtrar por Role"
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
               >
                  <MenuItem value="">Todos os Roles</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="owner">Proprietário</MenuItem>
                  <MenuItem value="farmmanager">Gerente</MenuItem>
                  <MenuItem value="veterinarian">Veterinário</MenuItem>
               </TextField>

               <TextField
                  select
                  size="small"
                  label="Filtrar por Status"
                  value={activeFilter}
                  onChange={e =>
                     setActiveFilter(e.target.value === "" ? "" : e.target.value === "true")
                  }
               >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Ativo</MenuItem>
                  <MenuItem value="false">Inativo</MenuItem>
               </TextField>
            </Box>
         </Paper>

         {/* ── Tabela ── */}
         <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider" }}
         >
            {loading ? (
               <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress color="primary" />
               </Box>
            ) : filteredUsers.length === 0 ? (
               <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <PeopleIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                     Nenhum usuário encontrado
                  </Typography>
               </Box>
            ) : (
               <Table size="small">
                  <TableHead>
                     <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                        <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                           NOME
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                           USERNAME
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                           EMAIL
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                           ROLE
                        </TableCell>
                        <TableCell
                           sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           align="center"
                        >
                           STATUS
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}>
                           ÚLTIMO ACESSO
                        </TableCell>
                        <TableCell
                           sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                           align="right"
                        >
                           AÇÕES
                        </TableCell>
                     </TableRow>
                  </TableHead>

                  <TableBody>
                     {filteredUsers.map(user => (
                        <TableRow key={user.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                           <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                 {user.fullName}
                              </Typography>
                           </TableCell>
                           <TableCell>
                              <Typography variant="body2">{user.username}</Typography>
                           </TableCell>
                           <TableCell>
                              <Typography variant="body2">{user.email}</Typography>
                           </TableCell>
                           <TableCell>
                              <Chip
                                 label={roleLabel(user.role)}
                                 size="small"
                                 color={roleColor(user.role)}
                                 variant="outlined"
                              />
                           </TableCell>
                           <TableCell align="center">
                              <Chip
                                 label={user.active ? "Ativo" : "Inativo"}
                                 size="small"
                                 color={user.active ? "success" : "default"}
                                 variant="outlined"
                              />
                           </TableCell>
                           <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                 {user.lastLogin
                                    ? new Date(user.lastLogin).toLocaleDateString("pt-BR")
                                    : "Nunca"}
                              </Typography>
                           </TableCell>
                           <TableCell align="right">
                              <IconButton size="small" onClick={e => handleOpenMenu(e, user)}>
                                 <MoreVertIcon fontSize="small" />
                              </IconButton>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            )}
         </TableContainer>

         {/* ── Menu de Ações ── */}
         <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
            {can("edit_user") && (
               <MenuItem onClick={() => menuUser && handleEditUser(menuUser)}>
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Editar
               </MenuItem>
            )}
            {can("delete_user") && authUser?.id !== menuUser?.id && (
               <MenuItem onClick={() => menuUser && handleDeleteUser(menuUser)}>
                  <DeleteIcon fontSize="small" sx={{ mr: 1, color: "error.main" }} />
                  <Typography color="error">Deletar</Typography>
               </MenuItem>
            )}
         </Menu>

         {/* ── Diálogo de Edição/Criação ── */}
         <UserFormDialog
            open={formDialogOpen}
            onClose={handleFormClose}
            editingUser={editingUser}
         />

         {/* ── Diálogo de Confirmação de Deleção ── */}
         <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
               <Typography>
                  Tem certeza que deseja deletar o usuário <strong>{userToDelete?.fullName}</strong>
                  ?
               </Typography>
               <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
               >
                  Esta ação não pode ser desfeita.
               </Typography>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
               <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
               <Button
                  variant="contained"
                  color="error"
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  startIcon={deleteLoading ? <CircularProgress size={20} /> : undefined}
               >
                  {deleteLoading ? "Deletando..." : "Deletar"}
               </Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
}
