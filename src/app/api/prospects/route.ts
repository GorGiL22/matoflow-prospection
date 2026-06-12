import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProspectService } from "@/modules/prospects/service";

const createProspectSchema = z.object({
  company_name: z.string().min(1, "Nom requis"),
  siret: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  google_reviews_count: z.number().int().min(0).optional(),
  source: z
    .enum(["manuel", "google_maps", "scraping", "import_csv", "api", "linkedin"])
    .optional(),
});

export async function GET() {
  try {
    const supabase = createAdminClient();
    const service = new ProspectService(supabase);
    const prospects = await service.listProspects();
    return NextResponse.json(prospects);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProspectSchema.parse(body);

    const supabase = createAdminClient();
    const service = new ProspectService(supabase);
    const prospect = await service.createOrUpdateProspect({
      ...parsed,
      email: parsed.email || null,
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
