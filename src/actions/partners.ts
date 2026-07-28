"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  askPartnerPortfolioAgent,
  createAndRunPartnerSearchJob,
  generateAndSavePartnerOutreach,
  getActivePartnerSearchJob,
  getPartnerSearchJob,
  partnerRepository,
  scorePartner,
} from "@/modules/partners";
import {
  PARTNER_STATUSES,
  PARTNER_TYPES,
  type PartnerStatus,
  type PartnerType,
} from "@/types/partner";
import { hasWebSearchConfigured } from "@/modules/partners/search/web-provider";

function ok<T extends Record<string, unknown>>(data: T) {
  return { success: true as const, ...data };
}

function fail(error: unknown) {
  return {
    success: false as const,
    error: error instanceof Error ? error.message : "Erreur inattendue",
  };
}

const partnerTypeSchema = z.enum(PARTNER_TYPES);
const partnerStatusSchema = z.enum(PARTNER_STATUSES);

export async function listPartnersAction(input?: {
  statut?: PartnerStatus;
  type?: PartnerType;
  search?: string;
  minScore?: number;
}) {
  try {
    const partners = await partnerRepository.list(input);
    return ok({ partners });
  } catch (error) {
    return fail(error);
  }
}

export async function getPartnerDashboardAction() {
  try {
    const stats = await partnerRepository.getDashboardStats();
    return ok({ stats });
  } catch (error) {
    return fail(error);
  }
}

export async function getPartnerAction(id: string) {
  try {
    const partner = await partnerRepository.getById(id);
    if (!partner) return fail(new Error("Partenaire introuvable"));
    return ok({ partner });
  } catch (error) {
    return fail(error);
  }
}

export async function createPartnerAction(formData: FormData) {
  try {
    const nom = String(formData.get("nom") ?? "").trim();
    const entreprise = String(formData.get("entreprise") ?? nom).trim();
    const type = partnerTypeSchema.parse(
      String(formData.get("type") ?? "autre")
    );
    if (!nom && !entreprise) {
      throw new Error("Nom ou entreprise requis");
    }

    const { partner } = await partnerRepository.upsertFromSearch({
      nom: nom || entreprise,
      entreprise: entreprise || nom,
      type,
      siteWeb: String(formData.get("siteWeb") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      telephone: String(formData.get("telephone") ?? "").trim() || null,
      adresse: String(formData.get("adresse") ?? "").trim() || null,
      zone: String(formData.get("zone") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      sourceRecherche: "manuel",
    });

    revalidatePath("/partenaires");
    return ok({ partner });
  } catch (error) {
    return fail(error);
  }
}

export async function updatePartnerStatusAction(
  id: string,
  statut: PartnerStatus
) {
  try {
    partnerStatusSchema.parse(statut);
    const partner = await partnerRepository.updateStatus(id, statut);
    revalidatePath("/partenaires");
    revalidatePath(`/partenaires/${id}`);
    return ok({ partner });
  } catch (error) {
    return fail(error);
  }
}

export async function addPartnerNoteAction(id: string, contenu: string) {
  try {
    const text = contenu.trim();
    if (!text) throw new Error("Note vide");
    const note = await partnerRepository.addNote(id, text);
    revalidatePath(`/partenaires/${id}`);
    return ok({ note });
  } catch (error) {
    return fail(error);
  }
}

export async function scorePartnerAction(id: string) {
  try {
    const partner = await scorePartner(id);
    revalidatePath(`/partenaires/${id}`);
    revalidatePath("/partenaires");
    return ok({ partner });
  } catch (error) {
    return fail(error);
  }
}

export async function generatePartnerOutreachAction(id: string) {
  try {
    const draft = await generateAndSavePartnerOutreach(id);
    revalidatePath(`/partenaires/${id}`);
    return ok({ draft });
  } catch (error) {
    return fail(error);
  }
}

export async function startPartnerSearchAction(input: {
  zone: string;
  types: PartnerType[];
  limitPerType?: number;
}) {
  try {
    const zone = input.zone.trim() || "France";
    const types = z.array(partnerTypeSchema).min(1).parse(input.types);

    if (!hasWebSearchConfigured() && !process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error(
        "Configurez SERPER_API_KEY (ou BRAVE_SEARCH_API_KEY) et/ou GOOGLE_MAPS_API_KEY"
      );
    }

    const active = await getActivePartnerSearchJob();
    if (active) {
      return ok({ job: active, alreadyRunning: true });
    }

    const job = await createAndRunPartnerSearchJob({
      zone,
      types,
      limitPerType: input.limitPerType ?? 8,
      score: true,
    });
    revalidatePath("/partenaires");
    return ok({ job, alreadyRunning: false });
  } catch (error) {
    return fail(error);
  }
}

export async function getPartnerSearchJobAction(id?: string) {
  try {
    const job = id
      ? await getPartnerSearchJob(id)
      : await getActivePartnerSearchJob();
    return ok({ job });
  } catch (error) {
    return fail(error);
  }
}

export async function askPartnerAgentAction(question: string) {
  try {
    const q = question.trim();
    if (!q) throw new Error("Question vide");
    const answer = await askPartnerPortfolioAgent(q);
    return ok({ answer });
  } catch (error) {
    return fail(error);
  }
}
