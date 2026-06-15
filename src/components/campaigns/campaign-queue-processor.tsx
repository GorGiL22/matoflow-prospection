"use client";

import { useEffect } from "react";

export function CampaignQueueProcessor() {
  useEffect(() => {
    const interval = setInterval(() => {
      void fetch("/api/campaigns/process", { method: "POST" });
    }, 30_000);

    void fetch("/api/campaigns/process", { method: "POST" });

    return () => clearInterval(interval);
  }, []);

  return null;
}
