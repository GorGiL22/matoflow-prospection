/**
 * Module CRM MatoFlow — V2
 * Synchronisation bidirectionnelle avec le CRM MatoFlow principal.
 */

export interface CrmSyncResult {
  synced: number;
  errors: string[];
}

export class CrmModule {
  async syncProspectsToCrm(_prospectIds: string[]): Promise<CrmSyncResult> {
    throw new Error("Intégration CRM non implémentée — prévu en V2");
  }

  async importFromCrm(): Promise<CrmSyncResult> {
    throw new Error("Import CRM non implémenté — prévu en V2");
  }
}
