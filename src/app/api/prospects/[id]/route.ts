import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProspectService } from "@/modules/prospects/service";

const updateProspectSchema = z.object({
  company_name: z.string().min(1).optional(),
  siret: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  google_reviews_count: z.number().int().min(0).optional(),
  status: z
    .enum(["nouveau", "contacte", "relance", "rdv", "client", "refuse"])
    .optional(),
  source: z
    .enum(["manuel", "google_maps", "scraping", "import_csv", "api", "linkedin"])
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const service = new ProspectService(supabase);
    const prospect = await service.getProspect(id);
    return NextResponse.json(prospect);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateProspectSchema.parse(body);

    const supabase = createAdminClient();
    const service = new ProspectService(supabase);
    const prospect = await service.updateProspect(id, parsed);
    return NextResponse.json(prospect);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const service = new ProspectService(supabase);
    await service.deleteProspect(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
