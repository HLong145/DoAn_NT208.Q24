export const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}/api${path}`;
}

// Resolve a media or asset URL returned by the backend. If the value is already
// an absolute URL it is returned unchanged. Otherwise the function prefixes the
// configured API base so the browser requests the correct host/port.
export function resolveAssetUrl(url?: string | null) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  // Ensure leading slash
  const path = url.startsWith('/') ? url : `/${url}`;
  // Fallback to localhost backend when API_BASE_URL is empty
  const base = API_BASE_URL || 'http://localhost:4001';
  return `${base}${path}`;
}