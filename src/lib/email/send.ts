import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: Array<{ name: string; value: string }>;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  if (!isEmailConfigured()) {
    throw new Error(
      "Resend non configuré. Ajoutez RESEND_API_KEY et RESEND_FROM dans .env.local"
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM!,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    tags: input.tags,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Resend n'a pas retourné d'identifiant d'email");
  }

  return { id: data.id };
}

export function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY manquant");
  }
  return new Resend(process.env.RESEND_API_KEY);
}
