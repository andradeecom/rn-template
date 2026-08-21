import type { BackendAdapter } from '@/adapters/ports';
import { apiAuthAdapter } from './auth';

export const apiAdapter: BackendAdapter = {
  name: 'api',
  auth: apiAuthAdapter,
};

export { apiAuthAdapter };
