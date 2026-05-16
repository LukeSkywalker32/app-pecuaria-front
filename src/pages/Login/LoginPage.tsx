import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import GrassIcon from "@mui/icons-material/Grass";
import LoginIcon from "@mui/icons-material/Login";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
   Box,
   Button,
   CircularProgress,
   FormControl,
   IconButton,
   InputAdornment,
   InputLabel,
   Link,
   MenuItem,
   Paper,
   Select,
   Slide,
   TextField,
   Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

// ─── Tipo da fazenda pública ───────────────────────────────────────────────
interface PublicFarm {
   id: string;
   name: string;
   location: string;
   logoUrl: string | null;
}

// ─── Helper: initials do nome da fazenda ──────────────────────────────────
function getInitials(name: string): string {
   return name
      .split(" ")
      .filter(w => w.length > 2) // ignora palavras curtas (de, da, do…)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join("");
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function LoginPage() {
   const navigate = useNavigate();

   // Passo atual do fluxo: 1 = seleção de fazenda | 2 = credenciais
   const [step, setStep] = useState<1 | 2>(1);

   // Estado das fazendas (carregadas da API pública)
   const [farms, setFarms] = useState<PublicFarm[]>([]);
   const [farmsLoading, setFarmsLoading] = useState(true);
   const [farmsError, setFarmsError] = useState(false);

   // Fazenda selecionada pelo usuário
   const [selectedFarmId, setSelectedFarmId] = useState("");
   const [selectedFarm, setSelectedFarm] = useState<PublicFarm | null>(null);

   // Credenciais
   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);

   // Estados de submissão
   const [loginLoading, setLoginLoading] = useState(false);
   const [loginError, setLoginError] = useState("");

   // ─── Busca fazendas na API ao montar ────────────────────────────────────
   // GET /api/farms/public — sem token, rota pública
   // GET /api/farms/public — sem token, rota pública
   const fetchFarms = useCallback(() => {
      setFarmsLoading(true);
      setFarmsError(false);
      api.get<PublicFarm[]>("/farms/public")
         .then(({ data }) => {
            setFarms(data);
            // Se só existir uma fazenda, já pré-seleciona
            if (data.length === 1) {
               setSelectedFarmId(data[0].id);
            }
         })
         .catch(() => setFarmsError(true))
         .finally(() => setFarmsLoading(false));
   }, []);

   useEffect(() => {
      fetchFarms();
   }, [fetchFarms]);

   // ─── Avança para o passo 2 ──────────────────────────────────────────────
   function handleSelectFarm() {
      const farm = farms.find(f => f.id === selectedFarmId) ?? null;
      setSelectedFarm(farm);
      setLoginError("");
      setStep(2);
   }

   // ─── Executa o login ────────────────────────────────────────────────────
   // POST /api/auth/login — retorna accessToken, refreshToken, role
   async function handleLogin() {
      if (!selectedFarm) return;
      setLoginLoading(true);
      setLoginError("");
      try {
         const { data } = await api.post("/auth/login", {
            farmId: selectedFarm.id,
            username: username.trim(),
            password,
         });
         // Persiste tokens e redireciona
         localStorage.setItem("accessToken", data.accessToken);
         localStorage.setItem("refreshToken", data.refreshToken);
         localStorage.setItem("role", data.role);
         localStorage.setItem("farmId", selectedFarm.id);
         navigate("/dashboard");
      } catch {
         setLoginError("Usuário ou senha incorretos.");
      } finally {
         setLoginLoading(false);
      }
   }

   // Submete com Enter no campo de senha
   function handlePasswordKeyDown(e: React.KeyboardEvent) {
      if (e.key === "Enter" && username && password) handleLogin();
   }

   // ─── Render ─────────────────────────────────────────────────────────────
   return (
      <Box
         sx={{
            minHeight: "100vh",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            // Padrão sutil de pontos — remete ao solo/plantio
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
         }}
      >
         <Box sx={{ width: "100%", maxWidth: 380 }}>
            {/* ═══════════════════════════════════════════════════════════════
                PASSO 1 — Seleção de fazenda
            ═══════════════════════════════════════════════════════════════ */}
            <Slide direction="right" in={step === 1} mountOnEnter unmountOnExit>
               <Box>
                  {/* Logo + nome do app */}
                  <Box
                     sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        mb: 5,
                     }}
                  >
                     <Box
                        sx={{
                           width: 72,
                           height: 72,
                           borderRadius: 3,
                           bgcolor: "rgba(255,255,255,0.15)",
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
                        sx={{ color: "white", fontSize: 28, lineHeight: 1.2 }}
                     >
                        AgroGestão
                     </Typography>
                     <Typography
                        variant="caption"
                        sx={{
                           color: "rgba(255,255,255,0.55)",
                           letterSpacing: 1.5,
                           textTransform: "uppercase",
                           mt: 0.5,
                        }}
                     >
                        Gestão Pecuária
                     </Typography>
                  </Box>

                  {/* Card de seleção */}
                  <Paper elevation={0} sx={{ borderRadius: 3, p: 3 }}>
                     <Typography
                        variant="caption"
                        sx={{
                           fontWeight: 700,
                           color: "text.secondary",
                           textTransform: "uppercase",
                           letterSpacing: 1,
                           display: "block",
                           mb: 1.5,
                        }}
                     >
                        Selecione sua fazenda
                     </Typography>

                     {/* ─── Dropdown ─── */}
                     <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Fazenda</InputLabel>
                        <Select
                           value={selectedFarmId}
                           label="Fazenda"
                           onChange={e => setSelectedFarmId(e.target.value)}
                           // Mostra spinner enquanto carrega
                           startAdornment={
                              farmsLoading ? (
                                 <InputAdornment position="start">
                                    <CircularProgress size={18} color="primary" />
                                 </InputAdornment>
                              ) : undefined
                           }
                           disabled={farmsLoading || farmsError}
                        >
                           {farms.map(farm => (
                              <MenuItem key={farm.id} value={farm.id}>
                                 {farm.name}
                              </MenuItem>
                           ))}
                        </Select>
                     </FormControl>

                     {/* Erro ao carregar fazendas */}
                     {farmsError && (
                        <Box
                           sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 2,
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: "error.50",
                           }}
                        >
                           <Typography variant="caption" color="error" sx={{ flex: 1 }}>
                              Não foi possível carregar as fazendas.
                           </Typography>
                           <Button
                              size="small"
                              startIcon={<RefreshIcon />}
                              onClick={fetchFarms}
                              sx={{ color: "error.main", minWidth: 0 }}
                           >
                              Tentar novamente
                           </Button>
                        </Box>
                     )}

                     <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        // Só habilita quando tem fazenda selecionada
                        disabled={!selectedFarmId || farmsLoading}
                        onClick={handleSelectFarm}
                        endIcon={<ArrowForwardIcon />}
                     >
                        Acessar
                     </Button>
                  </Paper>
               </Box>
            </Slide>

            {/* ═══════════════════════════════════════════════════════════════
                PASSO 2 — Credenciais
            ═══════════════════════════════════════════════════════════════ */}
            <Slide direction="left" in={step === 2} mountOnEnter unmountOnExit>
               <Box>
                  {/* Botão voltar */}
                  <Button
                     startIcon={<ArrowBackIcon />}
                     sx={{ color: "rgba(255,255,255,0.75)", mb: 3, pl: 0 }}
                     onClick={() => {
                        setStep(1);
                        setLoginError("");
                        setUsername("");
                        setPassword("");
                     }}
                  >
                     Voltar
                  </Button>

                  <Paper elevation={0} sx={{ borderRadius: 3, p: 3 }}>
                     {/* Logo / iniciais da fazenda */}
                     <Box
                        sx={{
                           display: "flex",
                           flexDirection: "column",
                           alignItems: "center",
                           mb: 3,
                        }}
                     >
                        <Box
                           sx={{
                              width: 88,
                              height: 88,
                              borderRadius: 3,
                              border: "2px solid",
                              borderColor: "divider",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mb: 1.5,
                              bgcolor: "#F0F4F1",
                           }}
                        >
                           {selectedFarm?.logoUrl ? (
                              // Se a fazenda tem logo, exibe a imagem
                              <Box
                                 component="img"
                                 src={selectedFarm.logoUrl}
                                 alt={selectedFarm.name}
                                 sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                           ) : (
                              // Fallback: iniciais da fazenda
                              <Typography
                                 sx={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: 30,
                                    fontWeight: 500,
                                    color: "primary.main",
                                 }}
                              >
                                 {selectedFarm ? getInitials(selectedFarm.name) : ""}
                              </Typography>
                           )}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                           {selectedFarm?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                           {selectedFarm?.location}
                        </Typography>
                     </Box>

                     {/* Campos de login */}
                     <TextField
                        fullWidth
                        label="Usuário"
                        variant="outlined"
                        autoComplete="username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        sx={{ mb: 2 }}
                     />

                     <TextField
                        fullWidth
                        label="Senha"
                        variant="outlined"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handlePasswordKeyDown}
                        sx={{ mb: 1 }}
                        slotProps={{
                           input: {
                              endAdornment: (
                                 <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(v => !v)} edge="end">
                                       {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                 </InputAdornment>
                              ),
                           },
                        }}
                     />

                     <Box sx={{ textAlign: "right", mb: 2.5 }}>
                        <Link
                           href="/forgot-password"
                           underline="hover"
                           sx={{ fontSize: 12, color: "primary.main", fontWeight: 600 }}
                        >
                           Esqueceu a senha?
                        </Link>
                     </Box>

                     {/* Erro de login */}
                     {loginError && (
                        <Typography
                           variant="caption"
                           color="error"
                           sx={{ display: "block", mb: 1.5, textAlign: "center" }}
                        >
                           {loginError}
                        </Typography>
                     )}

                     <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={!username || !password || loginLoading}
                        onClick={handleLogin}
                        startIcon={
                           loginLoading ? (
                              // Spinner substitui o ícone durante o loading
                              <CircularProgress size={18} color="inherit" />
                           ) : (
                              <LoginIcon />
                           )
                        }
                     >
                        {loginLoading ? "Entrando..." : "Entrar"}
                     </Button>
                  </Paper>
               </Box>
            </Slide>
         </Box>
      </Box>
   );
}
