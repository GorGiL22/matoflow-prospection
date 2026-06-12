import { SCORING_WEIGHTS } from "@/config/constants";
import type { AiScoreDetails } from "@/types/prospect";

const SIZE_SCORES: Record<string, number> = {
  petite: 0.5,
  moyenne: 0.8,
  grande: 1,
};

export function computeAiScore(criteria: AiScoreDetails): number {
  let score = 0;

  if (criteria.is_landscaping_company) {
    score += SCORING_WEIGHTS.is_landscaping_company;
  }
  if (criteria.has_maintenance_contracts) {
    score += SCORING_WEIGHTS.has_maintenance_contracts;
  }
  if (criteria.estimated_company_size) {
    const multiplier = SIZE_SCORES[criteria.estimated_company_size] ?? 0.5;
    score += Math.round(SCORING_WEIGHTS.estimated_company_size * multiplier);
  }
  if (criteria.has_teams) {
    score += SCORING_WEIGHTS.has_teams;
  }
  if (criteria.needs_quoting_planning_billing) {
    score += SCORING_WEIGHTS.needs_quoting_planning_billing;
  }

  return Math.min(100, Math.max(0, score));
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Prioritaire";
  if (score >= 50) return "Prometteur";
  if (score >= 30) return "Faible";
  return "Non qualifié";
}
