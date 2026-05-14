import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { getLastSession, isAuthenticated, refreshSessionInBackground, setSession } from "./types/auth.types";

const loginSchema = z.object({
  farmId: z.string().min(1, "Selecione uma fazenda"),
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const farms = [
  { id: "farm-1", name: "Fazenda X", logoUrl: "" },
  { id: "farm-2", name: "Fazenda Y", logoUrl: "" },
];

function Dashboard() {
  return <Typography variant="h4">Dashboard (placeholder)</Typography>;
}

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"farm" | "credentials">("farm");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { farmId: "", username: "", password: "" },
  });

  const selectedFarm = watch("farmId");
  const farmData = useMemo(() => farms.find((f) => f.id === selectedFarm), [selectedFarm]);

  if (isAuthenticated()) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const offlineSession = getLastSession();
      const isOffline = !navigator.onLine;

      if (isOffline && offlineSession?.farm.id === data.farmId) {
        setSession(offlineSession);
        navigate("/app/dashboard", { replace: true });
        return;
      }

      // TODO: integrar com POST /api/auth/login
      setSession({
        accessToken: `access-${Date.now()}`,
        refreshToken: `refresh-${Date.now()}`,
        user: { id: "u1", name: data.username, role: "admin" },
        farm: { id: data.farmId, name: farmData?.name ?? "Fazenda", logoUrl: farmData?.logoUrl },
      });
      await refreshSessionInBackground();
      navigate("/app/dashboard", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Stack sx={{ width: "100%", maxWidth: 980 }} direction={{ xs: "column", md: "row" }} spacing={3}>
        <Card sx={{ flex: 1, minHeight: 500, display: "grid", placeItems: "center" }}>
          <CardContent sx={{ width: "100%", display: "grid", gap: 3, justifyItems: "center" }}>
            <Select
              value={selectedFarm}
              displayEmpty
              onChange={(e) => setValue("farmId", e.target.value, { shouldValidate: true })}
              sx={{ width: 280, borderRadius: 999 }}
            >
              <MenuItem value="">Selecione a fazenda</MenuItem>
              {farms.map((farm) => (
                <MenuItem key={farm.id} value={farm.id}>
                  {farm.name}
                </MenuItem>
              ))}
            </Select>
            {errors.farmId && <Typography color="error">{errors.farmId.message}</Typography>}
            <Button
              variant="contained"
              sx={{ px: 6, borderRadius: 999 }}
              onClick={() => selectedFarm && setStep("credentials")}
              disabled={!selectedFarm}
            >
              Acessar
            </Button>
          </CardContent>
        </Card>

        {step === "credentials" && (
          <Card sx={{ flex: 1, minHeight: 500, display: "grid", placeItems: "center" }}>
            <CardContent
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ width: "100%", maxWidth: 320, display: "grid", gap: 2 }}
            >
              <Box
                sx={{
                  border: "2px solid",
                  borderColor: "primary.main",
                  minHeight: 220,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  mb: 1,
                  overflow: "hidden",
                }}
              >
                {farmData?.logoUrl ? (
                  <Box component="img" src={farmData.logoUrl} alt="Logo da fazenda" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Typography variant="h6" color="text.secondary">
                    LOGO FAZENDA
                  </Typography>
                )}
              </Box>

              <TextField
                label="Usuário"
                {...register("username")}
                error={!!errors.username}
                helperText={errors.username?.message}
              />
              <TextField
                label="Senha"
                type="password"
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? <CircularProgress size={22} color="inherit" /> : "Entrar"}
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
