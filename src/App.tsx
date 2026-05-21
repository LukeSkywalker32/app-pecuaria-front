import { Box, CircularProgress } from "@mui/material";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import AppLayout from "./layouts/AppLayout";

// ─── Lazy loading de todas as páginas ─────────────────────────────────────
// O React só carrega o bundle de cada página quando ela é acessada pela 1ª vez
// Isso reduz o bundle inicial — crucial para performance no mobile/Capacitor

const LoginPage = lazy(() => import("@/pages/Login/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/Dashboard/DashboardPage"));
const AnimalsPage = lazy(() => import("@/pages/Animals/AnimalsPage"));
const AnimalDetailPage = lazy(() => import("@/pages/Animals/AnimalDetailPage"));
const PasturesPage = lazy(() => import("@/pages/Pasture/PasturesPage"));
const EarTagsPage = lazy(() => import("@/pages/EarTags/EarTagsPage"));
const EstrusPage = lazy(() => import("@/pages/Estrus/EstrusPage"));
const PregnanciesPage = lazy(() => import("@/pages/Pregnancies/PregnanciesPage"));
const BirthsPage = lazy(() => import("@/pages/Births/BirthsPage"));
const VaccinationsPage = lazy(() => import("@/pages/Vaccinations/VaccinationsPage"));
const MortalitiesPage = lazy(() => import("@/pages/Mortalities/MortalitiesPage"));
const ManagementPage = lazy(() => import("@/pages/Management/ManagementPage"));
const UsersPage = lazy(() => import("@/pages/Users/UsersPage"));
const FarmsPage = lazy(() => import("@/pages/Farms/FarmsPage"));
const ProfilePage = lazy(() => import("@/pages/Profile/ProfilePage"));
const ForgotPassWordPage = lazy(() => import("@/pages/ForgotPassword/ForgotPasswordPage"));

// ─── Spinner exibido enquanto o chunk da página carrega ───────────────────
function PageLoader() {
   return (
      <Box
         sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            bgcolor: "#F5F7F5",
         }}
      >
         <CircularProgress color="primary" />
      </Box>
   );
}

// ─── App ──────────────────────────────────────────────────────────────────
export default function App() {
   return (
      // AuthProvider envolve tudo — qualquer componente abaixo pode usar useAuth()
      <AuthProvider>
         <Suspense fallback={<PageLoader />}>
            <Routes>
               {/* ── Rotas públicas ─────────────────────────────────── */}
               <Route path="/login" element={<LoginPage />} />
               <Route path="/forgot-password" element={<ForgotPassWordPage />} />

               {/* Redireciona raiz para dashboard — ProtectedRoute resolve se está logado */}
               <Route path="/" element={<Navigate to="/dashboard" replace />} />

               {/* ── Rotas protegidas — todos os roles ──────────────── */}
               {/* ProtectedRoute sem allowedRoles aceita qualquer usuário autenticado */}
               <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                     <Route path="/dashboard" element={<DashboardPage />} />
                     <Route path="/animals" element={<AnimalsPage />} />
                     <Route path="/animals/:id" element={<AnimalDetailPage />} />
                     <Route path="/pastures" element={<PasturesPage />} />
                     <Route path="/ear-tags" element={<EarTagsPage />} />
                     <Route path="/estrus" element={<EstrusPage />} />
                     <Route path="/pregnancies" element={<PregnanciesPage />} />
                     <Route path="/births" element={<BirthsPage />} />
                     <Route path="/vaccinations" element={<VaccinationsPage />} />
                     <Route path="/mortalities" element={<MortalitiesPage />} />
                     <Route path="/profile" element={<ProfilePage />} />
                  </Route>
               </Route>

               {/* ── Rotas protegidas — owner, farmmanager e admin ──── */}
               <Route element={<ProtectedRoute allowedRoles={["admin", "owner", "farmmanager"]} />}>
                  <Route element={<AppLayout />}>
                     <Route path="/management" element={<ManagementPage />} />
                     <Route path="/users" element={<UsersPage />} />
                  </Route>
               </Route>

               {/* ── Rotas protegidas — admin only ──────────────────── */}
               <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route element={<AppLayout />}>
                     <Route path="/farms" element={<FarmsPage />} />
                  </Route>
               </Route>

               {/* Qualquer rota não mapeada volta pro dashboard */}
               <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
         </Suspense>
      </AuthProvider>
   );
}
