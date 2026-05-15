import {
   GrassRounded,
   PetsRounded,
   PregnantWomanRounded,
   TrendingUpRounded,
   VaccinesRounded,
} from "@mui/icons-material";
import {
   Box,
   Button,
   Card,
   CardContent,
   Container,
   Grid,
   Paper,
   Stack,
   Typography,
} from "@mui/material";
import type React from "react";
import { useAuth } from "../contexts/AuthContext";

export const Dashboard: React.FC = () => {
   const { user } = useAuth();

   const stats = [
      {
         title: "Total de Animais",
         value: "1.245",
         icon: <PetsRounded sx={{ fontSize: 40, color: "#2d6a4f" }} />,
         color: "#e8f5e9",
      },
      {
         title: "Pastos Ativos",
         value: "12",
         icon: <GrassRounded sx={{ fontSize: 40, color: "#2d6a4f" }} />,
         color: "#e8f5e9",
      },
      {
         title: "Vacinações Pendentes",
         value: "45",
         icon: <VaccinesRounded sx={{ fontSize: 40, color: "#2d6a4f" }} />,
         color: "#fff3e0",
      },
      {
         title: "Gestações Ativas",
         value: "89",
         icon: <PregnantWomanRounded sx={{ fontSize: 40, color: "#2d6a4f" }} />,
         color: "#f3e5f5",
      },
   ];

   const quickActions = [
      { label: "Registrar Nascimento", path: "/births" },
      { label: "Registrar Morte", path: "/mortalities" },
      { label: "Adicionar Vacinação", path: "/vaccinations" },
      { label: "Registrar Cio", path: "/estrus" },
   ];

   return (
      <Box sx={{ py: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
         <Container maxWidth="lg">
            {/* Welcome Section */}
            <Box sx={{ mb: 4 }}>
               <Typography variant="h3" sx={{ fontWeight: 700, color: "#1b4332", mb: 1 }}>
                  Bem-vindo, {user?.username}!
               </Typography>
               <Typography variant="body1" color="textSecondary">
                  Aqui está um resumo do status da sua fazenda
               </Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
               {stats.map((stat, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                     <Card
                        sx={{
                           backgroundColor: stat.color,
                           border: "1px solid #e0e0e0",
                           transition: "all 0.3s ease",
                           "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: "0 8px 24px rgba(45, 106, 79, 0.15)",
                           },
                        }}
                     >
                        <CardContent>
                           <Box
                              sx={{
                                 display: "flex",
                                 justifyContent: "space-between",
                                 alignItems: "flex-start",
                              }}
                           >
                              <Box>
                                 <Typography
                                    color="textSecondary"
                                    sx={{ fontSize: "0.875rem", mb: 1 }}
                                 >
                                    {stat.title}
                                 </Typography>
                                 <Typography
                                    variant="h4"
                                    sx={{ fontWeight: 700, color: "#1b4332" }}
                                 >
                                    {stat.value}
                                 </Typography>
                              </Box>
                              {stat.icon}
                           </Box>
                        </CardContent>
                     </Card>
                  </Grid>
               ))}
            </Grid>

            {/* Quick Actions Section */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
               <Typography variant="h5" sx={{ fontWeight: 700, color: "#1b4332", mb: 3 }}>
                  Ações Rápidas
               </Typography>
               <Grid container spacing={2}>
                  {quickActions.map((action, index) => (
                     <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                        <Button
                           fullWidth
                           variant="outlined"
                           sx={{
                              py: 2,
                              borderColor: "#2d6a4f",
                              color: "#2d6a4f",
                              fontWeight: 600,
                              "&:hover": {
                                 backgroundColor: "#e8f5e9",
                                 borderColor: "#1b4332",
                              },
                           }}
                        >
                           {action.label}
                        </Button>
                     </Grid>
                  ))}
               </Grid>
            </Paper>

            {/* Recent Activity Section */}
            <Grid container spacing={3}>
               <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                     <Typography variant="h5" sx={{ fontWeight: 700, color: "#1b4332", mb: 2 }}>
                        Atividades Recentes
                     </Typography>
                     <Stack spacing={2}>
                        {[1, 2, 3].map(item => (
                           <Box
                              key={item}
                              sx={{
                                 p: 2,
                                 backgroundColor: "#f5f5f5",
                                 borderRadius: 1,
                                 borderLeft: "4px solid #2d6a4f",
                              }}
                           >
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                 Animal #12345 - Vacinação realizada
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                 Há 2 horas
                              </Typography>
                           </Box>
                        ))}
                     </Stack>
                  </Paper>
               </Grid>

               <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                     <Typography variant="h5" sx={{ fontWeight: 700, color: "#1b4332", mb: 2 }}>
                        Alertas Importantes
                     </Typography>
                     <Stack spacing={2}>
                        {[1, 2].map(item => (
                           <Box
                              key={item}
                              sx={{
                                 p: 2,
                                 backgroundColor: "#fff3e0",
                                 borderRadius: 1,
                                 borderLeft: "4px solid #fcbf49",
                                 display: "flex",
                                 alignItems: "center",
                                 gap: 2,
                              }}
                           >
                              <TrendingUpRounded sx={{ color: "#fcbf49" }} />
                              <Box>
                                 <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Vacinação em atraso
                                 </Typography>
                                 <Typography variant="caption" color="textSecondary">
                                    5 animais precisam de vacinação
                                 </Typography>
                              </Box>
                           </Box>
                        ))}
                     </Stack>
                  </Paper>
               </Grid>
            </Grid>
         </Container>
      </Box>
   );
};
