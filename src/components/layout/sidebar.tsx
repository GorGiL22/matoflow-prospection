"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/config/constants";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Prospects", href: "/prospects", icon: Users },
  { name: "Ajouter", href: "/prospects/nouveau", icon: UserPlus },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{APP_NAME}</p>
          <p className="text-xs text-zinc-500">Agent IA V1</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <p className="text-xs text-zinc-400">
          Modules V2 : Scraping, Relances, CRM
        </p>
      </div>
    </aside>
  );
}
