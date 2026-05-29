import GrassIcon from "@mui/icons-material/Grass";
import LoginIcon from "@mui/icons-material/Login";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
   Alert,
   Box,
   Button,
   CircularProgress,
   IconButton,
   InputAdornment,
   Paper,
   TextField,
   Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

export default function AdminLoginPage() {
   const navigate = useNavigate();

   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   async function handleLogin() {
      if (!username.trim() || !password) return;

      setLoading(true);
      setError("");
      try {
         const { data } = await api.post("/auth/admin-login", {
            username: username.trim(),
            password,
         });

         // Persiste tokens — farmId vem dentro do JWT, não precisamos salvar separado
         localStorage.setItem("accessToken", data.accessToken);
         localStorage.setItem("refreshToken", data.refreshToken);
         localStorage.setItem("role", data.role);
         localStorage.setItem("farmId", "farm-sistema");

         navigate("/dashboard");
      } catch {
         setError("Credenciais inválidas. Verifique usuário e senha.");
      } finally {
         setLoading(false);
      }
   }

   function handleKeyDown(e: React.KeyboardEvent) {
      if (e.key === "Enter" && username && password) handleLogin();
   }

   return (
      <Box
         sx={{
            minHeight: "100vh",
            bgcolor: "#0F2419", // verde mais escuro que o tema — diferencia do login normal
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
         }}
      >
         <Box sx={{ width: "100%", maxWidth: 380 }}>
            {/* ── Logo + badge de admin ── */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
               <Box
                  sx={{
                     width: 72,
                     height: 72,
                     borderRadius: 3,
                     bgcolor: "rgba(255,255,255,0.1)",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     mb: 1.5,
                  }}
               >
                  <GrassIcon sx={{ color: "white", fontSize: 40 }} />
               </Box>
               <Typography
                  variant="h4"
                  sx={{
                     color: "white",
                     fontFamily: "'Playfair Display', serif",
                     fontSize: 26,
                     lineHeight: 1.2,
                  }}
               >
                  AgroGestão
               </Typography>

               {/* Badge de acesso restrito */}
               <Box
                  sx={{
                     display: "flex",
                     alignItems: "center",
                     gap: 0.5,
                     mt: 1,
                     px: 1.5,
                     py: 0.4,
                     borderRadius: 10,
                     bgcolor: "rgba(239,68,68,0.2)",
                     border: "1px solid rgba(239,68,68,0.4)",
                  }}
               >
                  <SecurityIcon sx={{ fontSize: 12, color: "#FCA5A5" }} />
                  <Typography
                     variant="caption"
                     sx={{
                        color: "#FCA5A5",
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        fontSize: 10,
                     }}
                  >
                     Acesso Restrito — Admin
                  </Typography>
               </Box>
            </Box>

            {/* ── Card de login ── */}
            <Paper elevation={0} sx={{ borderRadius: 3, p: 3 }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Painel Administrativo
               </Typography>
               <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 2.5 }}
               >
                  Acesso exclusivo para administradores do sistema
               </Typography>

               {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                     {error}
                  </Alert>
               )}

               <TextField
                  fullWidth
                  label="Usuário"
                  size="small"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  sx={{ mb: 2 }}
                  autoFocus
               />

               <TextField
                  fullWidth
                  label="Senha"
                  size="small"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  sx={{ mb: 2.5 }}
                  slotProps={{
                     input: {
                        endAdornment: (
                           <InputAdornment position="end">
                              <IconButton
                                 onClick={() => setShowPassword(v => !v)}
                                 edge="end"
                                 size="small"
                              >
                                 {showPassword ? (
                                    <VisibilityOffIcon fontSize="small" />
                                 ) : (
                                    <VisibilityIcon fontSize="small" />
                                 )}
                              </IconButton>
                           </InputAdornment>
                        ),
                     },
                  }}
               />

               <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!username || !password || loading}
                  onClick={handleLogin}
                  startIcon={
                     loading ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />
                  }
                  sx={{
                     bgcolor: "#1B4332",
                     "&:hover": { bgcolor: "#133326" },
                  }}
               >
                  {loading ? "Autenticando..." : "Entrar como Admin"}
               </Button>
            </Paper>

            {/* ── Link voltar ao login normal ── */}
            <Box sx={{ textAlign: "center", mt: 2 }}>
               <Typography
                  variant="caption"
                  sx={{
                     color: "rgba(255,255,255,0.4)",
                     cursor: "pointer",
                     "&:hover": { color: "rgba(255,255,255,0.7)" },
                     transition: "color 0.2s",
                  }}
                  onClick={() => navigate("/login")}
               >
                  ← Voltar ao login normal
               </Typography>
            </Box>
         </Box>
      </Box>
   );
}
