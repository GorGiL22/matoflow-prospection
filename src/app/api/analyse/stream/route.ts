import { NextRequest } from "next/server";
import { z } from "zod";
import { runAnalysisPipeline } from "@/modules/analysis/pipeline";
import type { AnalysisStreamEvent } from "@/types/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  prospectId: z.string().min(1),
});

function encodeEvent(event: AnalysisStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prospectId } = bodySchema.parse(body);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = async (event: AnalysisStreamEvent) => {
          controller.enqueue(encodeEvent(event));
        };

        try {
          await runAnalysisPipeline(prospectId, emit);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Erreur inconnue";
          controller.enqueue(
            encodeEvent({ type: "error", message })
          );
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
