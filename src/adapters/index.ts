export {
  DEFAULT_PROVIDER,
  getAuthPort,
  getBackendAdapter,
  resetBackendAdapter,
  resolveProviderName,
  setBackendAdapter,
} from './container';
export type { AuthPort, BackendAdapter, ProviderName } from './ports';
export { apiAdapter } from './api';
export { supabaseAdapter } from './supabase';
