import AgricultureIcon from "@mui/icons-material/Agriculture";
import BabyChangingStationIcon from "@mui/icons-material/BabyChangingStation";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HeartBrokenIcon from "@mui/icons-material/HeartBroken";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PetsIcon from "@mui/icons-material/Pets";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
   Alert,
   Avatar,
   Box,
   Chip,
   CircularProgress,
   Grid,
   LinearProgress,
   Paper,
   Skeleton,
   Tooltip,
   Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAdminFarm } from "@/contexts/AdminFarmContext";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────

interface Animal {
   id: string;
   name: string;
   category: string;
   status: string;
   gender: string;
   birthDate: string;
   ageInMonths: number;
   pastureName: string | null;
   currentEarTag: string | null;
}

interface Pasture {
   id: string;
   name: string;
   animalCapacity: number;
   currentAnimals: number;
   occupancyRate: number;
   type: string;
   active: boolean;
}

interface Pregnancy {
   id: string;
   animalId: string;
   animalName: string | null;
   animalEarTag: string | null;
   currentStatus: string;
   attempts: Array<{ estimatedBirthDate: string; matingDate: string }>;
}

interface Estrus {
   id: string;
   animalId: string;
   animalName: string | null;
   animalEarTag: string | null;
   nextEstrus: string;
   date: string;
   intensity: string;
}

interface Vaccination {
   id: string;
   animalId: string;
   animalName: string | null;
   animalEarTag: string | null;
   vaccineType: string;
   nextDoseDate: string | null;
}

interface Birth {
   id: string;
   birthDate: string;
   damName: string | null;
   damEarTag: string | null;
   situation: string;
   calfGender: string | null;
}

interface Mortality {
   id: string;
   deathDate: string;
   animalName: string | null;
   animalEarTag: string | null;
   causeOfDeath: string;
}

interface DashboardData {
   animals: Animal[];
   pastures: Pasture[];
   pregnancies: Pregnancy[];
   upcomingEstrus: Estrus[];
   upcomingVaccinations: Vaccination[];
   recentBirths: Birth[];
   recentMortalities: Mortality[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string) {
   return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function daysUntil(iso: string): number {
   const diff = new Date(iso).getTime() - Date.now();
   return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function daysAgo(iso: string): number {
   const diff = Date.now() - new Date(iso).getTime();
   return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): "error" | "warning" | "success" {
   if (days <= 2) return "error";
   if (days <= 7) return "warning";
   return "success";
}

function occupancyColor(rate: number): string {
   if (rate >= 90) return "#EF4444";
   if (rate >= 70) return "#F59E0B";
   return "#1B4332";
}

// ─── Cores por categoria ──────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
   Touro: "#1B4332",
   Vaca: "#2D6A4F",
   Garrote: "#52B788",
   Novilha: "#74C69D",
   Bezerro: "#95D5B2",
   Bezerra: "#B7E4C7",
};

// ─── Card de Resumo ───────────────────────────────────────────────────────

interface SummaryCardProps {
   title: string;
   value: number | string;
   subtitle?: string;
   icon: React.ReactNode;
   color: string;
   loading?: boolean;
}

function SummaryCard({ title, value, subtitle, icon, color, loading }: SummaryCardProps) {
   return (
      <Paper
         elevation={0}
         sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            p: 2.5,
            height: "100%",
            position: "relative",
            overflow: "hidden",
            transition: "box-shadow 0.2s",
            "&:hover": { boxShadow: "0 4px 20px rgba(27,67,50,0.1)" },
         }}
      >
         <Box
            sx={{
               position: "absolute",
               top: -20,
               right: -20,
               width: 100,
               height: 100,
               borderRadius: "50%",
               bgcolor: color,
               opacity: 0.06,
            }}
         />
         <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box sx={{ flex: 1 }}>
               <Typography
                  variant="caption"
                  sx={{
                     color: "text.secondary",
                     fontWeight: 700,
                     textTransform: "uppercase",
                     letterSpacing: 0.8,
                  }}
               >
                  {title}
               </Typography>
               {loading ? (
                  <Skeleton width={60} height={48} />
               ) : (
                  <Typography
                     variant="h3"
                     sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.1, mt: 0.5 }}
                  >
                     {value}
                  </Typography>
               )}
               {subtitle && !loading && (
                  <Typography
                     variant="caption"
                     color="text.secondary"
                     sx={{ mt: 0.5, display: "block" }}
                  >
                     {subtitle}
                  </Typography>
               )}
            </Box>
            <Avatar sx={{ bgcolor: color, width: 48, height: 48, borderRadius: 2 }}>{icon}</Avatar>
         </Box>
      </Paper>
   );
}

// ─── Alert Item ───────────────────────────────────────────────────────────

interface AlertItemProps {
   icon: React.ReactNode;
   title: string;
   subtitle: string;
   badge: string;
   badgeColor: "error" | "warning" | "success" | "info";
}

function AlertItem({ icon, title, subtitle, badge, badgeColor }: AlertItemProps) {
   return (
      <Box
         sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            "&:last-child": { borderBottom: "none", pb: 0 },
            "&:first-of-type": { pt: 0 },
         }}
      >
         <Avatar sx={{ bgcolor: `${badgeColor}.50`, width: 36, height: 36, borderRadius: 1.5 }}>
            <Box sx={{ color: `${badgeColor}.main`, display: "flex" }}>{icon}</Box>
         </Avatar>
         <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
               {title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
               {subtitle}
            </Typography>
         </Box>
         <Chip
            label={badge}
            color={badgeColor}
            size="small"
            sx={{ fontSize: 11, height: 22, fontWeight: 700, flexShrink: 0 }}
         />
      </Box>
   );
}

// ─── Gráfico de Donut CSS puro ────────────────────────────────────────────

interface DonutChartProps {
   data: Array<{ name: string; value: number }>;
   total: number;
}

function DonutChart({ data, total }: DonutChartProps) {
   // Calcula os segmentos usando conic-gradient
   let cumulative = 0;
   const segments = data.map(d => {
      const pct = total > 0 ? (d.value / total) * 100 : 0;
      const start = cumulative;
      cumulative += pct;
      return { ...d, pct, start };
   });

   const gradient = segments
      .map(s => {
         const color = CATEGORY_COLORS[s.name] ?? "#95D5B2";
         return `${color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`;
      })
      .join(", ");

   return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
         {/* Donut */}
         <Box sx={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
            <Box
               sx={{
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  background: total > 0 ? `conic-gradient(${gradient})` : "#E5E7EB",
               }}
            />
            {/* Buraco central */}
            <Box
               sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
               }}
            >
               <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, lineHeight: 1, color: "primary.main" }}
               >
                  {total}
               </Typography>
               <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  ativos
               </Typography>
            </Box>
         </Box>

         {/* Legenda */}
         <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
            {segments.map(s => (
               <Box key={s.name} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                     sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: CATEGORY_COLORS[s.name] ?? "#95D5B2",
                        flexShrink: 0,
                     }}
                  />
                  <Typography variant="caption" color="text.secondary">
                     {s.name} ({s.value})
                  </Typography>
               </Box>
            ))}
         </Box>
      </Box>
   );
}

// ─── Gráfico de Barras CSS puro ───────────────────────────────────────────

interface BarChartProps {
   data: Array<{ mes: string; Nascimentos: number; Mortes: number }>;
}

function SimpleBarChart({ data }: BarChartProps) {
   const maxVal = Math.max(...data.flatMap(d => [d.Nascimentos, d.Mortes]), 1);

   return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%" }}>
         {/* Barras */}
         <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5, flex: 1, px: 1 }}>
            {data.map(d => (
               <Box
                  key={d.mes}
                  sx={{
                     flex: 1,
                     display: "flex",
                     flexDirection: "column",
                     alignItems: "center",
                     gap: 0.5,
                     height: "100%",
                  }}
               >
                  <Box
                     sx={{
                        flex: 1,
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "2px",
                     }}
                  >
                     {/* Barra Nascimentos */}
                     <Tooltip title={`${d.Nascimentos} nascimento(s)`} placement="top">
                        <Box
                           sx={{
                              flex: 1,
                              height: `${(d.Nascimentos / maxVal) * 100}%`,
                              minHeight: d.Nascimentos > 0 ? 4 : 0,
                              bgcolor: "#52B788",
                              borderRadius: "3px 3px 0 0",
                              transition: "height 0.4s ease",
                              cursor: "default",
                              "&:hover": { opacity: 0.8 },
                           }}
                        />
                     </Tooltip>
                     {/* Barra Mortes */}
                     <Tooltip title={`${d.Mortes} morte(s)`} placement="top">
                        <Box
                           sx={{
                              flex: 1,
                              height: `${(d.Mortes / maxVal) * 100}%`,
                              minHeight: d.Mortes > 0 ? 4 : 0,
                              bgcolor: "#EF4444",
                              borderRadius: "3px 3px 0 0",
                              transition: "height 0.4s ease",
                              cursor: "default",
                              "&:hover": { opacity: 0.8 },
                           }}
                        />
                     </Tooltip>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                     {d.mes}
                  </Typography>
               </Box>
            ))}
         </Box>

         {/* Legenda */}
         <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
               <Box sx={{ width: 10, height: 10, bgcolor: "#52B788", borderRadius: 0.5 }} />
               <Typography variant="caption" color="text.secondary">
                  Nascimentos
               </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
               <Box sx={{ width: 10, height: 10, bgcolor: "#EF4444", borderRadius: 0.5 }} />
               <Typography variant="caption" color="text.secondary">
                  Mortes
               </Typography>
            </Box>
         </Box>
      </Box>
   );
}

// ─── Componente Principal ─────────────────────────────────────────────────

export default function DashboardPage() {
   const { user } = useAuth();
   const isAdmin = user?.role === "admin";
   const [data, setData] = useState<DashboardData | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      async function fetchAll() {
         setLoading(true);
         setError("");
         try {
            const [
               animalsRes,
               pasturesRes,
               pregnanciesRes,
               estrusRes,
               vaccinationsRes,
               birthsRes,
               mortalitiesRes,
            ] = await Promise.all([
               api.get("/animals"),
               api.get("/pastures?active=true"),
               api.get("/pregnancies?status=pregnant"),
               api.get("/estrus/upcoming?dias=14"),
               api.get("/vaccinations/upcoming?dias=30"),
               api.get("/births"),
               api.get("/mortalities"),
            ]);

            setData({
               animals: animalsRes.data,
               pastures: pasturesRes.data,
               pregnancies: pregnanciesRes.data,
               upcomingEstrus: estrusRes.data,
               upcomingVaccinations: vaccinationsRes.data,
               recentBirths: birthsRes.data.slice(0, 5),
               recentMortalities: mortalitiesRes.data.slice(0, 5),
            });
         } catch {
            setError("Não foi possível carregar os dados do dashboard.");
         } finally {
            setLoading(false);
         }
      }
      fetchAll();
   }, []);

   // ─── Dados derivados ──────────────────────────────────────────────────

   const activeAnimals = data?.animals.filter(a => a.status === "active") ?? [];
   const totalAlerts =
      (data?.upcomingEstrus.length ?? 0) + (data?.upcomingVaccinations.length ?? 0);

   const categoryCounts = activeAnimals.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
   }, {});
   const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

   // Últimos 6 meses
   const monthlyData = (() => {
      const months: Record<string, { mes: string; Nascimentos: number; Mortes: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
         const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
         const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
         const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
         months[key] = {
            mes: label.charAt(0).toUpperCase() + label.slice(1),
            Nascimentos: 0,
            Mortes: 0,
         };
      }
      data?.recentBirths.forEach(b => {
         const key = b.birthDate.slice(0, 7);
         if (months[key]) months[key].Nascimentos++;
      });
      data?.recentMortalities.forEach(m => {
         const key = m.deathDate.slice(0, 7);
         if (months[key]) months[key].Mortes++;
      });
      return Object.values(months);
   })();

   const hour = new Date().getHours();
   const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
   const roleLabel: Record<string, string> = {
      admin: "Administrador",
      owner: "Proprietário",
      farmmanager: "Gerente",
      veterinarian: "Veterinário",
   };

   // ─── Render ───────────────────────────────────────────────────────────

   return (
      <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
         {/* ── Header ── */}
         <Box sx={{ mb: 4 }}>
            <Typography
               variant="h4"
               sx={{
                  fontWeight: 800,
                  color: "text.primary",
                  fontFamily: "'Playfair Display', serif",
                  lineHeight: 1.2,
               }}
            >
               {greeting}, {user?.fullName.split(" ")[0]} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
               {roleLabel[user?.role ?? ""] ?? ""} · {user?.farmName} ·{" "}
               {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
               })}
            </Typography>
         </Box>

         {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
               {error}
            </Alert>
         )}

         {/* ══ LINHA 1 — Cards de resumo ══ */}
         <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
               <SummaryCard
                  title="Animais Ativos"
                  value={loading ? "—" : activeAnimals.length}
                  subtitle={`${data?.animals.filter(a => a.status === "dead").length ?? 0} mortos · ${data?.animals.filter(a => a.status === "sold").length ?? 0} vendidos`}
                  icon={<PetsIcon sx={{ fontSize: 22 }} />}
                  color="#1B4332"
                  loading={loading}
               />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
               <SummaryCard
                  title="Pastos Ativos"
                  value={loading ? "—" : (data?.pastures.length ?? 0)}
                  subtitle={`${data?.pastures.reduce((s, p) => s + p.currentAnimals, 0) ?? 0} animais alocados`}
                  icon={<AgricultureIcon sx={{ fontSize: 22 }} />}
                  color="#2D6A4F"
                  loading={loading}
               />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
               <SummaryCard
                  title="Prenhezes Ativas"
                  value={loading ? "—" : (data?.pregnancies.length ?? 0)}
                  subtitle="Fêmeas confirmadas prenhes"
                  icon={<LocalHospitalIcon sx={{ fontSize: 22 }} />}
                  color="#52B788"
                  loading={loading}
               />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
               <SummaryCard
                  title="Alertas Pendentes"
                  value={loading ? "—" : totalAlerts}
                  subtitle={`${data?.upcomingEstrus.length ?? 0} CIOs · ${data?.upcomingVaccinations.length ?? 0} vacinas`}
                  icon={<TrendingUpIcon sx={{ fontSize: 22 }} />}
                  color={totalAlerts > 0 ? "#F59E0B" : "#1B4332"}
                  loading={loading}
               />
            </Grid>
         </Grid>

         {/* ══ LINHA 2 — Gráficos ══ */}
         <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {/* Donut — Rebanho por categoria */}
            <Grid size={{ xs: 12, md: 5 }}>
               <Paper
                  elevation={0}
                  sx={{
                     border: "1px solid",
                     borderColor: "divider",
                     borderRadius: 3,
                     p: 2.5,
                     height: "100%",
                  }}
               >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                     Rebanho por Categoria
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     Apenas animais ativos
                  </Typography>

                  <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                     {loading ? (
                        <Box
                           sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: 220,
                           }}
                        >
                           <CircularProgress size={40} />
                        </Box>
                     ) : pieData.length === 0 ? (
                        <Box
                           sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: 220,
                           }}
                        >
                           <Typography variant="body2" color="text.secondary">
                              Nenhum animal ativo
                           </Typography>
                        </Box>
                     ) : (
                        <DonutChart data={pieData} total={activeAnimals.length} />
                     )}
                  </Box>
               </Paper>
            </Grid>

            {/* Barras — Nascimentos x Mortes */}
            <Grid size={{ xs: 12, md: 7 }}>
               <Paper
                  elevation={0}
                  sx={{
                     border: "1px solid",
                     borderColor: "divider",
                     borderRadius: 3,
                     p: 2.5,
                     height: "100%",
                  }}
               >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                     Nascimentos × Mortes
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     Últimos 6 meses
                  </Typography>

                  {loading ? (
                     <Box
                        sx={{
                           display: "flex",
                           justifyContent: "center",
                           alignItems: "center",
                           height: 240,
                        }}
                     >
                        <CircularProgress size={40} />
                     </Box>
                  ) : (
                     <Box sx={{ height: 240, mt: 2 }}>
                        <SimpleBarChart data={monthlyData} />
                     </Box>
                  )}
               </Paper>
            </Grid>
         </Grid>

         {/* ══ LINHA 3 — Ocupação dos Pastos ══ */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5, mb: 3 }}
         >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
               <AgricultureIcon sx={{ color: "primary.main", fontSize: 20 }} />
               <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Ocupação dos Pastos
               </Typography>
               <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                  {data?.pastures.length ?? 0} pastos ativos
               </Typography>
            </Box>

            {loading ? (
               <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {[1, 2, 3].map(i => (
                     <Skeleton key={i} height={48} sx={{ borderRadius: 1 }} />
                  ))}
               </Box>
            ) : data?.pastures.length === 0 ? (
               <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 2 }}
               >
                  Nenhum pasto cadastrado
               </Typography>
            ) : (
               <Grid container spacing={2}>
                  {data?.pastures.map(pasture => (
                     <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={pasture.id}>
                        <Box
                           sx={{
                              p: 1.5,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: pasture.occupancyRate >= 90 ? "error.200" : "divider",
                              bgcolor: pasture.occupancyRate >= 90 ? "#FEF2F2" : "transparent",
                           }}
                        >
                           <Box
                              sx={{
                                 display: "flex",
                                 justifyContent: "space-between",
                                 alignItems: "center",
                                 mb: 1,
                              }}
                           >
                              <Box>
                                 <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700, lineHeight: 1.2 }}
                                 >
                                    {pasture.name}
                                 </Typography>
                                 <Typography variant="caption" color="text.secondary">
                                    {pasture.currentAnimals} / {pasture.animalCapacity} animais
                                 </Typography>
                              </Box>
                              <Typography
                                 variant="body2"
                                 sx={{
                                    fontWeight: 800,
                                    color: occupancyColor(pasture.occupancyRate),
                                    fontSize: 15,
                                 }}
                              >
                                 {pasture.occupancyRate}%
                              </Typography>
                           </Box>
                           <Tooltip title={`${pasture.occupancyRate}% ocupado`} placement="top">
                              <LinearProgress
                                 variant="determinate"
                                 value={Math.min(pasture.occupancyRate, 100)}
                                 sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: "#E5E7EB",
                                    "& .MuiLinearProgress-bar": {
                                       bgcolor: occupancyColor(pasture.occupancyRate),
                                       borderRadius: 4,
                                    },
                                 }}
                              />
                           </Tooltip>
                        </Box>
                     </Grid>
                  ))}
               </Grid>
            )}
         </Paper>

         {/* ══ LINHA 4 — Alertas + Eventos Recentes ══ */}
         <Grid container spacing={2.5}>
            {/* Alertas prioritários */}
            <Grid size={{ xs: 12, md: 6 }}>
               <Paper
                  elevation={0}
                  sx={{
                     border: "1px solid",
                     borderColor: "divider",
                     borderRadius: 3,
                     p: 2.5,
                     height: "100%",
                  }}
               >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                     <WarningAmberIcon sx={{ color: "warning.main", fontSize: 20 }} />
                     <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Alertas
                     </Typography>
                     {totalAlerts > 0 && (
                        <Chip
                           label={totalAlerts}
                           color="warning"
                           size="small"
                           sx={{ ml: "auto", fontWeight: 700 }}
                        />
                     )}
                  </Box>

                  {loading ? (
                     <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {[1, 2, 3].map(i => (
                           <Skeleton key={i} height={52} sx={{ borderRadius: 1 }} />
                        ))}
                     </Box>
                  ) : totalAlerts === 0 ? (
                     <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body2" sx={{ color: "success.main", fontWeight: 700 }}>
                           ✓ Nenhum alerta pendente
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                           Tudo em dia nos próximos 14 dias
                        </Typography>
                     </Box>
                  ) : (
                     <Box>
                        {data?.upcomingEstrus.map(e => {
                           const days = daysUntil(e.nextEstrus);
                           return (
                              <AlertItem
                                 key={e.id}
                                 icon={<FavoriteIcon sx={{ fontSize: 16 }} />}
                                 title={`CIO — ${e.animalEarTag ?? e.animalName ?? "Animal"}`}
                                 subtitle={`Previsto para ${formatDate(e.nextEstrus)}`}
                                 badge={days <= 0 ? "Hoje" : `${days}d`}
                                 badgeColor={urgencyColor(Math.max(days, 0))}
                              />
                           );
                        })}
                        {data?.upcomingVaccinations.map(v => {
                           if (!v.nextDoseDate) return null;
                           const days = daysUntil(v.nextDoseDate);
                           return (
                              <AlertItem
                                 key={v.id}
                                 icon={<VaccinesIcon sx={{ fontSize: 16 }} />}
                                 title={`${v.vaccineType} — ${v.animalEarTag ?? v.animalName ?? "Animal"}`}
                                 subtitle={`Próxima dose em ${formatDate(v.nextDoseDate)}`}
                                 badge={days <= 0 ? "Vencida" : `${days}d`}
                                 badgeColor={urgencyColor(Math.max(days, 0))}
                              />
                           );
                        })}
                     </Box>
                  )}
               </Paper>
            </Grid>

            {/* Eventos recentes */}
            <Grid size={{ xs: 12, md: 6 }}>
               <Paper
                  elevation={0}
                  sx={{
                     border: "1px solid",
                     borderColor: "divider",
                     borderRadius: 3,
                     p: 2.5,
                     height: "100%",
                  }}
               >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                     <NotificationsActiveIcon sx={{ color: "primary.main", fontSize: 20 }} />
                     <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Eventos Recentes
                     </Typography>
                  </Box>

                  {loading ? (
                     <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {[1, 2, 3, 4].map(i => (
                           <Skeleton key={i} height={52} sx={{ borderRadius: 1 }} />
                        ))}
                     </Box>
                  ) : (
                     <Box>
                        {data?.pregnancies.slice(0, 2).map(p => {
                           const estimated =
                              p.attempts?.[p.attempts.length - 1]?.estimatedBirthDate;
                           return (
                              <AlertItem
                                 key={p.id}
                                 icon={<LocalHospitalIcon sx={{ fontSize: 16 }} />}
                                 title={`Prenhe — ${p.animalEarTag ?? p.animalName ?? "Fêmea"}`}
                                 subtitle={
                                    estimated
                                       ? `Parto previsto: ${formatDate(estimated)}`
                                       : "Prenhez confirmada"
                                 }
                                 badge="Prenhe"
                                 badgeColor="info"
                              />
                           );
                        })}
                        {data?.recentBirths.slice(0, 2).map(b => (
                           <AlertItem
                              key={b.id}
                              icon={<BabyChangingStationIcon sx={{ fontSize: 16 }} />}
                              title={`Parto — ${b.damEarTag ?? b.damName ?? "Vaca"}`}
                              subtitle={`${daysAgo(b.birthDate)}d atrás · ${b.situation === "normal" ? "Normal" : "Natimorto"} · ${b.calfGender === "M" ? "Bezerro" : b.calfGender === "F" ? "Bezerra" : "—"}`}
                              badge={formatDate(b.birthDate)}
                              badgeColor={b.situation === "normal" ? "success" : "error"}
                           />
                        ))}
                        {data?.recentMortalities.slice(0, 2).map(m => (
                           <AlertItem
                              key={m.id}
                              icon={<HeartBrokenIcon sx={{ fontSize: 16 }} />}
                              title={`Óbito — ${m.animalEarTag ?? m.animalName ?? "Animal"}`}
                              subtitle={`${daysAgo(m.deathDate)}d atrás · ${m.causeOfDeath}`}
                              badge={formatDate(m.deathDate)}
                              badgeColor="error"
                           />
                        ))}
                        {data?.pregnancies.length === 0 &&
                           data?.recentBirths.length === 0 &&
                           data?.recentMortalities.length === 0 && (
                              <Box sx={{ textAlign: "center", py: 4 }}>
                                 <Typography variant="body2" color="text.secondary">
                                    Nenhum evento recente registrado
                                 </Typography>
                              </Box>
                           )}
                     </Box>
                  )}
               </Paper>
            </Grid>
         </Grid>
      </Box>
   );
}
