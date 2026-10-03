import { validateEnvironment } from './environment.js';

export const PREVIEW_STORAGE_KEY = 'cuebc.frontend.v1';

export function createPreviewStore(config, storage, seed, version) {
  if (validateEnvironment(config).mode !== 'demo') throw Error('Preview persistence is disabled outside demo mode.');
  return Object.freeze({
    key: PREVIEW_STORAGE_KEY,
    load() {
      try {
        const value = JSON.parse(storage.getItem(PREVIEW_STORAGE_KEY));
        return value?.version === version ? value : seed();
      } catch { return seed(); }
    },
    save(state) { storage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(state)); }
  });
}

// Milestone 1 exposes a health check only. Business writes are deliberately not implemented here.
export function createBackendClient(config, fetchImpl = globalThis.fetch) {
  const env = validateEnvironment(config);
  if (env.mode === 'demo') throw Error('The demo cannot make backend requests.');
  return Object.freeze({
    async health() {
      const response = await fetchImpl(`${env.supabaseUrl}/rest/v1/rpc/backend_health`, {
        method: 'POST',
        headers: { apikey: env.publishableKey, 'Content-Type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw Error(`Backend health check failed (${response.status}).`);
      const result = await response.json();
      if (result?.service !== 'cuebc' || result?.schema_version !== 1) throw Error('Unsupported backend schema.');
      return result;
    }
  });
}
