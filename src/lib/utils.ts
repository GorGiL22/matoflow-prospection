import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeWebsiteDomain(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  let domain = url.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, "");
  domain = domain.replace(/^www\./, "");
  domain = domain.split("/")[0]?.split("?")[0] ?? "";

  return domain || null;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  return email.trim().toLowerCase();
}

const INVALID_CONTACT_TOKENS = new Set([
  "-",
  "—",
  "–",
  ".",
  "n/a",
  "na",
  "nc",
  "null",
  "undefined",
  "none",
  "non renseigné",
  "non renseigne",
  "inconnu",
  "sur demande",
]);

function extractPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidPhoneNumber(
  value: string | null | undefined
): boolean {
  if (!value?.trim()) return false;

  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");

  if (INVALID_CONTACT_TOKENS.has(normalized)) return false;
  if (/[a-z@/\\]/.test(normalized)) return false;

  const digits = extractPhoneDigits(trimmed);
  if (digits.length < 10 || digits.length > 15) return false;
  if (new Set(digits).size <= 2) return false;

  if (digits.length === 10) {
    return digits.startsWith("0");
  }

  if (digits.startsWith("33") && digits.length >= 11) {
    return true;
  }

  return digits.length >= 10;
}

export function isValidEmailAddress(
  value: string | null | undefined
): boolean {
  const normalized = normalizeEmail(value);
  if (!normalized) return false;
  if (INVALID_CONTACT_TOKENS.has(normalized)) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized);
}

export function formatPhoneDisplay(
  value: string | null | undefined
): string | null {
  if (!isValidPhoneNumber(value)) return null;
  return value!.trim();
}

export function formatEmailDisplay(
  value: string | null | undefined
): string | null {
  if (!isValidEmailAddress(value)) return null;
  return normalizeEmail(value);
}

export function hasProspectPhoneAndEmail(prospect: {
  telephone: string | null;
  email: string | null;
  emailNormalise?: string | null;
}): boolean {
  const email = prospect.email ?? prospect.emailNormalise ?? null;
  return isValidPhoneNumber(prospect.telephone) && isValidEmailAddress(email);
}

export function isValidWebsite(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;

  const normalized = value.trim();
  const lower = normalized.toLowerCase();

  if (INVALID_CONTACT_TOKENS.has(lower)) return false;

  const domain = normalizeWebsiteDomain(
    /^https?:\/\//i.test(normalized)
      ? normalized
      : `https://${normalized}`
  );

  return Boolean(domain && domain.includes("."));
}

export function hasValidProspectWebsite(prospect: {
  siteWeb: string | null;
  domaineSite?: string | null;
}): boolean {
  if (prospect.domaineSite) return true;
  return isValidWebsite(prospect.siteWeb);
}

export function hasValidProspectEmail(prospect: {
  email: string | null;
  emailNormalise?: string | null;
}): boolean {
  return isValidEmailAddress(prospect.email ?? prospect.emailNormalise);
}

export function hasValidProspectPhone(prospect: {
  telephone: string | null;
}): boolean {
  return isValidPhoneNumber(prospect.telephone);
}

export function normalizeSiret(siret: string | null | undefined): string | null {
  if (!siret?.trim()) return null;
  const cleaned = siret.replace(/\D/g, "");
  return cleaned.length === 14 ? cleaned : null;
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, " ")
    .trim();
}

export function normalizeUnepWebsite(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  const domain = normalizeWebsiteDomain(normalized);
  if (!domain || domain.includes("lesentreprisesdupaysage.fr")) {
    return null;
  }

  return normalized;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 70) return "text-brand";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

export function getScoreBgColor(score: number | null): string {
  if (score === null) return "bg-surface-muted";
  if (score >= 70) return "bg-brand-muted";
  if (score >= 40) return "bg-amber-50 dark:bg-amber-950";
  return "bg-red-50 dark:bg-red-950";
}
