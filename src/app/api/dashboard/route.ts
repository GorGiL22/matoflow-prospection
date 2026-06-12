import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProspectService } from "@/modules/prospects/service";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const service = new ProspectService(supabase);
    const data = await service.getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
