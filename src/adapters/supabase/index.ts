import type { BackendAdapter } from '@/adapters/ports';
import { supabaseAuthAdapter } from './auth';

export const supabaseAdapter: BackendAdapter = {
  name: 'supabase',
  auth: supabaseAuthAdapter,
};

export { ProviderNotImplementedError, supabaseAuthAdapter } from './auth';
