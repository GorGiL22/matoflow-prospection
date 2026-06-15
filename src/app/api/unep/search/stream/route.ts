import { z } from "zod";
import { NextRequest } from "next/server";
import { unepSearchAreaSchema } from "@/lib/unep-area-schema";
import { searchUnepLandscapersInArea } from "@/modules/scraping/unep";
import { getUnepAreaDefinition } from "@/modules/scraping/unep-areas";
import { UNEP_MAX_RESULTS_PER_RUN } from "@/config/constants";
import type { UnepSearchStreamEvent } from "@/types/unep-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  area: unepSearchAreaSchema.default("lyon"),
  maxResults: z.number().int().min(0).max(UNEP_MAX_RESULTS_PER_RUN).optional(),
  startPage: z.number().int().min(1).optional(),
  includeMetropole: z.boolean().optional(),
  excludeExisting: z.boolean().optional(),
});

function encodeEvent(event: UnepSearchStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config = bodySchema.parse(body);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = async (event: UnepSearchStreamEvent) => {
          controller.enqueue(encodeEvent(event));
        };

        try {
          await searchUnepLandscapersInArea(
            config.area,
            {
              maxResults: config.maxResults ?? 50,
              startPage: config.startPage ?? 1,
              includeMetropole:
                config.includeMetropole ??
                getUnepAreaDefinition(config.area).includeMetropoleDefault,
              excludeExisting: config.excludeExisting ?? true,
            },
            emit
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Erreur inconnue";
          controller.enqueue(encodeEvent({ type: "error", message }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Requête invalide";
    return Response.json({ error: message }, { status: 400 });
  }
}
