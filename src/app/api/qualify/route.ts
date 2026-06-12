import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { QualificationService } from "@/modules/qualification/service";

const qualifySchema = z.object({
  prospectId: z.string().uuid(),
  websiteContent: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prospectId, websiteContent } = qualifySchema.parse(body);

    const supabase = createAdminClient();
    const service = new QualificationService(supabase);
    const prospect = await service.qualifyProspect(prospectId, websiteContent);

    return NextResponse.json(prospect);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
