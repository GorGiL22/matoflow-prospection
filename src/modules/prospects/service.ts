import type {
  Prospect,
  ProspectInsert,
  ProspectNote,
  ProspectUpdate,
} from "@/types/prospect";
import type { UnepCompanyResult, GoogleMapsPlaceResult } from "@/types/scraping";
import { ProspectRepository } from "./repository";

const repository = new ProspectRepository();

export class ProspectService {
  async listProspects() {
    return repository.findAll();
  }

  async getProspect(id: string) {
    const prospect = await repository.findById(id);
    if (!prospect) {
      throw new Error("Prospect introuvable");
    }
    return prospect;
  }

  async getProspectDetail(id: string) {
    const [prospect, notes, activites] = await Promise.all([
      this.getProspect(id),
      repository.getNotes(id),
      repository.getActivities(id),
    ]);

    return { prospect, notes, activites };
  }

  async createOrUpdateProspect(data: ProspectInsert): Promise<Prospect> {
    if (!data.nomEntreprise?.trim()) {
      throw new Error("Le nom de l'entreprise est requis");
    }
    return repository.upsert(data);
  }

  async importUnepCompany(company: UnepCompanyResult): Promise<Prospect> {
    if (!company.nomEntreprise?.trim()) {
      throw new Error("Le nom de l'entreprise est requis");
    }
    return repository.upsertFromUnep(company);
  }

  async importGoogleMapsPlace(place: GoogleMapsPlaceResult): Promise<Prospect> {
    if (!place.nomEntreprise?.trim()) {
      throw new Error("Le nom de l'entreprise est requis");
    }

    const description = [
      place.adresse,
      place.googleMapsUrl ? `Google Maps: ${place.googleMapsUrl}` : null,
      place.noteGoogle ? `Note Google: ${place.noteGoogle}/5` : null,
    ]
      .filter(Boolean)
      .join(" — ");

    return repository.upsert({
      nomEntreprise: place.nomEntreprise,
      telephone: place.telephone,
      email: place.email,
      siteWeb: place.siteWeb,
      ville: place.ville,
      avisGoogle: place.avisGoogle,
      description: description || null,
    });
  }

  async updateProspect(id: string, data: ProspectUpdate): Promise<Prospect> {
    return repository.update(id, data);
  }

  async updateProspectStatus(
    id: string,
    statut: ProspectUpdate["statut"]
  ): Promise<Prospect> {
    if (!statut) {
      throw new Error("Statut requis");
    }
    return repository.update(id, { statut });
  }

  async deleteProspect(id: string): Promise<void> {
    return repository.delete(id);
  }

  async addNote(prospectId: string, contenu: string): Promise<ProspectNote> {
    if (!contenu.trim()) {
      throw new Error("Le contenu de la note est requis");
    }
    await this.getProspect(prospectId);
    return repository.addNote(prospectId, contenu.trim());
  }

  async getDashboardData() {
    const [stats, priorityProspects, recentProspects] = await Promise.all([
      repository.getDashboardStats(),
      repository.getPriorityProspects(5),
      repository.findAll({ limit: 10 }),
    ]);

    return { stats, priorityProspects, recentProspects };
  }
}

export const prospectService = new ProspectService();
