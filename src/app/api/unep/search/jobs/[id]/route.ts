import { getUnepSearchJob } from "@/modules/scraping/unep-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const job = await getUnepSearchJob(id);

  if (!job) {
    return Response.json({ error: "Job introuvable" }, { status: 404 });
  }

  return Response.json({ job });
}
