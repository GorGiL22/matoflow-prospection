"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Leaf,
  Bot,
  MapPin,
  Building2,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/config/constants";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Agent IA", href: "/analyse", icon: Bot },
  { name: "Google Maps", href: "/prospects/recherche", icon: MapPin },
  { name: "UNEP", href: "/prospects/recherche-unep", icon: Building2 },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Campagnes email", href: "/campagnes", icon: Mail },
  { name: "Ajouter", href: "/prospects/nouveau", icon: UserPlus },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg">
      <div className="border-b border-sidebar-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover shadow-brand">
            <Leaf className="h-5 w-5 text-brand-foreground" />
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar-bg bg-brand-light" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-foreground">
              MatoFlow
            </p>
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Prospection
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/analyse"
                ? pathname === "/analyse"
                : item.href === "/prospects/recherche"
                  ? pathname === "/prospects/recherche"
                  : item.href === "/prospects/recherche-unep"
                    ? pathname.startsWith("/prospects/recherche-unep")
                    : item.href === "/prospects"
                      ? pathname === "/prospects"
                      : item.href === "/campagnes"
                        ? pathname.startsWith("/campagnes")
                        : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-brand shadow-sm"
                  : "text-muted hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive
                    ? "text-brand"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border p-3">
        <UserMenu />
        <ThemeToggle className="w-full" />
        <p className="px-3 text-[11px] leading-relaxed text-muted-foreground">
          {APP_NAME} · Agent IA V1
        </p>
      </div>
    </aside>
  );
}
