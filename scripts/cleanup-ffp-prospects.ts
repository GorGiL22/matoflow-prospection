#!/usr/bin/env npx tsx
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanupFfpProspectsInDb } from "../src/modules/scraping/ffp-import";

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
  console.log("Nettoyage FFP — emails + doublons…");
  const result = await cleanupFfpProspectsInDb();
  console.log(`Emails corrigés : ${result.emailsFixed}`);
  console.log(`Doublons fusionnés : ${result.merged}`);
  console.log(`Fiches supprimées : ${result.deleted}`);
  console.log(`Restant : ${result.remaining}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
