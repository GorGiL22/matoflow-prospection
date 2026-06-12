import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Prospect } from "@/types/prospect";
import { AI_CONFIG } from "@/config/constants";
import { ProspectRepository } from "@/modules/prospects/repository";
import { analyzeProspect } from "./analyzer";
import { computeAiScore } from "./scorer";

export class QualificationService {
  private repository: ProspectRepository;

  constructor(private supabase: SupabaseClient<Database>) {
    this.repository = new ProspectRepository(supabase);
  }

  async qualifyProspect(
    prospectId: string,
    websiteContent?: string | null
  ): Promise<Prospect> {
    const prospect = await this.repository.findById(prospectId);
    if (!prospect) {
      throw new Error("Prospect introuvable");
    }

    const criteria = await analyzeProspect({
      companyName: prospect.company_name,
      website: prospect.website,
      city: prospect.city,
      websiteContent,
    });

    const score = computeAiScore(criteria);

    await this.supabase.from("prospect_qualifications").insert({
      prospect_id: prospectId,
      score,
      criteria,
      website_analysis: { website_content_length: websiteContent?.length ?? 0 },
      model_version: AI_CONFIG.model,
    });

    return this.repository.update(prospectId, {
      ai_score: score,
      ai_score_details: criteria,
    });
  }
}
