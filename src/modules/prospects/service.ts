import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Prospect, ProspectInsert, ProspectUpdate } from "@/types/prospect";
import { ProspectRepository } from "./repository";

export class ProspectService {
  private repository: ProspectRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new ProspectRepository(supabase);
  }

  async listProspects() {
    return this.repository.findAll();
  }

  async getProspect(id: string) {
    const prospect = await this.repository.findById(id);
    if (!prospect) {
      throw new Error("Prospect introuvable");
    }
    return prospect;
  }

  async createOrUpdateProspect(data: ProspectInsert): Promise<Prospect> {
    if (!data.company_name?.trim()) {
      throw new Error("Le nom de l'entreprise est requis");
    }
    return this.repository.upsert(data);
  }

  async updateProspect(id: string, data: ProspectUpdate): Promise<Prospect> {
    return this.repository.update(id, data);
  }

  async deleteProspect(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async getDashboardData() {
    const [stats, priorityProspects, recentProspects] = await Promise.all([
      this.repository.getDashboardStats(),
      this.repository.getPriorityProspects(5),
      this.repository.findAll({ limit: 10 }),
    ]);

    return { stats, priorityProspects, recentProspects };
  }
}
