export const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}/api${path}`;
}

// Resolve a media or asset URL returned by the backend. If the value is already
// an absolute URL it is returned unchanged. Otherwise the function prefixes the
// configured API base so the browser requests the correct host/port.
export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
}