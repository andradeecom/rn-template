export type UserRole = 'admin' | 'user' | 'manager';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImageUrl?: string | null;
  mustChangePassword: boolean;
  emailVerifiedAt?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

/**
 * Registration does not sign the user in — the backend returns a message plus
 * the created user and waits for the emailed confirmation link.
 */
export type RegisterResponse = {
  message: string;
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'emailVerifiedAt'>;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * `currentPassword` is optional because the backend skips the check for users
 * flagged `mustChangePassword` (admin-created accounts on a temporary password).
 */
export type ChangePasswordRequest = {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
};

export type VerifyEmailRequest = {
  token: string;
};

export type ResendVerificationRequest = {
  email: string;
};

/** Shape returned by the message-only auth endpoints. */
export type MessageResponse = {
  message: string;
};

export type GoogleLoginRequest = {
  idToken: string;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type RefreshResponse = {
  accessToken: string;
};
