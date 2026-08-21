import type { BackendAdapter } from '@/adapters/ports';
import { supabaseAuthAdapter } from './auth';

export const supabaseAdapter: BackendAdapter = {
  name: 'supabase',
  auth: supabaseAuthAdapter,
};

export { supabaseAuthAdapter } from './auth';
export { getSupabaseClient, resetSupabaseClient } from './client';
export { toAuthError, toUser } from './mappers';
