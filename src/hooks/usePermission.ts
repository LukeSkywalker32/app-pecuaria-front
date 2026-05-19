import { useAuth } from "@/contexts/AuthContext";

//Permissao por role
//Usado para controlar visibilidade de botoes e ações

const ROLE_PERMISSIONS: Record<string, string[]> = {
   admin: [
      "create_animal",
      "edit_animal",
      "delete_animal",
      "place_ear_tag",
      "remove_ear_tag",
      "create_pasture",
      "edit_pasture",
      "delete_pasture",
      "register_estrus",
      "edit_estrus",
      "register_mating",
      "register_ultrasound_30",
      "edit_pregnancy",
      "register_birth",
      "edit_birth",
      "delete_birth",
      "register_vaccination",
      "edit_vaccination",
      "register_management",
      "move_batch",
      "register_mortality",
      "edit_mortality",
      "activate_user",
      "deactivate_user",
      "delete_user",
      "reset_user_password",
      "create_farm",
      "activate_farm",
      "deactivate_farm",
      "delete_farm",
   ],
   owner: [
      "create_animal",
      "edit_animal",
      "delete_animal",
      "place_ear_tag",
      "remove_ear_tag",
      "create_pasture",
      "edit_pasture",
      "delete_pasture",
      "register_estrus",
      "edit_estrus",
      "register_mating",
      "register_ultrasound_30",
      "edit_pregnancy",
      "register_birth",
      "edit_birth",
      "delete_birth",
      "register_vaccination",
      "edit_vaccination",
      "register_management",
      "move_batch",
      "register_mortality",
      "edit_mortality",
   ],
   farmmanager: [
      "create_animal",
      "edit_animal",
      "delete_animal",
      "place_ear_tag",
      "remove_ear_tag",
      "create_pasture",
      "edit_pasture",
      "delete_pasture",
      "register_estrus",
      "edit_estrus",
      "register_mating",
      "register_ultrasound_30",
      "edit_pregnancy",
      "register_birth",
      "edit_birth",
      "delete_birth",
      "register_vaccination",
      "edit_vaccination",
      "register_management",
      "move_batch",
      "register_mortality",
      "edit_mortality",
      "activate_user",
      "deactivate_user",
   ],
   veterinarian: [
      // Veterinário SÓ visualiza animais — não cria, edita ou deleta
      "register_vaccination",
      "edit_vaccination",
      "register_ultrasound_30",
      "register_birth",
      "edit_birth",
      "register_mortality",
      "register_estrus",
   ],
};
//hook principal - retorna função can() para checar permissoes
export function usePermission() {
   const { user } = useAuth();

   //can("create_animal") -> true/false
   function can(permission: string): boolean {
      if (!user) return false;
      const perms = ROLE_PERMISSIONS[user.role] ?? [];
      return perms.includes(permission);
   }
   return { can };
}
