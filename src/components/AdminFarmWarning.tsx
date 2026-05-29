// Criar este arquivo em: src/components/AdminFarmWarning.tsx
// Usar em qualquer página que precise avisar o admin para selecionar uma fazenda

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Alert } from "@mui/material";
import { useAdminFarm } from "@/contexts/AdminFarmContext";

/**
 * Exibe aviso amarelo quando o admin não selecionou nenhuma fazenda.
 * Renderizar apenas dentro de rotas protegidas para admin.
 * O AdminFarmProvider já deve estar no contexto (via AppLayout).
 */
export default function AdminFarmWarning() {
   const { selectedFarm } = useAdminFarm();

   if (selectedFarm) return null;

   return (
      <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
         <strong>Nenhuma fazenda selecionada.</strong> Escolha uma fazenda na barra lateral para
         visualizar os dados.
      </Alert>
   );
}
