const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function getBaseUrl(): string {
  return `${BASE}/`;
}
