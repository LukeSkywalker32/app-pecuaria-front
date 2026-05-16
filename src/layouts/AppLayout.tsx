import AgricultureIcon from "@mui/icons-material/Agriculture";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FavoriteIcon from "@mui/icons-material/Favorite";
import GrassIcon from "@mui/icons-material/Grass";
import HeartBrokenIcon from "@mui/icons-material/HeartBroken";
import LabelIcon from "@mui/icons-material/Label";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import PetsIcon from "@mui/icons-material/Pets";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import VaccinesIcon from "@mui/icons-material/Vaccines";
import {
   AppBar,
   Avatar,
   Box,
   Divider,
   Drawer,
   IconButton,
   List,
   ListItemButton,
   ListItemIcon,
   ListItemText,
   Toolbar,
   Tooltip,
   Typography,
} from "@mui/material";
import { type ReactNode, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/auth.types";

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED = 68;

// --- Definição dos itens de navegação ---
interface NavItem {
   label: string;
   path: string;
   icon: ReactNode;
   roles?: UserRole[]; //undefined = todos os roles
}
const NAV_ITEMS: NavItem[] = [
   { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
   { label: "Animais", path: "/animals", icon: <PetsIcon /> },
   { label: "Pastos", path: "/pastures", icon: <GrassIcon /> },
   { label: "Brincos", path: "/ear-tags", icon: <LabelIcon /> },
   { label: "CIO", path: "/estrus", icon: <FavoriteIcon /> },
   { label: "Prenhez", path: "/pregnancies", icon: <LocalHospitalIcon /> },
   { label: "Partos", path: "/births", icon: <ChildCareIcon /> },
   { label: "Vacinações", path: "/vaccinations", icon: <VaccinesIcon /> },
   { label: "Mortalidade", path: "/mortalities", icon: <HeartBrokenIcon /> },
   {
      label: "Manejo",
      path: "/management",
      icon: <SwapHorizIcon />,
      roles: ["admin", "owner", "farmmanager"],
   },
   {
      label: "Usuários",
      path: "/users",
      icon: <PeopleIcon />,
      roles: ["admin", "owner", "farmmanager"],
   },
   {
      label: "Fazendas",
      path: "/farms",
      icon: <AgricultureIcon />,
      roles: ["admin"],
   },
];
// --- COMPONENTES --

export default function AppLayout() {
   const { user, logout } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();

   const [collapsed, setCollapsed] = useState(false);
   //Filtra os itens de nav pelo role do usuario logado
   const visibleItems = NAV_ITEMS.filter(
      item => !item.roles || (user && item.roles.includes(user.role)),
   );
   // Helper: iniciais do nome completo para avatar
   function getInitials(name: string) {
      return name
         .split(" ")
         .slice(0, 2)
         .map(w => w[0])
         .join("")
         .toUpperCase();
   }
   // ---Label legivel do role
   const roleLabels: Record<UserRole, string> = {
      admin: "Administrador",
      owner: "Proprietário",
      farmmanager: "Gerente",
      veterinarian: "Veterinário",
   };
   const drawerWidth = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

   const drawer = (
      <Box
         sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "primary.main",
            color: "white",
         }}
      >
         {/* ── Topo: logo + toggle ────── */}
         <Toolbar
            sx={{
               justifyContent: collapsed ? "center" : "space-between",
               px: collapsed ? 1 : 2,
               minHeight: "64px !important",
            }}
         >
            {!collapsed && (
               <Typography
                  variant="h6"
                  sx={{
                     fontFamily: "'Playfair Display', serif",
                     fontSize: 18,
                     color: "white",
                     fontWeight: 500,
                  }}
               >
                  AgroGestão
               </Typography>
            )}
            <IconButton
               onClick={() => setCollapsed(v => !v)}
               sx={{ color: "rgba(255,255,255,0.7)" }}
               size="small"
            >
               <MenuIcon />
            </IconButton>
         </Toolbar>
         <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
         {/* ── Itens de navegação ──────────────────────────────── */}
         <List sx={{ flex: 1, pt: 1, px: collapsed ? 0.5 : 1 }}>
            {visibleItems.map(item => {
               const active = location.pathname.startsWith(item.path);
               return (
                  <Tooltip key={item.path} title={collapsed ? item.label : ""} placement="right">
                     <ListItemButton
                        onClick={() => navigate(item.path)}
                        sx={{
                           borderRadius: 2,
                           mb: 0.5,
                           px: collapsed ? 1.5 : 2,
                           minHeight: 44,
                           justifyContent: collapsed ? "center" : "flex-start",
                           bgcolor: active ? "rgba(255,255,255,0.15)" : "transparent",
                           "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                        }}
                     >
                        <ListItemIcon
                           sx={{
                              color: active ? "white" : "rgba(255,255,255,0.65)",
                              minWidth: collapsed ? 0 : 36,
                              "& svg": { fontSize: 20 },
                           }}
                        >
                           {item.icon}
                        </ListItemIcon>
                        {!collapsed && (
                           <ListItemText
                              primary={item.label}
                              slotProps={{
                                 primary: {
                                    sx: {
                                       fontSize: 14,
                                       fontWeight: active ? 700 : 400,
                                       color: active ? "white" : "rgba(255,255,255,0.75)",
                                    },
                                 },
                              }}
                           />
                        )}
                     </ListItemButton>
                  </Tooltip>
               );
            })}
         </List>
         <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

         {/* ── Rodapé: usuário + logout ─────────────────────────── */}
         <Box sx={{ p: collapsed ? 1 : 1.5 }}>
            {!collapsed && user && (
               <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <Avatar
                     sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        width: 36,
                        height: 36,
                        fontSize: 13,
                     }}
                  >
                     {getInitials(user.fullName)}
                  </Avatar>
                  <Box sx={{ overflow: "hidden" }}>
                     <Typography
                        variant="body2"
                        noWrap
                        sx={{
                           color: "white",
                           fontWeight: 700,
                           lineHeight: 1.2,
                        }}
                     >
                        {user.fullName}
                     </Typography>
                     <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>
                        {roleLabels[user.role]}
                     </Typography>
                  </Box>
               </Box>
            )}
            <Tooltip title={collapsed ? "Sair" : ""} placement="right">
               <ListItemButton
                  onClick={logout}
                  sx={{
                     borderRadius: 2,
                     px: collapsed ? 1.5 : 2,
                     justifyContent: collapsed ? "center" : "flex-start",
                     "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
               >
                  <ListItemIcon
                     sx={{ color: "rgba(255,255,255,0.65)", minWidth: collapsed ? 0 : 36 }}
                  >
                     <LogoutIcon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  {!collapsed && (
                     <ListItemText
                        primary="Sair"
                        slotProps={{
                           primary: {
                              sx: { fontSize: 14, color: "rgba(255,255,255,0.75)" },
                           },
                        }}
                     />
                  )}
               </ListItemButton>
            </Tooltip>
         </Box>
      </Box>
   );
   return (
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
         {/* ── Sidebar fixa (desktop) ── */}
         <Drawer
            variant="permanent"
            sx={{
               width: drawerWidth,
               flexShrink: 0,
               "& .MuiDrawer-paper": {
                  width: drawerWidth,
                  boxSizing: "border-box",
                  border: "none",
                  transition: "width .25s ease",
                  overflowX: "hidden",
               },
            }}
         >
            {drawer}
         </Drawer>
         {/* ── Conteúdo principal ── */}
         <Box
            component="main"
            sx={{
               flex: 1,
               bgcolor: "#F5F7F5", // fundo levemente esverdeado — remete ao campo
               minHeight: "100vh",
               transition: "margin .25s ease",
            }}
         >
            {/* AppBar no mobile — no desktop a sidebar já cobre */}
            <AppBar
               position="sticky"
               elevation={0}
               sx={{
                  display: { xs: "flex", md: "none" },
                  bgcolor: "primary.main",
               }}
            >
               <Toolbar>
                  <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif" }}>
                     AgroGestão
                  </Typography>
               </Toolbar>
            </AppBar>

            {/* A página filha renderiza aqui — injetada pelo React Router */}
            <Outlet />
         </Box>
      </Box>
   );
}
