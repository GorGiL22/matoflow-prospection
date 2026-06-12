import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { GeneratedContent } from "@/types/prospect";
import { ProspectRepository } from "@/modules/prospects/repository";
import { generateCommercialContent } from "./generator";

export class ContentService {
  private repository: ProspectRepository;

  constructor(private supabase: SupabaseClient<Database>) {
    this.repository = new ProspectRepository(supabase);
  }

  async generateForProspect(prospectId: string): Promise<GeneratedContent> {
    const prospect = await this.repository.findById(prospectId);
    if (!prospect) {
      throw new Error("Prospect introuvable");
    }

    const content = await generateCommercialContent(prospect);

    await this.repository.update(prospectId, {
      generated_email: content.email,
      generated_linkedin: content.linkedin,
      generated_call_script: content.callScript,
    });

    return content;
  }
}
