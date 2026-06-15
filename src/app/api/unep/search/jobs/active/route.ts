import { NextRequest } from "next/server";
import { z } from "zod";
import { unepSearchAreaSchema } from "@/lib/unep-area-schema";
import { getActiveUnepSearchJob } from "@/modules/scraping/unep-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  area: unepSearchAreaSchema.optional(),
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { area } = querySchema.parse(params);
  const job = await getActiveUnepSearchJob(area);

  return Response.json({ job });
}
