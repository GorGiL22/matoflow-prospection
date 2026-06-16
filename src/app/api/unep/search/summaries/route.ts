import { getUnepAreaScanSummaries } from "@/modules/scraping/unep-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summaries = await getUnepAreaScanSummaries();
    return Response.json({ summaries });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de charger les statuts UNEP";
    return Response.json({ error: message, summaries: [] }, { status: 500 });
  }
}
