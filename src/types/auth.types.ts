export type UserRole = "admin" | "owner" | "farmmanager" | "veterinarian";

export interface AuthUser {
   id: string;
   fullName: string;
   username: string;
   email: string;
   phone: string | null;
   role: UserRole;
   farmId: string;
   farmName: string;
   crmv: string | null;
   active: boolean;
   lastLogin: string | null;
}


