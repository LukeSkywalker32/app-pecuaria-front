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
import { useEffect, useSate } from "react";
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
