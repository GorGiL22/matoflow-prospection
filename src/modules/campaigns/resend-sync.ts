import { getResendClient } from "@/lib/email/send";
import { handleCampaignEmailBounce } from "@/modules/campaigns/bounce-handler";

export async function syncResendBounces(): Promise<{
  scanned: number;
  bounced: number;
  handled: number;
  addedToPhoneList: number;
}> {
  const resend = getResendClient();
  const { data, error } = await resend.emails.list();

  if (error) {
    throw new Error(error.message);
  }

  const emails = data?.data ?? [];
  let bounced = 0;
  let handled = 0;
  let addedToPhoneList = 0;

  for (const email of emails) {
    if (email.last_event !== "bounced") continue;
    bounced += 1;

    const result = await handleCampaignEmailBounce({
      resendEmailId: email.id,
      toEmail: email.to[0] ?? "",
      message: "Email rebondi (synchronisation Resend)",
    });

    if (result.handled) handled += 1;
    if (result.addedToPhoneList) addedToPhoneList += 1;
  }

  return {
    scanned: emails.length,
    bounced,
    handled,
    addedToPhoneList,
  };
}
