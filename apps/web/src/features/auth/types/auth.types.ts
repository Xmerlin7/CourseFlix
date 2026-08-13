export type UserRole = "student" | "teacher" | "admin" | "assistant";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

// Every OTP-issuing endpoint (`auth/otp/request`, `auth/register`,
// `auth/password/request`) returns this shape. `devCode` is only present when
// email delivery is NOT configured AND we're not in production — once a real
// mail key is set, the code never leaves the server. `accountStatus` is set
// only for the register flow so the client can tell "code sent" from "account
// already active / not registered".
export interface OtpResponse {
  message: string;
  email: string;
  devCode?: string;
  accountStatus?: "pending" | "active" | "unknown";
}

export type OtpPurpose = 'register' | 'google_oauth';

export interface OtpRequestPayload {
  email: string;
  purpose: OtpPurpose;
}

export interface OtpVerifyPayload {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

export interface PasswordResetPayload {
  email: string;
  code: string;
  newPassword: string;
}
