import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  DashboardStats,
  Prospect,
  ProspectInsert,
  ProspectStatus,
  ProspectUpdate,
} from "@/types/prospect";
import { PRIORITY_SCORE_THRESHOLD } from "@/config/constants";

type Supabase = SupabaseClient<Database>;

export class ProspectRepository {
  constructor(private supabase: Supabase) {}

  async findAll(options?: {
    status?: ProspectStatus;
    minScore?: number;
    limit?: number;
  }): Promise<Prospect[]> {
    let query = this.supabase
      .from("prospects")
      .select("*")
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.minScore !== undefined) {
      query = query.gte("ai_score", options.minScore);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Prospect[];
  }

  async findById(id: string): Promise<Prospect | null> {
    const { data, error } = await this.supabase
      .from("prospects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as Prospect;
  }

  async upsert(data: ProspectInsert): Promise<Prospect> {
    type UpsertArgs = Database["public"]["Functions"]["upsert_prospect"]["Args"];

    const args: UpsertArgs = {
      p_company_name: data.company_name,
      p_siret: data.siret ?? null,
      p_phone: data.phone ?? null,
      p_email: data.email ?? null,
      p_website: data.website ?? null,
      p_city: data.city ?? null,
      p_google_reviews_count: data.google_reviews_count ?? 0,
      p_source: data.source ?? "manuel",
      p_status: data.status ?? "nouveau",
      p_ai_score: data.ai_score ?? null,
    };

    const { data: result, error } = await this.supabase.rpc(
      "upsert_prospect",
      args as never
    );

    if (error) throw error;
    return result as Prospect;
  }

  async update(id: string, data: ProspectUpdate): Promise<Prospect> {
    const { data: result, error } = await this.supabase
      .from("prospects")
      .update(data as Database["public"]["Tables"]["prospects"]["Update"])
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result as Prospect;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("prospects").delete().eq("id", id);
    if (error) throw error;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const { data, error } = await this.supabase
      .from("dashboard_stats")
      .select("*")
      .single();

    if (error) throw error;

    return (data ?? {
      total_prospects: 0,
      nouveaux: 0,
      contactes: 0,
      relances: 0,
      rdv: 0,
      clients: 0,
      refuses: 0,
      prioritaires: 0,
      score_moyen: null,
    }) as DashboardStats;
  }

  async getPriorityProspects(limit = 10): Promise<Prospect[]> {
    return this.findAll({
      minScore: PRIORITY_SCORE_THRESHOLD,
      limit,
    });
  }
}
