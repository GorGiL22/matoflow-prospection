import type { UnepSearchArea } from "@/modules/scraping/unep-areas";

export interface UnepScanCursor {
  nextPage: number;
  totalPages: number;
}

function getCursorKey(area: UnepSearchArea): string {
  return `matoflow-unep-cursor-${area}`;
}

export function loadUnepScanCursor(area: UnepSearchArea): UnepScanCursor | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(getCursorKey(area));
    if (!raw) return null;

    const cursor = JSON.parse(raw) as UnepScanCursor;

    // Ancien bug : totalPages = nombre d'entreprises (ex. 468) au lieu de pages API (~5).
    if (!cursor.totalPages || cursor.totalPages > 50) {
      localStorage.removeItem(getCursorKey(area));
      return null;
    }

    return cursor;
  } catch {
    return null;
  }
}

export function saveUnepScanCursor(
  area: UnepSearchArea,
  cursor: UnepScanCursor
): void {
  localStorage.setItem(getCursorKey(area), JSON.stringify(cursor));
}

export function clearUnepScanCursor(area: UnepSearchArea): void {
  localStorage.removeItem(getCursorKey(area));
}
