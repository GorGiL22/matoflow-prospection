import { NextRequest } from "next/server";
import { getResendClient } from "@/lib/email/send";
import {
  extractCampaignEmailIdFromResendTags,
  handleCampaignEmailBounce,
  normalizeRecipientEmail,
} from "@/modules/campaigns/bounce-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return Response.json({ error: "Webhook Resend non configuré" }, { status: 503 });
  }

  try {
    const resend = getResendClient();
    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    });

    if (event.type !== "email.bounced") {
      return Response.json({ received: true, ignored: event.type });
    }

    const campaignEmailId = extractCampaignEmailIdFromResendTags(
      event.data.tags as Array<{ name: string; value: string }> | undefined
    );

    const result = await handleCampaignEmailBounce({
      resendEmailId: event.data.email_id,
      toEmail: normalizeRecipientEmail(event.data.to),
      message: event.data.bounce.message,
      campaignEmailId: campaignEmailId ?? undefined,
    });

    return Response.json({ received: true, ...result });
  } catch (error) {
    console.error("[webhooks/resend]", error);
    const message = error instanceof Error ? error.message : "Webhook invalide";
    return Response.json({ error: message }, { status: 400 });
  }
}
