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

export function normalizeSiret(siret: string | null | undefined): string | null {
  if (!siret?.trim()) return null;
  const cleaned = siret.replace(/\D/g, "");
  return cleaned.length === 14 ? cleaned : null;
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
  if (score === null) return "text-zinc-400";
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-500";
}

export function getScoreBgColor(score: number | null): string {
  if (score === null) return "bg-zinc-100";
  if (score >= 70) return "bg-emerald-50";
  if (score >= 40) return "bg-amber-50";
  return "bg-red-50";
}
