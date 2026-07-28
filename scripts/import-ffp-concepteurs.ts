#!/usr/bin/env npx tsx
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { importFfpConcepteurs } from "../src/modules/scraping/ffp-import";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

async function main() {
  console.log("Import FFP concepteurs — démarrage…");

  const result = await importFfpConcepteurs({
    onProgress(progress) {
      if (progress.phase === "enrichissement" || progress.phase === "import") {
        process.stdout.write(
          `\r${progress.phase}: ${progress.processed}/${progress.total}` +
            (progress.current ? ` — ${progress.current}` : "")
        );
      }
    },
  });

  console.log("\n\nTerminé.");
  console.log(`Annuaire agences: ${result.annuaireCount}`);
  console.log(`Fiches enrichies: ${result.enrichedCount}`);
  console.log(`Créés: ${result.imported}`);
  console.log(`Mis à jour: ${result.updated}`);
  console.log(`Erreurs: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log("\nDétail des erreurs:");
    for (const error of result.errors.slice(0, 20)) {
      console.log(`- ${error}`);
    }
    if (result.errors.length > 20) {
      console.log(`… et ${result.errors.length - 20} autres`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
