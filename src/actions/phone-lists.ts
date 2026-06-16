"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { phoneListService } from "@/modules/phone-lists/service";

const nameSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(120),
});

const listIdSchema = z.object({
  listId: z.string().min(1),
});

const addProspectsSchema = z.object({
  listId: z.string().min(1),
  prospectIds: z.array(z.string().min(1)).min(1),
});

const itemIdSchema = z.object({
  itemId: z.string().min(1),
  listId: z.string().min(1),
});

function revalidatePhoneListPages(listId?: string) {
  revalidatePath("/prospects/listes-numeros");
  if (listId) {
    revalidatePath(`/prospects/listes-numeros/${listId}`);
  }
}

export async function createPhoneListAction(formData: FormData) {
  const { nom } = nameSchema.parse({ nom: formData.get("nom") });
  const list = await phoneListService.create(nom);
  revalidatePhoneListPages();
  redirect(`/prospects/listes-numeros/${list.id}`);
}

export async function deletePhoneListAction(listId: string) {
  listIdSchema.parse({ listId });
  await phoneListService.delete(listId);
  revalidatePhoneListPages();
  redirect("/prospects/listes-numeros");
}

export async function addProspectsToPhoneListAction(
  listId: string,
  prospectIds: string[]
) {
  const parsed = addProspectsSchema.parse({ listId, prospectIds });
  const added = await phoneListService.addProspects(
    parsed.listId,
    parsed.prospectIds
  );
  revalidatePhoneListPages(parsed.listId);
  return { added };
}

export async function removePhoneListItemAction(itemId: string, listId: string) {
  itemIdSchema.parse({ itemId, listId });
  await phoneListService.removeItem(itemId);
  revalidatePhoneListPages(listId);
}
