// src/utils/media.ts
const STORAGE_BASE_URL = "https://master.hayllis.com/writable/uploads/";

export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STORAGE_BASE_URL}${path}`;
}