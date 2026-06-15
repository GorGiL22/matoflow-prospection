import { AI_CONFIG } from "@/config/constants";
import { ProspectRepository } from "@/modules/prospects/repository";
import type { Prospect } from "@/types/prospect";
import { analyzeProspect } from "./analyzer";
import { computeAiScore } from "./scorer";

const repository = new ProspectRepository();

export class QualificationService {
  async qualifyProspect(
    prospectId: string,
    websiteContent?: string | null
  ): Promise<Prospect> {
    const prospect = await repository.findById(prospectId);
    if (!prospect) {
      throw new Error("Prospect introuvable");
    }

    const criteria = await analyzeProspect({
      companyName: prospect.nomEntreprise,
      website: prospect.siteWeb,
      city: prospect.ville,
      description: prospect.description,
      websiteContent,
    });

    const score = computeAiScore(criteria);

    await repository.addQualification(prospectId, {
      score,
      criteres: criteria,
      analyseSite: { website_content_length: websiteContent?.length ?? 0 },
      versionModele: AI_CONFIG.model,
    });

    return repository.update(prospectId, {
      scoreIA: score,
      detailsScoreIA: criteria,
    });
  }
}

export const qualificationService = new QualificationService();
