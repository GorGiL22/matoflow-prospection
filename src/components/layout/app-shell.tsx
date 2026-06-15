"use client";

import { Sidebar } from "./sidebar";
import { UnepSearchJobBanner } from "@/components/scraping/unep-search-job-banner";
import { UnepSearchJobProvider } from "@/components/scraping/unep-search-job-provider";
import { CampaignQueueProcessor } from "@/components/campaigns/campaign-queue-processor";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UnepSearchJobProvider>
      <CampaignQueueProcessor />
      <div className="app-background flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-6 py-8 pb-24 lg:px-8">
            {children}
          </div>
        </main>
        <UnepSearchJobBanner />
      </div>
    </UnepSearchJobProvider>
  );
}
