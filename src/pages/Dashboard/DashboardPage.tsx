import AgricultureIcon from "@mui/icons-material/Agriculture";
import BabyChangingStationIcon from "@mui/icons-material/BabyChangingStation";
import FavoriteIcon from "@mui/icons-material/Favorite";
import GrassIcon from "@mui/icons-material/Grass";
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
   Divider,
   Grid,
   LinearProgress,
   Paper,
   Skeleton,
   Tooltip,
   Typography,
} from "@mui/material";
import { useEffect, useSate, useState } from "react";
import {
   Bar,
   BarChart,
   CartesianGrid,
   Cell,
   Legend,
   Pie,
   PieChart,
   Tooltip as RechartsTooltip,
   ResponsiveContainer,
   XAxis,
   YAxis,
} from "recharts";
import { set } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

// ------- Tipos ------------

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
interface Pragnancy {
   id: string;
   animalId: string;
   animalName: string | null;
   animalEarTag: string | null;
   currentStatus: string;
   attemps: Array<{ estimatedDate: string; matingDate: string }>;
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
   pragnancies: Pragnancy[];
   upcomingEstrus: Estrus[];
   upcomingVaccinations: Vaccination[];
   recentBirths: Birth[];
   recentMortalities: Mortality[];
}

// --------------- HELPERS ---------------

function formatDate(iso: string) {
   return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
   });
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
   if (rate >= 80) return "#EF4444";
   if (rate >= 70) return "#F59E0B";
   return "#1B4332";
}
// ─── Componente de Card de Resumo ──────────

interface SummaryCardProps {
   title: string;
   value: string | number;
   subtitle?: string;
   icon: React.ReactNode;
   color: string;
   loading?: boolean;
   trend?: { value: number; label: string };
}
function SummaryCard({ title, value, subtitle, icon, color, loading, trend }: SummaryCardProps) {
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
         {/* ── Fundo Decorativo ── */}
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
         <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ flex: 1 }}>
               <Typography
                  variant="h3"
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
                     sx={{
                        fontWeight: 800,
                        color: "text.primary",
                        lineHeight: 1.1,
                        mt: 0.5,
                     }}
                  >
                     {value}
                  </Typography>
               )}
               {subtitle && !loading && (
                  <Typography
                     variant="caption"
                     color="text.secondary"
                     sx={{
                        mt: 0.5,
                        display: "block",
                     }}
                  >
                     {subtitle}
                  </Typography>
               )}
               {trend && !loading && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                     <TrendingUpIcon
                        sx={{
                           fontSize: 14,
                           color: trend.value >= 0 ? "success.main" : "error.main",
                        }}
                     />
                     <Typography
                        variant="caption"
                        sx={{
                           color: trend.value >= 0 ? "success.main" : "error.main",
                           fontWeight: 700,
                        }}
                     >
                        {trend.value}
                     </Typography>
                  </Box>
               )}
            </Box>
            <Avatar
               sx={{
                  bgcolor: color,
                  width: 48,
                  height: 48,
                  borderRadius: 2,
               }}
            >
               {icon}
            </Avatar>
         </Box>
      </Paper>
   );
}

// ─── Componente de Alerta Item ─────────

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
            "&:last-child": { borderBottom: "none", pb: 8 },
            "&:first-of-type": { pt: 8 },
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
export default function DashboardPage() {
   const { user } = useAuth();
   const [data, setData] = useSate<DashboardData | null>(null);
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
            setError("Não foi possível carregar os dados do Dashboard");
         } finally {
            setLoading(false);
         }
      }
      fetchAll();
   }, []);

   // ─── Dados derivados ────────────
   const activeAnimals = data?.animals.filter(a => a.status === "active") ?? [];
   const totalAlerts =
      (data?.upcomingEstrus.length ?? 0) + (data?.upcomingVaccinations.length ?? 0);

   //Rebanho por categoria para gráficos de pizza
   const categoryCounts = activeAnimals.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
   }, {});

   const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
   const PIE_COLORS: Record<string, string> = {
      Touro: "#1B4332",
      Vaca: "#2D6A4F",
      Garrote: "#52B788",
      Novilha: "#74C69D",
      Bezerro: "#95D5B2",
      Bezerra: "#B7E4C7",
   };

   //Nascimento e mortes por mês (ultimos 6 meses)
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

   // ------ Hora do dia para Saudação
   const hour = new Date().getHours();
   const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa Tarde" : "Boa Noite";

   const roleLabel: Record<string, string> = {
      admin: "Administrador",
      owner: "Proprietário",
      farmmanager: "Gerente da fazenda",
      veterinarian: "Veterinário",
   };

   // ------------ Render ------------
   return (
      {/** -----Header----- */}
      <Box sx= {{mb:}}>



      </Box>
   )
}
