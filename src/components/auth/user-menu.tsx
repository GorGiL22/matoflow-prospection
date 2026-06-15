"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";

const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (authDisabled) return null;
  if (status === "loading") {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">Chargement…</div>
    );
  }
  if (!session?.user) return null;

  const name = session.user.name ?? session.user.email ?? "Utilisateur";

  return (
    <div className="space-y-2 rounded-lg border border-sidebar-border bg-surface-muted/50 p-3">
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted">
            <User className="h-4 w-4 text-brand" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">{name}</p>
          {session.user.email && (
            <p className="truncate text-[11px] text-muted-foreground">
              {session.user.email}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/connexion" })}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
        Déconnexion
      </button>
    </div>
  );
}
