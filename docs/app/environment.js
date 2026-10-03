// Browser-safe configuration only. Server credentials never belong in this module.
export function validateEnvironment(input) {
  const allowed = new Set(['mode', 'supabaseUrl', 'publishableKey']);
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid environment configuration.');
  if (Object.keys(input).some(key => !allowed.has(key))) throw Error('Unexpected environment setting. Only browser-safe settings are allowed.');
  const { mode, supabaseUrl = '', publishableKey = '' } = input;
  if (!['demo', 'local', 'test', 'production'].includes(mode)) throw Error('Choose an explicit application environment.');
  if (typeof supabaseUrl !== 'string' || typeof publishableKey !== 'string') throw Error('Environment values must be text.');
  if (mode === 'demo') {
    if (supabaseUrl || publishableKey) throw Error('The demo must not connect to a backend.');
    return Object.freeze({ mode, supabaseUrl: '', publishableKey: '' });
  }
  let url;
  try { url = new URL(supabaseUrl); } catch { throw Error('A valid Supabase URL is required.'); }
  if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw Error('Use a plain backend origin without credentials.');
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (mode === 'local' && (!loopback || url.protocol !== 'http:')) throw Error('Local mode requires a loopback HTTP backend.');
  if (mode !== 'local' && (loopback || url.protocol !== 'https:')) throw Error('Hosted environments require a remote HTTPS backend.');
  // New projects use publishable keys. Legacy anon JWTs must not contain elevated roles.
  let legacyAnon = false;
  if (publishableKey.split('.').length === 3) {
    try {
      const payload = publishableKey.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
      legacyAnon = JSON.parse(atob(payload)).role === 'anon';
    } catch { /* A malformed key must fail validation below. */ }
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey) && !legacyAnon) throw Error('Only a Supabase publishable or legacy anon key is permitted in the browser.');
  return Object.freeze({ mode, supabaseUrl: url.origin, publishableKey });
}

// Public preview always starts in demo mode. URL parameters and browser storage cannot override it.
export const environment = validateEnvironment({ mode: 'demo' });
