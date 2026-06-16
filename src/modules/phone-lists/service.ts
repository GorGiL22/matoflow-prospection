import { PhoneListRepository } from "./repository";

const repository = new PhoneListRepository();

export class PhoneListService {
  list() {
    return repository.findAll();
  }

  get(id: string) {
    return repository.findById(id);
  }

  create(nom: string) {
    if (!nom.trim()) {
      throw new Error("Le nom de la liste est requis");
    }
    return repository.create(nom);
  }

  delete(id: string) {
    return repository.delete(id);
  }

  addProspects(listId: string, prospectIds: string[]) {
    return repository.addProspects(listId, prospectIds);
  }

  removeItem(itemId: string) {
    return repository.removeItem(itemId);
  }

  listProspectCandidates(listId: string) {
    return repository.listProspectCandidates(listId);
  }
}

export const phoneListService = new PhoneListService();
