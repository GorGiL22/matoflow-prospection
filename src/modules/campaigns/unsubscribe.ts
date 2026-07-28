import { createHmac, timingSafeEqual } from "node:crypto";
import { getCampaignTrackingBaseUrl } from "@/lib/campaign-tracking";

function getUnsubscribeSecret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.RESEND_API_KEY ||
    "matoflow-local-unsubscribe"
  );
}

export function createUnsubscribeToken(campaignEmailId: string): string {
  return createHmac("sha256", getUnsubscribeSecret())
    .update(campaignEmailId)
    .digest("base64url");
}

export function verifyUnsubscribeToken(
  campaignEmailId: string,
  token: string
): boolean {
  if (!campaignEmailId || !token) return false;

  const expected = createUnsubscribeToken(campaignEmailId);
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);

  if (expectedBuffer.length !== tokenBuffer.length) return false;

  try {
    return timingSafeEqual(expectedBuffer, tokenBuffer);
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(campaignEmailId: string): string | null {
  const baseUrl = getCampaignTrackingBaseUrl();
  if (!baseUrl) return null;

  const token = createUnsubscribeToken(campaignEmailId);
  return `${baseUrl}/desabonnement/${campaignEmailId}?t=${token}`;
}

export function appendUnsubscribeFooter(
  body: string,
  campaignEmailId: string
): { text: string; htmlExtra: string } {
  const url = buildUnsubscribeUrl(campaignEmailId);

  const text = url
    ? `${body.trimEnd()}

---
Si vous ne souhaitez plus recevoir nos emails, cliquez ici pour vous désabonner :
${url}
Vous pouvez aussi répondre « STOP » à cet email.`
    : `${body.trimEnd()}

---
Si vous ne souhaitez plus recevoir nos emails, répondez « STOP » à cet email.`;

  const htmlExtra = url
    ? `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 12px;" />
<p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:#6b7280;">
Si vous ne souhaitez plus recevoir nos emails,
<a href="${url}" style="color:#059669;text-decoration:underline;">cliquez ici pour vous désabonner</a>.
</p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">
Vous pouvez aussi répondre « STOP » à cet email.
</p>`
    : `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 12px;" />
<p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;">
Si vous ne souhaitez plus recevoir nos emails, répondez « STOP » à cet email.
</p>`;

  return { text, htmlExtra };
}
