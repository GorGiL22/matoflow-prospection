import { NextRequest } from "next/server";
import { campaignService } from "@/modules/campaigns/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function runProcess() {
  try {
    const startedAt = Date.now();
    const maxDurationMs = 20_000;
    let processedAny = false;
    let processedCount = 0;
    let lastCampaignId: string | undefined;
    let lastEmailId: string | undefined;
    let lastError: string | undefined;

    while (Date.now() - startedAt < maxDurationMs) {
      const result = await campaignService.processQueue();
      if (!result.processed) {
        return Response.json({
          processed: processedAny,
          processedCount,
          campaignId: lastCampaignId,
          emailId: lastEmailId,
          error: lastError,
        });
      }

      processedAny = true;
      processedCount += 1;
      lastCampaignId = result.campaignId;
      lastEmailId = result.emailId;
      lastError = result.error;

      if (result.error) {
        break;
      }
    }

    return Response.json({
      processed: processedAny,
      processedCount,
      campaignId: lastCampaignId,
      emailId: lastEmailId,
      error: lastError,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur file d'envoi";
    console.error("[campaigns/process]", error);
    return Response.json({ processed: false, error: message }, { status: 500 });
  }
}

/** Cron Vercel uniquement (GET + CRON_SECRET). */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ error: "Cron non configuré" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }
  return runProcess();
}

export async function POST() {
  return runProcess();
}
