import { ProspectRepository } from "@/modules/prospects/repository";
import type { GeneratedContent } from "@/types/prospect";
import { generateCommercialContent } from "./generator";

const repository = new ProspectRepository();

export class ContentService {
  async generateForProspect(prospectId: string): Promise<GeneratedContent> {
    const prospect = await repository.findById(prospectId);
    if (!prospect) {
      throw new Error("Prospect introuvable");
    }

    const content = await generateCommercialContent(prospect);

    await repository.update(prospectId, {
      emailGenere: content.email,
      linkedinGenere: content.linkedin,
      scriptAppelGenere: content.callScript,
    });

    await repository.createActivity(
      prospectId,
      "contenu",
      "Contenu commercial généré par l'IA"
    );

    return content;
  }
}

export const contentService = new ContentService();
