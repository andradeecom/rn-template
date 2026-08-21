import type { AuthError, User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserRole } from '@/types/auth';

const ROLES: UserRole[] = ['admin', 'user', 'manager'];

function toRole(value: unknown): UserRole {
  return typeof value === 'string' && (ROLES as string[]).includes(value) ? (value as UserRole) : 'user';
}

/**
 * Translates a Supabase user into this app's `User`.
 *
 * A real translation, not a cast. Supabase keeps arbitrary profile fields in
 * `user_metadata` and has no `role` or `mustChangePassword` of its own, so both
 * are read defensively: `user_metadata` is client-writable unless locked down,
 * and an unrecognized role must not widen access. A production deployment
 * should source `role` from a `profiles` table or a custom JWT claim rather
 * than trusting metadata — see docs/backend-adapters.md.
 */
export function toUser(user: SupabaseUser): User {
  const meta = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? '',
    firstName: typeof meta.firstName === 'string' ? meta.firstName : '',
    lastName: typeof meta.lastName === 'string' ? meta.lastName : '',
    role: toRole(meta.role),
    profileImageUrl: typeof meta.avatarUrl === 'string' ? meta.avatarUrl : null,
    mustChangePassword: meta.mustChangePassword === true,
    emailVerifiedAt: user.email_confirmed_at ?? null,
  };
}

/**
 * Error shape the rest of the app already understands.
 *
 * Screens read `error.response.status` because every provider so far has been
 * axios-backed. Supabase rejects with an `AuthError` carrying a flat `status`,
 * so it is reshaped here — otherwise every call site would have to branch on
 * which provider is installed, which is what this layer exists to prevent.
 */
export type NormalizedAuthError = Error & {
  response: { status: number; data: { message: string } };
};

export function toAuthError(error: AuthError): NormalizedAuthError {
  const status = error.status ?? 500;
  const normalized = new Error(error.message) as NormalizedAuthError;

  normalized.name = error.name;
  normalized.response = { status, data: { message: error.message } };

  return normalized;
}
