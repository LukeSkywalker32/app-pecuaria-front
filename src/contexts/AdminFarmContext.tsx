import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import api from "@/services/api";

// ─── Tipos ────────────────────────────────────────────────────────────────

interface Farm {
   id: string;
   name: string;
   location: string;
   logoUrl: string | null;
}

interface AdminFarmContextData {
   farms: Farm[];
   selectedFarm: Farm | null;
   selectFarm: (farm: Farm | null) => void;
   isLoading: boolean;
   refetchFarms: () => Promise<void>;
}

// ─── Contexto ─────────────────────────────────────────────────────────────

const AdminFarmContext = createContext<AdminFarmContextData>({
   farms: [],
   selectedFarm: null,
   selectFarm: () => {},
   isLoading: false,
   refetchFarms: async () => {},
});

// ─── Chave do localStorage ────────────────────────────────────────────────
// Persiste a última fazenda selecionada entre sessões
const STORAGE_KEY = "admin:selectedFarmId";

// ─── Provider ─────────────────────────────────────────────────────────────

export function AdminFarmProvider({ children }: { children: ReactNode }) {
   const [farms, setFarms] = useState<Farm[]>([]);
   const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // Carrega todas as fazendas ativas (admin vê todas)
   const fetchFarms = useCallback(async () => {
      setIsLoading(true);
      try {
         const { data } = await api.get<Farm[]>("/farms?active=true");
         setFarms(data);

         // Restaura a última fazenda selecionada do localStorage
         const savedId = localStorage.getItem(STORAGE_KEY);
         if (savedId) {
            const found = data.find((f: Farm) => f.id === savedId);
            if (found) {
               setSelectedFarm(found);
               // Injeta imediatamente no header padrão do axios
               api.defaults.headers.common["X-Farm-Id"] = found.id;
            }
         }
      } catch {
         // Silencia — admin pode estar sem fazendas cadastradas ainda
      } finally {
         setIsLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchFarms();
   }, [fetchFarms]);

   // Seleciona uma fazenda e persiste a escolha
   const selectFarm = useCallback((farm: Farm | null) => {
      setSelectedFarm(farm);

      if (farm) {
         localStorage.setItem(STORAGE_KEY, farm.id);
         // Injeta o header em todas as próximas requisições do axios
         api.defaults.headers.common["X-Farm-Id"] = farm.id;
      } else {
         localStorage.removeItem(STORAGE_KEY);
         // Remove o header — admin volta a ver dados globais (farm-sistema)
         delete api.defaults.headers.common["X-Farm-Id"];
      }
   }, []);

   // Função para recarregar a lista de fazendas (usada após CRUD)
   const refetchFarms = useCallback(async () => {
      await fetchFarms();
   }, [fetchFarms]);

   return (
      <AdminFarmContext.Provider
         value={{ farms, selectedFarm, selectFarm, isLoading, refetchFarms }}
      >
         {children}
      </AdminFarmContext.Provider>
   );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useAdminFarm() {
   return useContext(AdminFarmContext);
}
