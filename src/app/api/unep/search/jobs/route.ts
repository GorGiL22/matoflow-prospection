import { NextRequest } from "next/server";
import { z } from "zod";
import { UNEP_MAX_RESULTS_PER_RUN } from "@/config/constants";
import { unepSearchAreaSchema } from "@/lib/unep-area-schema";
import { createUnepSearchJob } from "@/modules/scraping/unep-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  area: unepSearchAreaSchema,
  maxResults: z.number().int().min(0).max(UNEP_MAX_RESULTS_PER_RUN),
  startPage: z.number().int().min(1).default(1),
  includeMetropole: z.boolean().default(false),
  excludeExisting: z.boolean().default(true),
  autoChain: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const job = await createUnepSearchJob(body);
    return Response.json({ job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Requête invalide";
    return Response.json({ error: message }, { status: 400 });
  }
}
