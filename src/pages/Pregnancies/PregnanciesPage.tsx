import AddIcon from "@mui/icons-material/Add";
import BabyChangingStationIcon from "@mui/icons-material/BabyChangingStation";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FilterListIcon from "@mui/icons-material/FilterList";
import HistoryIcon from "@mui/icons-material/History";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PendingIcon from "@mui/icons-material/Pending";
import ScienceIcon from "@mui/icons-material/Science";
import SearchIcon from "@mui/icons-material/Search";
import {
   Alert,
   Autocomplete,
   Avatar,
   Box,
   Button,
   Chip,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   Divider,
   FormControl,
   IconButton,
   InputAdornment,
   InputLabel,
   MenuItem,
   Paper,
   Select,
   Skeleton,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   TextField,
   Timeline,
   TimelineConnector,
   TimelineContent,
   TimelineDot,
   TimelineItem,
   TimelineSeparator,
   Tooltip,
   Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import type { number } from "zod";
import { usePermission } from "@/hooks/usePermission";
import api from "@/services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────

type Pregnancystatus = "not_started" | "in_progress" | "pregnant" | "failed";
type MatingType = "NATURAL" | "AI";
type UltrasoundResult = "PREGNANT" | "EMPTY" | "ABSORPTION" | "VIABLE";

interface UltrasoundResponse {
   id: string;
   attemptId: string;
   days: number;
   result: UltrasoundResult;
   notes: string | null;
   ultrasoundDate: string;
   veterinarianId: string | null;
   veterinarianName: string | null;
}

interface AttemptResponse {
   id: string;
   pregnancyId: string;
   number: number;
   matingDate: string;
   matingType: MatingType;
   bullId: string | null;
   bullEarTag: string | null;
   semenName: string | null;
   technican: string | null;
   estimatedBirthDate: string;
   attemptStatus: "in_progress" | "success" | "failed";
   notes: string | null;
   ultrasounds: UltrasoundResponse[];
}

interface PregnancyResponse {
   id: string;
   farmId: string;
   animalId: string;
   animalEarTag: string | null;
   animalName: string | null;
   currentStatus: PregnancyStatus;
   currentStatusDate: string;
   totalAttempts: number;
   attempts: AttemptResponse[];
   createdAt: string;
   updatedAt: string;
}

interface AnimalOption {
   id: string;
   name: string;
   chipId: string;
   currentEarTag: string | null;
   gender: string;
   status: string;
}
interface BullOption {
   id: string;
   name: string;
   chipId: string;
   currentEarTag: string | null;
}

// ------ Helpers ------
function formatDate(iso: string | null | undefined) {
   if (!iso) return "-";
   return new Date(iso).toLocaleDateString("pt-BR");
}
function daysUntil(iso: string): number {
   const diff = new Date(iso).getTime() - Date.now();
   return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const STATUS_CONFIG: Record<
   PregnancyStatus,
   { label: string; color: any; bgcolor: string; icon: React.ReactNode }
> = {
   not_started: {
      label: "Aguardando",
      color: "default",
      bgcolor: "#F3F4F6",
      icon: <PendingIcon sx={{ fontSize: 14 }} />,
   },
   in_progress: {
      label: "Em andamento",
      color: "info",
      bgcolor: "#EFF6FF",
      icon: <FavoriteIcon sx={{ fontSize: 14 }} />,
   },
   pregnant: {
      label: "Prenha",
      color: "success",
      bgcolor: "#f0fff4",
      icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
   },
   failed: {
      label: "Falha",
      color: "error",
      bgcolor: "#fef2f2",
      icon: <CancelIcon sx={{ fontSize: 14 }} />,
   },
};

const ATTEMPT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
   in_progress: { label: "Em andamento", color: "#3B82F6" },
   success: { label: "Sucesso", color: "#10B981" },
   failed: { label: "Falhou", color: "#EF4444" },
};

const ULTRASOUND_RESULT_CONFIG: Record<UltrasoundResult, { label: string; color: string }> = {
   PREGNANT: { label: "Prenha", color: "#10B981" },
   VIABLE: { label: "Viavel", color: "#1B4332" },
   EMPTY: { label: "Vazia", color: "#EF4444" },
   ABSORPTION: { label: "Absorvido", color: "#F59E0B" },
};

// ----- Card de Resumo ----------

interface SummaryCardProps {
   title: string;
   value: number | string;
   subtitle?: string;
   icon: React.ReactNode;
   color: string;
   loading?: boolean;
   alert?: boolean;
}

function SummartCard({ title, value, subtitle, icon, color, loading, alert }: SummaryCardProps) {
   return (
      <Paper
         elevation={0}
         sx={{
            border: "1px solid",
            borderColor: alert ? "warning.300" : "divider",
            bgcolor: alert ? "#FFFBEB" : "background.paper",
            borderRadius: 3,
            p: 2.5,
            flex: 1,
            position: "relative",
            overflow: "hidden",
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
            <Box>
               <Typography
                  variant="caption"
                  sx={{
                     color: alert ? "warning.dark" : "text.secondary",
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
                        color: alert ? "warning.dark" : "text.primary",
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
                     color={alert ? "warning.dark" : "text.secondary"}
                     sx={{ mt: 0.5, display: "block" }}
                  >
                     {subtitle}
                  </Typography>
               )}
            </Box>
            <Avatar
               sx={{ bgcolor: alert ? "#F59E0B" : color, width: 48, height: 48, borderRadius: 2 }}
            >
               {icon}
            </Avatar>
         </Box>
      </Paper>
   );
}

// ----- Dialogo: Iniciar Prenhez -----
