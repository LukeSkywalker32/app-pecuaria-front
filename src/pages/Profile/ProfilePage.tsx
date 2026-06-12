import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import {
   Alert,
   Box,
   Button,
   CircularProgress,
   Divider,
   Paper,
   Tab,
   Tabs,
   TextField,
   Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import api from "@/services/api";

// --- TIPOS ---
interface UserProfile {
   id: string;
   fullName: string;
   username: string;
   email: string;
   phone: string | null;
   role: string;
   farmName: string;
   crmv: string | null;
   graduationDate: string | null;
   specialties: string[] | null;
   lastLogin: string | null;
   createdAt: string;
}

function TabPanel({
   children,
   value,
   index,
}: {
   children: React.ReactNode;
   value: number;
   index: number;
}) {
   if (value !== index) return null;
   return <Box sx={{ pt: 2 }}>{children}</Box>;
}

function formatDate(iso: string | null | undefined) {
   if (!iso) return "—";
   return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
   });
}

export default function ProfilePage() {
   const { user: authUser, refreshUser } = useAuth();
   const [profile, setProfile] = useState<UserProfile | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [tab, setTab] = useState(0);

   // Aba de Editar Perfil
   const [editFullName, setEditFullName] = useState("");
   const [editEmail, setEditEmail] = useState("");
   const [editPhone, setEditPhone] = useState("");
   const [editLoading, setEditLoading] = useState(false);
   const [editError, setEditError] = useState("");
   const [editSuccess, setEditSuccess] = useState("");

   // Aba de Alterar Senha
   const [currentPassword, setCurrentPassword] = useState("");
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [passwordLoading, setPasswordLoading] = useState(false);
   const [passwordError, setPasswordError] = useState("");
   const [passwordSuccess, setPasswordSuccess] = useState("");

   const fetchProfile = useCallback(async (): Promise<void> => {
      setLoading(true);
      setError("");
      try {
         const { data } = await api.get<UserProfile>("/users/me");
         setProfile(data);
      } catch (err: any) {
         setError("Não foi possível carregar seu perfil. Tente novamente.");
      } finally {
         setLoading(false);
      }
   }, []);

   // Carrega perfil ao montar
   useEffect(() => {
      fetchProfile();
   }, [fetchProfile]);

   // Popula campos de edição quando perfil carrega
   useEffect(() => {
      if (profile) {
         setEditFullName(profile.fullName);
         setEditEmail(profile.email);
         setEditPhone(profile.phone ?? "");
      }
   }, [profile]);

   async function handleUpdateProfile() {
      setEditError("");
      setEditSuccess("");

      if (!editFullName.trim()) {
         setEditError("Nome completo é obrigatório");
         return;
      }

      if (!editEmail.trim()) {
         setEditError("Email é obrigatório");
         return;
      }

      setEditLoading(true);
      try {
         await api.put(`/users/${profile?.id}`, {
            fullName: editFullName.trim(),
            email: editEmail.trim(),
            phone: editPhone.trim() || null,
         });
         setEditSuccess("Perfil atualizado com sucesso!");
         await fetchProfile();
         await refreshUser();
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao atualizar perfil";
         setEditError(msg);
      } finally {
         setEditLoading(false);
      }
   }

   async function handleChangePassword() {
      setPasswordError("");
      setPasswordSuccess("");

      if (!currentPassword) {
         setPasswordError("Senha atual é obrigatória");
         return;
      }

      if (!newPassword) {
         setPasswordError("Nova senha é obrigatória");
         return;
      }

      if (newPassword.length < 6) {
         setPasswordError("Nova senha deve ter pelo menos 6 caracteres");
         return;
      }

      if (newPassword !== confirmPassword) {
         setPasswordError("As senhas não conferem");
         return;
      }

      setPasswordLoading(true);
      try {
         await api.patch("/users/me/change-password", {
            currentPassword,
            newPassword,
         });
         setPasswordSuccess("Senha alterada com sucesso!");
         setCurrentPassword("");
         setNewPassword("");
         setConfirmPassword("");
      } catch (err: any) {
         const msg = err?.response?.data?.error ?? "Erro ao alterar senha";
         setPasswordError(msg);
      } finally {
         setPasswordLoading(false);
      }
   }

   if (loading) {
      return (
         <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
            <CircularProgress color="primary" />
         </Box>
      );
   }

   if (error || !profile) {
      return (
         <Box sx={{ p: 3 }}>
            <Alert severity="error">{error || "Perfil não encontrado."}</Alert>
         </Box>
      );
   }

   const roleLabel =
      {
         admin: "Administrador",
         owner: "Proprietário",
         farmmanager: "Gerente da Fazenda",
         veterinarian: "Veterinário",
      }[profile.role] || profile.role;

   return (
      <Box sx={{ p: 3, maxWidth: 900 }}>
         {/* ── Cabeçalho ── */}
         <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box
               sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: "primary.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
               }}
            >
               <PersonIcon sx={{ color: "primary.main", fontSize: 28 }} />
            </Box>
            <Box>
               <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {profile.fullName}
               </Typography>
               <Typography variant="body2" color="text.secondary">
                  {roleLabel} · {profile.farmName}
               </Typography>
            </Box>
         </Box>

         {/* ── Informações Básicas ── */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, mb: 3 }}
         >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
               INFORMAÇÕES DA CONTA
            </Typography>

            <Box
               sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 2,
               }}
            >
               <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                     USERNAME
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                     {profile.username}
                  </Typography>
               </Box>

               <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                     ROLE
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                     {roleLabel}
                  </Typography>
               </Box>

               <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                     FAZENDA
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                     {profile.farmName}
                  </Typography>
               </Box>

               <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                     ÚLTIMO ACESSO
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                     {formatDate(profile.lastLogin)}
                  </Typography>
               </Box>

               <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                     CADASTRADO EM
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                     {formatDate(profile.createdAt)}
                  </Typography>
               </Box>
            </Box>

            {/* Campos específicos para veterinários */}
            {profile.role === "veterinarian" && (profile.crmv || profile.graduationDate) && (
               <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                     INFORMAÇÕES PROFISSIONAIS
                  </Typography>
                  <Box
                     sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 2,
                     }}
                  >
                     {profile.crmv && (
                        <Box>
                           <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontWeight: 700 }}
                           >
                              CRMV
                           </Typography>
                           <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {profile.crmv}
                           </Typography>
                        </Box>
                     )}
                     {profile.graduationDate && (
                        <Box>
                           <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontWeight: 700 }}
                           >
                              DATA DE FORMAÇÃO
                           </Typography>
                           <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatDate(profile.graduationDate)}
                           </Typography>
                        </Box>
                     )}
                     {profile.specialties && profile.specialties.length > 0 && (
                        <Box>
                           <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontWeight: 700 }}
                           >
                              ESPECIALIDADES
                           </Typography>
                           <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {profile.specialties.join(", ")}
                           </Typography>
                        </Box>
                     )}
                  </Box>
               </>
            )}
         </Paper>

         {/* ── Abas de Edição ── */}
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
                  "& .MuiTab-root": { fontSize: 13, textTransform: "none", fontWeight: 600 },
               }}
            >
               <Tab label="Editar Perfil" icon={<PersonIcon />} iconPosition="start" />
               <Tab label="Alterar Senha" icon={<LockIcon />} iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 3 }}>
               {/* ── Aba 1: Editar Perfil ── */}
               <TabPanel value={tab} index={0}>
                  {editSuccess && (
                     <Alert severity="success" sx={{ mb: 2 }} onClose={() => setEditSuccess("")}>
                        {editSuccess}
                     </Alert>
                  )}
                  {editError && (
                     <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEditError("")}>
                        {editError}
                     </Alert>
                  )}

                  <Box sx={{ display: "grid", gap: 2, maxWidth: 500 }}>
                     <TextField
                        fullWidth
                        label="Nome Completo *"
                        size="small"
                        value={editFullName}
                        onChange={e => setEditFullName(e.target.value)}
                        disabled={editLoading}
                     />

                     <TextField
                        fullWidth
                        label="Email *"
                        size="small"
                        type="email"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        disabled={editLoading}
                     />

                     <TextField
                        fullWidth
                        label="Telefone"
                        size="small"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        disabled={editLoading}
                     />

                     <Button
                        variant="contained"
                        onClick={handleUpdateProfile}
                        disabled={editLoading}
                        startIcon={editLoading ? <CircularProgress size={20} /> : undefined}
                     >
                        {editLoading ? "Salvando..." : "Salvar Alterações"}
                     </Button>
                  </Box>
               </TabPanel>

               {/* ── Aba 2: Alterar Senha ── */}
               <TabPanel value={tab} index={1}>
                  {passwordSuccess && (
                     <Alert
                        severity="success"
                        sx={{ mb: 2 }}
                        onClose={() => setPasswordSuccess("")}
                     >
                        {passwordSuccess}
                     </Alert>
                  )}
                  {passwordError && (
                     <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError("")}>
                        {passwordError}
                     </Alert>
                  )}

                  <Box sx={{ display: "grid", gap: 2, maxWidth: 500 }}>
                     <TextField
                        fullWidth
                        label="Senha Atual *"
                        size="small"
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        disabled={passwordLoading}
                     />

                     <TextField
                        fullWidth
                        label="Nova Senha *"
                        size="small"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        disabled={passwordLoading}
                        helperText="Mínimo 6 caracteres"
                     />

                     <TextField
                        fullWidth
                        label="Confirmar Nova Senha *"
                        size="small"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        disabled={passwordLoading}
                     />

                     <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={passwordLoading}
                        startIcon={passwordLoading ? <CircularProgress size={20} /> : undefined}
                     >
                        {passwordLoading ? "Alterando..." : "Alterar Senha"}
                     </Button>
                  </Box>
               </TabPanel>
            </Box>
         </Paper>
      </Box>
   );
}
