import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { ContentService } from "@/modules/content/service";

const generateSchema = z.object({
  prospectId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prospectId } = generateSchema.parse(body);

    const supabase = createAdminClient();
    const service = new ContentService(supabase);
    const content = await service.generateForProspect(prospectId);

    return NextResponse.json(content);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
