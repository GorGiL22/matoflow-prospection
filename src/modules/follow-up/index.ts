/**
 * Module Relances — V2
 * Automatisation des relances email et suivi des séquences commerciales.
 */

export interface FollowUpSequence {
  id: string;
  name: string;
  steps: FollowUpStep[];
}

export interface FollowUpStep {
  delayDays: number;
  channel: "email" | "linkedin" | "phone";
  templateId: string;
}

export class FollowUpModule {
  async scheduleSequence(_prospectId: string, _sequenceId: string): Promise<void> {
    throw new Error("Module relances non implémenté — prévu en V2");
  }
}
