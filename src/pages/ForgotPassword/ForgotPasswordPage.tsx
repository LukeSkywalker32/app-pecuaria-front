import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GrassIcon from "@mui/icons-material/Grass";
import LockResetIcon from "@mui/icons-material/LockReset";
import {
   Alert,
   Box,
   Button,
   CircularProgress,
   Paper,
   Step,
   StepLabel,
   Stepper,
   TextField,
   Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = ["Identificação", "Código de verificação", "Nova Senha"];

export default function ForgotPassWordPage() {
   const navigate = useNavigate();
   const [step, setStep] = useState(0);

   // Step 0
   const [farmId, setFarmId] = useState("");
   const [email, setEmail] = useState("");
   //Step 1
   const [code, setCode] = useState("");
   //Step 2
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");

   //UI states
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   //Step 0: Enviar código
   function handleSendCode() {
      setError("");
      if (!farmId.trim() || !email.trim()) {
         setError("Preencha o ID da fazenda e o e-mail");
         return;
      }
      // TODO: chamar POST /api/auth/forgot-password quando integrar
      // await api.post("/auth/forgot-password", { farmId, email });
      setStep(1);
   }
   // ---Step 1: Validar código ---
   function handleValidateCode() {
      setError("");
      if (code.trim().length !== 6) {
         setError("O código deve ter exatamente 6 dígitos.");
         return;
      }
      // TODO: validar o código no backend quando integrar
      setStep(2);
   }
   // ─── Step 2: Redefinir senha ───
   function handleResetPassword() {
      setError("");
      if (newPassword.length < 8) {
         setError("A senha deve pelo menos 8 caracteres.");
         return;
      }
      // TODO: chamar POST /api/auth/confirm-reset quando integrar
      // await api.post("/auth/confirm-reset", { farmId, email, code, newPassword });
      setStep(3);
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
            backgroundSize: "28px 28px",
            //backgroundPosition: '0 0, 10px 10px',
         }}
      >
         <Box sx={{ width: "100%", maxWidth: 440 }}>
            {/*-- Logo --- */}
            <Box sx={{ display: "flex", flexDirection: "collumn", alignItems: "center", mb: 4 }}>
               <Box
                  sx={{
                     width: 60,
                     height: 60,
                     borderRadius: 3,
                     bgcolor: "rgba(255,255,255,0.15)",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     mb: 1.5,
                  }}
               >
                  <GrassIcon sx={{ color: "white", fontSize: 34 }} />
               </Box>
               <Typography
                  variant="h5"
                  sx={{ color: "white", fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
               >
                  AgroGestao
               </Typography>
            </Box>
            <Paper elevation={0} sx={{ borderRadius: 3, p: 3 }}>
               {/* Header */}
               <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                  <LockResetIcon sx={{ color: "primary.main", fontSize: 26 }} />
                  <Box>
                     <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Recuperar Senha
                     </Typography>
                     <Typography variant="caption" color="text.secondary">
                        Siga os passos para redefinir sua senha
                     </Typography>
                  </Box>
               </Box>

               {/* ----Stepper */}
               {step < 3 && (
                  <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
                     {STEPS.map(label => (
                        <Step key={label}>
                           <StepLabel
                              sx={{
                                 "& .MuiStepLabel": { fontSize: 11 },
                              }}
                           >
                              {label}
                           </StepLabel>
                        </Step>
                     ))}
                  </Stepper>
               )}
               {/*----------- Erro --------; */}
               {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                     {error}
                  </Alert>
               )}
               {/* ════════════════════════════════════════════
                   STEP 0 — Identificação
               ════════════════════════════════════════════ */}
               {step === 0 && (
                  <Box>
                     <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Informe o ID da sua fazenda e o e-mail cadastrado. Você receberá um código
                        de 6 dígitos.
                     </Typography>

                     <TextField
                        fullWidth
                        label="ID da Fazenda"
                        size="small"
                        value={farmId}
                        onChange={e => setFarmId(e.target.value)}
                        helperText="Disponível no painel de configurações da fazenda"
                        sx={{ mb: 2 }}
                     />

                     <TextField
                        fullWidth
                        label="E-mail"
                        type="email"
                        size="small"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        sx={{ mb: 2 }}
                     />

                     <Alert severity="info" sx={{ mb: 2 }}>
                        Esta funcionalidade estará disponível em breve. Para redefinir sua senha,
                        entre em contato com o administrador da fazenda.
                     </Alert>

                     <Button
                        fullWidth
                        variant="contained"
                        onClick={handleSendCode}
                        disabled={loading}
                        startIcon={
                           loading ? <CircularProgress size={16} color="inherit" /> : undefined
                        }
                     >
                        {loading ? "Enviando..." : "Enviar Código"}
                     </Button>
                  </Box>
               )}

               {/* ════════════════════════════════════════════
                   STEP 1 — Código de verificação
               ════════════════════════════════════════════ */}
               {step === 1 && (
                  <Box>
                     <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Digite o código de 6 dígitos enviado para <strong>{email}</strong>.
                     </Typography>

                     <TextField
                        fullWidth
                        label="Código de Verificação"
                        size="small"
                        value={code}
                        onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        slotProps={{
                           htmlInput: {
                              maxLength: 6,
                              style: {
                                 letterSpacing: "8px",
                                 fontSize: "22px",
                                 textAlign: "center",
                              },
                           },
                        }}
                        sx={{ mb: 2 }}
                     />

                     <Button fullWidth variant="contained" onClick={handleValidateCode}>
                        Verificar Código
                     </Button>

                     <Button
                        fullWidth
                        size="small"
                        sx={{ mt: 1, color: "text.secondary" }}
                        onClick={() => setStep(0)}
                     >
                        Reenviar código
                     </Button>
                  </Box>
               )}

               {/* ════════════════════════════════════════════
                   STEP 2 — Nova senha
               ════════════════════════════════════════════ */}
               {step === 2 && (
                  <Box>
                     <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Escolha uma nova senha forte para sua conta.
                     </Typography>

                     <TextField
                        fullWidth
                        label="Nova Senha"
                        type="password"
                        size="small"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        helperText="Mínimo 8 caracteres, com maiúsculas, números e símbolo"
                        sx={{ mb: 2 }}
                     />

                     <TextField
                        fullWidth
                        label="Confirmar Nova Senha"
                        type="password"
                        size="small"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        sx={{ mb: 2 }}
                     />

                     <Button fullWidth variant="contained" onClick={handleResetPassword}>
                        Redefinir Senha
                     </Button>
                  </Box>
               )}

               {/* ════════════════════════════════════════════
                   STEP 3 — Sucesso
               ════════════════════════════════════════════ */}
               {step === 3 && (
                  <Box sx={{ textAlign: "center", py: 2 }}>
                     <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}
                     >
                        Senha redefinida com sucesso!
                     </Typography>
                     <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Você já pode fazer login com sua nova senha.
                     </Typography>
                     <Button variant="contained" fullWidth onClick={() => navigate("/login")}>
                        Ir para o Login
                     </Button>
                  </Box>
               )}

               {/* ── Voltar ao login ── */}
               {step < 3 && (
                  <Button
                     fullWidth
                     startIcon={<ArrowBackIcon />}
                     sx={{ mt: 2, color: "text.secondary" }}
                     onClick={() => navigate("/login")}
                  >
                     Voltar ao Login
                  </Button>
               )}
            </Paper>
         </Box>
      </Box>
   );
}
