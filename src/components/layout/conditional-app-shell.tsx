"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";
import { AuthSessionProvider } from "@/components/auth/session-provider";

export function ConditionalAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/connexion";
  const isPublicPage = isAuthPage || pathname.startsWith("/desabonnement");

  return (
    <AuthSessionProvider>
      {isPublicPage ? children : <AppShell>{children}</AppShell>}
    </AuthSessionProvider>
  );
}
