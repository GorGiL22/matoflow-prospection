import type {
  PhoneListDetail,
  PhoneListExportFormat,
  PhoneListItem,
} from "@/types/phone-list";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildPhoneListExport(
  listName: string,
  items: PhoneListItem[],
  format: PhoneListExportFormat
): { content: string; filename: string; mimeType: string } {
  const safeName = listName
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "liste";

  if (format === "txt-numbers") {
    const content = items.map((item) => item.telephone).join("\n");
    return {
      content,
      filename: `${safeName}-numeros.txt`,
      mimeType: "text/plain;charset=utf-8",
    };
  }

  if (format === "txt-full") {
    const content = items
      .map(
        (item) =>
          `${item.nomEntreprise}\t${item.telephone}\t${item.ville ?? ""}`
      )
      .join("\n");
    return {
      content: `Entreprise\tTéléphone\tVille\n${content}`,
      filename: `${safeName}-complet.txt`,
      mimeType: "text/plain;charset=utf-8",
    };
  }

  const header = "Entreprise,Téléphone,Ville";
  const rows = items.map((item) =>
    [
      escapeCsv(item.nomEntreprise),
      escapeCsv(item.telephone),
      escapeCsv(item.ville ?? ""),
    ].join(",")
  );
  return {
    content: [header, ...rows].join("\n"),
    filename: `${safeName}.csv`,
    mimeType: "text/csv;charset=utf-8",
  };
}

export function downloadPhoneListExport(
  list: Pick<PhoneListDetail, "nom" | "items">,
  format: PhoneListExportFormat
) {
  const { content, filename, mimeType } = buildPhoneListExport(
    list.nom,
    list.items,
    format
  );
  const blob = new Blob(["\uFEFF", content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
