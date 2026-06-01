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
   MenuItem,
   Paper,
   Select,
   Slide,
   TextField,
   Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import api from "@/services/api";

interface PublicFarm {
   id: string;
   name: string;
   location: string;
   logoUrl: string | null;
}

function getInitials(name: string): string {
   return name
      .split(" ")
      .filter(w => w.length > 2)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join("");
}

export default function LoginPage() {
   const navigate = useNavigate();
   const { login } = useAuth();

   const [step, setStep] = useState<1 | 2>(1);

   const [farms, setFarms] = useState<PublicFarm[]>([]);
   const [farmsLoading, setFarmsLoading] = useState(true);
   const [farmsError, setFarmsError] = useState(false);

   const [selectedFarmId, setSelectedFarmId] = useState("");
   const [selectedFarm, setSelectedFarm] = useState<PublicFarm | null>(null);

   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);

   const [loginLoading, setLoginLoading] = useState(false);
   const [loginError, setLoginError] = useState("");

   const fetchFarms = useCallback(() => {
      setFarmsLoading(true);
      setFarmsError(false);
      api.get<PublicFarm[]>("/farms/public")
         .then(({ data }) => {
            setFarms(data);
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

   function handleSelectFarm() {
      const farm = farms.find(f => f.id === selectedFarmId) ?? null;
      setSelectedFarm(farm);
      setLoginError("");
      setStep(2);
   }

   async function handleLogin(e: React.FormEvent) {
      // Previne o reload padrão do form — essencial para SPA
      e.preventDefault();

      if (!selectedFarm || loginLoading) return;
      setLoginLoading(true);
      setLoginError("");
      try {
         const { data } = await api.post("/auth/login", {
            farmId: selectedFarm.id,
            username: username.trim(),
            password,
         });

         // login() salva os tokens E busca /users/me antes de retornar
         // Só então navegamos — evita a race condition com ProtectedRoute
         await login(data.accessToken, data.refreshToken);
         navigate("/dashboard");
      } catch {
         setLoginError("Usuário ou senha incorretos.");
      } finally {
         setLoginLoading(false);
      }
   }

   return (
      <Box
         sx={{
            minHeight: "100vh",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
         }}
      >
         <Box sx={{ width: "100%", maxWidth: 380 }}>
            {/* ══ PASSO 1 — Seleção de fazenda ══ */}
            <Slide direction="right" in={step === 1} mountOnEnter unmountOnExit>
               <Box>
                  <Box
                     sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 5 }}
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

                     <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Fazenda</InputLabel>
                        <Select
                           value={selectedFarmId}
                           label="Fazenda"
                           onChange={e => setSelectedFarmId(e.target.value)}
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
                        disabled={!selectedFarmId || farmsLoading}
                        onClick={handleSelectFarm}
                        endIcon={<ArrowForwardIcon />}
                     >
                        Acessar
                     </Button>
                  </Paper>
               </Box>
            </Slide>

            {/* ══ PASSO 2 — Credenciais ══ */}
            <Slide direction="left" in={step === 2} mountOnEnter unmountOnExit>
               <Box>
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
                     {/* Logo da fazenda */}
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
                              <Box
                                 component="img"
                                 src={selectedFarm.logoUrl}
                                 alt={selectedFarm.name}
                                 sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                           ) : (
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

                     {/*
                      * <form> é essencial aqui por três motivos:
                      * 1. Permite que gerenciadores de senha funcionem corretamente
                      * 2. Permite submit com Enter sem gambiarras
                      * 3. Evita o aviso do Chrome sobre password fora de form
                      * noValidate desliga a validação nativa do browser (usamos a nossa)
                      */}
                     <Box
                        component="form"
                        onSubmit={handleLogin}
                        noValidate
                        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                     >
                        <TextField
                           fullWidth
                           label="Usuário"
                           variant="outlined"
                           autoComplete="username"
                           value={username}
                           onChange={e => setUsername(e.target.value)}
                        />

                        <TextField
                           fullWidth
                           label="Senha"
                           variant="outlined"
                           type={showPassword ? "text" : "password"}
                           autoComplete="current-password"
                           value={password}
                           onChange={e => setPassword(e.target.value)}
                           slotProps={{
                              input: {
                                 endAdornment: (
                                    <InputAdornment position="end">
                                       <IconButton
                                          onClick={() => setShowPassword(v => !v)}
                                          edge="end"
                                       >
                                          {showPassword ? (
                                             <VisibilityOffIcon />
                                          ) : (
                                             <VisibilityIcon />
                                          )}
                                       </IconButton>
                                    </InputAdornment>
                                 ),
                              },
                           }}
                        />

                        <Box sx={{ textAlign: "right", mt: -1 }}>
                           <Typography
                              component="a"
                              href="/forgot-password"
                              sx={{
                                 fontSize: 14,
                                 color: "#1B4332",
                                 fontWeight: 600,
                                 textDecoration: "none",
                                 cursor: "pointer",
                              }}
                           >
                              Esqueceu a senha?
                           </Typography>
                        </Box>

                        {loginError && (
                           <Typography
                              variant="caption"
                              color="error"
                              sx={{ textAlign: "center", mt: -1 }}
                           >
                              {loginError}
                           </Typography>
                        )}

                        {/*
                         * type="submit" faz o form responder ao Enter automaticamente
                         * e ao clique — sem precisar de onKeyDown manual
                         */}
                        <Button
                           type="submit"
                           fullWidth
                           variant="contained"
                           size="large"
                           disabled={!username || !password || loginLoading}
                           startIcon={
                              loginLoading ? (
                                 <CircularProgress size={18} color="inherit" />
                              ) : (
                                 <LoginIcon />
                              )
                           }
                        >
                           {loginLoading ? "Entrando..." : "Entrar"}
                        </Button>
                     </Box>
                  </Paper>
               </Box>
            </Slide>
         </Box>
      </Box>
   );
}
