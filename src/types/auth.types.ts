export interface LoginRequest {
   farmId: string;
   username: string;
   password: string;
}
export interface RefreshTokenRequest {
   refreshToken: string;
}
export interface ForgotPasswordRequest {
   farmId: string;
   email: string;
}
export interface ConfirmResetRequest {
   farmId: string;
   email: string;
   code: string;
   newPassword: string;
}
export interface AuthenticationResponse {
   accessToken: string;
   refreshToken: string;
   userId: string;
   username: string;
   role: "admin" | "owner" | "farmmanager" | "veterinarian";
   expiresIn: string;
}

export interface UserTokenData {
   userId: string;
   farmId: string;
   username: string;
   email: string;
   role: "admin" | "owner" | "farmmanager" | "veterinarian";
}

export interface AuthContextType {
   user: UserTokenData | null;
   isAuthenticated: boolean;
   isLoading: boolean;
   login: (request: LoginRequest) => Promise<void>;
   logout: () => void;
   refreshToken: () => Promise<void>;
   forgotPassword: (request: ForgotPasswordRequest) => Promise<void>;
   confirmReset: (request: ConfirmResetRequest) => Promise<void>;
}
