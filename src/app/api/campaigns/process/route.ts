import { campaignService } from "@/modules/campaigns/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await campaignService.processQueue();
  return Response.json(result);
}
