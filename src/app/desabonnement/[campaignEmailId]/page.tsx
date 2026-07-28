import { UnsubscribeForm } from "@/components/campaigns/unsubscribe-form";
import { getUnsubscribePreview } from "@/modules/campaigns/unsubscribe-service";

export const dynamic = "force-dynamic";

interface UnsubscribePageProps {
  params: Promise<{ campaignEmailId: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: UnsubscribePageProps) {
  const { campaignEmailId } = await params;
  const { t: token } = await searchParams;

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground">Désabonnement</h1>
        <p className="mt-3 text-sm text-muted">
          Lien invalide. Utilisez le lien présent dans l&apos;email reçu.
        </p>
      </main>
    );
  }

  const preview = await getUnsubscribePreview(campaignEmailId, token);

  if (!preview.valid) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
        <h1 className="text-2xl font-bold text-foreground">Désabonnement</h1>
        <p className="mt-3 text-sm text-muted">{preview.error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <div className="mb-6 space-y-1">
        <p className="text-sm font-medium uppercase tracking-wider text-muted">
          MatoFlow
        </p>
        <h1 className="text-2xl font-bold text-foreground">
          Se désabonner des emails
        </h1>
      </div>
      <UnsubscribeForm
        campaignEmailId={campaignEmailId}
        token={token}
        nomEntreprise={preview.nomEntreprise}
        alreadyUnsubscribed={preview.alreadyUnsubscribed}
      />
    </main>
  );
}
