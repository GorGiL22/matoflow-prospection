import type {
  AiScoreDetails,
  ProspectSource,
  ProspectStatus,
} from "./prospect";

export interface Database {
  public: {
    Tables: {
      prospects: {
        Row: {
          id: string;
          company_name: string;
          siret: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          city: string | null;
          google_reviews_count: number;
          status: ProspectStatus;
          source: ProspectSource;
          ai_score: number | null;
          ai_score_details: AiScoreDetails;
          website_domain: string | null;
          email_normalized: string | null;
          siret_normalized: string | null;
          generated_email: string | null;
          generated_linkedin: string | null;
          generated_call_script: string | null;
          content_generated_at: string | null;
          created_at: string;
          updated_at: string;
          last_contacted_at: string | null;
        };
        Insert: {
          id?: string;
          company_name: string;
          siret?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          city?: string | null;
          google_reviews_count?: number;
          status?: ProspectStatus;
          source?: ProspectSource;
          ai_score?: number | null;
          ai_score_details?: AiScoreDetails;
          generated_email?: string | null;
          generated_linkedin?: string | null;
          generated_call_script?: string | null;
          content_generated_at?: string | null;
          last_contacted_at?: string | null;
        };
        Update: {
          company_name?: string;
          siret?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          city?: string | null;
          google_reviews_count?: number;
          status?: ProspectStatus;
          source?: ProspectSource;
          ai_score?: number | null;
          ai_score_details?: AiScoreDetails;
          generated_email?: string | null;
          generated_linkedin?: string | null;
          generated_call_script?: string | null;
          content_generated_at?: string | null;
          last_contacted_at?: string | null;
        };
        Relationships: [];
      };
      prospect_qualifications: {
        Row: {
          id: string;
          prospect_id: string;
          score: number;
          criteria: AiScoreDetails;
          website_analysis: Record<string, unknown>;
          model_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          prospect_id: string;
          score: number;
          criteria?: AiScoreDetails;
          website_analysis?: Record<string, unknown>;
          model_version?: string;
        };
        Update: {
          score?: number;
          criteria?: AiScoreDetails;
          website_analysis?: Record<string, unknown>;
          model_version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prospect_qualifications_prospect_id_fkey";
            columns: ["prospect_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
      prospect_activities: {
        Row: {
          id: string;
          prospect_id: string;
          activity_type: string;
          description: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          prospect_id: string;
          activity_type: string;
          description?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          activity_type?: string;
          description?: string | null;
          metadata?: Record<string, unknown>;
        };
        Relationships: [
          {
            foreignKeyName: "prospect_activities_prospect_id_fkey";
            columns: ["prospect_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      dashboard_stats: {
        Row: {
          total_prospects: number;
          nouveaux: number;
          contactes: number;
          relances: number;
          rdv: number;
          clients: number;
          refuses: number;
          prioritaires: number;
          score_moyen: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      upsert_prospect: {
        Args: {
          p_company_name: string;
          p_siret?: string | null;
          p_phone?: string | null;
          p_email?: string | null;
          p_website?: string | null;
          p_city?: string | null;
          p_google_reviews_count?: number;
          p_source?: ProspectSource;
          p_status?: ProspectStatus;
          p_ai_score?: number | null;
        };
        Returns: Database["public"]["Tables"]["prospects"]["Row"];
      };
    };
    Enums: {
      prospect_status: ProspectStatus;
      prospect_source: ProspectSource;
    };
  };
}
