import { apiAdapter } from './api';
import { supabaseAdapter } from './supabase';
import type { AuthPort, BackendAdapter, ProviderName } from './ports';

const ADAPTERS: Record<ProviderName, BackendAdapter> = {
  api: apiAdapter,
  supabase: supabaseAdapter,
};

export const DEFAULT_PROVIDER: ProviderName = 'api';

function isProviderName(value: string | undefined): value is ProviderName {
  return value === 'api' || value === 'supabase';
}

/**
 * Reads the configured provider, falling back to the REST backend.
 *
 * An unrecognized value falls back rather than throwing. `EXPO_PUBLIC_*` is
 * inlined at build time, so a typo would otherwise be a hard crash on launch
 * with no way to recover on-device — a warning plus a working default is the
 * better failure. A missing value is not a typo, so it stays silent.
 */
export function resolveProviderName(raw = process.env.EXPO_PUBLIC_API_PROVIDER): ProviderName {
  if (isProviderName(raw)) return raw;

  if (raw !== undefined && raw !== '') {
    console.warn(
      `[adapters] Unknown EXPO_PUBLIC_API_PROVIDER "${raw}". ` +
        `Expected "api" or "supabase" — falling back to "${DEFAULT_PROVIDER}".`
    );
  }

  return DEFAULT_PROVIDER;
}

let adapter: BackendAdapter = ADAPTERS[resolveProviderName()];

/**
 * The active provider.
 *
 * Resolved through a function rather than exported as a value so the binding is
 * late: consumers ask at call time, which is what lets `setBackendAdapter`
 * swap it. A module-level `export const auth = adapter.auth` would freeze the
 * choice at import time and quietly ignore every override.
 */
export function getBackendAdapter(): BackendAdapter {
  return adapter;
}

/** Shorthand for the auth port, which is what nearly every caller wants. */
export function getAuthPort(): AuthPort {
  return getBackendAdapter().auth;
}

/**
 * Replaces the active provider.
 *
 * The seam tests use to install a fake, and the hook an app would use to select
 * a provider at runtime rather than at build time. Returns nothing; pair it
 * with `resetBackendAdapter` in a test teardown so one spec cannot leak its
 * provider into the next.
 */
export function setBackendAdapter(next: BackendAdapter): void {
  adapter = next;
}

/** Restores the env-configured provider. Intended for test teardown. */
export function resetBackendAdapter(): void {
  adapter = ADAPTERS[resolveProviderName()];
}

export { ADAPTERS };
