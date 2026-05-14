import type {
   AuthenticationResponse,
   ConfirmResetRequest,
   ForgotPasswordRequest,
   LoginRequest,
   RefreshTokenRequest,
} from "../types/auth.types";
import api from "./api";

class AuthService {
   async login(request: LoginRequest): Promise<AuthenticationResponse> {
      const response = await api.post<AuthenticationResponse>("/auth/login", request);
      return response.data;
   }
   async refreshToken(request: RefreshTokenRequest): Promise<AuthenticationResponse> {
      const response = await api.post<AuthenticationResponse>("/auth/renew-token", request);
      return response.data;
   }
   async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
      await api.post("/auth/forgot-password", request);
   }
   async confirmReset(request: ConfirmResetRequest): Promise<void> {
      await api.post("/auth/reset-password", request);
   }
}
export default new AuthService();
