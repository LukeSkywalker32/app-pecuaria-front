import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BabyChangingStationIcon from "@mui/icons-material/BabyChangingStation";
import LabelIcon from "@mui/icons-material/Label";
import LabelOffIcon from "@mui/icons-material/LabelOff";
import PetsIcon from "@mui/icons-material/Pets";
import PregnantWomanIcon from "@mui/icons-material/PregnantWoman";
import ScienceIcon from "@mui/icons-material/Science";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
   Alert,
   Box,
   Button,
   Chip,
   CircularProgress,
   Divider,
   Paper,
   Tab,
   Table,
   TableBody,
   TableCell,
   TableContainer,
   TableHead,
   TableRow,
   Tabs,
   Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AnimalMovementHistory from "@/pages/Management/components/AnimalMovementHistory";
import api from "@/services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────

export interface AnimalResponse {
   id: string;
   name: string;
   chipId: string;
   currentEarTag: string | null;
   gender: "M" | "F";
   birthDate: string;
   origin: "born" | "purchased";
   breed: string;
   category: string;
   status: "active" | "dead" | "sold" | "quarantine" | "treatment";
   pastureId: string | null;
   pastureName: string | null;
   weightKg: number | null;
   ageInMonths: number;
   createdAt: string;
}

interface EarTagRecord {
   id: string;
   earTagNumber: string;
   placementDate: string;
   removalDate: string | null;
   reason: string | null;
   isActive: boolean;
}

interface VaccinationRecord {
   id: string;
   vaccineType: string;
   brand: string;
   batch: string;
   vaccinationDate: string;
   expirationDate: string;
   nextDoseDate: string | null;
   reaction: string | null;
   notes: string | null;
   veterinarianName: string | null;
}

interface EstrusRecord {
   id: string;
   date: string;
   intensity: string;
   nextEstrus: string;
   notes: string | null;
   detectedByName: string | null;
}

interface AttemptRecord {
   id: string;
   number: number;
   matingDate: string;
   matingType: string;
   bullEarTag: string | null;
   semenName: string | null;
   technician: string | null;
   estimatedBirthDate: string;
   attemptStatus: string;
   notes: string | null;
   ultrasounds: {
      id: string;
      days: number;
      result: string;
      ultrasoundDate: string;
      notes: string | null;
   }[];
}

interface PregnancyRecord {
   id: string;
   currentStatus: string;
   currentStatusDate: string;
   totalAttempts: number;
   attempts: AttemptRecord[];
   createdAt: string;
}

interface BirthRecord {
   id: string;
   birthDate: string;
   birthTime: string | null;
   birthType: string;
   situation: string;
   calfGender: string | null;
   calfWeight: number | null;
   calfEarTag: string | null;
   calfChip: string | null;
   deathReason: string | null;
   notes: string | null;
   veterinarianName: string | null;
}

interface MortalityRecord {
   id: string;
   deathDate: string;
   deathTime: string | null;
   deathLocation: string;
   causeOfDeath: string;
   severity: string | null;
   necropsy: boolean;
   disposal: string | null;
   notes: string | null;
   registeredByName: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function statusLabel(s: string) {
   return (
      {
         active: "Ativo",
         dead: "Morto",
         sold: "Vendido",
         quarantine: "Quarentena",
         treatment: "Tratamento",
      }[s] ?? s
   );
}

function statusColor(s: string): any {
   return (
      {
         active: "success",
         dead: "error",
         sold: "default",
         quarantine: "warning",
         treatment: "info",
      }[s] ?? "default"
   );
}

function formatDate(iso: string | null | undefined) {
   if (!iso) return "—";
   return new Date(iso).toLocaleDateString("pt-BR");
}

function intensityLabel(v: string) {
   return { weak: "Fraco", moderate: "Moderado", strong: "Forte" }[v] ?? v;
}

function intensityColor(v: string): any {
   return { weak: "default", moderate: "warning", strong: "success" }[v] ?? "default";
}

function pregnancyStatusLabel(s: string) {
   return (
      {
         not_started: "Não iniciada",
         in_progress: "Em andamento",
         pregnant: "Prenha",
         failed: "Falhou",
         completed: "Concluída",
      }[s] ?? s
   );
}

function pregnancyStatusColor(s: string): any {
   return (
      {
         not_started: "default",
         in_progress: "info",
         pregnant: "success",
         failed: "error",
         completed: "success",
      }[s] ?? "default"
   );
}

function matingTypeLabel(v: string) {
   return { NATURAL: "Monta Natural", AI: "Inseminação Artificial" }[v] ?? v;
}

function attemptStatusLabel(s: string) {
   return (
      {
         pending: "Pendente",
         success: "Sucesso",
         failed: "Falhou",
      }[s] ?? s
   );
}

function ultrasoundResultLabel(r: string) {
   return { PREGNANT: "Prenha", EMPTY: "Vazia", ABSORPTION: "Absorção", VIABLE: "Viável" }[r] ?? r;
}

function ultrasoundResultColor(r: string): any {
   return (
      { PREGNANT: "success", EMPTY: "error", ABSORPTION: "warning", VIABLE: "success" }[r] ??
      "default"
   );
}

function birthTypeLabel(v: string) {
   return { normal: "Normal", assisted: "Assistido", c_section: "Cesárea" }[v] ?? v;
}

function birthSituationLabel(v: string) {
   return { normal: "Vivo", dead: "Natimorto" }[v] ?? v;
}

function severityLabel(v: string | null) {
   if (!v) return "—";
   return { low: "Baixa", medium: "Média", high: "Alta" }[v] ?? v;
}

function severityColor(v: string | null): any {
   if (!v) return "default";
   return { low: "success", medium: "warning", high: "error" }[v] ?? "default";
}

// ─── Sub-componente: estado vazio ─────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
   return (
      <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
         <Typography variant="body2">{message}</Typography>
      </Box>
   );
}

// ─── Sub-componente: carregando ───────────────────────────────────────────

function LoadingState() {
   return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
         <CircularProgress size={28} color="primary" />
      </Box>
   );
}

// ─── TAB: Brincos ─────────────────────────────────────────────────────────

function EarTagsTab({ animalId }: { animalId: string }) {
   const [records, setRecords] = useState<EarTagRecord[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      api.get<EarTagRecord[]>(`/earTagHistory/animal/${animalId}`)
         .then(({ data }) => setRecords(data))
         .catch(() => setRecords([]))
         .finally(() => setLoading(false));
   }, [animalId]);

   if (loading) return <LoadingState />;
   if (records.length === 0)
      return <EmptyState message="Nenhum brinco registrado para este animal." />;

   return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
         {records.map((r, idx) => (
            <Box
               key={r.id}
               sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: r.isActive ? "success.200" : "divider",
                  bgcolor: r.isActive ? "#F0FFF4" : "#FAFAFA",
                  position: "relative",
               }}
            >
               {idx < records.length - 1 && (
                  <Box
                     sx={{
                        position: "absolute",
                        bottom: -13,
                        left: 28,
                        width: 2,
                        height: 14,
                        bgcolor: "divider",
                     }}
                  />
               )}
               <Box
                  sx={{
                     display: "flex",
                     alignItems: "flex-start",
                     justifyContent: "space-between",
                     gap: 1,
                  }}
               >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                     {r.isActive ? (
                        <LabelIcon sx={{ fontSize: 18, color: "success.main" }} />
                     ) : (
                        <LabelOffIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                     )}
                     <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                           {r.earTagNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                           Colocado em {formatDate(r.placementDate)}
                           {r.removalDate && ` · Removido em ${formatDate(r.removalDate)}`}
                        </Typography>
                        {r.reason && (
                           <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                           >
                              Motivo: {r.reason}
                           </Typography>
                        )}
                     </Box>
                  </Box>
                  <Chip
                     label={r.isActive ? "Ativo" : "Removido"}
                     color={r.isActive ? "success" : "default"}
                     size="small"
                     sx={{ fontSize: 11, height: 22 }}
                  />
               </Box>
            </Box>
         ))}
      </Box>
   );
}

// ─── TAB: Vacinações ──────────────────────────────────────────────────────

function VaccinationsTab({ animalId }: { animalId: string }) {
   const [records, setRecords] = useState<VaccinationRecord[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      api.get<VaccinationRecord[]>(`/vaccinations/animal/${animalId}`)
         .then(({ data }) => setRecords(data))
         .catch(() => setRecords([]))
         .finally(() => setLoading(false));
   }, [animalId]);

   if (loading) return <LoadingState />;
   if (records.length === 0)
      return <EmptyState message="Nenhuma vacinação registrada para este animal." />;

   return (
      <TableContainer
         component={Paper}
         elevation={0}
         sx={{ border: "1px solid", borderColor: "divider" }}
      >
         <Table size="small">
            <TableHead>
               <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                  {["DATA", "VACINA", "MARCA / LOTE", "VALIDADE", "PRÓX. DOSE", "VETERINÁRIO"].map(
                     h => (
                        <TableCell
                           key={h}
                           sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                        >
                           {h}
                        </TableCell>
                     ),
                  )}
               </TableRow>
            </TableHead>
            <TableBody>
               {records.map(r => (
                  <TableRow key={r.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                     <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           {formatDate(r.vaccinationDate)}
                        </Typography>
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           {r.vaccineType}
                        </Typography>
                        {r.reaction && (
                           <Typography variant="caption" color="warning.main">
                              Reação: {r.reaction}
                           </Typography>
                        )}
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2">{r.brand}</Typography>
                        <Typography variant="caption" color="text.secondary">
                           Lote: {r.batch}
                        </Typography>
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2">{formatDate(r.expirationDate)}</Typography>
                     </TableCell>
                     <TableCell>
                        <Typography
                           variant="body2"
                           color={r.nextDoseDate ? "primary.main" : "text.disabled"}
                        >
                           {formatDate(r.nextDoseDate)}
                        </Typography>
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2">{r.veterinarianName ?? "—"}</Typography>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </TableContainer>
   );
}

// ─── TAB: CIOs ────────────────────────────────────────────────────────────

function EstrusTab({ animalId }: { animalId: string }) {
   const [records, setRecords] = useState<EstrusRecord[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      api.get<EstrusRecord[]>(`/estrus/animal/${animalId}`)
         .then(({ data }) => setRecords(data))
         .catch(() => setRecords([]))
         .finally(() => setLoading(false));
   }, [animalId]);

   if (loading) return <LoadingState />;
   if (records.length === 0)
      return <EmptyState message="Nenhum CIO registrado para este animal." />;

   return (
      <TableContainer
         component={Paper}
         elevation={0}
         sx={{ border: "1px solid", borderColor: "divider" }}
      >
         <Table size="small">
            <TableHead>
               <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                  {[
                     "DATA",
                     "INTENSIDADE",
                     "PRÓX. CIO ESPERADO",
                     "DETECTADO POR",
                     "OBSERVAÇÕES",
                  ].map(h => (
                     <TableCell
                        key={h}
                        sx={{ fontWeight: 700, color: "text.secondary", fontSize: 12 }}
                     >
                        {h}
                     </TableCell>
                  ))}
               </TableRow>
            </TableHead>
            <TableBody>
               {records.map(r => (
                  <TableRow key={r.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                     <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           {formatDate(r.date)}
                        </Typography>
                     </TableCell>
                     <TableCell>
                        <Chip
                           label={intensityLabel(r.intensity)}
                           color={intensityColor(r.intensity)}
                           size="small"
                           sx={{ fontSize: 11, height: 22 }}
                        />
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2">{formatDate(r.nextEstrus)}</Typography>
                     </TableCell>
                     <TableCell>
                        <Typography variant="body2">{r.detectedByName ?? "—"}</Typography>
                     </TableCell>
                     <TableCell>
                        <Typography
                           variant="body2"
                           color={r.notes ? "text.primary" : "text.disabled"}
                           sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                           }}
                        >
                           {r.notes ?? "—"}
                        </Typography>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </TableContainer>
   );
}

// ─── TAB: Prenhez ─────────────────────────────────────────────────────────

function PregnancyTab({ animalId }: { animalId: string }) {
   const [records, setRecords] = useState<PregnancyRecord[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      api.get<PregnancyRecord[]>(`/pregnancies/animal/${animalId}`)
         .then(({ data }) => setRecords(data))
         .catch(() => setRecords([]))
         .finally(() => setLoading(false));
   }, [animalId]);

   if (loading) return <LoadingState />;
   if (records.length === 0)
      return <EmptyState message="Nenhuma prenhez registrada para este animal." />;

   return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
         {records.map(preg => (
            <Paper
               key={preg.id}
               elevation={0}
               sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
               }}
            >
               {/* Header da prenhez */}
               <Box
                  sx={{
                     p: 2,
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "space-between",
                     bgcolor: "#F9FAFB",
                  }}
               >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                     <PregnantWomanIcon sx={{ fontSize: 18, color: "primary.main" }} />
                     <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Prenhez — iniciada em {formatDate(preg.createdAt)}
                     </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                     <Typography variant="caption" color="text.secondary">
                        {preg.totalAttempts} cobertura(s)
                     </Typography>
                     <Chip
                        label={pregnancyStatusLabel(preg.currentStatus)}
                        color={pregnancyStatusColor(preg.currentStatus)}
                        size="small"
                        sx={{ fontSize: 11, height: 22 }}
                     />
                  </Box>
               </Box>

               {/* Tentativas */}
               {preg.attempts.length > 0 && (
                  <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                     {preg.attempts.map(attempt => (
                        <Box
                           key={attempt.id}
                           sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                           }}
                        >
                           <Box
                              sx={{
                                 display: "flex",
                                 justifyContent: "space-between",
                                 alignItems: "flex-start",
                                 mb: 0.5,
                              }}
                           >
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                 Cobertura #{attempt.number} — {formatDate(attempt.matingDate)}
                              </Typography>
                              <Chip
                                 label={attemptStatusLabel(attempt.attemptStatus)}
                                 color={
                                    attempt.attemptStatus === "success"
                                       ? "success"
                                       : attempt.attemptStatus === "failed"
                                         ? "error"
                                         : "default"
                                 }
                                 size="small"
                                 sx={{ fontSize: 11, height: 20 }}
                              />
                           </Box>
                           <Typography variant="caption" color="text.secondary">
                              {matingTypeLabel(attempt.matingType)}
                              {attempt.bullEarTag && ` · Touro: ${attempt.bullEarTag}`}
                              {attempt.semenName && ` · Sêmen: ${attempt.semenName}`}
                              {attempt.technician && ` · Técnico: ${attempt.technician}`}
                           </Typography>
                           <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                           >
                              Parto estimado: {formatDate(attempt.estimatedBirthDate)}
                           </Typography>

                           {/* Ultrassons */}
                           {attempt.ultrasounds.length > 0 && (
                              <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                 {attempt.ultrasounds.map(u => (
                                    <Box
                                       key={u.id}
                                       sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                          p: "2px 8px",
                                          borderRadius: 1,
                                          bgcolor: "#F0F4F1",
                                          border: "1px solid",
                                          borderColor: "divider",
                                       }}
                                    >
                                       <ScienceIcon
                                          sx={{ fontSize: 13, color: "text.secondary" }}
                                       />
                                       <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                          US {u.days}d
                                       </Typography>
                                       <Chip
                                          label={ultrasoundResultLabel(u.result)}
                                          color={ultrasoundResultColor(u.result)}
                                          size="small"
                                          sx={{ fontSize: 10, height: 18 }}
                                       />
                                       <Typography variant="caption" color="text.secondary">
                                          {formatDate(u.ultrasoundDate)}
                                       </Typography>
                                    </Box>
                                 ))}
                              </Box>
                           )}
                        </Box>
                     ))}
                  </Box>
               )}
            </Paper>
         ))}
      </Box>
   );
}

// ─── TAB: Partos ──────────────────────────────────────────────────────────

function BirthsTab({ animalId }: { animalId: string }) {
   const [records, setRecords] = useState<BirthRecord[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      api.get<BirthRecord[]>(`/births/animal/${animalId}`)
         .then(({ data }) => setRecords(data))
         .catch(() => setRecords([]))
         .finally(() => setLoading(false));
   }, [animalId]);

   if (loading) return <LoadingState />;
   if (records.length === 0)
      return <EmptyState message="Nenhum parto registrado para este animal." />;

   return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
         {records.map(r => (
            <Paper
               key={r.id}
               elevation={0}
               sx={{
                  border: "1px solid",
                  borderColor: r.situation === "dead" ? "error.200" : "divider",
                  borderRadius: 2,
                  p: 2,
               }}
            >
               <Box
                  sx={{
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "space-between",
                     mb: 1,
                  }}
               >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                     <BabyChangingStationIcon
                        sx={{
                           fontSize: 18,
                           color: r.situation === "dead" ? "error.main" : "success.main",
                        }}
                     />
                     <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatDate(r.birthDate)}
                        {r.birthTime && ` às ${r.birthTime}`}
                     </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                     <Chip
                        label={birthTypeLabel(r.birthType)}
                        size="small"
                        sx={{ fontSize: 11, height: 22 }}
                     />
                     <Chip
                        label={birthSituationLabel(r.situation)}
                        color={r.situation === "dead" ? "error" : "success"}
                        size="small"
                        sx={{ fontSize: 11, height: 22 }}
                     />
                  </Box>
               </Box>

               <Box
                  sx={{
                     display: "grid",
                     gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                     gap: 1.5,
                  }}
               >
                  {[
                     {
                        label: "Sexo do Bezerro",
                        value:
                           r.calfGender === "M" ? "Macho" : r.calfGender === "F" ? "Fêmea" : "—",
                     },
                     {
                        label: "Peso ao Nascer",
                        value: r.calfWeight != null ? `${r.calfWeight} kg` : "—",
                     },
                     { label: "Brinco Bezerro", value: r.calfEarTag ?? "—" },
                     { label: "Chip Bezerro", value: r.calfChip ?? "—" },
                     { label: "Veterinário", value: r.veterinarianName ?? "—" },
                  ].map(item => (
                     <Box key={item.label}>
                        <Typography
                           variant="caption"
                           color="text.secondary"
                           sx={{
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              display: "block",
                           }}
                        >
                           {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           {item.value}
                        </Typography>
                     </Box>
                  ))}
               </Box>

               {r.deathReason && (
                  <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: "#FEF2F2" }}>
                     <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                        Causa da morte:{" "}
                     </Typography>
                     <Typography variant="caption" color="error.main">
                        {r.deathReason}
                     </Typography>
                  </Box>
               )}
               {r.notes && (
                  <Typography
                     variant="caption"
                     color="text.secondary"
                     sx={{ display: "block", mt: 1 }}
                  >
                     Obs: {r.notes}
                  </Typography>
               )}
            </Paper>
         ))}
      </Box>
   );
}

// ─── TAB: Mortalidade ─────────────────────────────────────────────────────

function MortalityTab({ animalId }: { animalId: string }) {
   const [records, setRecords] = useState<MortalityRecord[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      api.get<MortalityRecord[]>(`/mortalities/animal/${animalId}`)
         .then(({ data }) => setRecords(data))
         .catch(() => setRecords([]))
         .finally(() => setLoading(false));
   }, [animalId]);

   if (loading) return <LoadingState />;
   if (records.length === 0)
      return <EmptyState message="Nenhum registro de mortalidade para este animal." />;

   return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
         {records.map(r => (
            <Paper
               key={r.id}
               elevation={0}
               sx={{
                  border: "1px solid",
                  borderColor: "error.200",
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "#FFF8F8",
               }}
            >
               <Box
                  sx={{
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "space-between",
                     mb: 1.5,
                  }}
               >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                     <WarningAmberIcon sx={{ fontSize: 18, color: "error.main" }} />
                     <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                        {formatDate(r.deathDate)}
                        {r.deathTime && ` às ${r.deathTime}`}
                     </Typography>
                  </Box>
                  {r.severity && (
                     <Chip
                        label={`Gravidade: ${severityLabel(r.severity)}`}
                        color={severityColor(r.severity)}
                        size="small"
                        sx={{ fontSize: 11, height: 22 }}
                     />
                  )}
               </Box>

               <Box
                  sx={{
                     display: "grid",
                     gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                     gap: 1.5,
                  }}
               >
                  {[
                     { label: "Local", value: r.deathLocation },
                     { label: "Causa", value: r.causeOfDeath },
                     { label: "Destino", value: r.disposal ?? "—" },
                     { label: "Necropsia", value: r.necropsy ? "Sim" : "Não" },
                     { label: "Registrado por", value: r.registeredByName ?? "—" },
                  ].map(item => (
                     <Box key={item.label}>
                        <Typography
                           variant="caption"
                           color="text.secondary"
                           sx={{
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              display: "block",
                           }}
                        >
                           {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                           {item.value}
                        </Typography>
                     </Box>
                  ))}
               </Box>

               {r.notes && (
                  <Typography
                     variant="caption"
                     color="text.secondary"
                     sx={{ display: "block", mt: 1.5 }}
                  >
                     Obs: {r.notes}
                  </Typography>
               )}
            </Paper>
         ))}
      </Box>
   );
}

// ─── TabPanel ─────────────────────────────────────────────────────────────

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

// ─── Componente Principal ─────────────────────────────────────────────────

export default function AnimalDetailPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();

   const [animal, setAnimal] = useState<AnimalResponse | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [tab, setTab] = useState(0);

   useEffect(() => {
      if (!id) return;
      setLoading(true);
      api.get<AnimalResponse>(`/animals/${id}`)
         .then(({ data }) => setAnimal(data))
         .catch(() => setError("Animal não encontrado."))
         .finally(() => setLoading(false));
   }, [id]);

   if (loading) {
      return (
         <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
            <CircularProgress color="primary" />
         </Box>
      );
   }

   if (error || !animal) {
      return (
         <Box sx={{ p: 3 }}>
            <Alert severity="error">{error || "Animal não encontrado."}</Alert>
            <Button
               startIcon={<ArrowBackIcon />}
               onClick={() => navigate("/animals")}
               sx={{ mt: 2 }}
            >
               Voltar para Animais
            </Button>
         </Box>
      );
   }

   return (
      <Box sx={{ p: 3, maxWidth: 900 }}>
         <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/animals")}
            sx={{ mb: 2, color: "text.secondary", pl: 0 }}
         >
            Animais
         </Button>

         {/* ── Card principal do animal ── */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, mb: 2 }}
         >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
               <Box
                  sx={{
                     width: 56,
                     height: 56,
                     borderRadius: 2,
                     bgcolor: animal.gender === "M" ? "#E8F5E9" : "#FCE4EC",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     flexShrink: 0,
                  }}
               >
                  <PetsIcon
                     sx={{ color: animal.gender === "M" ? "#1B4332" : "#880E4F", fontSize: 28 }}
                  />
               </Box>

               <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                     <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {animal.name}
                     </Typography>
                     <Chip
                        label={statusLabel(animal.status)}
                        color={statusColor(animal.status)}
                        size="small"
                     />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                     {animal.breed} · {animal.category} ·{" "}
                     {animal.gender === "M" ? "Macho" : "Fêmea"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                     Brinco: <strong>{animal.currentEarTag ?? "—"}</strong> · Chip:{" "}
                     <strong>{animal.chipId}</strong>
                  </Typography>
               </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box
               sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 2,
               }}
            >
               {[
                  { label: "Data de Nascimento", value: formatDate(animal.birthDate) },
                  {
                     label: "Idade",
                     value:
                        animal.ageInMonths < 12
                           ? `${animal.ageInMonths} meses`
                           : `${Math.floor(animal.ageInMonths / 12)} anos`,
                  },
                  {
                     label: "Peso",
                     value: animal.weightKg != null ? `${animal.weightKg} kg` : "Não informado",
                  },
                  { label: "Pasto Atual", value: animal.pastureName ?? "Sem pasto" },
                  {
                     label: "Origem",
                     value: animal.origin === "born" ? "Nascido na fazenda" : "Comprado",
                  },
                  { label: "Cadastrado em", value: formatDate(animal.createdAt) },
               ].map(item => (
                  <Box key={item.label}>
                     <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                           fontWeight: 700,
                           textTransform: "uppercase",
                           letterSpacing: 0.6,
                           display: "block",
                        }}
                     >
                        {item.label}
                     </Typography>
                     <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.value}
                     </Typography>
                  </Box>
               ))}
            </Box>
         </Paper>

         {/* ── Tabs de histórico ── */}
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
               variant="scrollable"
               scrollButtons="auto"
               sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "& .MuiTab-root": { fontSize: 13, textTransform: "none", fontWeight: 600 },
               }}
            >
               <Tab
                  icon={<LabelIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label="Brincos"
               />
               <Tab
                  icon={<VaccinesIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label="Vacinações"
               />
               <Tab
                  icon={<ScienceIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label="CIOs"
               />
               <Tab
                  icon={<PregnantWomanIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label="Prenhez"
               />
               <Tab
                  icon={<BabyChangingStationIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label="Partos"
               />
               <Tab label="Manejo" />
               <Tab
                  icon={<WarningAmberIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label="Mortalidade"
               />
            </Tabs>

            <Box sx={{ p: 2 }}>
               <TabPanel value={tab} index={0}>
                  <EarTagsTab animalId={animal.id} />
               </TabPanel>
               <TabPanel value={tab} index={1}>
                  <VaccinationsTab animalId={animal.id} />
               </TabPanel>
               <TabPanel value={tab} index={2}>
                  <EstrusTab animalId={animal.id} />
               </TabPanel>
               <TabPanel value={tab} index={3}>
                  <PregnancyTab animalId={animal.id} />
               </TabPanel>
               <TabPanel value={tab} index={4}>
                  <BirthsTab animalId={animal.id} />
               </TabPanel>
               <TabPanel value={tab} index={5}>
                  <AnimalMovementHistory animalId={animal.id} />
               </TabPanel>
               <TabPanel value={tab} index={6}>
                  <MortalityTab animalId={animal.id} />
               </TabPanel>
            </Box>
         </Paper>
      </Box>
   );
}
