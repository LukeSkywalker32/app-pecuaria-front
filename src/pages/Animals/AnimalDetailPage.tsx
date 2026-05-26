import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PetsIcon from "@mui/icons-material/Pets";
import {
   Alert,
   Box,
   Button,
   Chip,
   CircularProgress,
   Divider,
   Paper,
   Tab,
   Tabs,
   Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import type { AnimalResponse } from "./AnimalsPage";

// ─── Formatações reutilizadas ────────────────────────────────────────────
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

// ─── Painel de tab com lazy render ───────────────────────────────────────
function TabPanel({
   children,
   value,
   index,
}: {
   children: React.ReactNode;
   value: number;
   index: number;
}) {
   // Só renderiza o conteúdo quando a tab está ativa — melhora performance
   if (value !== index) return null;
   return <Box sx={{ pt: 2 }}>{children}</Box>;
}

// ─── Componente ───────────────────────────────────────────────────────────
export default function AnimalDetailPage() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();

   const [animal, setAnimal] = useState<AnimalResponse | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [tab, setTab] = useState(0);

   // Carrega dados do animal pelo ID da URL
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
         {/* ── Breadcrumb / Voltar ── */}
         <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/animals")}
            sx={{ mb: 2, color: "text.secondary", pl: 0 }}
         >
            Animais
         </Button>

         {/* ── Header do animal ── */}
         <Paper
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 3, mb: 2 }}
         >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
               {/* Ícone de avatar do animal */}
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

            {/* ── Grid de informações básicas ── */}
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
                     value: animal.weightKg !== null ? `${animal.weightKg} Kg` : "Não Informado",
                  },
                  { label: "Pasto Atual", value: animal.pastureName ?? "Sem pasto" },
                  {
                     label: "Origem",
                     value: (animal as any).origin === "born" ? "Nascido na fazenda" : "Comprado",
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

         {/* ── Tabs de módulos relacionados ── */}
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
               sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "& .MuiTab-root": { fontSize: 13, textTransform: "none", fontWeight: 600 },
               }}
            >
               <Tab label="Brincos" />
               <Tab label="Vacinações" />
               <Tab label="CIOs" />
               <Tab label="Prenhez" />
               <Tab label="Partos" />
               <Tab label="Manejo" />
               <Tab label="Mortalidade" />
            </Tabs>

            <Box sx={{ p: 2 }}>
               {/* Placeholder de cada tab — implementar progressivamente */}
               {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <TabPanel key={i} value={tab} index={i}>
                     <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center", py: 4 }}
                     >
                        Módulo em desenvolvimento — em breve disponível.
                     </Typography>
                  </TabPanel>
               ))}
            </Box>
         </Paper>
      </Box>
   );
}
