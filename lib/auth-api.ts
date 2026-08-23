import { api, setAccessToken, getAccessToken } from "./api";
import type { User } from "@/stores";

interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  reason?: "expired" | "invalid" | "used";
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post<null>("/auth/forgot-password", { email });
}

export async function verifyResetToken(token: string): Promise<VerifyResetTokenResponse> {
  return api.get<VerifyResetTokenResponse>(
    `/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
  );
}

export async function resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>("/auth/reset-password", { token, newPassword });
  setAccessToken(data.accessToken);
  return data;
}

export async function googleLogin(credential: string): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>("/auth/google", { credential });
  setAccessToken(data.accessToken);
  return data;
}

export async function githubLogin(payload?: { code?: string; accessToken?: string; username?: string }): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>("/auth/github", payload || {});
  setAccessToken(data.accessToken);
  return data;
}

export async function logoutAllSessions(): Promise<void> {
  await api.post("/auth/logout-all");
}

export async function exportUserData(): Promise<Blob> {
  // Using native fetch to get blob since api wrapper might parse as JSON
  const token = getAccessToken();
  const response = await fetch("/api/auth/export", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Export failed");
  return response.blob();
}

export async function generate2FA(): Promise<{ qrCode: string; secret: string }> {
  return api.post<{ qrCode: string; secret: string }>("/auth/2fa/generate");
}

export async function verify2FA(token: string): Promise<{ is2FAEnabled: boolean }> {
  return api.post<{ is2FAEnabled: boolean }>("/auth/2fa/verify", { token });
}

export async function disable2FA(): Promise<{ is2FAEnabled: boolean }> {
  return api.post<{ is2FAEnabled: boolean }>("/auth/2fa/disable");
}
