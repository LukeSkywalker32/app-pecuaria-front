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
import AnimalMovementHistory from "@/pages/Management/components/AnimalMovementHistory";
import api from "@/services/api";

// --- TIPOS ---
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
               <TabPanel value={tab} index={0}>
                  <Typography
                     variant="body2"
                     color="text.secondary"
                     sx={{ textAlign: "center", py: 4 }}
                  >
                     Módulo em desenvolvimento — em breve disponível.
                  </Typography>
               </TabPanel>
               <TabPanel value={tab} index={1}>
                  <Typography
                     variant="body2"
                     color="text.secondary"
                     sx={{ textAlign: "center", py: 4 }}
                  >
                     Módulo em desenvolvimento — em breve disponível.
                  </Typography>
               </TabPanel>
               <TabPanel value={tab} index={2}>
                  <Typography
                     variant="body2"
                     color="text.secondary"
                     sx={{ textAlign: "center", py: 4 }}
                  >
                     Módulo em desenvolvimento — em breve disponível.
                  </Typography>
               </TabPanel>
               <TabPanel value={tab} index={3}>
                  <Typography
                     variant="body2"
                     color="text.secondary"
                     sx={{ textAlign: "center", py: 4 }}
                  >
                     Módulo em desenvolvimento — em breve disponível.
                  </Typography>
               </TabPanel>
               <TabPanel value={tab} index={4}>
                  <Typography
                     variant="body2"
                     color="text.secondary"
                     sx={{ textAlign: "center", py: 4 }}
                  >
                     Módulo em desenvolvimento — em breve disponível.
                  </Typography>
               </TabPanel>
               <TabPanel value={tab} index={5}>
                  <AnimalMovementHistory animalId={animal.id} />
               </TabPanel>
               <TabPanel value={tab} index={6}>
                  <Typography
                     variant="body2"
                     color="text.secondary"
                     sx={{ textAlign: "center", py: 4 }}
                  >
                     Módulo em desenvolvimento — em breve disponível.
                  </Typography>
               </TabPanel>
            </Box>
         </Paper>
      </Box>
   );
}
