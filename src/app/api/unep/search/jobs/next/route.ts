import { buildNextUnepAutoJob } from "@/modules/scraping/unep-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const next = await buildNextUnepAutoJob();

  return Response.json({
    input: next?.input ?? null,
    areaName: next?.areaName ?? null,
  });
}
