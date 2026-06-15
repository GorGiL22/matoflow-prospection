import { stopAllActiveUnepSearchJobs } from "@/modules/scraping/unep-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const jobs = await stopAllActiveUnepSearchJobs();
  return Response.json({ jobs, stopped: jobs.length });
}
