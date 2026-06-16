"use client";

import { useEffect, useRef } from "react";

export function CampaignQueueProcessor() {
  const inFlightRef = useRef(false);

  useEffect(() => {
    async function tick() {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await fetch("/api/campaigns/process", { method: "POST" });
      } finally {
        inFlightRef.current = false;
      }
    }

    void tick();
    const interval = setInterval(() => void tick(), 10_000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
